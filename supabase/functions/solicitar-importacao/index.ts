import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const BodySchema = z.object({
  periodo_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inicial inválida (YYYY-MM-DD)'),
  periodo_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data final inválida (YYYY-MM-DD)'),
  regiao: z.string().min(1).max(120),
  fonte_tipo: z.enum(['url', 'arquivo']),
  fonte_url: z.string().url().max(2048).optional(),
  arquivo_nome: z.string().max(255).optional(),
  arquivo_base64: z.string().max(20_000_000).optional(),
  observacoes: z.string().max(2000).optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';

    const supabase = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const body = parsed.data;
    if (body.fonte_tipo === 'url' && !body.fonte_url) {
      return new Response(JSON.stringify({ error: 'fonte_url obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (body.fonte_tipo === 'arquivo' && (!body.arquivo_nome || !body.arquivo_base64)) {
      return new Response(JSON.stringify({ error: 'arquivo obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ticket = `IMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    console.log('[solicitar-importacao] nova solicitação', {
      ticket,
      user_id: user.id,
      email: user.email,
      periodo: `${body.periodo_inicio} → ${body.periodo_fim}`,
      regiao: body.regiao,
      fonte_tipo: body.fonte_tipo,
      fonte_url: body.fonte_url,
      arquivo_nome: body.arquivo_nome,
      arquivo_size_b64: body.arquivo_base64?.length ?? 0,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        ticket,
        message: 'Solicitação de importação registrada. A equipe de dados receberá o pedido.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[solicitar-importacao] erro', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
