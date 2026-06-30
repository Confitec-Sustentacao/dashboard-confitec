import { CDN_URLS } from "../config.js";
import { formatCurrency, formatRef, formatCurrencyNoPrefix } from "../utils/formatters.js";
import { getFilteredItems } from "./items-table.js";

export function bindExportButtons() {
  const btnCsv = document.getElementById("btn-export-csv");
  const btnPdf = document.getElementById("btn-export-pdf");
  if (btnCsv) btnCsv.addEventListener("click", exportToCSV);
  if (btnPdf) btnPdf.addEventListener("click", exportToPDF);
}

function exportToCSV() {
  const items = getFilteredItems();
  if (items.length === 0) {
    alert("Nenhum lançamento para exportar.");
    return;
  }

  const headers = ["Período / Arquivo", "Tipo", "Descrição", "Referência", "Valor (R$)"];
  let csv = "﻿"; // BOM UTF-8 (compatibilidade com Excel)
  csv += headers.join(";") + "\n";

  items.forEach((item) => {
    csv += [
      `"${item.period} (${item.typeLabel})"`,
      `"${item.type}"`,
      `"${item.desc}"`,
      `"${item.ref ? formatRef(item.ref) : "-"}"`,
      `"${formatCurrencyNoPrefix(item.value)}"`,
    ].join(";") + "\n";
  });

  downloadBlob(csv, `detalhamento_lancamentos_${Date.now()}.csv`, "text/csv;charset=utf-8;");
}

async function exportToPDF() {
  const items = getFilteredItems();
  if (items.length === 0) {
    alert("Nenhum lançamento para exportar.");
    return;
  }

  try {
    await loadJsPdfIfNeeded();
  } catch {
    alert("Erro ao carregar biblioteca PDF. Verifique sua conexão com a internet.");
    return;
  }

  const doc = new window.jsPDF();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Detalhamento de Lançamentos por Arquivo", 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 28);

  const tableRows = items.map((item) => [
    `${item.period} (${item.typeLabel})`,
    item.type,
    item.desc,
    item.ref ? formatRef(item.ref) : "-",
    formatCurrency(item.value),
  ]);

  doc.autoTable({
    head: [["Período / Arquivo", "Tipo", "Descrição", "Referência", "Valor"]],
    body: tableRows,
    startY: 35,
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [99, 102, 241] },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
    },
  });

  doc.save(`detalhamento_lancamentos_${Date.now()}.pdf`);
}

/**
 * Lazy-load jsPDF + plugin autoTable apenas quando o usuário clicar em "Exportar PDF".
 * Evita carregar ~70KB extras na inicialização do dashboard.
 */
async function loadJsPdfIfNeeded() {
  if (typeof window.jspdf === "undefined") {
    await loadScript(CDN_URLS.JSPDF);
  }
  if (window.jspdf && window.jspdf.jsPDF) {
    window.jsPDF = window.jspdf.jsPDF;
  } else {
    throw new Error("jsPDF not initialized");
  }
  if (typeof window.jsPDF.API.autoTable === "undefined") {
    await loadScript(CDN_URLS.JSPDF_AUTOTABLE);
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
