const TAB_META = {
  overview: {
    title: "Executive Dashboard",
    subtitle: "Acompanhamento e evolução financeira de holerites (Janeiro - Junho 2026)",
  },
  "holerite-mirror": {
    title: "Espelho de Holerite",
    subtitle: "Visualização idêntica aos recibos de pagamento oficiais da Confitec",
  },
  bonuses: {
    title: "Bonificações Extras",
    subtitle: "Análise detalhada de PLR e Adiantamento de 13º Salário",
  },
  simulator: {
    title: "Simulador Salarial",
    subtitle: "Projete cenários alterando salário base, horas extras e sobreaviso",
  },
};

export function initNavigation(handlers = {}) {
  const navItems = document.querySelectorAll(".nav-item");
  const tabContents = document.querySelectorAll(".tab-content");
  const pageTitle = document.getElementById("page-title");
  const pageSubtitle = document.getElementById("page-subtitle");

  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();

      navItems.forEach((nav) => nav.classList.remove("active"));
      tabContents.forEach((tab) => tab.classList.remove("active"));

      item.classList.add("active");
      const tabId = item.getAttribute("data-tab");
      document.getElementById(`tab-${tabId}`).classList.add("active");

      const meta = TAB_META[tabId];
      if (meta) {
        pageTitle.innerText = meta.title;
        pageSubtitle.innerText = meta.subtitle;
      }

      if (handlers[tabId]) handlers[tabId]();
    });
  });
}
