/**
 * Ponto de entrada da aplicação.
 * - Carrega módulos
 * - Conecta callbacks entre eles (multiselect → KPI/gráficos, upload → refresh global)
 * - Executa renderizações iniciais
 */

import { appState, resetSelections } from "./state.js";
import { getUniqueDescriptions } from "./data/payroll-store.js";

import { initTheme } from "./ui/theme.js";
import { initNavigation } from "./ui/navigation.js";
import {
  initGlobalMultiselect,
  initItemPeriodMultiselect,
  initItemDescMultiselect,
  initItemTypeMultiselect,
  bindOutsideClickHandler,
} from "./ui/multiselect.js";
import { renderKPIs } from "./ui/kpis.js";
import { renderSummaryTable } from "./ui/summary-table.js";
import { renderItemsTable } from "./ui/items-table.js";
import { renderBonuses } from "./ui/bonuses.js";
import {
  renderHoleriteMirror,
  populateHoleriteDropdown,
  bindHoleriteDropdown,
} from "./ui/holerite-mirror.js";
import { initSimulator, runSalarySimulation, populateSimulatorFromHolerite } from "./ui/simulator.js";
import { updateSidebarProfile, resetSidebarProfile } from "./ui/sidebar-profile.js";
import { bindExportButtons } from "./ui/export.js";
import { initUploadModal } from "./ui/upload-modal.js";
import { initCharts, destroyCharts, renderCharts, refreshChartThemes } from "./charts/charts.js";

document.addEventListener("DOMContentLoaded", () => {
  window.lucide?.createIcons();

  const multiselects = {};

  initTheme(() => refreshChartThemes());

  initNavigation({
    "holerite-mirror": () => {
      const select = document.getElementById("holerite-period-select");
      renderHoleriteMirror(select.value);
    },
    simulator: runSalarySimulation,
  });

  multiselects.global = initGlobalMultiselect((periodIds) => {
    renderKPIs(periodIds);
    renderCharts(periodIds);
  });

  multiselects.itemPeriod = initItemPeriodMultiselect(() => renderItemsTable());
  multiselects.itemDesc = initItemDescMultiselect(getUniqueDescriptions, () => renderItemsTable());
  multiselects.itemType = initItemTypeMultiselect(() => renderItemsTable());

  bindOutsideClickHandler();
  bindHoleriteDropdown();
  bindExportButtons();
  initSimulator();

  initUploadModal({
    onBatchComplete: refreshDashboard,
    onFileRemoved: refreshDashboard,
  });

  /**
   * Atualiza todas as visualizações após upload/remoção de holerite.
   * Recria charts (estrutura de dados pode ter mudado) e re-renderiza tabelas.
   */
  function refreshDashboard() {
    resetSelections();

    multiselects.global.populate();
    multiselects.itemPeriod.populate();
    multiselects.itemDesc.populate();
    multiselects.itemType.populate();

    renderKPIs(appState.selectedPeriodIds);
    destroyCharts();
    if (appState.payrollData.length > 0) initCharts();
    renderSummaryTable();
    renderItemsTable();

    populateHoleriteDropdown();
    renderHoleriteMirror(appState.payrollData[0]?.id ?? null);
    renderBonuses();

    if (appState.payrollData.length > 0) {
      updateSidebarProfile(appState.payrollData[0]);
    } else {
      resetSidebarProfile();
    }

    // Simulador: usa o último holerite mensal disponível como ponto de partida.
    // Sem dados, todos os campos ficam zerados.
    const latestMonthly = [...appState.payrollData]
      .reverse()
      .find((item) => item.type === "mensal");
    populateSimulatorFromHolerite(latestMonthly ?? null);
  }

  // Renderização inicial (estado vazio até PDFs serem carregados)
  refreshDashboard();
});
