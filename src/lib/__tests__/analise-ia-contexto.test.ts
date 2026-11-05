import { describe, it, expect } from "vitest";
import { montarBalancoMunicipio, resumirMtrMunicipio } from "../analise-ia-contexto";

const cooperativas = [
  { id: "c-aju", cidade: "Aracaju", estado: "SE" },
  { id: "c-ssa", cidade: "Salvador", estado: "BA" },
];
const entradas = [
  { cooperativa_id: "c-aju", tipo_material: "PET", peso_bruto_kg: 100, data_recebimento: "2025-03-01" },
  { cooperativa_id: "c-ssa", tipo_material: "PET", peso_bruto_kg: 900, data_recebimento: "2025-03-01" },
  { cooperativa_id: "c-aju", tipo_material: "PET", peso_bruto_kg: 50, data_recebimento: "2019-03-01" },
];
const saidas = [
  { cooperativa_id: "c-aju", tipo_material: "PET", peso_kg: 40, data_despacho: "2025-04-01" },
  { cooperativa_id: "c-ssa", tipo_material: "PET", peso_kg: 700, data_despacho: "2025-04-01" },
];

describe("análise de IA por município", () => {
  it("não mistura pesos de municípios diferentes no balanço", () => {
    const b = montarBalancoMunicipio({ municipio: { nome: "Aracaju", uf: "SE" }, inicio: 2024, fim: 2025, cooperativas, entradas, saidas });
    expect(b).toEqual([{ material: "PET", entrada_kg: 100, saida_kg: 40, saldo_kg: 60 }]);
  });

  it("não mistura MTR de outro município nem de fora do período", () => {
    const mtr = [
      { quantidade_kg: 10, fluxo_status: "aprovado", created_at: "2025-01-01", geradores_criticos: { municipio: "Aracaju", uf: "SE" } },
      { quantidade_kg: 999, fluxo_status: "aprovado", created_at: "2025-01-01", geradores_criticos: { municipio: "Salvador", uf: "BA" } },
      { quantidade_kg: 5, fluxo_status: "aprovado", created_at: "2018-01-01", geradores_criticos: { municipio: "Aracaju", uf: "SE" } },
    ];
    const r = resumirMtrMunicipio({ municipio: { nome: "aracajú", uf: "se" }, inicio: 2024, fim: 2025, mtr });
    expect(r).toEqual({ total: 1, peso_kg: 10, por_status: { aprovado: 1 } });
  });
});
