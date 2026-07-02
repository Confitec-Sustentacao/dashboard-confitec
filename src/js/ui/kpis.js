import { appState } from "../state.js";
import { getMetricsForPeriods } from "../data/payroll-store.js";
import { formatCurrency, formatPercent } from "../utils/formatters.js";

const elements = {};

function $(id) {
  if (!elements[id]) elements[id] = document.getElementById(id);
  return elements[id];
}

export function renderKPIs(periodIds) {
  if (periodIds.length === 0) {
    setEmptyState();
    return;
  }

  const m = getMetricsForPeriods(periodIds);

  $("kpi-bruto-val").innerText = formatCurrency(m.totalBruto);
  // Líquido "de fato recebido" = bruto − outros descontos (adiantamento compõe o líquido)
  $("kpi-liquido-val").innerText = formatCurrency(m.liquidoReal);
  // Total retido = só descontos reais (exclui adiantamento, que é salário antecipado)
  $("kpi-descontos-val").innerText = formatCurrency(m.totalOutrosDescontos);
  $("kpi-fgts-val").innerText = formatCurrency(m.totalFgts);
  $("kpi-taxa-val").innerText = formatPercent(m.taxaEfetiva);

  const isConsolidado = periodIds.length === appState.payrollData.length;
  const descLabel = isConsolidado
    ? "Período consolidado"
    : `${periodIds.length} período(s) selecionado(s)`;

  $("kpi-bruto-sub").innerText = `Proventos brutos (${descLabel})`;
  $("kpi-liquido-sub").innerText = "Recebido (inclui adiantamento)";
  $("kpi-descontos-sub").innerText = "Descontos reais (exclui adiantamento)";
  $("kpi-fgts-sub").innerText = "Depósitos de FGTS do período";
  $("kpi-taxa-sub").innerText = "Impostos efetivos (INSS + IRRF)";
}

function setEmptyState() {
  $("kpi-bruto-val").innerText = "R$ 0,00";
  $("kpi-liquido-val").innerText = "R$ 0,00";
  $("kpi-descontos-val").innerText = "R$ 0,00";
  $("kpi-fgts-val").innerText = "R$ 0,00";
  $("kpi-taxa-val").innerText = "0,0%";

  ["kpi-bruto-sub", "kpi-liquido-sub", "kpi-descontos-sub", "kpi-fgts-sub", "kpi-taxa-sub"]
    .forEach((id) => ($(id).innerText = "Nenhum período selecionado"));
}
