import { describe, it, expect, beforeEach } from "vitest";
import { toCSV, carimboCSV } from "@/lib/residuos-criticos";

describe("exportações CSV", () => {
  beforeEach(() => localStorage.clear());

  it("gera cabeçalho e escapa separadores", () => {
    const csv = toCSV([{ UF: "SP", Nome: "Área; central" }]);
    expect(csv.split("\n")[0]).toBe("UF;Nome");
    expect(csv).toContain('"Área; central"');
  });

  it("carimba usuário, filtros e fonte", () => {
    localStorage.setItem("sinarv-export-user", "gestor@sinarv.gov.br");
    const carimbo = carimboCSV({ filtros: { UF: "MG" }, fonte: "MUNIC 2023" });
    expect(carimbo).toContain("gestor@sinarv.gov.br");
    expect(carimbo).toContain("UF=MG");
    expect(carimbo).toContain("MUNIC 2023");
    expect(carimbo.split("\n").every((l) => l.startsWith("# "))).toBe(true);
  });

  it("indica usuário não identificado sem sessão", () => {
    expect(carimboCSV()).toContain("não identificado");
  });
});
