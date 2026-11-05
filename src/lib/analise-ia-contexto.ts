// Monta o balanço de massa e o resumo de MTR da análise de IA
// usando SOMENTE registros do município e do período escolhidos.

export const normTxt = (s?: string | null) =>
  (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

export type MunicipioRef = { nome: string; uf: string };

export const mesmoMunicipio = (a: MunicipioRef, nome?: string | null, uf?: string | null) =>
  normTxt(a.nome) === normTxt(nome) && normTxt(a.uf) === normTxt(uf);

const anoDe = (d: unknown) => (d ? new Date(d as string).getFullYear() : NaN);

type Coop = { id: string; cidade?: string | null; estado?: string | null };

export function montarBalancoMunicipio(opts: {
  municipio: MunicipioRef;
  inicio: number;
  fim: number;
  cooperativas: Coop[];
  entradas: any[];
  saidas: any[];
}) {
  const { municipio, inicio, fim } = opts;
  const ids = new Set(opts.cooperativas.filter((c) => mesmoMunicipio(municipio, c.cidade, c.estado)).map((c) => c.id));
  const noPeriodo = (d: unknown) => { const a = anoDe(d); return a >= inicio && a <= fim; };
  const bal: Record<string, { material: string; entrada_kg: number; saida_kg: number }> = {};
  const g = (k: string) => (bal[k] ??= { material: k, entrada_kg: 0, saida_kg: 0 });
  opts.entradas
    .filter((e) => ids.has(e.cooperativa_id) && noPeriodo(e.data_recebimento ?? e.created_at))
    .forEach((e) => (g(e.tipo_material || "Outros").entrada_kg += Number(e.peso_bruto_kg) || 0));
  opts.saidas
    .filter((s) => ids.has(s.cooperativa_id) && noPeriodo(s.data_despacho ?? s.created_at))
    .forEach((s) => (g(s.tipo_material || "Outros").saida_kg += Number(s.peso_kg ?? s.peso_despachado_kg ?? s.peso_liquido_kg) || 0));
  return Object.values(bal).map((b) => ({ ...b, saldo_kg: b.entrada_kg - b.saida_kg }));
}

export function resumirMtrMunicipio(opts: { municipio: MunicipioRef; inicio: number; fim: number; mtr: any[] }) {
  const { municipio, inicio, fim } = opts;
  const lista = opts.mtr.filter((m) => {
    const a = anoDe(m.created_at);
    return a >= inicio && a <= fim && mesmoMunicipio(municipio, m.geradores_criticos?.municipio, m.geradores_criticos?.uf);
  });
  const por_status: Record<string, number> = {};
  let peso_kg = 0;
  lista.forEach((m) => {
    const k = m.fluxo_status ?? "indefinido";
    por_status[k] = (por_status[k] ?? 0) + 1;
    peso_kg += Number(m.quantidade_kg) || 0;
  });
  return { total: lista.length, peso_kg, por_status };
}
