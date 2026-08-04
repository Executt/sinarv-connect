/** Regras de alerta de prazos do módulo Lixões (PNRS + Roteiro de Encerramento). */

export type JanelaPrazo = "vencido" | "30" | "60" | "90" | "fora";

export const JANELA_LABEL: Record<Exclude<JanelaPrazo, "fora">, string> = {
  vencido: "Prazo vencido",
  "30": "Vence em até 30 dias",
  "60": "Vence em 31–60 dias",
  "90": "Vence em 61–90 dias",
};

export const JANELA_CLASS: Record<Exclude<JanelaPrazo, "fora">, string> = {
  vencido: "bg-red-500/10 text-red-600 border-red-500/20",
  "30": "bg-orange-500/10 text-orange-600 border-orange-500/20",
  "60": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "90": "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

/** Dias restantes até uma data ISO (yyyy-mm-dd). Negativo quando já venceu. */
export function diasRestantes(dateISO: string | null): number | null {
  if (!dateISO) return null;
  const alvo = new Date(`${dateISO.slice(0, 10)}T00:00:00`).getTime();
  if (!Number.isFinite(alvo)) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((alvo - hoje.getTime()) / 86400000);
}

export function classificarPrazo(dias: number | null): JanelaPrazo {
  if (dias === null) return "fora";
  if (dias < 0) return "vencido";
  if (dias <= 30) return "30";
  if (dias <= 60) return "60";
  if (dias <= 90) return "90";
  return "fora";
}

export type AlertaPrazo = {
  id: string;
  origem: "pnrs" | "roteiro";
  lixaoId: string;
  titulo: string;
  contexto: string;
  data: string;
  dias: number;
  janela: Exclude<JanelaPrazo, "fora">;
};
