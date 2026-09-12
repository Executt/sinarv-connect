import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const BodySchema = z.object({
  tipo: z.enum(['mtr', 'licencas', 'munic']),
  arquivo_nome: z.string().max(255).optional(),
  fonte: z.string().max(255).optional(),
  escopo_uf: z.string().max(40).optional(),
  periodo_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  periodo_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  observacoes: z.string().max(2000).optional(),
  linhas: z.array(z.record(z.string(), z.any())).min(1).max(5000),
});

const num = (v: unknown) => {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(String(v).replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
};
const onlyDigits = (v: unknown) => String(v ?? '').replace(/\D/g, '');
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data deve ser YYYY-MM-DD');

const LicencaSchema = z.object({
  cnpj_operador: z.string().min(11),
  tipo: z.string().min(1).max(60),
  numero: z.string().min(1).max(80),
  orgao_emissor: z.string().min(1).max(120),
  emissao: dateStr,
  validade: dateStr,
  observacoes: z.string().max(1000).optional(),
});

const MtrSchema = z.object({
  codigo: z.string().min(1).max(60),
  cnpj_gerador: z.string().min(11),
  cnpj_transportador: z.string().optional(),
  cnpj_destinador: z.string().optional(),
  classe_residuo: z.string().min(1).max(60),
  onu_number: z.string().max(20).optional(),
  quantidade_kg: z.number().positive(),
  data_prevista: z.string().optional(),
  data_coleta: z.string().optional(),
});

const MunicSchema = z.object({
  ano_referencia: z.number().int().min(1990).max(2100),
  regiao: z.string().min(1).max(60),
  pct_lixao: z.number().min(0).max(100),
  pct_aterro_controlado: z.number().min(0).max(100).optional(),
  pct_aterro_sanitario: z.number().min(0).max(100).optional(),
  pct_lixao_acima_50k: z.number().min(0).max(100).optional(),
  pct_coleta_seletiva: z.number().min(0).max(100).optional(),
  pct_instrumento_legal: z.number().min(0).max(100).optional(),
  pct_catadores_informais: z.number().min(0).max(100).optional(),
  pct_entidades_catadores: z.number().min(0).max(100).optional(),
  fonte: z.string().max(200).optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';

    const caller = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: userRes } = await caller.auth.getUser();
    const user = userRes?.user;
    if (!user) return json({ error: 'unauthorized' }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: rolesRows } = await admin.from('user_roles').select('role').eq('user_id', user.id);
    const roles = (rolesRows ?? []).map((r: any) => r.role as string);
    if (roles.length === 0) return json({ error: 'Usuário sem perfil atribuído' }, 403);
    const isGov = roles.includes('gov') || roles.includes('super_admin');

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const body = parsed.data;

    if (body.tipo === 'munic' && !isGov) {
      return json({ error: 'Somente perfis de governo podem importar indicadores PNRS/MUNIC' }, 403);
    }

    const erros: { linha: number; mensagem: string }[] = [];
    let ok = 0;

    for (let i = 0; i < body.linhas.length; i++) {
      const raw = body.linhas[i];
      const nLinha = i + 2; // cabeçalho = linha 1
      try {
        if (body.tipo === 'licencas') {
          const r = LicencaSchema.parse({
            cnpj_operador: onlyDigits(raw.cnpj_operador ?? raw.cnpj),
            tipo: String(raw.tipo ?? '').trim(),
            numero: String(raw.numero ?? '').trim(),
            orgao_emissor: String(raw.orgao_emissor ?? '').trim(),
            emissao: String(raw.emissao ?? '').trim(),
            validade: String(raw.validade ?? '').trim(),
            observacoes: raw.observacoes ? String(raw.observacoes) : undefined,
          });
          if (r.emissao > r.validade) throw new Error('emissão posterior à validade');
          const { data: op } = await admin
            .from('operadores_logisticos').select('id').eq('cnpj', r.cnpj_operador).maybeSingle();
          if (!op) throw new Error(`operador com CNPJ ${r.cnpj_operador} não cadastrado`);

          const { data: existente } = await admin
            .from('licencas_ambientais').select('id')
            .eq('operador_id', op.id).eq('numero', r.numero).maybeSingle();

          const payload = {
            operador_id: op.id, tipo: r.tipo, numero: r.numero, orgao_emissor: r.orgao_emissor,
            emissao: r.emissao, validade: r.validade, observacoes: r.observacoes ?? null,
          };
          const res = existente
            ? await admin.from('licencas_ambientais').update(payload).eq('id', existente.id)
            : await admin.from('licencas_ambientais').insert(payload);
          if (res.error) throw new Error(res.error.message);
        } else if (body.tipo === 'mtr') {
          const r = MtrSchema.parse({
            codigo: String(raw.codigo ?? '').trim(),
            cnpj_gerador: onlyDigits(raw.cnpj_gerador),
            cnpj_transportador: raw.cnpj_transportador ? onlyDigits(raw.cnpj_transportador) : undefined,
            cnpj_destinador: raw.cnpj_destinador ? onlyDigits(raw.cnpj_destinador) : undefined,
            classe_residuo: String(raw.classe_residuo ?? '').trim(),
            onu_number: raw.onu_number ? String(raw.onu_number) : undefined,
            quantidade_kg: num(raw.quantidade_kg) ?? NaN,
            data_prevista: raw.data_prevista ? String(raw.data_prevista) : undefined,
            data_coleta: raw.data_coleta ? String(raw.data_coleta) : undefined,
          });

          const { data: ger } = await admin
            .from('geradores_criticos').select('id').eq('cnpj', r.cnpj_gerador).maybeSingle();
          if (!ger) throw new Error(`gerador com CNPJ ${r.cnpj_gerador} não cadastrado`);

          let operador_id: string | null = null;
          if (r.cnpj_transportador) {
            const { data: t } = await admin.from('operadores_logisticos').select('id').eq('cnpj', r.cnpj_transportador).maybeSingle();
            if (!t) throw new Error(`transportador com CNPJ ${r.cnpj_transportador} não cadastrado`);
            operador_id = t.id;
          }
          let destinador_id: string | null = null;
          if (r.cnpj_destinador) {
            const { data: d } = await admin.from('operadores_logisticos').select('id').eq('cnpj', r.cnpj_destinador).maybeSingle();
            if (!d) throw new Error(`destinador com CNPJ ${r.cnpj_destinador} não cadastrado`);
            destinador_id = d.id;
          }

          const payload: Record<string, unknown> = {
            codigo: r.codigo,
            gerador_id: ger.id,
            operador_id,
            destinador_id,
            classe_residuo: r.classe_residuo,
            onu_number: r.onu_number ?? null,
            quantidade_kg: r.quantidade_kg,
            data_prevista: r.data_prevista || null,
            data_coleta: r.data_coleta || null,
            created_by: user.id,
          };

          const { data: existente } = await admin
            .from('mtr_solicitacoes').select('id').eq('codigo', r.codigo).maybeSingle();
          const res = existente
            ? await admin.from('mtr_solicitacoes').update(payload).eq('id', existente.id)
            : await admin.from('mtr_solicitacoes').insert(payload);
          if (res.error) throw new Error(res.error.message);
        } else {
          const r = MunicSchema.parse({
            ano_referencia: num(raw.ano_referencia),
            regiao: String(raw.regiao ?? '').trim(),
            pct_lixao: num(raw.pct_lixao),
            pct_aterro_controlado: num(raw.pct_aterro_controlado),
            pct_aterro_sanitario: num(raw.pct_aterro_sanitario),
            pct_lixao_acima_50k: num(raw.pct_lixao_acima_50k),
            pct_coleta_seletiva: num(raw.pct_coleta_seletiva),
            pct_instrumento_legal: num(raw.pct_instrumento_legal),
            pct_catadores_informais: num(raw.pct_catadores_informais),
            pct_entidades_catadores: num(raw.pct_entidades_catadores),
            fonte: raw.fonte ? String(raw.fonte) : undefined,
          });

          const { data: existente } = await admin
            .from('munic_diagnostico').select('id')
            .eq('ano_referencia', r.ano_referencia).eq('regiao', r.regiao).maybeSingle();

          const payload = { ...r, fonte: r.fonte ?? 'IBGE MUNIC - Suplemento de Saneamento' };
          const res = existente
            ? await admin.from('munic_diagnostico').update(payload).eq('id', existente.id)
            : await admin.from('munic_diagnostico').insert(payload);
          if (res.error) throw new Error(res.error.message);
        }
        ok++;
      } catch (e) {
        const msg = e instanceof z.ZodError
          ? e.errors.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ')
          : (e as Error).message;
        erros.push({ linha: nLinha, mensagem: msg });
      }
    }

    const { data: lote, error: loteErr } = await admin.from('importacoes_oficiais').insert({
      tipo: body.tipo,
      origem: 'upload',
      arquivo_nome: body.arquivo_nome ?? null,
      fonte: body.fonte ?? null,
      escopo_uf: body.escopo_uf ?? null,
      periodo_inicio: body.periodo_inicio ?? null,
      periodo_fim: body.periodo_fim ?? null,
      total_linhas: body.linhas.length,
      linhas_ok: ok,
      linhas_erro: erros.length,
      erros: erros.slice(0, 200),
      status: erros.length === 0 ? 'concluida' : (ok === 0 ? 'falhou' : 'parcial'),
      observacoes: body.observacoes ?? null,
      importado_por: user.id,
      importado_por_email: user.email ?? null,
    }).select('id').single();
    if (loteErr) console.error('[importar-dados-oficiais] erro ao registrar lote', loteErr);

    return json({ ok: true, lote_id: lote?.id ?? null, total: body.linhas.length, importadas: ok, erros });
  } catch (err) {
    console.error('[importar-dados-oficiais] erro', err);
    return json({ error: (err as Error).message }, 500);
  }
});
