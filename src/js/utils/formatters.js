const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value) {
  return BRL.format(value ?? 0);
}

export function formatCurrencyNoPrefix(value) {
  return formatCurrency(value).replace("R$", "").trim();
}

export function formatNameTitleCase(str) {
  if (!str) return "";
  const lowercaseExceptions = ["de", "do", "da", "dos", "das", "e"];
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word, idx) => {
      if (lowercaseExceptions.includes(word) && idx > 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function formatPercent(value, digits = 1) {
  return `${(value ?? 0).toFixed(digits).replace(".", ",")}%`;
}

export function formatRef(value) {
  if (value === null || value === undefined) return "";
  return value.toFixed(2).replace(".", ",");
}

/**
 * Escapa caracteres HTML perigosos antes de interpolar em innerHTML.
 * Defesa em profundidade: nossos dados vêm de PDFs parseados, mas um PDF
 * malicioso poderia injetar HTML/script via campos como nome ou descrição.
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
