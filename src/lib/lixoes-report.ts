/** Geração do relatório PDF do módulo Lixões (mapa + filtros + números principais). */

export type ReportNumero = { rotulo: string; valor: string; detalhe?: string };
export type ReportTabela = { titulo: string; linhas: Record<string, unknown>[] };

export type ReportInput = {
  titulo: string;
  subtitulo?: string;
  filtros: Record<string, string>;
  numeros: ReportNumero[];
  mapaDataUrl?: string | null;
  tabelas?: ReportTabela[];
};

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

/** Captura um elemento do DOM (ex.: container do Leaflet) como imagem PNG. */
export async function capturarElemento(el: HTMLElement | null): Promise<string | null> {
  if (!el) return null;
  try {
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(el, { useCORS: true, backgroundColor: "#ffffff", scale: 1.5, logging: false });
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

function tabelaHtml(t: ReportTabela) {
  if (t.linhas.length === 0) {
    return `<h2>${esc(t.titulo)}</h2><p class="vazio">Sem registros para os filtros aplicados.</p>`;
  }
  const headers = Object.keys(t.linhas[0]);
  return `<h2>${esc(t.titulo)}</h2>
    <table><thead><tr>${headers.map((h) => `<th>${esc(h.replace(/_/g, " "))}</th>`).join("")}</tr></thead>
    <tbody>${t.linhas
      .map((r) => `<tr>${headers.map((h) => `<td>${esc(r[h])}</td>`).join("")}</tr>`)
      .join("")}</tbody></table>`;
}

export function gerarRelatorioPDF(input: ReportInput) {
  const win = window.open("", "_blank", "width=1100,height=800");
  if (!win) return;
  const filtros = Object.entries(input.filtros)
    .map(([k, v]) => `<li><b>${esc(k)}:</b> ${esc(v)}</li>`)
    .join("");

  win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
  <title>${esc(input.titulo)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    body{font-family:system-ui,-apple-system,sans-serif;color:#111;margin:0}
    h1{font-size:20px;margin:0 0 2px}
    h2{font-size:14px;margin:22px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
    p.meta{font-size:11px;color:#666;margin:0 0 14px}
    ul.filtros{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:6px}
    ul.filtros li{font-size:11px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:4px;padding:3px 8px}
    .nums{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
    .num{border:1px solid #e5e7eb;border-radius:6px;padding:8px}
    .num .r{font-size:10px;color:#6b7280}
    .num .v{font-size:16px;font-weight:700}
    .num .d{font-size:10px;color:#6b7280}
    img.mapa{width:100%;border:1px solid #e5e7eb;border-radius:6px;margin-top:8px}
    table{width:100%;border-collapse:collapse;font-size:10px}
    th,td{border:1px solid #ddd;padding:4px 6px;text-align:left}
    th{background:#f3f4f6}
    p.vazio{font-size:11px;color:#6b7280}
    footer{margin-top:24px;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:6px}
  </style></head><body>
  <h1>${esc(input.titulo)}</h1>
  <p class="meta">SINARV · ${esc(input.subtitulo ?? "Módulo Lixões")} · gerado em ${new Date().toLocaleString("pt-BR")}</p>
  <h2>Filtros aplicados</h2>
  <ul class="filtros">${filtros || "<li>Nenhum filtro</li>"}</ul>
  <h2>Números principais</h2>
  <div class="nums">${input.numeros
    .map(
      (n) =>
        `<div class="num"><div class="r">${esc(n.rotulo)}</div><div class="v">${esc(n.valor)}</div>${
          n.detalhe ? `<div class="d">${esc(n.detalhe)}</div>` : ""
        }</div>`,
    )
    .join("")}</div>
  ${input.mapaDataUrl ? `<h2>Mapa</h2><img class="mapa" src="${input.mapaDataUrl}" alt="Mapa do módulo Lixões" />` : ""}
  ${(input.tabelas ?? []).map(tabelaHtml).join("")}
  <footer>Documento gerado automaticamente pelo SINARV — Sistema Nacional de Rastreabilidade de Resíduos.</footer>
  <script>window.onload=function(){setTimeout(function(){window.print()},350)}<\/script>
  </body></html>`);
  win.document.close();
}
