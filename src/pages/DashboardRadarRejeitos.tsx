import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import L from "leaflet";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Truck, AlertTriangle, Radio, ShieldAlert, MapPin, RefreshCw } from "lucide-react";
import { LixoesErrorBoundary } from "@/components/lixoes/LixoesErrorBoundary";
import { useAuth } from "@/hooks/use-auth";

type Veiculo = { id: string; placa: string; tracker_id: string; transportadora: string; ativo: boolean };
type Carga = {
  id: string; categoria: string; detalhamento: string; destino_final: string;
  status: string; veiculo_id: string | null; origem_localidade: string | null;
};
type Rota = {
  id: string; carga_id: string; origem_lat: number; origem_lng: number;
  destino_lat: number; destino_lng: number; raio_tolerancia_m: number;
};
type Ping = {
  id: string; veiculo_id: string; carga_id: string | null;
  lat: number; lng: number; status_porta: string;
  peso_carga_kg: number | null; recebido_em: string;
};
type Alerta = {
  id: string; veiculo_id: string | null; carga_id: string | null; tipo: string;
  severidade: string; distancia_desvio_m: number | null;
  latitude: number | null; longitude: number | null;
  mensagem: string; status: string; created_at: string;
};

const CATEGORIA_LABEL: Record<string, string> = {
  contaminado_perigoso: "Contaminado / Perigoso",
  hospitalar: "Hospitalar (RSS)",
  quimico: "Químico",
};
const SEV_COLOR: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/10 text-info",
  high: "bg-warning/10 text-warning",
  critical: "bg-destructive/10 text-destructive",
};
const TIPO_LABEL: Record<string, string> = {
  desvio_rota: "Desvio de rota",
  porta_aberta: "Porta aberta",
  peso_divergente: "Peso divergente",
  parada_nao_autorizada: "Parada não autorizada",
};

const validCoord = (lat: unknown, lng: unknown) => {
  const la = Number(lat), lo = Number(lng);
  return Number.isFinite(la) && Number.isFinite(lo) && la >= -90 && la <= 90 && lo >= -180 && lo <= 180;
};

// mock demo layers (demanda + descartes irregulares) — em produção viriam do DB
const DEMANDA_MOCK = [
  { lat: -22.92, lng: -43.23, peso: 12 }, // Rio
  { lat: -23.55, lng: -46.63, peso: 25 }, // SP
  { lat: -15.79, lng: -47.88, peso: 8 },  // Brasília
  { lat: -19.92, lng: -43.94, peso: 10 }, // BH
];
const IRREGULARES_MOCK = [
  { lat: -22.90, lng: -43.20, tipo: "Lixo hospitalar céu aberto" },
  { lat: -23.60, lng: -46.70, tipo: "Descarte de tintas / solventes" },
  { lat: -12.97, lng: -38.51, tipo: "Pneus acumulados" },
];

function RadarMap({
  veiculos, cargas, rotas, ultimosPings, alertas,
}: {
  veiculos: Veiculo[]; cargas: Carga[]; rotas: Rota[];
  ultimosPings: Record<string, Ping>; alertas: Alerta[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersRef = useRef<{
    destinos: LayerGroup; demanda: LayerGroup; irregular: LayerGroup;
    frota: LayerGroup; rotas: LayerGroup;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const brBounds = L.latLngBounds([-33.75, -73.99], [5.27, -34.79]);
    const map = L.map(containerRef.current, {
      center: [-14.235, -51.9253], zoom: 4,
      maxBounds: brBounds, maxBoundsViscosity: 1.0,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap", noWrap: true, bounds: brBounds,
    }).addTo(map);
    map.fitBounds(brBounds);

    const destinos = L.layerGroup().addTo(map);
    const demanda = L.layerGroup().addTo(map);
    const irregular = L.layerGroup().addTo(map);
    const frota = L.layerGroup().addTo(map);
    const rotas = L.layerGroup().addTo(map);

    L.control.layers(undefined, {
      "🟢 Destinações finais": destinos,
      "🟠 Demanda comunitária": demanda,
      "🔴 Descarte irregular": irregular,
      "🟣 Frota em tempo real": frota,
      "Rotas planejadas": rotas,
    }, { collapsed: false, position: "topright" }).addTo(map);

    mapRef.current = map;
    layersRef.current = { destinos, demanda, irregular, frota, rotas };
    return () => { map.remove(); mapRef.current = null; layersRef.current = null; };
  }, []);

  // camada 1 — destinos (mock: usa destinos das rotas)
  useEffect(() => {
    const L_ = layersRef.current; if (!L_) return;
    L_.destinos.clearLayers();
    rotas.forEach((r) => {
      if (!validCoord(r.destino_lat, r.destino_lng)) return;
      L.circleMarker([Number(r.destino_lat), Number(r.destino_lng)], {
        radius: 8, color: "#107E3E", fillColor: "#107E3E", fillOpacity: 0.75, weight: 2,
      }).bindPopup(`<b>Destino final</b><br/>${cargas.find(c => c.id === r.carga_id)?.destino_final ?? ""}`)
        .addTo(L_.destinos);
    });
  }, [rotas, cargas]);

  // camada 2 — demanda (mock)
  useEffect(() => {
    const L_ = layersRef.current; if (!L_) return;
    L_.demanda.clearLayers();
    DEMANDA_MOCK.forEach((d) => {
      L.circle([d.lat, d.lng], {
        radius: d.peso * 8000, color: "#E9730C", fillColor: "#E9730C", fillOpacity: 0.2, weight: 1,
      }).bindPopup(`<b>Demanda comunitária</b><br/>Cluster de ${d.peso} pedidos`).addTo(L_.demanda);
    });
  }, []);

  // camada 3 — descartes irregulares (mock)
  useEffect(() => {
    const L_ = layersRef.current; if (!L_) return;
    L_.irregular.clearLayers();
    IRREGULARES_MOCK.forEach((p) => {
      L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="background:#BB0000;color:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600">⚠</div>`,
        }),
      }).bindPopup(`<b>Descarte irregular</b><br/>${p.tipo}`).addTo(L_.irregular);
    });
  }, []);

  // camada 4 — frota realtime + rotas
  useEffect(() => {
    const L_ = layersRef.current; if (!L_) return;
    L_.frota.clearLayers();
    L_.rotas.clearLayers();

    rotas.forEach((r) => {
      if (!validCoord(r.origem_lat, r.origem_lng) || !validCoord(r.destino_lat, r.destino_lng)) return;
      L.polyline(
        [[Number(r.origem_lat), Number(r.origem_lng)], [Number(r.destino_lat), Number(r.destino_lng)]],
        { color: "#0A6ED1", weight: 2, opacity: 0.4, dashArray: "6 4" },
      ).addTo(L_.rotas);
    });

    Object.values(ultimosPings).forEach((p) => {
      if (!validCoord(p.lat, p.lng)) return;
      const veiculo = veiculos.find(v => v.id === p.veiculo_id);
      const alertaAtivo = alertas.some(a =>
        a.status === "active" && a.veiculo_id === p.veiculo_id &&
        (a.severidade === "critical" || a.severidade === "high"),
      );
      const cor = alertaAtivo ? "#BB0000" : "#7B4FBF";
      L.marker([Number(p.lat), Number(p.lng)], {
        icon: L.divIcon({
          className: "",
          html: `<div style="background:${cor};color:white;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:700;box-shadow:0 0 0 3px ${cor}33;${alertaAtivo ? "animation:pulse 1.2s infinite" : ""}">🚛 ${veiculo?.placa ?? "?"}</div>`,
        }),
      }).bindPopup(
        `<b>${veiculo?.placa ?? "veículo"}</b><br/>${veiculo?.transportadora ?? ""}<br/>Porta: ${p.status_porta}<br/>Peso: ${p.peso_carga_kg ?? "—"} kg<br/><small>${new Date(p.recebido_em).toLocaleString("pt-BR")}</small>`,
      ).addTo(L_.frota);
    });
  }, [ultimosPings, veiculos, rotas, alertas]);

  return (
    <div className="relative">
      <style>{`@keyframes pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.15) } }`}</style>
      <div ref={containerRef} className="h-[560px] w-full rounded-lg overflow-hidden border border-border" />
    </div>
  );
}

function RadarRejeitosInner() {
  const { roles } = useAuth();
  const role = roles.includes("super_admin") ? "super_admin" : roles.includes("gov") ? "gov" : (roles[0] ?? "—");
  const qc = useQueryClient();
  const [ultimosPings, setUltimosPings] = useState<Record<string, Ping>>({});

  const veiculosQ = useQuery({
    queryKey: ["radar-veiculos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("veiculos_frota").select("*").order("placa");
      if (error) throw error;
      return (data ?? []) as Veiculo[];
    },
  });
  const cargasQ = useQuery({
    queryKey: ["radar-cargas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cargas_perigosas").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Carga[];
    },
  });
  const rotasQ = useQuery({
    queryKey: ["radar-rotas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rotas_planejadas").select("*");
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        ...r,
        origem_lat: Number(r.origem_lat), origem_lng: Number(r.origem_lng),
        destino_lat: Number(r.destino_lat), destino_lng: Number(r.destino_lng),
      })) as Rota[];
    },
  });
  const alertasQ = useQuery({
    queryKey: ["radar-alertas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alertas_geofencing").select("*")
        .order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return (data ?? []) as Alerta[];
    },
  });
  const pingsQ = useQuery({
    queryKey: ["radar-pings-recentes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("telemetria_frota").select("*")
        .order("recebido_em", { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []) as Ping[];
    },
  });

  // último ping por veículo
  useEffect(() => {
    const pings = pingsQ.data ?? [];
    const map: Record<string, Ping> = {};
    pings.forEach((p) => { if (!map[p.veiculo_id]) map[p.veiculo_id] = p; });
    setUltimosPings(map);
  }, [pingsQ.data]);

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("radar-rejeitos")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "telemetria_frota" }, (payload) => {
        const p = payload.new as Ping;
        setUltimosPings((prev) => ({ ...prev, [p.veiculo_id]: p }));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "alertas_geofencing" }, () => {
        qc.invalidateQueries({ queryKey: ["radar-alertas"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const veiculos = veiculosQ.data ?? [];
  const cargas = cargasQ.data ?? [];
  const rotas = rotasQ.data ?? [];
  const alertas = alertasQ.data ?? [];

  const stats = useMemo(() => ({
    frota: veiculos.filter(v => v.ativo).length,
    emTransito: cargas.filter(c => c.status === "em_transito").length,
    alertasCriticos: alertas.filter(a => a.status === "active" && a.severidade === "critical").length,
    pingsAtivos: Object.keys(ultimosPings).length,
  }), [veiculos, cargas, alertas, ultimosPings]);

  const reload = () => {
    qc.invalidateQueries({ queryKey: ["radar-veiculos"] });
    qc.invalidateQueries({ queryKey: ["radar-cargas"] });
    qc.invalidateQueries({ queryKey: ["radar-rotas"] });
    qc.invalidateQueries({ queryKey: ["radar-alertas"] });
    qc.invalidateQueries({ queryKey: ["radar-pings-recentes"] });
  };

  const ackAlert = async (id: string) => {
    await supabase.from("alertas_geofencing").update({ status: "acknowledged" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["radar-alertas"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="outline" className="gap-1"><ShieldAlert className="h-3 w-3" /> Papel: {role ?? "—"}</Badge>
        <Badge variant="outline" className="gap-1"><Radio className="h-3 w-3" /> Realtime ativo</Badge>
        <Badge variant="outline">Pings recebidos: {pingsQ.data?.length ?? 0}</Badge>
        <Button size="sm" variant="ghost" onClick={reload} className="h-7 gap-1 ml-auto">
          <RefreshCw className="h-3 w-3" /> Recarregar
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Frota ativa", value: stats.frota, icon: Truck, color: "text-primary" },
          { label: "Cargas em trânsito", value: stats.emTransito, icon: MapPin, color: "text-info" },
          { label: "Veículos com ping", value: stats.pingsAtivos, icon: Radio, color: "text-success" },
          { label: "Alertas críticos", value: stats.alertasCriticos, icon: AlertTriangle, color: "text-destructive" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <s.icon className={`h-4 w-4 ${s.color}`} />{s.label}
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Mapa Operacional — Radar de Rejeitos</CardTitle>
        </CardHeader>
        <CardContent>
          <RadarMap
            veiculos={veiculos} cargas={cargas} rotas={rotas}
            ultimosPings={ultimosPings} alertas={alertas}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Alertas de Geofencing ({alertas.filter(a => a.status === "active").length} ativos)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {alertas.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Nenhum alerta registrado. A ingestão via edge function <code>ingest-telemetria</code> disparará eventos aqui em tempo real.
                </TableCell></TableRow>
              )}
              {alertas.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(a.created_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-xs">{TIPO_LABEL[a.tipo] ?? a.tipo}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${SEV_COLOR[a.severidade] ?? ""}`}>
                      {a.severidade}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs max-w-md">{a.mensagem}</TableCell>
                  <TableCell><Badge variant={a.status === "active" ? "destructive" : "secondary"}>{a.status}</Badge></TableCell>
                  <TableCell>
                    {a.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => ackAlert(a.id)}>Reconhecer</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cargas monitoradas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Detalhamento</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargas.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Nenhuma carga cadastrada.
                </TableCell></TableRow>
              )}
              {cargas.map((c) => {
                const v = veiculos.find(x => x.id === c.veiculo_id);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs">{CATEGORIA_LABEL[c.categoria] ?? c.categoria}</TableCell>
                    <TableCell className="text-xs">{c.detalhamento}</TableCell>
                    <TableCell className="text-xs">{c.origem_localidade ?? "—"}</TableCell>
                    <TableCell className="text-xs">{c.destino_final}</TableCell>
                    <TableCell className="text-xs">{v?.placa ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardRadarRejeitos() {
  return (
    <LixoesErrorBoundary>
      <RadarRejeitosInner />
    </LixoesErrorBoundary>
  );
}
