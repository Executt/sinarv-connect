import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const PingSchema = z.object({
  tracker_id: z.string().min(1).max(120),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  peso_carga_kg: z.number().nonnegative().optional(),
  status_porta: z.enum(['fechada', 'aberta']).optional(),
  velocidade_kmh: z.number().nonnegative().max(300).optional(),
  carga_id: z.string().uuid().optional(),
});

function timingSafeEqual(a: string, b: string) {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  if (ea.length !== eb.length) return false;
  let diff = 0;
  for (let i = 0; i < ea.length; i++) diff |= ea[i] ^ eb[i];
  return diff === 0;
}

// Haversine em metros
function distMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function distToSegment(
  p: { lat: number; lng: number },
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  // aproximação plana (ok para geofencing local ~ km)
  const ax = a.lng, ay = a.lat, bx = b.lng, by = b.lat, px = p.lng, py = p.lat;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  const proj = { lat: ay + t * dy, lng: ax + t * dx };
  return distMeters(p, proj);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const INGEST_TOKEN = Deno.env.get('INGEST_TOKEN');

    // Auth por token compartilhado dos trackers — fail closed: sem token configurado, nada entra.
    if (!INGEST_TOKEN) {
      console.error('[ingest-telemetria] INGEST_TOKEN não configurado — ingestão bloqueada');
      return new Response(JSON.stringify({ error: 'ingest_disabled' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const provided = req.headers.get('x-ingest-token') ?? '';
    if (provided.length !== INGEST_TOKEN.length || !timingSafeEqual(provided, INGEST_TOKEN)) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = PingSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const ping = parsed.data;

    const db = createClient(SUPABASE_URL, SERVICE);

    // resolve veiculo pelo tracker_id
    const { data: veiculo, error: vErr } = await db
      .from('veiculos_frota')
      .select('id, placa, ativo')
      .eq('tracker_id', ping.tracker_id)
      .maybeSingle();
    if (vErr) throw vErr;
    if (!veiculo || !veiculo.ativo) {
      return new Response(JSON.stringify({ error: 'veiculo_nao_registrado' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // carga: preferir a explícita; senão a última em_transito
    let cargaId = ping.carga_id ?? null;
    if (!cargaId) {
      const { data: carga } = await db
        .from('cargas_perigosas')
        .select('id')
        .eq('veiculo_id', veiculo.id)
        .in('status', ['em_transito', 'planejada'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      cargaId = carga?.id ?? null;
    }

    // insere telemetria (append-only)
    const { error: tErr } = await db.from('telemetria_frota').insert({
      veiculo_id: veiculo.id,
      carga_id: cargaId,
      lat: ping.lat,
      lng: ping.lng,
      peso_carga_kg: ping.peso_carga_kg ?? null,
      status_porta: ping.status_porta ?? 'fechada',
      velocidade_kmh: ping.velocidade_kmh ?? null,
    });
    if (tErr) throw tErr;

    const alerts: Array<Record<string, unknown>> = [];

    // Geofencing contra rota planejada
    if (cargaId) {
      const { data: rota } = await db
        .from('rotas_planejadas')
        .select('origem_lat, origem_lng, destino_lat, destino_lng, waypoints, raio_tolerancia_m')
        .eq('carga_id', cargaId)
        .maybeSingle();

      if (rota) {
        const pts: Array<{ lat: number; lng: number }> = [
          { lat: Number(rota.origem_lat), lng: Number(rota.origem_lng) },
          ...(Array.isArray(rota.waypoints)
            ? (rota.waypoints as Array<{ lat: number; lng: number }>)
            : []),
          { lat: Number(rota.destino_lat), lng: Number(rota.destino_lng) },
        ];
        let minDist = Infinity;
        for (let i = 0; i < pts.length - 1; i++) {
          const d = distToSegment({ lat: ping.lat, lng: ping.lng }, pts[i], pts[i + 1]);
          if (d < minDist) minDist = d;
        }
        const tol = Number(rota.raio_tolerancia_m ?? 2000);
        if (minDist > tol) {
          alerts.push({
            veiculo_id: veiculo.id,
            carga_id: cargaId,
            tipo: 'desvio_rota',
            severidade: 'critical',
            distancia_desvio_m: Math.round(minDist),
            latitude: ping.lat,
            longitude: ping.lng,
            mensagem: `Veículo ${veiculo.placa} desviou ${(minDist / 1000).toFixed(2)} km da rota aprovada (tolerância ${tol} m).`,
          });
        }
      }
    }

    // Porta aberta em trânsito
    if (ping.status_porta === 'aberta') {
      alerts.push({
        veiculo_id: veiculo.id,
        carga_id: cargaId,
        tipo: 'porta_aberta',
        severidade: 'high',
        latitude: ping.lat,
        longitude: ping.lng,
        mensagem: `Porta do baú do veículo ${veiculo.placa} aberta em trânsito.`,
      });
    }

    // Peso divergente vs peso de origem
    if (cargaId && typeof ping.peso_carga_kg === 'number') {
      const { data: carga } = await db
        .from('cargas_perigosas')
        .select('peso_origem_kg')
        .eq('id', cargaId)
        .maybeSingle();
      const pesoOrigem = carga?.peso_origem_kg ? Number(carga.peso_origem_kg) : null;
      if (pesoOrigem && pesoOrigem > 0) {
        const diffPct = ((pesoOrigem - ping.peso_carga_kg) / pesoOrigem) * 100;
        if (diffPct > 5) {
          alerts.push({
            veiculo_id: veiculo.id,
            carga_id: cargaId,
            tipo: 'peso_divergente',
            severidade: 'critical',
            latitude: ping.lat,
            longitude: ping.lng,
            mensagem: `Perda de ${diffPct.toFixed(1)}% no peso da carga (${veiculo.placa}) — suspeita de descarte irregular em trânsito.`,
          });
        }
      }
    }

    if (alerts.length > 0) {
      const { error: aErr } = await db.from('alertas_geofencing').insert(alerts);
      if (aErr) console.error('[ingest-telemetria] falha ao gravar alertas', aErr);
    }

    return new Response(
      JSON.stringify({ ok: true, veiculo_id: veiculo.id, carga_id: cargaId, alertas_gerados: alerts.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[ingest-telemetria] erro', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
