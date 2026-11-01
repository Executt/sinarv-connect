/** Simulador de sustentabilidade econômico-financeira do manejo de RSU (NR ANA nº 3/2022). */
export interface EntradaSimulador {
  populacao: number;
  domicilios: number;
  toneladasAno: number;
  custoColetaPorTon: number;
  custoDestinacaoPorTon: number;
  custoFixoAnual: number;
  taxaMensalPorDomicilio: number;
  inadimplenciaPct: number;
  outrasReceitasAnual: number;
}

export interface ResultadoSimulador {
  custoTotalAnual: number;
  arrecadacaoAnual: number;
  saldoAnual: number;
  coberturaPct: number;
  custoPorTonelada: number;
  custoPorHabitante: number;
  taxaEquilibrioMensal: number;
  situacao: "sustentavel" | "parcial" | "deficitaria";
}

export function simular(e: EntradaSimulador): ResultadoSimulador {
  const custoTotalAnual =
    e.toneladasAno * (e.custoColetaPorTon + e.custoDestinacaoPorTon) + e.custoFixoAnual;
  const adimplencia = 1 - Math.min(Math.max(e.inadimplenciaPct, 0), 100) / 100;
  const arrecadacaoTaxa = e.domicilios * e.taxaMensalPorDomicilio * 12 * adimplencia;
  const arrecadacaoAnual = arrecadacaoTaxa + e.outrasReceitasAnual;
  const coberturaPct = custoTotalAnual > 0 ? (arrecadacaoAnual / custoTotalAnual) * 100 : 0;
  const faltante = Math.max(custoTotalAnual - e.outrasReceitasAnual, 0);
  const taxaEquilibrioMensal =
    e.domicilios > 0 && adimplencia > 0 ? faltante / (e.domicilios * 12 * adimplencia) : 0;
  return {
    custoTotalAnual,
    arrecadacaoAnual,
    saldoAnual: arrecadacaoAnual - custoTotalAnual,
    coberturaPct,
    custoPorTonelada: e.toneladasAno > 0 ? custoTotalAnual / e.toneladasAno : 0,
    custoPorHabitante: e.populacao > 0 ? custoTotalAnual / e.populacao : 0,
    taxaEquilibrioMensal,
    situacao: coberturaPct >= 100 ? "sustentavel" : coberturaPct >= 70 ? "parcial" : "deficitaria",
  };
}

/** Valores ilustrativos — NÃO são dados oficiais. */
export const EXEMPLO: EntradaSimulador = {
  populacao: 100000,
  domicilios: 33000,
  toneladasAno: 30000,
  custoColetaPorTon: 180,
  custoDestinacaoPorTon: 90,
  custoFixoAnual: 1500000,
  taxaMensalPorDomicilio: 20,
  inadimplenciaPct: 15,
  outrasReceitasAnual: 300000,
};
