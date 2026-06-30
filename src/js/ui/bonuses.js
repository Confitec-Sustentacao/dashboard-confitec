import { appState } from "../state.js";
import { RUBRICAS } from "../config.js";
import { formatCurrency } from "../utils/formatters.js";

export function renderBonuses() {
  renderPLR();
  renderDecimoTerceiro();
}

function renderPLR() {
  const plrData = appState.payrollData.find((item) => item.type === "plr");

  const el = {
    bruto: document.getElementById("plr-bruto"),
    irrf: document.getElementById("plr-irrf"),
    sindical: document.getElementById("plr-sindical"),
    liquido: document.getElementById("plr-liquido"),
  };

  if (!plrData) {
    el.bruto.innerText = el.irrf.innerText = el.sindical.innerText = el.liquido.innerText = "R$ 0,00";
    return;
  }

  let plrIrrf = 0;
  let plrSindical = 0;
  plrData.descontos.forEach((d) => {
    if (d.code === RUBRICAS.IRRF_PLR || d.code === RUBRICAS.IRRF) plrIrrf += d.value;
    if (d.code === RUBRICAS.DPLR_SINDICAL) plrSindical += d.value;
  });

  el.bruto.innerText = formatCurrency(plrData.totals.vencimentos);
  el.irrf.innerText = formatCurrency(plrIrrf);
  el.sindical.innerText = formatCurrency(plrSindical);
  el.liquido.innerText = formatCurrency(plrData.totals.liquido);
}

function renderDecimoTerceiro() {
  const data = appState.payrollData.find((item) => item.type === "13o");

  const el = {
    bruto: document.getElementById("13o-bruto"),
    extras: document.getElementById("13o-extras"),
    descontos: document.getElementById("13o-descontos"),
    liquido: document.getElementById("13o-liquido"),
  };

  if (!data) {
    el.bruto.innerText = el.extras.innerText = el.descontos.innerText = el.liquido.innerText = "R$ 0,00";
    return;
  }

  let bruto = 0;
  let extras = 0;
  data.vencimentos.forEach((v) => {
    if (v.code === RUBRICAS.DECIMO_TERCEIRO) bruto = v.value;
    else extras += v.value;
  });

  el.bruto.innerText = formatCurrency(bruto);
  el.extras.innerText = formatCurrency(extras);
  el.descontos.innerText = formatCurrency(data.totals.descontos);
  el.liquido.innerText = formatCurrency(data.totals.liquido);
}
