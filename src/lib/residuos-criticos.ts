export const FLUXO_STATUS = ["rascunho", "enviado", "em_analise", "aprovado", "bloqueado"] as const;
export type FluxoStatus = (typeof FLUXO_STATUS)[number];

export const fluxoLabel: Record<FluxoStatus, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  em_analise: "Em análise",
  aprovado: "Aprovado",
  bloqueado: "Bloqueado",
};

export const fluxoColor: Record<FluxoStatus, string> = {
  rascunho: "bg-muted text-muted-foreground border-border",
  enviado: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  em_analise: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  aprovado: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  bloqueado: "bg-red-500/10 text-red-600 border-red-500/20",
};

/** Transições permitidas no fluxo de aprovação do MTR. */
export const fluxoTransicoes: Record<FluxoStatus, FluxoStatus[]> = {
  rascunho: ["enviado"],
  enviado: ["em_analise", "bloqueado"],
  em_analise: ["aprovado", "bloqueado"],
  aprovado: [],
  bloqueado: ["rascunho"],
};

export function maskCNPJ(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function isValidCNPJ(value: string) {
  const c = value.replace(/\D/g, "");
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const calc = (len: number) => {
    let sum = 0;
    let pos = len - 7;
    for (let i = 0; i < len; i++) {
      sum += Number(c[i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(c[12]) && calc(13) === Number(c[13]);
}

export function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

export function diasAte(dateISO: string) {
  return Math.ceil((new Date(`${dateISO}T00:00:00`).getTime() - Date.now()) / 86400000);
}

export function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(";"), ...rows.map((r) => headers.map((h) => esc(r[h])).join(";"))].join("\n");
}

/** Carimbo de responsabilidade das exportações (data/hora, usuário, filtros e fonte). */
export type ExportMeta = {
  usuario?: string;
  filtros?: Record<string, unknown>;
  fonte?: string;
};

const csvComment = (s: string) => `# ${String(s).replace(/[\r\n]+/g, " ")}`;

export function carimboCSV(meta: ExportMeta = {}): string {
  const usuario =
    meta.usuario ??
    (typeof localStorage !== "undefined" ? localStorage.getItem("sinarv-export-user") || "" : "");
  const filtros = Object.entries(meta.filtros ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  const linhas = [
    csvComment(`SINARV — exportação gerada em ${new Date().toLocaleString("pt-BR")}`),
    csvComment(`Usuário: ${usuario || "não identificado"}`),
    csvComment(`Filtros: ${filtros || "nenhum"}`),
    csvComment(`Fonte dos dados: ${meta.fonte || "Base SINARV"}`),
  ];
  return linhas.join("\n");
}

export function downloadCSV(filename: string, rows: Record<string, unknown>[], meta: ExportMeta = {}) {
  const csv = `${carimboCSV(meta)}\n${toCSV(rows)}`;
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Abre a janela de impressão do navegador com uma tabela — gera PDF via "Salvar como PDF". */
export function printPDF(titulo: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const win = window.open("", "_blank", "width=1024,height=768");
  if (!win) return;
  const escapeHtml = (s: unknown) =>
    String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
  win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
    <title>${escapeHtml(titulo)}</title>
    <style>
      body{font-family:system-ui,sans-serif;padding:24px;color:#111}
      h1{font-size:18px;margin:0 0 4px}
      p.meta{font-size:11px;color:#666;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:11px}
      th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
      th{background:#f3f4f6}
    </style></head><body>
    <h1>${escapeHtml(titulo)}</h1>
    <p class="meta">SINARV · gerado em ${new Date().toLocaleString("pt-BR")} · ${rows.length} registro(s)</p>
    <table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
    <tbody>${rows
      .map((r) => `<tr>${headers.map((h) => `<td>${escapeHtml(r[h])}</td>`).join("")}</tr>`)
      .join("")}</tbody></table>
    <script>window.onload=function(){window.print()}<\/script>
    </body></html>`);
  win.document.close();
}
