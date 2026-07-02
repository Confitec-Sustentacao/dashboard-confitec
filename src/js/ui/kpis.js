import { appState } from "../state.js";
import { getMetricsForPeriods } from "../data/payroll-store.js";
import { formatCurrency, formatPercent, escapeHtml } from "../utils/formatters.js";

const elements = {};

function $(id) {
  if (!elements[id]) elements[id] = document.getElementById(id);
  return elements[id];
}

// Definição de cada KPI para o cálculo de variação:
// - metric: chave no objeto de métricas
// - increaseIsGood: se subir é positivo (verde) ou negativo (vermelho)
// - kind: "money" (variação %) ou "pp" (diferença em pontos percentuais)
const DELTA_CONFIG = [
  { id: "kpi-bruto-delta",     metric: "totalBruto",          increaseIsGood: true,  kind: "money" },
  { id: "kpi-liquido-delta",   metric: "liquidoReal",         increaseIsGood: true,  kind: "money" },
  { id: "kpi-descontos-delta", metric: "totalOutrosDescontos", increaseIsGood: false, kind: "money" },
  { id: "kpi-fgts-delta",      metric: "totalFgts",           increaseIsGood: true,  kind: "money" },
  { id: "kpi-taxa-delta",      metric: "taxaEfetiva",         increaseIsGood: false, kind: "pp" },
];

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

  renderDeltas(periodIds);
}

/**
 * Variação mês a mês: compara o mês mais recente da seleção contra o mês
 * anterior a ele (na base completa). Usa apenas holerites mensais — PLR e
 * 13º não entram para não distorcer a comparação de tendência.
 */
function renderDeltas(periodIds) {
  const monthly = appState.payrollData.filter((p) => p.type === "mensal");
  const selectedMonthly = monthly.filter((p) => periodIds.includes(p.id));

  if (selectedMonthly.length === 0) return clearDeltas();

  const current = selectedMonthly[selectedMonthly.length - 1];
  const currentIdx = monthly.findIndex((p) => p.id === current.id);
  if (currentIdx <= 0) return clearDeltas(); // não há mês anterior para comparar

  const previous = monthly[currentIdx - 1];
  const curM = getMetricsForPeriods([current.id]);
  const prevM = getMetricsForPeriods([previous.id]);
  const label = `vs ${previous.period.split("/")[0]}`;

  DELTA_CONFIG.forEach((cfg) => {
    renderDelta($(cfg.id), curM[cfg.metric], prevM[cfg.metric], cfg, label);
  });
}

function renderDelta(el, curVal, prevVal, cfg, label) {
  if (!el) return;

  // Base zero: sem referência para variação percentual
  if (cfg.kind === "money" && prevVal === 0) {
    el.className = "kpi-delta neutral";
    el.innerHTML = "";
    return;
  }

  let diff;
  let magnitude;
  if (cfg.kind === "pp") {
    diff = curVal - prevVal;
    magnitude = `${Math.abs(diff).toFixed(1).replace(".", ",")} p.p.`;
  } else {
    diff = ((curVal - prevVal) / Math.abs(prevVal)) * 100;
    magnitude = `${Math.abs(diff).toFixed(1).replace(".", ",")}%`;
  }

  const isUp = diff > 0.05;
  const isDown = diff < -0.05;
  const arrow = isUp ? "▲" : isDown ? "▼" : "—";

  let cls = "neutral";
  if (isUp) cls = cfg.increaseIsGood ? "positive" : "negative";
  else if (isDown) cls = cfg.increaseIsGood ? "negative" : "positive";

  el.className = `kpi-delta ${cls}`;
  el.innerHTML = `<span>${arrow} ${magnitude}</span><span class="delta-label">${escapeHtml(label)}</span>`;
}

function clearDeltas() {
  DELTA_CONFIG.forEach((cfg) => {
    const el = $(cfg.id);
    if (el) {
      el.className = "kpi-delta neutral";
      el.innerHTML = "";
    }
  });
}

function setEmptyState() {
  $("kpi-bruto-val").innerText = "R$ 0,00";
  $("kpi-liquido-val").innerText = "R$ 0,00";
  $("kpi-descontos-val").innerText = "R$ 0,00";
  $("kpi-fgts-val").innerText = "R$ 0,00";
  $("kpi-taxa-val").innerText = "0,0%";

  ["kpi-bruto-sub", "kpi-liquido-sub", "kpi-descontos-sub", "kpi-fgts-sub", "kpi-taxa-sub"]
    .forEach((id) => ($(id).innerText = "Nenhum período selecionado"));

  clearDeltas();
}
