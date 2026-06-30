# Dashboard Confitec - Análise e Evolução de Holerites (2026)

Este projeto consiste em uma plataforma executiva de Business Intelligence (BI) de uso pessoal para consolidar, analisar e simular os dados financeiros contidos nos recibos de pagamento de salário (holerites) de **Niuarque Batista Rosa** no cargo de **Coordenador de Projetos** na empresa **JMCONFITEC SISTEMAS DE COMPUTAÇÃO EIRELI**.

---

## 🚀 Como Executar o Projeto

Para abrir e visualizar o dashboard localmente no seu navegador, você pode subir um servidor local simples na raiz do projeto. 

Execute um dos comandos abaixo no seu terminal (PowerShell ou Bash) de dentro da pasta do projeto:

### Opção A: Usando Node.js (Recomendado)
```bash
# Caso tenha o pacote http-server global ou queira rodar via npx:
npx http-server ./
```

### Opção B: Usando Python (Se já estiver instalado)
```bash
python -m http.server 8000
```

Após iniciar o servidor, abra o seu navegador e acesse o endereço fornecido (ex: `http://localhost:8080` ou `http://localhost:8000`).

---

## 📂 Estrutura de Arquivos do Projeto

*   **[index.html](file:///c:/Users/niuarque.batista/Desktop/IA%20Reg/Projetos/dashboard-confitec/index.html)**: Estrutura da aplicação web, contendo os cartões de KPI, o alternador de temas Claro/Escuro, os contêineres de gráficos do Chart.js e as abas interativas.
*   **[styles.css](file:///c:/Users/niuarque.batista/Desktop/IA%20Reg/Projetos/dashboard-confitec/styles.css)**: Folha de estilos premium com design system moderno, aplicando efeitos de *Glassmorphism* em ambos os temas (Claro e Escuro) e layouts altamente responsivos (Grid/Flexbox).
*   **[data.js](file:///c:/Users/niuarque.batista/Desktop/IA%20Reg/Projetos/dashboard-confitec/data.js)**: Banco de dados local contendo os lançamentos estruturados de todos os holerites (Janeiro a Junho, Adiantamento de 13º e PLR).
*   **[app.js](file:///c:/Users/niuarque.batista/Desktop/IA%20Reg/Projetos/dashboard-confitec/app.js)**: Lógica principal da aplicação web, manipulação de abas, filtros globais de período, atualização de KPIs em tempo real, integração completa com o Chart.js e renderização dinâmica do espelho oficial do holerite.

---

## 📊 Funcionalidades & Métricas do Dashboard

1.  **Métricas KPIs em Tempo Real**:
    *   **Rendimento Bruto**: Soma de todos os proventos.
    *   **Rendimento Líquido**: Valor real creditado em conta corrente.
    *   **Total Retido**: Descontos acumulados (INSS, IRRF, coparticipações, atrasos).
    *   **FGTS do Período**: Fundo de Garantia depositado pela empresa.
    *   **Alíquota Efetiva**: Carga tributária consolidada de impostos obrigatórios (INSS + IRRF) dividida sobre o salário bruto.

2.  **Abas Temáticas**:
    *   **Visão Geral**: Painel de gráficos analíticos exibindo a evolução financeira mensal, distribuição da composição dos descontos, origem da renda (fixo vs extras) e depósitos de FGTS.
    *   **Espelho do Holerite**: Cópia visual fiel e idêntica aos recibos de pagamento de salário oficiais da Confitec, permitindo selecionar qualquer período e visualizar seus respectivos lançamentos detalhadamente.
    *   **13º & PLR**: Relatórios direcionados sobre as bonificações extraordinárias recebidas no ano de 2026.
    *   **Simulador Salarial**: Permite arrastar seletores de salário base, quantidade de horas extras normais e de domingos, horas de sobreaviso e ajuda de custo para visualizar em tempo real a projeção do novo salário líquido e os descontos tributários progressivos.
