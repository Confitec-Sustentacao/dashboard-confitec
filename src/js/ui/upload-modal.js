import { parsePayrollText } from "../data/payroll-parser.js";
import { upsertPayroll, removePayroll } from "../data/payroll-store.js";
import { escapeHtml } from "../utils/formatters.js";

let filesToProcess = [];
let onBatchComplete = () => {};
let onFileRemoved = () => {};

export function initUploadModal({ onBatchComplete: batchCb, onFileRemoved: removedCb }) {
  if (typeof batchCb === "function") onBatchComplete = batchCb;
  if (typeof removedCb === "function") onFileRemoved = removedCb;

  const modal = document.getElementById("upload-modal");
  const btnOpen = document.getElementById("btn-open-upload-modal");
  const btnClose = document.getElementById("btn-close-upload-modal");
  const dragDropZone = document.getElementById("drag-drop-zone");
  const fileInput = document.getElementById("file-input");
  const filesTable = document.getElementById("modal-files-table");

  btnOpen.addEventListener("click", () => {
    modal.classList.add("show");
    if (filesToProcess.length > 0) filesTable.style.display = "table";
  });

  btnClose.addEventListener("click", () => modal.classList.remove("show"));

  dragDropZone.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) handleFilesSelection(e.target.files);
  });

  dragDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dragDropZone.classList.add("dragover");
  });

  dragDropZone.addEventListener("dragleave", () => {
    dragDropZone.classList.remove("dragover");
  });

  dragDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dragDropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) handleFilesSelection(e.dataTransfer.files);
  });
}

function handleFilesSelection(files) {
  const pdfFiles = Array.from(files).filter(
    (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
  );

  if (pdfFiles.length === 0) return;

  document.getElementById("modal-files-table").style.display = "table";

  pdfFiles.forEach((file) => {
    if (filesToProcess.some((item) => item.file.name === file.name)) return;

    const fileItem = {
      id: "file-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      file,
      status: 0,
      codigo: "-",
      periodo: "-",
      funcionario: "-",
      periodId: null,
      data: null,
    };

    filesToProcess.push(fileItem);
    addFileRow(fileItem);
    processFile(fileItem);
  });
}

function addFileRow(fileItem) {
  const tableBody = document.querySelector("#modal-files-table tbody");
  const row = document.createElement("tr");
  row.id = fileItem.id;
  row.innerHTML = `
    <td>${escapeHtml(fileItem.codigo)}</td>
    <td style="font-weight: 600;">${escapeHtml(fileItem.file.name)}</td>
    <td>${escapeHtml(fileItem.funcionario)}</td>
    <td class="status-cell" style="font-weight: 500;">0%</td>
    <td style="text-align: center;">
      <button class="btn-remove-file" style="background: none; border: none; color: var(--color-danger); cursor: pointer; font-size: 0.8rem; font-weight: bold;">[X] Remover</button>
    </td>
  `;

  row.querySelector(".btn-remove-file").addEventListener("click", () => {
    removeFileItem(fileItem.id);
  });

  tableBody.appendChild(row);
}

function removeFileItem(id) {
  const fileItem = filesToProcess.find((item) => item.id === id);
  if (!fileItem) return;

  filesToProcess = filesToProcess.filter((item) => item.id !== id);
  const row = document.getElementById(id);
  if (row) row.remove();

  if (filesToProcess.length === 0) {
    document.getElementById("modal-files-table").style.display = "none";
  }

  if (fileItem.status === 100 && fileItem.periodId) {
    const removed = removePayroll(fileItem.periodId);
    if (removed) onFileRemoved();
  }
}

function updateFileRowStatus(fileItem) {
  const row = document.getElementById(fileItem.id);
  if (!row) return;

  row.cells[0].innerText = fileItem.codigo;
  row.cells[1].innerText = fileItem.periodo !== "-" ? fileItem.periodo : fileItem.file.name;
  row.cells[2].innerText = fileItem.funcionario;

  const statusCell = row.querySelector(".status-cell");
  if (fileItem.status === "Erro") {
    statusCell.innerText = "Erro";
    statusCell.style.color = "var(--color-danger)";
  } else if (fileItem.status === 100) {
    statusCell.innerText = "100% Concluído";
    statusCell.style.color = "var(--color-success)";
  } else {
    statusCell.innerText = fileItem.status + "%";
    statusCell.style.color = "var(--color-warning)";
  }
}

async function processFile(fileItem) {
  const file = fileItem.file;
  const reader = new FileReader();

  reader.onload = async function (e) {
    try {
      fileItem.status = 25;
      updateFileRowStatus(fileItem);

      const typedarray = new Uint8Array(e.target.result);

      fileItem.status = 50;
      updateFileRowStatus(fileItem);

      const pdf = await window.pdfjsLib.getDocument({ data: typedarray }).promise;

      fileItem.status = 75;
      updateFileRowStatus(fileItem);

      const page = await pdf.getPage(1);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item) => item.str).join(" ");

      fileItem.status = 90;
      updateFileRowStatus(fileItem);

      const parsedData = parsePayrollText(text, file.name);

      if (!parsedData) {
        throw new Error("Não foi possível processar as rubricas do PDF.");
      }

      fileItem.status = 100;
      fileItem.codigo = parsedData.bases.codigo || "10000119";
      fileItem.periodo = parsedData.period;
      fileItem.funcionario = parsedData.funcionario;
      fileItem.periodId = parsedData.id;
      fileItem.data = parsedData;
      updateFileRowStatus(fileItem);
    } catch (err) {
      console.error("Erro no processamento:", err);
      fileItem.status = "Erro";
      updateFileRowStatus(fileItem);
    }

    checkBatchCompletion();
  };

  reader.readAsArrayBuffer(file);
}

function checkBatchCompletion() {
  if (filesToProcess.length === 0) return;

  const allFinished = filesToProcess.every(
    (item) => item.status === 100 || item.status === "Erro",
  );
  if (!allFinished) return;

  let loadedCount = 0;
  filesToProcess.forEach((item) => {
    if (item.status === 100 && item.data) {
      upsertPayroll(item.data);
      loadedCount++;
    }
  });

  if (loadedCount === 0) return;

  setTimeout(() => {
    document.getElementById("upload-modal").classList.remove("show");
    document.getElementById("file-input").value = "";
    onBatchComplete();
  }, 1500);
}
