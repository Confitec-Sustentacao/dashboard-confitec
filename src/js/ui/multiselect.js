import { appState, ITEM_TYPES } from "../state.js";
import { escapeHtml } from "../utils/formatters.js";

/**
 * Multiselect global do header (filtra KPIs e gráficos de Visão Geral).
 */
export function initGlobalMultiselect(onChange) {
  const multiselectBtn = document.getElementById("multiselect-btn");
  const multiselectList = document.getElementById("multiselect-list");
  const multiselectLabel = document.getElementById("multiselect-label");
  const chkSelectAll = document.getElementById("chk-select-all");
  const optionsContainer = document.getElementById("multiselect-options-container");

  function populateOptions() {
    optionsContainer.innerHTML = "";
    appState.payrollData.forEach((item) => {
      const optionDiv = document.createElement("div");
      optionDiv.className = "multiselect-option";
      const id = escapeHtml(item.id);
      optionDiv.innerHTML = `
        <input type="checkbox" id="chk-${id}" value="${id}" checked>
        <label for="chk-${id}">${escapeHtml(item.period)} <span style="font-size: 0.75rem; color: var(--text-muted);">(${escapeHtml(item.typeLabel)})</span></label>
      `;
      optionsContainer.appendChild(optionDiv);
    });

    optionsContainer.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", updateSelection);
    });

    chkSelectAll.checked = true;
    chkSelectAll.indeterminate = false;
    multiselectLabel.innerText = "Todo o Período (Consolidado)";
  }

  function updateSelection() {
    const checkboxes = optionsContainer.querySelectorAll('input[type="checkbox"]');
    const checkedBoxes = Array.from(checkboxes).filter((cb) => cb.checked);
    appState.selectedPeriodIds = checkedBoxes.map((cb) => cb.value);

    chkSelectAll.checked = checkedBoxes.length === checkboxes.length;
    chkSelectAll.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length;

    multiselectLabel.innerText = describeSelection(checkedBoxes, checkboxes.length, "Todo o Período (Consolidado)", "Nenhum período selecionado", "período");

    onChange(appState.selectedPeriodIds);
  }

  // Listeners persistentes (botão e select-all)
  multiselectBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeOtherDropdowns("multiselect-list");
    multiselectList.classList.toggle("show");
  });

  chkSelectAll.addEventListener("change", (e) => {
    optionsContainer.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.checked = e.target.checked;
    });
    updateSelection();
  });

  return { populate: populateOptions };
}

/**
 * Multiselect da tabela detalhada (filtra por período).
 */
export function initItemPeriodMultiselect(onChange) {
  const optionsContainer = document.getElementById("item-period-options-container");
  const label = document.getElementById("item-period-label");
  const chkAll = document.getElementById("chk-period-all");
  const list = document.getElementById("item-period-list");
  const btn = document.getElementById("item-period-btn");

  function populate() {
    optionsContainer.innerHTML = "";
    appState.payrollData.forEach((item) => {
      const optionDiv = document.createElement("div");
      optionDiv.className = "multiselect-option";
      const id = escapeHtml(item.id);
      optionDiv.innerHTML = `
        <input type="checkbox" id="chk-item-period-${id}" value="${id}" checked>
        <label for="chk-item-period-${id}">${escapeHtml(item.period)} <span style="font-size: 0.75rem; color: var(--text-muted);">(${escapeHtml(item.typeLabel)})</span></label>
      `;
      optionsContainer.appendChild(optionDiv);
    });

    optionsContainer.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", updateSelection);
    });

    chkAll.checked = true;
    chkAll.indeterminate = false;
    label.innerText = "Todos os Períodos / Arquivos";
  }

  function updateSelection() {
    const checkboxes = optionsContainer.querySelectorAll('input[type="checkbox"]');
    const checkedBoxes = Array.from(checkboxes).filter((cb) => cb.checked);
    appState.filterPeriodIds = checkedBoxes.map((cb) => cb.value);

    chkAll.checked = checkedBoxes.length === checkboxes.length;
    chkAll.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length;

    label.innerText = describeSelection(checkedBoxes, checkboxes.length, "Todos os Períodos / Arquivos", "Nenhum período selecionado", "período");

    onChange();
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeOtherDropdowns("item-period-list");
    list.classList.toggle("show");
  });

  chkAll.addEventListener("change", (e) => {
    optionsContainer.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.checked = e.target.checked;
    });
    updateSelection();
  });

  return { populate };
}

/**
 * Multiselect da tabela detalhada (filtra por descrição/rubrica).
 */
export function initItemDescMultiselect(getUniqueDescriptions, onChange) {
  const optionsContainer = document.getElementById("item-desc-options-container");
  const label = document.getElementById("item-desc-label");
  const chkAll = document.getElementById("chk-desc-all");
  const list = document.getElementById("item-desc-list");
  const btn = document.getElementById("item-desc-btn");

  function populate() {
    const unique = getUniqueDescriptions();
    appState.filterDescNames = [...unique];

    optionsContainer.innerHTML = "";
    unique.forEach((desc, idx) => {
      const optionDiv = document.createElement("div");
      optionDiv.className = "multiselect-option";
      const safeDesc = escapeHtml(desc);
      optionDiv.innerHTML = `
        <input type="checkbox" id="chk-item-desc-${idx}" value="${safeDesc}" checked>
        <label for="chk-item-desc-${idx}">${safeDesc}</label>
      `;
      optionsContainer.appendChild(optionDiv);
    });

    optionsContainer.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", updateSelection);
    });

    chkAll.checked = true;
    chkAll.indeterminate = false;
    label.innerText = "Todas as Rubricas";
  }

  function updateSelection() {
    const checkboxes = optionsContainer.querySelectorAll('input[type="checkbox"]');
    const checkedBoxes = Array.from(checkboxes).filter((cb) => cb.checked);
    appState.filterDescNames = checkedBoxes.map((cb) => cb.value);

    chkAll.checked = checkedBoxes.length === checkboxes.length;
    chkAll.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length;

    if (checkedBoxes.length === checkboxes.length) {
      label.innerText = "Todas as Rubricas";
    } else if (checkedBoxes.length === 0) {
      label.innerText = "Nenhuma rubrica selecionada";
    } else if (checkedBoxes.length <= 2) {
      label.innerText = checkedBoxes.map((cb) => cb.value).join(", ");
    } else {
      label.innerText = `${checkedBoxes.length} rubricas selecionadas`;
    }

    onChange();
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeOtherDropdowns("item-desc-list");
    list.classList.toggle("show");
  });

  chkAll.addEventListener("change", (e) => {
    optionsContainer.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.checked = e.target.checked;
    });
    updateSelection();
  });

  return { populate };
}

/**
 * Multiselect da tabela detalhada (filtra por tipo de lançamento: Provento ou Desconto).
 */
export function initItemTypeMultiselect(onChange) {
  const optionsContainer = document.getElementById("item-type-options-container");
  const label = document.getElementById("item-type-label");
  const chkAll = document.getElementById("chk-type-all");
  const list = document.getElementById("item-type-list");
  const btn = document.getElementById("item-type-btn");

  function populate() {
    appState.filterTypes = [...ITEM_TYPES];

    optionsContainer.innerHTML = "";
    ITEM_TYPES.forEach((type, idx) => {
      const optionDiv = document.createElement("div");
      optionDiv.className = "multiselect-option";
      const safeType = escapeHtml(type);
      optionDiv.innerHTML = `
        <input type="checkbox" id="chk-item-type-${idx}" value="${safeType}" checked>
        <label for="chk-item-type-${idx}">${safeType}</label>
      `;
      optionsContainer.appendChild(optionDiv);
    });

    optionsContainer.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", updateSelection);
    });

    chkAll.checked = true;
    chkAll.indeterminate = false;
    label.innerText = "Todos os Tipos";
  }

  function updateSelection() {
    const checkboxes = optionsContainer.querySelectorAll('input[type="checkbox"]');
    const checkedBoxes = Array.from(checkboxes).filter((cb) => cb.checked);
    appState.filterTypes = checkedBoxes.map((cb) => cb.value);

    chkAll.checked = checkedBoxes.length === checkboxes.length;
    chkAll.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length;

    if (checkedBoxes.length === checkboxes.length) {
      label.innerText = "Todos os Tipos";
    } else if (checkedBoxes.length === 0) {
      label.innerText = "Nenhum tipo selecionado";
    } else {
      label.innerText = checkedBoxes.map((cb) => cb.value).join(", ");
    }

    onChange();
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeOtherDropdowns("item-type-list");
    list.classList.toggle("show");
  });

  chkAll.addEventListener("change", (e) => {
    optionsContainer.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.checked = e.target.checked;
    });
    updateSelection();
  });

  return { populate };
}

/**
 * Fecha qualquer dropdown aberto que não seja o `keep` recém-clicado.
 */
function closeOtherDropdowns(keep) {
  const allDropdowns = ["multiselect-list", "item-period-list", "item-desc-list", "item-type-list"];
  allDropdowns
    .filter((id) => id !== keep)
    .forEach((id) => document.getElementById(id)?.classList.remove("show"));
}

/**
 * Fecha todos os dropdowns ao clicar fora deles.
 */
export function bindOutsideClickHandler() {
  const DROPDOWNS = [
    { container: "#period-multiselect",      list: "multiselect-list" },
    { container: "#item-period-multiselect", list: "item-period-list" },
    { container: "#item-desc-multiselect",   list: "item-desc-list" },
    { container: "#item-type-multiselect",   list: "item-type-list" },
  ];
  document.addEventListener("click", (e) => {
    DROPDOWNS.forEach(({ container, list }) => {
      if (!e.target.closest(container)) {
        document.getElementById(list)?.classList.remove("show");
      }
    });
  });
}

function describeSelection(checked, total, allLabel, emptyLabel, singularNoun) {
  if (checked.length === total) return allLabel;
  if (checked.length === 0) return emptyLabel;
  if (checked.length <= 2) {
    return checked
      .map((cb) => {
        const item = appState.payrollData.find((p) => p.id === cb.value);
        return item ? item.period.split("/")[0] : cb.value;
      })
      .join(", ");
  }
  return `${checked.length} ${singularNoun}s selecionados`;
}
