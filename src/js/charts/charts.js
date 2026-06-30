import { appState } from "../state.js";
import {
  findById,
  getMonthlySalaries,
  getAdiantamentoTotal,
  getOutrosDescontosTotal,
} from "../data/payroll-store.js";
import { getThemeColors } from "../ui/theme.js";
import { CHART_COLORS, RUBRICAS } from "../config.js";
import { formatCurrency } from "../utils/formatters.js";

/**
 * Plugin Chart.js: desenha o percentual de cada fatia diretamente sobre ela.
 * - Considera apenas fatias VISÍVEIS no cálculo do total (quando o usuário
 *   desmarca itens da legenda, os percentuais restantes se reajustam).
 * - Oculta rótulos de fatias muito pequenas (< 3%) para evitar poluição visual.
 */
const percentLabelsPlugin = {
  id: "percentLabels",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const dataset = chart.data.datasets[0];
    const meta = chart.getDatasetMeta(0);

    const visibleTotal = dataset.data.reduce(
      (sum, value, i) => (chart.getDataVisibility(i) ? sum + value : sum),
      0,
    );
    if (visibleTotal === 0) return;

    ctx.save();
    ctx.font = "bold 12px Outfit, system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 3;

    meta.data.forEach((arc, i) => {
      if (!chart.getDataVisibility(i)) return;
      const percent = (dataset.data[i] / visibleTotal) * 100;
      if (percent < 3) return;
      const { x, y } = arc.tooltipPosition();
      ctx.fillText(`${percent.toFixed(1)}%`, x, y);
    });
    ctx.restore();
  },
};

export function initCharts() {
  const colors = getThemeColors();
  const monthlyData = getMonthlySalaries();

  buildEvolutionChart(colors, monthlyData);
  buildDeductionsChart(colors);
  buildIncomeChart(colors);
  buildFgtsChart(colors);
}

export function destroyCharts() {
  Object.values(appState.charts).forEach((chart) => chart?.destroy());
  appState.charts = { evolution: null, deductions: null, income: null, fgts: null };
}

export function renderCharts(periodIds) {
  if (!appState.charts.evolution) return;

  // Evolução Mensal: Bruto, Líquido, Adiantamento Salarial, Outros Descontos
  const monthly = appState.payrollData.filter(
    (item) => item.type === "mensal" && periodIds.includes(item.id),
  );
  appState.charts.evolution.data.labels = monthly.map((d) => d.period.split("/")[0]);
  appState.charts.evolution.data.datasets[0].data = monthly.map((d) => d.totals.vencimentos);
  appState.charts.evolution.data.datasets[1].data = monthly.map((d) => d.totals.liquido);
  appState.charts.evolution.data.datasets[2].data = monthly.map(getAdiantamentoTotal);
  appState.charts.evolution.data.datasets[3].data = monthly.map(getOutrosDescontosTotal);
  appState.charts.evolution.update();

  // Composição de Descontos: detalhamento por rubrica, com Adiantamento em destaque
  const breakdown = buildDeductionsBreakdown(periodIds);
  appState.charts.deductions.data.labels = breakdown.labels;
  appState.charts.deductions.data.datasets[0].data = breakdown.values;
  appState.charts.deductions.data.datasets[0].backgroundColor = breakdown.backgroundColor;
  appState.charts.deductions.update();

  // Origem de Renda
  let baseTotal = 0;
  let addTotal = 0;
  periodIds.forEach((id) => {
    const p = findById(id);
    if (!p) return;
    p.vencimentos.forEach((v) => {
      if (v.code === RUBRICAS.SALARIO_BASE) baseTotal += v.value;
      else if (v.code !== RUBRICAS.PLR && v.code !== RUBRICAS.DECIMO_TERCEIRO) addTotal += v.value;
    });
  });
  appState.charts.income.data.datasets[0].data = [baseTotal, addTotal];
  appState.charts.income.update();

  // FGTS por Período
  const activeFgts = appState.payrollData.filter((item) => periodIds.includes(item.id));
  appState.charts.fgts.data.labels = activeFgts.map((d) => d.period);
  appState.charts.fgts.data.datasets[0].data = activeFgts.map((d) => d.bases.fgtsMes);
  appState.charts.fgts.update();
}

export function refreshChartThemes() {
  if (!appState.charts.evolution) return;
  const colors = getThemeColors();

  Object.values(appState.charts).forEach((chart) => {
    if (!chart) return;
    if (chart.options.plugins.legend?.labels) {
      chart.options.plugins.legend.labels.color = colors.text;
    }
    if (chart.options.scales) {
      if (chart.options.scales.x?.grid) {
        chart.options.scales.x.grid.color = colors.grid;
        chart.options.scales.x.ticks.color = colors.text;
      }
      if (chart.options.scales.y?.grid) {
        chart.options.scales.y.grid.color = colors.grid;
        chart.options.scales.y.ticks.color = colors.text;
      }
    }
    chart.options.plugins.tooltip.backgroundColor = colors.tooltipBg;
    chart.options.plugins.tooltip.titleColor = colors.tooltipText;
    chart.options.plugins.tooltip.bodyColor = colors.tooltipText;
    chart.update();
  });
}

function buildEvolutionChart(colors, monthlyData) {
  const ctx = document.getElementById("chart-evolution").getContext("2d");
  const periods = monthlyData.map((d) => d.period.split("/")[0]);

  appState.charts.evolution = new window.Chart(ctx, {
    type: "line",
    data: {
      labels: periods,
      datasets: [
        {
          label: "Salário Bruto",
          data: monthlyData.map((d) => d.totals.vencimentos),
          borderColor: CHART_COLORS.bruto,
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.3,
        },
        {
          label: "Salário Líquido",
          data: monthlyData.map((d) => d.totals.liquido),
          borderColor: CHART_COLORS.liquido,
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.3,
        },
        {
          label: "Adiantamento Salarial",
          data: monthlyData.map(getAdiantamentoTotal),
          borderColor: CHART_COLORS.ajuda,
          backgroundColor: "rgba(245, 158, 11, 0.05)",
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.3,
        },
        {
          label: "Outros Descontos",
          data: monthlyData.map(getOutrosDescontosTotal),
          borderColor: CHART_COLORS.descontos,
          backgroundColor: "rgba(239, 68, 68, 0.05)",
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.3,
        },
      ],
    },
    options: baseOptions(colors, true),
  });
}

function buildDeductionsChart(colors) {
  const ctx = document.getElementById("chart-deductions").getContext("2d");
  const periodIds = appState.payrollData.map((p) => p.id);
  const { labels, values, backgroundColor } = buildDeductionsBreakdown(periodIds);

  appState.charts.deductions = new window.Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor,
        borderWidth: 0,
      }],
    },
    options: pieOptions(colors, "right", { withPercent: true }),
    plugins: [percentLabelsPlugin],
  });
}

/**
 * Agrega descontos por descrição. O "Desconto de Adiantamento Salarial"
 * vai sempre na primeira posição com cor de destaque (âmbar) — é a rubrica
 * que mais representa o salário, então merece evidência visual separada
 * das contribuições e tributos.
 */
function buildDeductionsBreakdown(periodIds) {
  const discountSum = {};
  periodIds.forEach((id) => {
    const p = findById(id);
    if (!p) return;
    p.descontos.forEach((d) => {
      discountSum[d.description] = (discountSum[d.description] || 0) + d.value;
    });
  });

  const entries = Object.entries(discountSum);
  const adiantamentoIdx = entries.findIndex(([desc]) => /adiantamento/i.test(desc));
  if (adiantamentoIdx > 0) {
    const [adiantamentoEntry] = entries.splice(adiantamentoIdx, 1);
    entries.unshift(adiantamentoEntry);
  }

  const labels = entries.map(([desc]) => desc);
  const values = entries.map(([, val]) => val);
  const backgroundColor = labels.map((label, i) => {
    if (i === 0 && /adiantamento/i.test(label)) return CHART_COLORS.ajuda;
    // Pula a cor âmbar (já reservada para o adiantamento) ao distribuir o palette restante
    const palette = CHART_COLORS.donut.filter((c) => c !== CHART_COLORS.ajuda);
    return palette[(i - 1) % palette.length];
  });

  return { labels, values, backgroundColor };
}

function buildIncomeChart(colors) {
  const ctx = document.getElementById("chart-income-sources").getContext("2d");
  let baseTotal = 0;
  let addTotal = 0;
  appState.payrollData.forEach((p) => {
    p.vencimentos.forEach((v) => {
      if (v.code === RUBRICAS.SALARIO_BASE) baseTotal += v.value;
      else if (v.code !== RUBRICAS.PLR && v.code !== RUBRICAS.DECIMO_TERCEIRO) addTotal += v.value;
    });
  });

  appState.charts.income = new window.Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Salário Base (Fixo)", "Variáveis (Extras/Sobreaviso/DSR)"],
      datasets: [{
        data: [baseTotal, addTotal],
        backgroundColor: [CHART_COLORS.bruto, CHART_COLORS.fgts],
        borderWidth: 0,
      }],
    },
    options: pieOptions(colors, "bottom", { withPercent: true }),
    plugins: [percentLabelsPlugin],
  });
}

function buildFgtsChart(colors) {
  const ctx = document.getElementById("chart-fgts").getContext("2d");
  appState.charts.fgts = new window.Chart(ctx, {
    type: "bar",
    data: {
      labels: appState.payrollData.map((d) => d.period),
      datasets: [{
        label: "Depósito FGTS",
        data: appState.payrollData.map((d) => d.bases.fgtsMes),
        backgroundColor: CHART_COLORS.fgts,
        borderRadius: 8,
      }],
    },
    options: {
      ...baseOptions(colors, false),
      plugins: {
        legend: { display: false },
        tooltip: tooltipFor(colors, (ctx) => ` FGTS: ${formatCurrency(ctx.raw)}`),
      },
    },
  });
}

function baseOptions(colors, showLegend) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: colors.text }, display: showLegend },
      tooltip: tooltipFor(colors, (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`),
    },
    scales: {
      x: { grid: { color: colors.grid }, ticks: { color: colors.text } },
      y: {
        grid: { color: colors.grid },
        ticks: { color: colors.text },
        // Adiciona 15% de "respiração" acima/abaixo dos valores extremos —
        // evita que a linha mais baixa fique colada na base do gráfico
        grace: "15%",
      },
    },
  };
}

function pieOptions(colors, legendPosition, { withPercent = false } = {}) {
  const labelFn = withPercent
    ? (ctx) => {
        // Percentual relativo apenas às fatias VISÍVEIS (acompanha desmarcação na legenda)
        const visibleTotal = ctx.dataset.data.reduce(
          (sum, v, i) => (ctx.chart.getDataVisibility(i) ? sum + v : sum),
          0,
        );
        const pct = visibleTotal > 0 ? (ctx.raw / visibleTotal) * 100 : 0;
        return ` ${ctx.label}: ${formatCurrency(ctx.raw)} (${pct.toFixed(1)}%)`;
      }
    : (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.raw)}`;

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: legendPosition, labels: { color: colors.text } },
      tooltip: tooltipFor(colors, labelFn),
    },
  };
}

function tooltipFor(colors, labelFn) {
  return {
    backgroundColor: colors.tooltipBg,
    titleColor: colors.tooltipText,
    bodyColor: colors.tooltipText,
    callbacks: { label: labelFn },
  };
}
