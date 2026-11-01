import { describe, it, expect } from "vitest";
import { simular, EXEMPLO } from "../simulador-financeiro";

describe("simulador financeiro", () => {
  it("custo total = toneladas × (coleta + destinação) + fixo", () => {
    expect(simular(EXEMPLO).custoTotalAnual).toBe(30000 * 270 + 1500000);
  });
  it("arrecadação desconta inadimplência", () => {
    expect(simular(EXEMPLO).arrecadacaoAnual).toBeCloseTo(33000 * 20 * 12 * 0.85 + 300000);
  });
  it("taxa de equilíbrio leva a cobertura de 100%", () => {
    const r = simular(EXEMPLO);
    const r2 = simular({ ...EXEMPLO, taxaMensalPorDomicilio: r.taxaEquilibrioMensal });
    expect(r2.coberturaPct).toBeCloseTo(100);
    expect(r2.situacao).toBe("sustentavel");
  });
  it("cobertura abaixo de 70% é deficitária", () => {
    expect(simular({ ...EXEMPLO, taxaMensalPorDomicilio: 0, outrasReceitasAnual: 0 }).situacao).toBe("deficitaria");
  });
});
