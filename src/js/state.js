/**
 * Estado central da aplicação.
 * Mantém os dados de holerites carregados e os filtros ativos.
 * Módulos importam este objeto e leem/escrevem diretamente.
 */
export const ITEM_TYPES = ["Provento", "Desconto"];

export const appState = {
  payrollData: [],
  selectedPeriodIds: [],
  filterPeriodIds: [],
  filterDescNames: [],
  filterTypes: [...ITEM_TYPES],
  charts: {
    evolution: null,
    deductions: null,
    income: null,
    fgts: null,
  },
};

export function setPayrollData(data) {
  appState.payrollData = data;
}

export function resetSelections() {
  appState.selectedPeriodIds = appState.payrollData.map((item) => item.id);
  appState.filterPeriodIds = appState.payrollData.map((item) => item.id);
  appState.filterTypes = [...ITEM_TYPES];
}
