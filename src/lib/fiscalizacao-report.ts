import { gerarRelatorioPDF } from "@/lib/lixoes-report";

export const TIPOS_DOCUMENTO: Record<string, string> = {
  notificacao_previa: "Notificação prévia",
  auto_infracao: "Auto de infração",
  termo_ajustamento_conduta: "Termo de Ajustamento de Conduta",
  oficio_diligencia: "Ofício de diligência",
};

export const FASES_TRAMITACAO: Record<string, string> = {
  instaurado: "Instaurado",
  notificado: "Notificado",
  defesa_apresentada: "Defesa apresentada",
  em_analise_juridica: "Em análise jurídica",
  saneado: "Saneado",
  executado: "Executado",
};

export const ENQUADRAMENTOS = [
  "Lei 12.305/2010 (PNRS), art. 47 — disposição final inadequada",
  "Lei 12.305/2010, art. 54 (red. Lei 14.026/2020) — prazo de encerramento de lixões",
  "Decreto 11.043/2022 (Planares) — metas de recuperação e desvio de aterro",
  "Decreto 10.936/2022 — logística reversa e responsabilidade compartilhada",
  "Portaria MMA nº 280/2020 — MTR obrigatório",
  "NR ANA nº 3/2022 — sustentabilidade econômico-financeira do serviço",
];

/** Data-limite de resposta a partir da notificação. */
export function dataLimiteResposta(dataNotificacao: string | null | undefined, dias: number | null | undefined): string | null {
  if (!dataNotificacao || !dias || dias <= 0) return null;
  const d = new Date(dataNotificacao + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export async function sha256Hex(texto: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type AcaoFiscalizacao = {
  id: string; municipio: string; uf: string; titulo: string; descricao?: string | null;
  prioridade: string; numero_processo?: string | null; enquadramento_legal?: string | null;
  tipo_documento: string; fase_tramitacao: string; data_notificacao?: string | null; prazo_resposta_dias?: number | null;
};

export type IndicadoresMunicipio = { desvio?: string; meta?: string; pesoAprovado?: string; foraBalanco?: string; mtrBloqueados?: number };

/** Gera o termo em PDF e devolve o hash SHA-256 do seu conteúdo canônico. */
export async function emitirTermo(a: AcaoFiscalizacao, ind: IndicadoresMunicipio, usuario: string): Promise<string> {
  const emitidoEm = new Date().toISOString();
  const limite = dataLimiteResposta(a.data_notificacao, a.prazo_resposta_dias);
  const canonico = JSON.stringify({ id: a.id, processo: a.numero_processo, tipo: a.tipo_documento, municipio: a.municipio, uf: a.uf, titulo: a.titulo, enquadramento: a.enquadramento_legal, ind, emitidoEm, usuario });
  const hash = await sha256Hex(canonico);
  const tipo = TIPOS_DOCUMENTO[a.tipo_documento] ?? a.tipo_documento;
  gerarRelatorioPDF({
    titulo: `${tipo} — ${a.municipio}/${a.uf}`,
    subtitulo: a.numero_processo ? `Processo nº ${a.numero_processo}` : "Processo ainda sem número",
    filtros: {
      Município: `${a.municipio}/${a.uf}`,
      "Fase de tramitação": FASES_TRAMITACAO[a.fase_tramitacao] ?? a.fase_tramitacao,
      Prioridade: a.prioridade,
      "Data da notificação": a.data_notificacao ?? "—",
      "Prazo para resposta": limite ? `${a.prazo_resposta_dias} dias (até ${limite})` : "—",
    },
    numeros: [
      { rotulo: "Desvio de aterro", valor: ind.desvio ?? "—", detalhe: ind.meta },
      { rotulo: "Peso aprovado no balanço", valor: ind.pesoAprovado ?? "—" },
      { rotulo: "Fora do balanço", valor: ind.foraBalanco ?? "—" },
      { rotulo: "MTR bloqueados", valor: String(ind.mtrBloqueados ?? 0) },
    ],
    textoLivre: {
      titulo: "Fundamentação e determinação",
      texto: `Inconformidade: ${a.titulo}.\n${a.descricao ?? ""}\n\nEnquadramento legal: ${a.enquadramento_legal ?? "não informado"}.\n\nFica o município notificado a apresentar manifestação e plano de regularização${limite ? ` até ${limite}` : " no prazo fixado pelo órgão"}, sob pena das sanções previstas na legislação aplicável.\n\nHash SHA-256 do documento: ${hash}\nEmitido em ${emitidoEm} (UTC).`,
    },
    usuario,
    fonteDados: "SINARV — benchmarks municipais, MTR e ações de fiscalização",
  });
  return hash;
}
