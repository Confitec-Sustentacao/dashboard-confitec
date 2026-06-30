import { appState } from "../state.js";
import { getAllLineItems } from "../data/payroll-store.js";
import { formatCurrency, formatRef, escapeHtml } from "../utils/formatters.js";

export function renderItemsTable() {
  const tbody = document.querySelector("#items-detail-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filteredItems = getFilteredItems();

  if (filteredItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhum item encontrado com os filtros aplicados.</td></tr>`;
    return;
  }

  filteredItems.forEach((item) => {
    const row = document.createElement("tr");
    const valClass = item.type === "Provento"
      ? "color: var(--color-success);"
      : "color: var(--color-danger);";

    row.innerHTML = `
      <td style="font-weight: 600;">${escapeHtml(item.period)} <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: normal;">(${escapeHtml(item.typeLabel)})</span></td>
      <td><span class="badge" style="background: var(--bg-app); border: 1px solid var(--border-card); padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem;">${escapeHtml(item.type)}</span></td>
      <td>${escapeHtml(item.desc)}</td>
      <td style="text-align: right;">${item.ref ? formatRef(item.ref) : "-"}</td>
      <td style="text-align: right; font-weight: 600; ${valClass}">${formatCurrency(item.value)}</td>
    `;
    tbody.appendChild(row);
  });
}

export function getFilteredItems() {
  return getAllLineItems().filter((item) => {
    return appState.filterPeriodIds.includes(item.periodId) &&
           appState.filterDescNames.includes(item.desc) &&
           appState.filterTypes.includes(item.type);
  });
}
