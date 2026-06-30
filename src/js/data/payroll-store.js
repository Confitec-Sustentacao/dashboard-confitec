import { appState } from "../state.js";
import { RUBRICAS } from "../config.js";

export function getMonthlySalaries() {
  return appState.payrollData.filter((item) => item.type === "mensal");
}

export function getAdditionalIncome() {
  return appState.payrollData.filter((item) => item.type !== "mensal");
}

export function findById(id) {
  return appState.payrollData.find((item) => item.id === id);
}

/**
 * Aggrega métricas para um conjunto de períodos selecionados.
 * Usado pelos cartões de KPI e pelo gráfico de evolução.
 */
export function getMetricsForPeriods(periodIds) {
  const metrics = {
    totalBruto: 0,
    totalLiquido: 0,
    totalDescontos: 0,
    totalFgts: 0,
    totalInss: 0,
    totalIrrf: 0,
  };

  periodIds.forEach((id) => {
    const data = findById(id);
    if (!data) return;

    metrics.totalBruto += data.totals.vencimentos;
    metrics.totalDescontos += data.totals.descontos;
    metrics.totalLiquido += data.totals.liquido;
    metrics.totalFgts += data.bases.fgtsMes;

    data.descontos.forEach((d) => {
      if (d.code === RUBRICAS.INSS) metrics.totalInss += d.value;
      if (d.code === RUBRICAS.IRRF || d.code === RUBRICAS.IRRF_PLR) metrics.totalIrrf += d.value;
    });
  });

  metrics.taxaEfetiva = metrics.totalBruto > 0
    ? ((metrics.totalInss + metrics.totalIrrf) / metrics.totalBruto) * 100
    : 0;

  return metrics;
}

/**
 * Retorna todas as linhas (vencimentos + descontos) atravessadas com metadados
 * do período. Usado pela tabela detalhada e exportações.
 */
export function getAllLineItems() {
  const items = [];
  appState.payrollData.forEach((p) => {
    p.vencimentos.forEach((v) => {
      items.push({
        periodId: p.id,
        period: p.period,
        typeLabel: p.typeLabel,
        type: "Provento",
        code: v.code,
        desc: v.description,
        ref: v.ref,
        value: v.value,
      });
    });
    p.descontos.forEach((d) => {
      items.push({
        periodId: p.id,
        period: p.period,
        typeLabel: p.typeLabel,
        type: "Desconto",
        code: d.code,
        desc: d.description,
        ref: d.ref,
        value: d.value,
      });
    });
  });
  return items;
}

/**
 * Soma do Adiantamento Salarial (código 0006) num holerite.
 * É tratado separadamente pois é antecipação do próprio salário, não imposto/contribuição.
 */
export function getAdiantamentoTotal(payroll) {
  return payroll.descontos
    .filter((d) => d.code === RUBRICAS.ADIANTAMENTO_SALARIAL)
    .reduce((acc, d) => acc + d.value, 0);
}

/**
 * Soma dos demais descontos (INSS, IRRF, Academia, etc.), excluindo o Adiantamento.
 */
export function getOutrosDescontosTotal(payroll) {
  return payroll.descontos
    .filter((d) => d.code !== RUBRICAS.ADIANTAMENTO_SALARIAL)
    .reduce((acc, d) => acc + d.value, 0);
}

export function getUniqueDescriptions() {
  const descs = new Set();
  appState.payrollData.forEach((p) => {
    p.vencimentos.forEach((v) => descs.add(v.description));
    p.descontos.forEach((d) => descs.add(d.description));
  });
  return Array.from(descs).sort((a, b) => a.localeCompare(b));
}

/**
 * Insere ou substitui um holerite na base, mantendo a ordem cronológica.
 */
export function upsertPayroll(payroll) {
  const index = appState.payrollData.findIndex((p) => p.id === payroll.id);
  if (index !== -1) {
    appState.payrollData[index] = payroll;
  } else {
    appState.payrollData.push(payroll);
  }
  appState.payrollData.sort((a, b) => a.id.localeCompare(b.id));
}

export function removePayroll(id) {
  const index = appState.payrollData.findIndex((p) => p.id === id);
  if (index === -1) return false;
  appState.payrollData.splice(index, 1);
  return true;
}
