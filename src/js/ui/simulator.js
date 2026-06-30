import { INSS_TABLE, IRRF_TABLE, FGTS_RATE, HORAS_MES } from "../config.js";
import { formatCurrency } from "../utils/formatters.js";

const SIMULATOR_INPUTS = ["sim-base-range", "sim-he-range", "sim-hed-range", "sim-sa-range", "sim-ac-range"];

export function initSimulator() {
  SIMULATOR_INPUTS.forEach((id) => {
    document.getElementById(id).addEventListener("input", runSalarySimulation);
  });
}

/**
 * Pré-popula os sliders com base no último holerite mensal carregado.
 * Salário base vem de bases.salarioBase; ajuda de custo é localizada na lista
 * de vencimentos pela descrição (rubricas variam entre meses).
 * Se nenhum holerite mensal estiver presente, zera todos os campos.
 */
export function populateSimulatorFromHolerite(holerite) {
  const baseRange = document.getElementById("sim-base-range");
  const heRange = document.getElementById("sim-he-range");
  const hedRange = document.getElementById("sim-hed-range");
  const saRange = document.getElementById("sim-sa-range");
  const acRange = document.getElementById("sim-ac-range");

  if (!holerite) {
    baseRange.value = 0;
    heRange.value = 0;
    hedRange.value = 0;
    saRange.value = 0;
    acRange.value = 0;
    runSalarySimulation();
    return;
  }

  const salarioBase = holerite.bases?.salarioBase ?? 0;
  const ajudaCusto = holerite.vencimentos.find(
    (v) => /ajuda|custo|isenta/i.test(v.description),
  )?.value ?? 0;

  baseRange.value = salarioBase;
  acRange.value = ajudaCusto;
  heRange.value = 0;
  hedRange.value = 0;
  saRange.value = 0;

  runSalarySimulation();
}

export function runSalarySimulation() {
  const baseValue = parseFloat(document.getElementById("sim-base-range").value);
  const heHours = parseFloat(document.getElementById("sim-he-range").value);
  const hedHours = parseFloat(document.getElementById("sim-hed-range").value);
  const saHours = parseFloat(document.getElementById("sim-sa-range").value);
  const acValue = parseFloat(document.getElementById("sim-ac-range").value);

  document.getElementById("sim-base-val").innerText = formatCurrency(baseValue);
  document.getElementById("sim-he-val").innerText = `${heHours} horas`;
  document.getElementById("sim-hed-val").innerText = `${hedHours} horas`;
  document.getElementById("sim-sa-val").innerText = `${saHours} horas`;
  document.getElementById("sim-ac-val").innerText = formatCurrency(acValue);

  const result = calculateSalary({ baseValue, heHours, hedHours, saHours, acValue });

  document.getElementById("sim-res-bruto").innerText = formatCurrency(result.brutoTotal);
  document.getElementById("sim-res-inss").innerText = formatCurrency(result.inss);
  document.getElementById("sim-res-irrf").innerText = formatCurrency(result.irrf);
  document.getElementById("sim-res-fgts").innerText = formatCurrency(result.fgts);
  document.getElementById("sim-res-liquido").innerText = formatCurrency(result.liquido);
}

function calculateSalary({ baseValue, heHours, hedHours, saHours, acValue }) {
  const valorHora = baseValue / HORAS_MES;

  // Horas extras (100% de acréscimo) e sobreaviso (1/3 da hora)
  const valorHe = heHours * (valorHora * 2);
  const valorHed = hedHours * (valorHora * 2);
  const valorSa = saHours * (valorHora / 3);

  // DSR sobre adicionais (1/6 - regra geral CLT)
  const valorDsr = (valorHe + valorHed + valorSa) / 6;

  const proventosTributaveis = baseValue + valorHe + valorHed + valorSa + valorDsr;
  const brutoTotal = proventosTributaveis + acValue;

  const inss = calcularInss(proventosTributaveis);
  const baseIrrf = proventosTributaveis - inss;
  const irrf = calcularIrrf(baseIrrf);
  const fgts = proventosTributaveis * FGTS_RATE;
  const liquido = brutoTotal - (inss + irrf);

  return { brutoTotal, inss, irrf, fgts, liquido };
}

function calcularInss(base) {
  if (base >= INSS_TABLE.TETO_BASE) return INSS_TABLE.TETO_DESCONTO;

  let desconto = 0;
  let restante = base;
  let limiteAnterior = 0;

  for (const faixa of INSS_TABLE.FAIXAS) {
    const limite = faixa.ate;
    const tributavel = Math.min(restante, limite - limiteAnterior);
    if (tributavel <= 0) break;
    desconto += tributavel * faixa.aliquota;
    restante -= tributavel;
    limiteAnterior = limite;
    if (restante <= 0) break;
  }

  return Math.min(desconto, INSS_TABLE.TETO_DESCONTO);
}

function calcularIrrf(base) {
  const faixa = IRRF_TABLE.find((f) => base <= f.ate);
  if (!faixa) return 0;
  const valor = (base * faixa.aliquota) - faixa.deducao;
  return valor < 0 ? 0 : valor;
}
