import { RUBRICA_CODES_PATTERN, DESCONTO_CODES, DISPLAY_MULTIPLIER } from "../config.js";

const MONTH_NAMES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/**
 * Converte texto bruto extraído de um PDF de holerite da Confitec em uma
 * estrutura normalizada que o resto da aplicação consome.
 * Retorna null se o texto não parece ser um holerite válido.
 */
export function parsePayrollText(text, filename) {
  if (!text.toLowerCase().includes("confitec")) return null;

  const period = parsePeriod(text);
  if (!period) return null;

  const { type, typeLabel } = inferType(text, filename);
  const id = buildId(period, type);
  const { funcionario, cargo, empresa } = parseIdentity(text);
  const { vencimentos, descontos, totals } = parseRubricas(text);
  const bases = parseBases(text);

  if (vencimentos.length === 0 && type === "mensal") return null;

  const payroll = {
    id,
    period,
    type,
    typeLabel,
    bases,
    vencimentos,
    descontos,
    funcionario,
    cargo,
    empresa,
    totals,
  };

  if (DISPLAY_MULTIPLIER !== 1) scaleMonetaryValues(payroll, DISPLAY_MULTIPLIER);
  return payroll;
}

/**
 * Multiplica todos os valores monetários por um fator. Usado apenas para
 * disfarçar valores reais ao gerar screenshots de demonstração.
 * Não toca em `ref` (horas/quantidades) nem em `faixaIrrf` (percentual).
 */
function scaleMonetaryValues(payroll, factor) {
  payroll.vencimentos.forEach((v) => (v.value *= factor));
  payroll.descontos.forEach((d) => (d.value *= factor));
  payroll.totals.vencimentos *= factor;
  payroll.totals.descontos *= factor;
  payroll.totals.liquido *= factor;
  payroll.bases.salarioBase *= factor;
  payroll.bases.baseInss *= factor;
  payroll.bases.baseCalcFgts *= factor;
  payroll.bases.fgtsMes *= factor;
  payroll.bases.baseCalcIrrf *= factor;
}

function parsePeriod(text) {
  const match = text.match(
    /(Janeiro|Fevereiro|Março|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)\/20\d{2}/i,
  );
  if (!match) return null;
  const raw = match[0];
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function inferType(text, filename) {
  const lowerFilename = filename.toLowerCase();
  const lowerText = text.toLowerCase();
  if (lowerFilename.includes("plr") || lowerText.includes("plr") || lowerText.includes("pplr")) {
    return { type: "plr", typeLabel: "PLR (Participação de Lucros)" };
  }
  if (lowerFilename.includes("13") || lowerText.includes("13º") || lowerText.includes("adiantamento de 13")) {
    return { type: "13o", typeLabel: "Adiantamento de 13º Salário" };
  }
  return { type: "mensal", typeLabel: "Salário Mensal" };
}

function buildId(period, type) {
  const [monthName, year] = period.split("/");
  const monthIdx = MONTH_NAMES.indexOf(monthName.toLowerCase());
  const monthNum = monthIdx !== -1 ? String(monthIdx + 1).padStart(2, "0") : "01";
  return `${year}-${monthNum}-${type}`;
}

function parseIdentity(text) {
  let funcionario = "Recurso Confitec";
  const nameMatch = text.match(/Faixa\s+IRRF[\s\|]+([A-ZÀ-ÿ\s]+?)[\s\|]+\d{6}/i);
  if (nameMatch) {
    funcionario = nameMatch[1].trim();
  } else {
    const nameMatchAlt = text.match(/([A-ZÀ-ÿ\s]{5,})\s*\|\s*\b\d{6}\b/);
    if (nameMatchAlt) funcionario = nameMatchAlt[1].trim();
  }

  let cargo = "Usuário";
  const cargoMatch = text.match(/([A-ZÀ-ÿ\s\-]{3,})[\s\|]+\b(1\d{7})\b/i);
  if (cargoMatch) cargo = cargoMatch[1].trim();

  let empresa = "JMCONFITEC SISTEMAS";
  const empresaMatch = text.match(/(JMCONFITEC\s+[A-ZÀ-ÿ\s]+)/i);
  if (empresaMatch) empresa = empresaMatch[1].trim();

  return { funcionario, cargo, empresa };
}

function parseRubricas(text) {
  const rubricaRegex = new RegExp(
    "\\b(" + RUBRICA_CODES_PATTERN + ")\\s+([A-Za-zÀ-ÿºª\\s\\-\\.\\/]+?)\\s+((?:\\d{1,3}(?:\\.\\d{3})*,\\d{2})|\\b\\d+\\b)?\\s*(\\d{1,3}(?:\\.\\d{3})*,\\d{2})",
    "g",
  );

  // Os holerites da Confitec saem com 2 vias na mesma página (empresa + funcionário).
  // PDF.js extrai o conteúdo duplicado, então deduplicamos por (code+desc+ref+value).
  const seen = new Set();
  const vencimentos = [];
  const descontos = [];
  let totalVencimentos = 0;
  let totalDescontos = 0;
  let match;

  while ((match = rubricaRegex.exec(text)) !== null) {
    const code = match[1];
    const desc = match[2].trim();
    const refStr = match[3];
    const valueStr = match[4];

    const key = `${code}|${desc}|${refStr || ""}|${valueStr}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const value = brToFloat(valueStr);
    const ref = refStr ? brToFloat(refStr) : null;

    const isDesconto = DESCONTO_CODES.includes(code) ||
      /desconto|atraso|inss|irrf|imposto|academia|saude|dental|sindical/i.test(desc);

    const item = { code, description: desc, ref, value };

    if (isDesconto) {
      descontos.push(item);
      totalDescontos += value;
    } else {
      vencimentos.push(item);
      totalVencimentos += value;
    }
  }

  return {
    vencimentos,
    descontos,
    totals: {
      vencimentos: totalVencimentos,
      descontos: totalDescontos,
      liquido: totalVencimentos - totalDescontos,
    },
  };
}

function parseBases(text) {
  const bases = {
    salarioBase: 0,
    baseInss: 0,
    baseCalcFgts: 0,
    fgtsMes: 0,
    baseCalcIrrf: 0,
    faixaIrrf: 0,
    codigo: "10000119",
  };

  const idx = text.indexOf("Faixa IRRF");
  if (idx === -1) return bases;

  // Captura APENAS valores monetários (formato BR com vírgula decimal).
  // Evita confundir com CBO (212405), CNPJ (05.949.608/0001-80) e códigos.
  const postText = text.substring(idx + 10);
  const monetaryRegex = /\d{1,3}(?:\.\d{3})*,\d{2}/g;
  const numbers = postText.match(monetaryRegex);
  if (!numbers || numbers.length < 5) return bases;

  bases.salarioBase = brToFloat(numbers[0]);
  bases.baseInss = brToFloat(numbers[1]);
  bases.baseCalcFgts = brToFloat(numbers[2]);
  bases.fgtsMes = brToFloat(numbers[3]);
  bases.baseCalcIrrf = brToFloat(numbers[4]);

  // A Faixa IRRF aparece como "27,5" (1 casa decimal) ou "27,50" no rodapé.
  // Procuramos especificamente por padrão de alíquota (0-99 com 1-2 decimais).
  const aliquotaMatch = postText.match(/\b([0-9]{1,2}),(\d{1,2})\b(?!\d)/);
  if (aliquotaMatch) {
    bases.faixaIrrf = parseFloat(`${aliquotaMatch[1]}.${aliquotaMatch[2]}`);
  }

  return bases;
}

function brToFloat(str) {
  return parseFloat(str.replace(/\./g, "").replace(",", "."));
}
