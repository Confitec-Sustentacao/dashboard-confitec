import { appState } from "../state.js";
import { RUBRICAS } from "../config.js";
import { formatCurrency, formatPercent, escapeHtml } from "../utils/formatters.js";

export function renderSummaryTable() {
  const tbody = document.querySelector("#summary-table tbody");
  tbody.innerHTML = "";

  appState.payrollData.forEach((data) => {
    let inss = 0;
    let irrf = 0;
    data.descontos.forEach((d) => {
      if (d.code === RUBRICAS.INSS) inss = d.value;
      if (d.code === RUBRICAS.IRRF || d.code === RUBRICAS.IRRF_PLR) irrf = d.value;
    });
    const taxaEfetiva = data.totals.vencimentos > 0
      ? ((inss + irrf) / data.totals.vencimentos) * 100
      : 0;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td style="font-weight: 600;">${escapeHtml(data.period)}</td>
      <td><span class="badge" style="background: var(--bg-app); border: 1px solid var(--border-card); padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem;">${escapeHtml(data.typeLabel)}</span></td>
      <td style="font-weight: 500;">${formatCurrency(data.totals.vencimentos)}</td>
      <td style="color: var(--color-danger);">${formatCurrency(data.totals.descontos)}</td>
      <td style="color: var(--color-success); font-weight: 600;">${formatCurrency(data.totals.liquido)}</td>
      <td>${formatCurrency(data.bases.fgtsMes)}</td>
      <td>${formatPercent(taxaEfetiva)}</td>
    `;
    tbody.appendChild(row);
  });
}
