import { findById } from "../data/payroll-store.js";
import { appState } from "../state.js";
import { formatCurrency, formatCurrencyNoPrefix, formatPercent, formatRef, escapeHtml } from "../utils/formatters.js";

export function populateHoleriteDropdown() {
  const select = document.getElementById("holerite-period-select");
  select.innerHTML = "";

  appState.payrollData.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.innerText = `${item.period} - ${item.typeLabel}`;
    select.appendChild(opt);
  });
}

export function bindHoleriteDropdown() {
  const select = document.getElementById("holerite-period-select");
  select.addEventListener("change", (e) => renderHoleriteMirror(e.target.value));
}

export function renderHoleriteMirror(id) {
  const container = document.getElementById("holerite-paper-view");
  const item = findById(id);

  if (!item) {
    container.innerHTML = `
      <div style="padding: 4rem 2rem; text-align: center; color: var(--text-secondary); background: var(--bg-card); border-radius: 12px; border: 1px dashed var(--border-card); width: 100%;">
        <i data-lucide="file-text" style="width: 48px; height: 48px; margin: 0 auto 1.5rem auto; color: var(--color-primary); opacity: 0.7;"></i>
        <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text-primary);">Nenhum holerite carregado</h3>
        <p style="font-size: 0.85rem; max-width: 400px; margin: 0 auto; line-height: 1.5;">
          Clique no botão <strong>Carregar PDFs</strong> na barra lateral esquerda para importar seus recibos em PDF da Confitec.
        </p>
      </div>
    `;
    if (typeof window.lucide !== "undefined") window.lucide.createIcons();
    return;
  }

  container.innerHTML = buildMirrorHtml(item);
}

function buildMirrorHtml(item) {
  const maxRows = 10;
  const listItems = [];

  item.vencimentos.forEach((v) => {
    listItems.push({
      code: v.code,
      desc: v.description,
      ref: formatRef(v.ref),
      vencimento: formatCurrencyNoPrefix(v.value),
      desconto: "",
    });
  });

  item.descontos.forEach((d) => {
    listItems.push({
      code: d.code,
      desc: d.description,
      ref: formatRef(d.ref),
      vencimento: "",
      desconto: formatCurrencyNoPrefix(d.value),
    });
  });

  while (listItems.length < maxRows) {
    listItems.push({ code: "", desc: "", ref: "", vencimento: "", desconto: "" });
  }

  const rowsHtml = listItems.map((row) => `
    <div class="holerite-row" style="font-size: 0.75rem; min-height: 22px;">
      <div class="holerite-col" style="width: 10%;">${escapeHtml(row.code)}</div>
      <div class="holerite-col" style="width: 50%; text-align: left;">${escapeHtml(row.desc)}</div>
      <div class="holerite-col" style="width: 10%; text-align: right;">${row.ref}</div>
      <div class="holerite-col" style="width: 15%; text-align: right;">${row.vencimento}</div>
      <div class="holerite-col" style="width: 15%; text-align: right;">${row.desconto}</div>
    </div>
  `).join("");

  const cleanPeriod = item.period.replace(" (PLR)", "").replace(" (13º)", "");

  return `
    <!-- Cabeçalho Empresa -->
    <div class="holerite-header-table">
      <div class="holerite-row">
        <div class="holerite-col" style="width: 65%; font-weight: bold; text-align: left;">
          JMCONFITEC SISTEMAS DE COMPUTACAO EIRELI<br>
          Avenida PRESIDENTE VARGAS, 463 - 10 ANDAR
        </div>
        <div class="holerite-col" style="width: 35%; text-align: right;">
          <span style="font-weight: bold; font-size: 0.9rem;">Recibo de Pagamento de Salário</span><br>
          Período: ${escapeHtml(cleanPeriod)}
        </div>
      </div>
      <div class="holerite-row" style="font-size: 0.7rem;">
        <div class="holerite-col" style="width: 100%; text-align: left;">CNPJ : 05.949.608/0001-80</div>
      </div>
    </div>

    <!-- Cabeçalho Funcionário -->
    <div class="holerite-header-table">
      <div class="holerite-row" style="font-weight: bold; font-size: 0.7rem;">
        <div class="holerite-col" style="width: 15%; text-align: left;">Código</div>
        <div class="holerite-col" style="width: 50%; text-align: left;">Nome do Funcionário</div>
        <div class="holerite-col" style="width: 15%; text-align: left;">CBO</div>
        <div class="holerite-col" style="width: 20%; text-align: left;">Cargo</div>
      </div>
      <div class="holerite-row">
        <div class="holerite-col" style="width: 15%; text-align: left;">10000119</div>
        <div class="holerite-col" style="width: 50%; text-align: left; font-weight: bold;">NIUARQUE BATISTA ROSA</div>
        <div class="holerite-col" style="width: 15%; text-align: left;">212405</div>
        <div class="holerite-col" style="width: 20%; text-align: left;">COORDENADOR DE PROJETOS</div>
      </div>
    </div>

    <!-- Lançamentos -->
    <div class="holerite-body-table">
      <div class="holerite-body-header">
        <div class="holerite-col" style="width: 10%; text-align: left;">Cod.</div>
        <div class="holerite-col" style="width: 50%; text-align: left;">Descrição</div>
        <div class="holerite-col" style="width: 10%; text-align: right;">Ref.</div>
        <div class="holerite-col" style="width: 15%; text-align: right;">Vencimentos</div>
        <div class="holerite-col" style="width: 15%; text-align: right;">Descontos</div>
      </div>
      <div class="holerite-body-rows">
        ${rowsHtml}
      </div>
    </div>

    <!-- Totais Finais -->
    <div class="holerite-footer-table">
      <div class="holerite-row" style="font-weight: bold;">
        <div class="holerite-col" style="width: 70%; text-align: right;">Total de Vencimentos</div>
        <div class="holerite-col" style="width: 15%; text-align: right;">${formatCurrencyNoPrefix(item.totals.vencimentos)}</div>
        <div class="holerite-col" style="width: 15%; text-align: right; color: var(--color-danger);">${formatCurrencyNoPrefix(item.totals.descontos)}</div>
      </div>
      <div class="holerite-row" style="font-weight: bold; background: rgba(0, 0, 0, 0.02); padding: 0.5rem 0;">
        <div class="holerite-col" style="width: 70%; text-align: right; font-size: 0.95rem;">Valor Líquido ===></div>
        <div class="holerite-col" style="width: 30%; text-align: right; font-size: 1rem; color: var(--color-success);">${formatCurrency(item.totals.liquido)}</div>
      </div>
    </div>

    <!-- Rodapé de Bases -->
    <div class="holerite-bases-table">
      <div class="holerite-base-box">
        <div class="holerite-base-title">Salário Base</div>
        <div>${formatCurrencyNoPrefix(item.bases.salarioBase)}</div>
      </div>
      <div class="holerite-base-box">
        <div class="holerite-base-title">Base Calc. INSS</div>
        <div>${formatCurrencyNoPrefix(item.bases.baseInss)}</div>
      </div>
      <div class="holerite-base-box">
        <div class="holerite-base-title">Base Calc. FGTS</div>
        <div>${formatCurrencyNoPrefix(item.bases.baseCalcFgts)}</div>
      </div>
      <div class="holerite-base-box" style="font-weight: bold;">
        <div class="holerite-base-title">FGTS do Mês</div>
        <div>${formatCurrencyNoPrefix(item.bases.fgtsMes)}</div>
      </div>
      <div class="holerite-base-box">
        <div class="holerite-base-title">Base Calc. IRRF</div>
        <div>${formatCurrencyNoPrefix(item.bases.baseCalcIrrf)}</div>
      </div>
      <div class="holerite-base-box">
        <div class="holerite-base-title">Faixa IRRF</div>
        <div>${item.bases.faixaIrrf ? formatPercent(item.bases.faixaIrrf) : "0,0%"}</div>
      </div>
    </div>
  `;
}
