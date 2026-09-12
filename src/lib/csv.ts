/** Utilitários simples de leitura de CSV (vírgula ou ponto e vírgula, com aspas). */

export type CsvRow = Record<string, string>;

const detectDelimiter = (linha: string) => {
  const c = (linha.match(/,/g) || []).length;
  const s = (linha.match(/;/g) || []).length;
  return s > c ? ";" : ",";
};

const splitLine = (linha: string, delim: string): string[] => {
  const out: string[] = [];
  let atual = "";
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];
    if (ch === '"') {
      if (aspas && linha[i + 1] === '"') { atual += '"'; i++; }
      else aspas = !aspas;
    } else if (ch === delim && !aspas) {
      out.push(atual.trim());
      atual = "";
    } else {
      atual += ch;
    }
  }
  out.push(atual.trim());
  return out;
};

export const parseCsv = (texto: string): { headers: string[]; rows: CsvRow[] } => {
  const linhas = texto
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");
  if (linhas.length === 0) return { headers: [], rows: [] };

  const delim = detectDelimiter(linhas[0]);
  const headers = splitLine(linhas[0], delim).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const rows = linhas.slice(1).map((l) => {
    const vals = splitLine(l, delim);
    const row: CsvRow = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
    return row;
  });
  return { headers, rows };
};

export const baixarCsvModelo = (nome: string, colunas: string[], exemplo: string[]) => {
  const conteudo = `${colunas.join(";")}\n${exemplo.join(";")}\n`;
  const blob = new Blob([`\uFEFF${conteudo}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
};
