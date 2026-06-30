/**
 * Constantes da aplicação: códigos de rubricas, tabelas fiscais e defaults.
 * Centralizar aqui facilita manutenção quando a Receita atualizar as faixas.
 */

// Códigos de rubricas observados nos recibos da Confitec
export const RUBRICAS = {
  SALARIO_BASE: "0115",
  INSS: "0088",
  IRRF: "0089",
  IRRF_PLR: "0091",
  PLR: "PLR",
  DPLR_SINDICAL: "DPLR",
  ADIANTAMENTO_SALARIAL: "0006",
  DECIMO_TERCEIRO: "0036",
};

// Códigos que devem ser classificados como descontos no parser
export const DESCONTO_CODES = ["0006", "9R74", "07S5FO", "02A1", "0088", "0089", "DPLR", "0091"];

// Padrão de regex compilado para extrair rubricas dos PDFs
export const RUBRICA_CODES_PATTERN = "(?:0115|9R69|01H8|01H2|0082|0006|9R74|07S5FO|02A1|0088|0089|PLR|DPLR|0091|0036|01H1|01H9)";

// Caracteres permitidos na descrição de uma rubrica.
// Inclui dígitos para descrições como "Adiantamento de 13º", "Hora Extra 100%", etc.
export const RUBRICA_DESC_CHARS = "[A-Za-zÀ-ÿºª0-9\\s\\-\\.\\/]";

// Tabela progressiva de INSS 2026 (valores aproximados)
export const INSS_TABLE = {
  TETO_DESCONTO: 988.07,
  TETO_BASE: 8475.55,
  FAIXAS: [
    { ate: 1412.00, aliquota: 0.075, dedAcumulada: 0 },
    { ate: 2666.68, aliquota: 0.09,  dedAcumulada: 1412.00 * 0.075 },
    { ate: 4000.03, aliquota: 0.12,  dedAcumulada: (1412.00 * 0.075) + ((2666.68 - 1412.00) * 0.09) },
    { ate: Infinity, aliquota: 0.14, dedAcumulada: (1412.00 * 0.075) + ((2666.68 - 1412.00) * 0.09) + ((4000.03 - 2666.68) * 0.12) },
  ],
};

// Tabela progressiva de IRRF 2026 (simplificada)
export const IRRF_TABLE = [
  { ate: 2259.20, aliquota: 0,     deducao: 0 },
  { ate: 2826.65, aliquota: 0.075, deducao: 169.44 },
  { ate: 3751.05, aliquota: 0.15,  deducao: 381.44 },
  { ate: 4664.68, aliquota: 0.225, deducao: 662.77 },
  { ate: Infinity, aliquota: 0.275, deducao: 896.00 },
];

// Alíquota FGTS
export const FGTS_RATE = 0.08;

// Divisor mensal de horas para cálculo do valor-hora
export const HORAS_MES = 220;

// Palette de cores dos gráficos (alinhada com styles.css)
export const CHART_COLORS = {
  bruto: "#6366f1",
  liquido: "#10b981",
  descontos: "#ef4444",
  fgts: "#06b6d4",
  ajuda: "#f59e0b",
  donut: ["#ef4444", "#f59e0b", "#06b6d4", "#6366f1", "#a855f7", "#ec4899"],
};

// URLs das libs carregadas sob demanda (exportação PDF)
export const CDN_URLS = {
  JSPDF: "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  JSPDF_AUTOTABLE: "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js",
};

// =====================================================================
// Fator de disfarce: multiplica todos os valores monetários após o parse.
// 1.0 = sem disfarce (valores reais do PDF).
// !=1.0 = valores escalados (útil apenas para gerar screenshots de demo).
// Mantenha em 1.0 para uso normal.
// =====================================================================
export const DISPLAY_MULTIPLIER = 1.0;
