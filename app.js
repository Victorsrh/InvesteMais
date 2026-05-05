const projects = [];

const form = document.querySelector("#projectForm");
const projectName = document.querySelector("#projectName");
const initialInvestment = document.querySelector("#initialInvestment");
const discountRate = document.querySelector("#discountRate");
const customScenarioPercent = document.querySelector("#customScenarioPercent");
const cashFlows = document.querySelector("#cashFlows");
const actualCashFlows = document.querySelector("#actualCashFlows");
const actualProjectSelect = document.querySelector("#actualProjectSelect");
const projectList = document.querySelector("#projectList");
const projectCount = document.querySelector("#projectCount");
const emptyState = document.querySelector("#emptyState");
const resultsContent = document.querySelector("#resultsContent");
const simulationTab = document.querySelector("#simulationTab");
const obtainedTab = document.querySelector("#obtainedTab");
const simulationView = document.querySelector("#simulationView");
const obtainedView = document.querySelector("#obtainedView");
const rankingTable = document.querySelector("#rankingTable");
const bestProject = document.querySelector("#bestProject");
const finalRecommendation = document.querySelector("#finalRecommendation");
const horizonWarning = document.querySelector("#horizonWarning");
const vplChart = document.querySelector("#vplChart");
const scenarioCards = document.querySelector("#scenarioCards");
const actualComparison = document.querySelector("#actualComparison");
const cashFlowCharts = document.querySelector("#cashFlowCharts");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseNumber(value) {
  const normalized = String(value).trim().replace(",", ".");
  if (normalized === "") {
    return Number.NaN;
  }
  return Number(normalized);
}

function parseCashFlows(value) {
  const text = String(value).trim();
  if (text === "") {
    return [];
  }

  if (text.includes(";") || text.includes("\n")) {
    return text
      .split(/[;\n]+/)
      .map((item) => parseNumber(item.trim()))
      .filter((item) => !Number.isNaN(item));
  }

  return text
    .split(",")
    .map((item) => parseNumber(item.trim()))
    .filter((item) => !Number.isNaN(item));
}

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatPercent(value) {
  return `${(value * 100).toFixed(2).replace(".", ",")}%`;
}

function formatPayback(value) {
  if (value === null) {
    return "Nao recupera";
  }
  return `${value.toFixed(2).replace(".", ",")} período(s)`;
}

function formatIrrMargin(value) {
  if (value === null) {
    return "Nao calculada";
  }
  return `${(value * 100).toFixed(2).replace(".", ",")} p.p.`;
}

function presentValue(futureValue, rate, period) {
  return futureValue / (1 + rate) ** period;
}

function futureValue(presentValueAmount, rate, period) {
  return presentValueAmount * (1 + rate) ** period;
}

function calculateNpv(initialValue, flows, rate) {
  return flows.reduce((total, flow, index) => {
    return total + presentValue(flow, rate, index + 1);
  }, -initialValue);
}

function calculateEquivalentAnnualNpv(npv, rate, periods) {
  if (periods <= 0) {
    return 0;
  }
  if (rate === 0) {
    return npv / periods;
  }
  return npv * (rate / (1 - (1 + rate) ** -periods));
}

function calculateDiscountedPayback(initialValue, flows, rate) {
  let accumulated = -initialValue;

  for (let index = 0; index < flows.length; index += 1) {
    const discountedFlow = presentValue(flows[index], rate, index + 1);
    const previousBalance = accumulated;
    accumulated += discountedFlow;

    if (accumulated >= 0) {
      return index + Math.abs(previousBalance) / discountedFlow;
    }
  }

  return null;
}

function calculateIrr(initialValue, flows) {
  let minRate = -0.99;
  let maxRate = 10;
  let minNpv = calculateNpv(initialValue, flows, minRate);
  let maxNpv = calculateNpv(initialValue, flows, maxRate);

  if (minNpv * maxNpv > 0) {
    return null;
  }

  for (let i = 0; i < 200; i += 1) {
    const middleRate = (minRate + maxRate) / 2;
    const middleNpv = calculateNpv(initialValue, flows, middleRate);

    if (Math.abs(middleNpv) < 0.000001) {
      return middleRate;
    }

    if (minNpv * middleNpv < 0) {
      maxRate = middleRate;
      maxNpv = middleNpv;
    } else {
      minRate = middleRate;
      minNpv = middleNpv;
    }
  }

  return (minRate + maxRate) / 2;
}

function interpretRisk(scenarios) {
  const pessimistic = scenarios.find((scenario) => scenario.key === "pessimistic").npv;
  const probable = scenarios.find((scenario) => scenario.key === "probable").npv;
  const optimistic = scenarios.find((scenario) => scenario.key === "optimistic").npv;

  if (pessimistic > 0) {
    return "Maior margem de segurança: o VPL permanece positivo até no cenário pessimista.";
  }
  if (probable > 0 && pessimistic <= 0) {
    return "Projeto sensível ao risco: cria valor no cenário provável, mas pode destruir valor no pessimista.";
  }
  if (optimistic > 0 && probable <= 0) {
    return "Projeto mais arriscado: depende do cenário otimista para ter VPL positivo.";
  }
  return "Risco elevado: o VPL continua negativo mesmo no cenário otimista.";
}

function analyzeProject(project) {
  const customPercent = parseNumber(customScenarioPercent.value);
  const npv = calculateNpv(project.initialInvestment, project.flows, project.rate);
  const irr = calculateIrr(project.initialInvestment, project.flows);
  const payback = calculateDiscountedPayback(project.initialInvestment, project.flows, project.rate);
  const cashFlowRows = project.flows.map((flow, index) => {
    const period = index + 1;
    const pv = presentValue(flow, project.rate, period);
    const fv = futureValue(flow, project.rate, period);
    return { period, flow, pv, fv };
  });
  const scenarios = [
    { key: "pessimistic", name: "Pessimista", factor: 0.8 },
    { key: "probable", name: "Provável", factor: 1 },
    { key: "optimistic", name: "Otimista", factor: 1.2 },
  ];

  if (!Number.isNaN(customPercent)) {
    scenarios.push({
      key: "custom",
      name: "Personalizado",
      factor: customPercent / 100,
    });
  }

  const analyzedScenarios = scenarios.map((scenario) => {
    const scenarioFlows = project.flows.map((flow) => flow * scenario.factor);
    return {
      ...scenario,
      npv: calculateNpv(project.initialInvestment, scenarioFlows, project.rate),
    };
  });
  const actualNpv = project.actualFlows.length > 0
    ? calculateNpv(project.initialInvestment, project.actualFlows, project.rate)
    : null;
  const actualEquivalentAnnualNpv = actualNpv === null
    ? null
    : calculateEquivalentAnnualNpv(actualNpv, project.rate, project.actualFlows.length);
  const actualDifference = actualNpv === null ? null : actualNpv - npv;

  return {
    ...project,
    npv,
    equivalentAnnualNpv: calculateEquivalentAnnualNpv(npv, project.rate, project.flows.length),
    irr,
    irrMargin: irr === null ? null : irr - project.rate,
    payback,
    cashFlowRows,
    scenarios: analyzedScenarios,
    actualNpv,
    actualEquivalentAnnualNpv,
    actualDifference,
    riskConclusion: interpretRisk(analyzedScenarios),
    decision: npv > 0 ? "Sugere aceitar" : npv < 0 ? "Sugere rejeitar" : "Analisar critérios adicionais",
  };
}

function analyzeAllProjects() {
  return projects
    .map(analyzeProject)
    .sort((first, second) => second.npv - first.npv);
}

function renderProjectList() {
  projectCount.textContent = `${projects.length} cadastrado${projects.length === 1 ? "" : "s"}`;
  projectList.innerHTML = projects
    .map((project, index) => `
      <div class="project-item">
        <strong>${project.name}</strong>
        <span>Investimento: ${formatCurrency(project.initialInvestment)}</span>
        <span>Taxa: ${formatPercent(project.rate)} | Fluxos previstos: ${project.flows.length}</span>
        <span>${project.actualFlows.length > 0 ? `Resultado obtido informado: ${project.actualFlows.length} período(s)` : "Sem resultado obtido informado"}</span>
        <button class="secondary" type="button" onclick="removeProject(${index})">Remover</button>
      </div>
    `)
    .join("");
  renderActualProjectOptions();
}

function renderActualProjectOptions() {
  actualProjectSelect.innerHTML = projects
    .map((project, index) => `<option value="${index}">${escapeHtml(project.name)}</option>`)
    .join("");
}

function classByValue(value) {
  return value >= 0 ? "positive" : "negative";
}

function renderRanking(analyses) {
  rankingTable.innerHTML = analyses
    .map((project, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(project.name)}</td>
        <td class="${classByValue(project.npv)}">${formatCurrency(project.npv)}</td>
        <td class="${classByValue(project.equivalentAnnualNpv)}">${formatCurrency(project.equivalentAnnualNpv)}</td>
        <td>${project.irr === null ? "Nao encontrada" : formatPercent(project.irr)}</td>
        <td>${formatIrrMargin(project.irrMargin)}</td>
        <td>${formatPayback(project.payback)}</td>
        <td>${project.decision}</td>
      </tr>
    `)
    .join("");
}

function renderBestProject(analyses) {
  const best = analyses[0];
  bestProject.innerHTML = `
    <div class="metric">
      <span>Melhor projeto por VPL</span>
      <strong>${best.name}</strong>
    </div>
    <div class="metric">
      <span>VPL</span>
      <strong class="${classByValue(best.npv)}">${formatCurrency(best.npv)}</strong>
    </div>
    <div class="metric">
      <span>VPL anual equivalente</span>
      <strong class="${classByValue(best.equivalentAnnualNpv)}">${formatCurrency(best.equivalentAnnualNpv)}</strong>
    </div>
    <div class="metric">
      <span>TIR</span>
      <strong>${best.irr === null ? "Nao encontrada" : formatPercent(best.irr)}</strong>
    </div>
    <div class="metric">
      <span>Margem da TIR</span>
      <strong>${formatIrrMargin(best.irrMargin)}</strong>
    </div>
    <div class="metric">
      <span>Payback descontado</span>
      <strong>${formatPayback(best.payback)}</strong>
    </div>
  `;
}

function buildFinalRecommendation(analyses) {
  const bestByNpv = analyses[0];
  const viableProjects = analyses.filter((project) => project.npv > 0);
  const hasDifferentHorizons = new Set(analyses.map((project) => project.flows.length)).size > 1;
  const bestByEquivalent = [...analyses].sort(
    (first, second) => second.equivalentAnnualNpv - first.equivalentAnnualNpv,
  )[0];

  if (viableProjects.length === 0) {
    return "Nenhum projeto apresenta VPL positivo. Pela regra do VPL, os projetos analisados tenderiam a ser rejeitados.";
  }

  if (hasDifferentHorizons && bestByEquivalent.name !== bestByNpv.name) {
    return (
      `Pelo VPL total, o projeto mais atrativo é ${bestByNpv.name}. ` +
      `Como os horizontes são diferentes, o VPL anual equivalente também deve ser observado; por esse critério, destaca-se ${bestByEquivalent.name}.`
    );
  }

  return (
    `Projeto recomendado: ${bestByNpv.name}. ` +
    "Ele apresenta o maior VPL entre os projetos analisados e gera valor acima da taxa mínima informada."
  );
}

function renderFinalRecommendation(analyses) {
  finalRecommendation.innerHTML = `
    <strong>Conclusão final</strong>
    <span>${escapeHtml(buildFinalRecommendation(analyses))}</span>
  `;
}

function renderHorizonWarning(analyses) {
  const periods = [...new Set(analyses.map((project) => project.flows.length))];
  if (periods.length <= 1) {
    return "";
  }

  return `
    <div class="warning-box">
      Os projetos possuem horizontes diferentes (${periods.join(", ")} períodos).
      Nesses casos, comparar apenas o VPL total pode favorecer projetos mais longos.
      Use também o VPL anual equivalente para uma comparação mais equilibrada.
    </div>
  `;
}

function buildVplChartSvg(analyses) {
  const width = 760;
  const height = 280;
  const values = analyses.map((project) => project.npv);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = max - min || 1;
  const y = (value) => 20 + ((max - value) / range) * (height - 50);
  const zeroY = y(0);
  const barWidth = Math.max(36, Math.min(90, 520 / analyses.length));
  const gap = 28;

  const bars = analyses.map((project, index) => {
    const x = 65 + index * (barWidth + gap);
    const valueY = y(project.npv);
    const top = Math.min(valueY, zeroY);
    const barHeight = Math.abs(zeroY - valueY);
    const color = project.npv >= 0 ? "#287d3c" : "#b42318";

    return `
      <rect x="${x}" y="${top}" width="${barWidth}" height="${barHeight}" fill="${color}"></rect>
      <text x="${x + barWidth / 2}" y="${top - 6}" text-anchor="middle" font-size="12">${formatCurrency(project.npv)}</text>
      <text x="${x + barWidth / 2}" y="265" text-anchor="middle" font-size="12">${escapeHtml(project.name.slice(0, 14))}</text>
    `;
  }).join("");

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Gráfico de VPL por projeto">
      <line x1="40" y1="${zeroY}" x2="730" y2="${zeroY}" stroke="#667085"></line>
      ${bars}
    </svg>
  `;
}

function renderVplChart(analyses) {
  vplChart.innerHTML = buildVplChartSvg(analyses);
}

function renderScenarios(analyses) {
  scenarioCards.innerHTML = analyses
    .map((project) => `
      <div class="scenario-card">
        <h4>${escapeHtml(project.name)}</h4>
        ${project.scenarios.map((scenario) => `
          <div class="scenario-line">
            <span>${scenario.name} (${Math.round(scenario.factor * 100)}%)</span>
            <strong class="${classByValue(scenario.npv)}">${formatCurrency(scenario.npv)}</strong>
          </div>
        `).join("")}
        <p>${project.riskConclusion}</p>
      </div>
    `)
    .join("");
}

function renderActualComparison(analyses) {
  const projectsWithActuals = analyses.filter((project) => project.actualNpv !== null);

  if (projectsWithActuals.length === 0) {
    actualComparison.innerHTML = `
      <div class="empty-state">
        Nenhum projeto possui resultado obtido informado. Selecione um projeto acima, cole os valores obtidos e clique em "Comparar resultado obtido".
      </div>
    `;
    return;
  }

  actualComparison.innerHTML = projectsWithActuals
    .map((project) => `
      <div class="comparison-card">
        <h4>${escapeHtml(project.name)}</h4>
        <div class="comparison-line">
          <span>VPL previsto</span>
          <strong class="${classByValue(project.npv)}">${formatCurrency(project.npv)}</strong>
        </div>
        <div class="comparison-line">
          <span>VPL do resultado obtido</span>
          <strong class="${classByValue(project.actualNpv)}">${formatCurrency(project.actualNpv)}</strong>
        </div>
        <div class="comparison-line">
          <span>Variação em relação ao previsto</span>
          <strong class="${classByValue(project.actualDifference)}">${formatCurrency(project.actualDifference)}</strong>
        </div>
        <div class="comparison-line">
          <span>Leitura</span>
          <strong>${project.actualDifference >= 0 ? "Acima do previsto" : "Abaixo do previsto"}</strong>
        </div>
      </div>
    `)
    .join("");
}

function buildCashFlowChart(project) {
      const width = Math.max(520, project.cashFlowRows.length * 54 + 90);
      const height = 230;
      const values = project.cashFlowRows.map((row) => row.flow);
      const min = Math.min(0, ...values);
      const max = Math.max(0, ...values);
      const range = max - min || 1;
      const y = (value) => 20 + ((max - value) / range) * (height - 50);
      const zeroY = y(0);
      const slotWidth = (width - 90) / project.cashFlowRows.length;
      const barWidth = Math.max(14, Math.min(44, slotWidth * 0.62));
      const showValueLabels = project.cashFlowRows.length <= 6;
      const bars = project.cashFlowRows.map((row, index) => {
        const x = 50 + index * slotWidth + (slotWidth - barWidth) / 2;
        const valueY = y(row.flow);
        const top = Math.min(valueY, zeroY);
        const barHeight = Math.abs(zeroY - valueY);
        const color = row.flow >= 0 ? "#287d3c" : "#b42318";
        const label = showValueLabels
          ? `<text x="${x + barWidth / 2}" y="${top - 6}" text-anchor="middle" font-size="11">${formatCurrency(row.flow)}</text>`
          : "";

        return `
          <rect x="${x}" y="${top}" width="${barWidth}" height="${barHeight}" fill="${color}">
            <title>P${row.period}: ${formatCurrency(row.flow)}</title>
          </rect>
          ${label}
          <text x="${x + barWidth / 2}" y="214" text-anchor="middle" font-size="12">P${row.period}</text>
        `;
      }).join("");

      const valueRows = project.cashFlowRows.map((row) => `
        <span><strong>P${row.period}</strong> ${formatCurrency(row.flow)}</span>
      `).join("");

      return `
        <div class="flow-card">
          <h4>${escapeHtml(project.name)}</h4>
          <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Fluxos de caixa de ${project.name}">
            <line x1="35" y1="${zeroY}" x2="${width - 25}" y2="${zeroY}" stroke="#667085"></line>
            ${bars}
          </svg>
          <div class="flow-values">${valueRows}</div>
        </div>
      `;
}

function renderCashFlowCharts(analyses) {
  cashFlowCharts.innerHTML = analyses
    .map((project) => buildCashFlowChart(project))
    .join("");
}

function switchResultView(view) {
  const showingSimulation = view === "simulation";
  simulationView.classList.toggle("hidden", !showingSimulation);
  obtainedView.classList.toggle("hidden", showingSimulation);
  simulationTab.classList.toggle("active", showingSimulation);
  obtainedTab.classList.toggle("active", !showingSimulation);
}

function buildRankingRows(analyses) {
  return analyses
    .map((project, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(project.name)}</td>
        <td class="${classByValue(project.npv)}">${formatCurrency(project.npv)}</td>
        <td class="${classByValue(project.equivalentAnnualNpv)}">${formatCurrency(project.equivalentAnnualNpv)}</td>
        <td>${project.irr === null ? "Nao encontrada" : formatPercent(project.irr)}</td>
        <td>${formatIrrMargin(project.irrMargin)}</td>
        <td>${formatPayback(project.payback)}</td>
        <td>${project.decision}</td>
      </tr>
    `)
    .join("");
}

function buildScenarioSection(analyses) {
  return analyses
    .map((project) => `
      <section class="report-section">
        <h3>${escapeHtml(project.name)}</h3>
        <div class="scenario-list">
          ${project.scenarios.map((scenario) => `
            <div>
              <span>${scenario.name} (${Math.round(scenario.factor * 100)}%)</span>
              <strong class="${classByValue(scenario.npv)}">${formatCurrency(scenario.npv)}</strong>
            </div>
          `).join("")}
        </div>
        <p>${project.riskConclusion}</p>
      </section>
    `)
    .join("");
}

function buildActualComparisonSection(analyses) {
  const projectsWithActuals = analyses.filter((project) => project.actualNpv !== null);
  if (projectsWithActuals.length === 0) {
    return `
      <section class="report-section">
        <h2>Previsto x resultado obtido</h2>
        <p>Nenhum projeto possui resultado obtido informado.</p>
      </section>
    `;
  }

  return `
    <section class="report-section">
      <h2>Previsto x resultado obtido</h2>
      <p>Esta seção compara a simulação feita antes do projeto com os valores obtidos posteriormente.</p>
      <table>
        <thead>
          <tr>
            <th>Projeto</th>
            <th>VPL previsto</th>
            <th>VPL do resultado obtido</th>
            <th>Variação</th>
            <th>Leitura</th>
          </tr>
        </thead>
        <tbody>
          ${projectsWithActuals.map((project) => `
            <tr>
              <td>${escapeHtml(project.name)}</td>
              <td class="${classByValue(project.npv)}">${formatCurrency(project.npv)}</td>
              <td class="${classByValue(project.actualNpv)}">${formatCurrency(project.actualNpv)}</td>
              <td class="${classByValue(project.actualDifference)}">${formatCurrency(project.actualDifference)}</td>
              <td>${project.actualDifference >= 0 ? "Acima do previsto" : "Abaixo do previsto"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
  `;
}

function buildProjectDetailSections(analyses) {
  return analyses
    .map((project) => `
      <section class="report-section">
        <h2>${escapeHtml(project.name)}</h2>
        <div class="summary-grid">
          <div><span>Investimento inicial</span><strong>${formatCurrency(project.initialInvestment)}</strong></div>
          <div><span>Taxa mínima</span><strong>${formatPercent(project.rate)}</strong></div>
          <div><span>Períodos</span><strong>${project.flows.length}</strong></div>
          <div><span>Sugestão</span><strong>${project.decision}</strong></div>
        </div>
        ${buildCashFlowChart(project)}
      </section>
    `)
    .join("");
}

function buildReportHtml(analyses) {
  const best = analyses[0];
  const warning = renderHorizonWarning(analyses);
  const generatedAt = new Date().toLocaleString("pt-BR");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Investe+ - Relatório de Orçamento de Capital</title>
  <style>
    body { margin: 0; background: #f4f6f8; color: #1f2933; font-family: Arial, Helvetica, sans-serif; }
    .report { max-width: 1120px; margin: 0 auto; padding: 32px 24px; }
    .cover { background: #12355b; color: #fff; border-radius: 8px; padding: 28px; margin-bottom: 18px; }
    .cover h1 { margin: 0 0 8px; font-size: 28px; }
    .cover h2 { margin: 18px 0 8px; color: #fff; font-size: 22px; }
    .cover p { margin: 0; color: #d7e4f5; }
    .report-section { background: #fff; border: 1px solid #d9e0e8; border-radius: 8px; padding: 20px; margin: 16px 0; }
    h2, h3 { color: #12355b; margin-top: 0; }
    ul { margin: 10px 0 0; padding-left: 22px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #d9e0e8; padding: 9px; text-align: left; white-space: nowrap; }
    th { background: #eef3f8; color: #12355b; }
    .positive { color: #287d3c; font-weight: 700; }
    .negative { color: #b42318; font-weight: 700; }
    .warning-box { border: 1px solid #f1c27d; border-radius: 8px; padding: 12px 14px; background: #fff7e8; color: #7a4b00; line-height: 1.45; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; }
    .summary-grid div { border: 1px solid #d9e0e8; border-radius: 8px; padding: 12px; background: #fbfcfe; }
    .summary-grid span { display: block; color: #667085; font-size: 13px; }
    .summary-grid strong { display: block; margin-top: 5px; font-size: 17px; }
    svg { width: 100%; height: auto; display: block; }
    .flow-card { border: 1px solid #d9e0e8; border-radius: 8px; padding: 14px; background: #fff; margin-top: 12px; }
    .flow-card h4 { margin: 0 0 10px; color: #12355b; }
    .flow-values { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 6px 12px; margin-top: 10px; color: #344054; font-size: 13px; }
    .flow-values span { border-top: 1px solid #edf1f5; padding-top: 6px; }
    .scenario-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; }
    .scenario-list div { border: 1px solid #d9e0e8; border-radius: 8px; padding: 10px; background: #fbfcfe; }
    .scenario-list span { display: block; color: #667085; margin-bottom: 5px; }
    @media print { body { background: #fff; } .report { padding: 0; } .report-section, .cover { break-inside: avoid; } }
  </style>
</head>
<body>
  <main class="report">
    <header class="cover">
      <h1>Investe+</h1>
      <p>Sistema de Apoio à Decisão em Orçamento de Capital</p>
      <h2>Relatório de Orçamento de Capital</h2>
      <p>Comparação de projetos por VPL, TIR, payback descontado e risco por cenários.</p>
      <p>Gerado em ${generatedAt}</p>
    </header>

    <section class="report-section">
      <h2>Fundamentação financeira</h2>
      <ul>
        <li>VPL positivo indica criação de valor para a empresa.</li>
        <li>TIR deve ser comparada com a taxa mínima de atratividade.</li>
        <li>Payback descontado mede a recuperação do investimento em valor presente.</li>
        <li>Cenários mostram como o risco altera a decisão de investimento.</li>
        <li>VPL anual equivalente ajuda a comparar projetos com prazos diferentes.</li>
        <li>Previsto x resultado obtido compara a estimativa inicial com os fluxos reais depois que o projeto acontece.</li>
      </ul>
    </section>

    ${warning}

    <section class="report-section">
      <h2>Resumo da decisão</h2>
      <div class="summary-grid">
        <div><span>Melhor projeto por VPL</span><strong>${escapeHtml(best.name)}</strong></div>
        <div><span>VPL</span><strong class="${classByValue(best.npv)}">${formatCurrency(best.npv)}</strong></div>
        <div><span>VPL anual equivalente</span><strong class="${classByValue(best.equivalentAnnualNpv)}">${formatCurrency(best.equivalentAnnualNpv)}</strong></div>
        <div><span>TIR</span><strong>${best.irr === null ? "Nao encontrada" : formatPercent(best.irr)}</strong></div>
      </div>
      <p><strong>Conclusão final:</strong> ${escapeHtml(buildFinalRecommendation(analyses))}</p>
    </section>

    <section class="report-section">
      <h2>Ranking por VPL</h2>
      <table>
        <thead>
          <tr>
            <th>Posição</th>
            <th>Projeto</th>
            <th>VPL</th>
            <th>VPL anual equivalente</th>
            <th>TIR</th>
            <th>Margem da TIR</th>
            <th>Payback</th>
            <th>Sugestão</th>
          </tr>
        </thead>
        <tbody>${buildRankingRows(analyses)}</tbody>
      </table>
    </section>

    <section class="report-section">
      <h2>Gráfico de VPL</h2>
      ${buildVplChartSvg(analyses)}
    </section>

    <section class="report-section">
      <h2>Análise de risco por cenários</h2>
      ${buildScenarioSection(analyses)}
    </section>

    ${buildActualComparisonSection(analyses)}

    ${buildProjectDetailSections(analyses)}
  </main>
</body>
</html>`;
}

function renderResults() {
  renderProjectList();

  if (projects.length === 0) {
    emptyState.classList.remove("hidden");
    resultsContent.classList.add("hidden");
    return;
  }

  const analyses = analyzeAllProjects();
  emptyState.classList.add("hidden");
  resultsContent.classList.remove("hidden");
  horizonWarning.innerHTML = renderHorizonWarning(analyses);
  renderBestProject(analyses);
  renderFinalRecommendation(analyses);
  renderRanking(analyses);
  renderVplChart(analyses);
  renderScenarios(analyses);
  renderActualComparison(analyses);
  renderCashFlowCharts(analyses);
}

function setupTermTooltips() {
  const tooltip = document.createElement("div");
  tooltip.className = "floating-tooltip hidden";
  document.body.appendChild(tooltip);

  document.body.addEventListener("mouseover", (event) => {
    const term = event.target.closest(".term");
    if (!term) {
      return;
    }
    tooltip.textContent = term.dataset.tip;
    tooltip.classList.remove("hidden");
  });

  document.body.addEventListener("mousemove", (event) => {
    if (tooltip.classList.contains("hidden")) {
      return;
    }
    const margin = 12;
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    const left = Math.min(event.clientX + margin, window.innerWidth - tooltipWidth - margin);
    const top = Math.max(margin, event.clientY - tooltipHeight - margin);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  });

  document.body.addEventListener("mouseout", (event) => {
    if (event.target.closest(".term")) {
      tooltip.classList.add("hidden");
    }
  });
}

function removeProject(index) {
  projects.splice(index, 1);
  actualCashFlows.value = "";
  renderResults();
}

function saveActualFlowsForSelectedProject() {
  const index = Number(actualProjectSelect.value);
  const flows = parseCashFlows(actualCashFlows.value);

  if (!projects[index]) {
    alert("Selecione um projeto para comparar.");
    return;
  }
  if (flows.length === 0) {
    alert("Informe pelo menos um valor obtido.");
    return;
  }

  projects[index].actualFlows = flows;
  actualCashFlows.value = "";
  renderResults();
  actualProjectSelect.value = String(index);
}

function clearActualFlowsForSelectedProject() {
  const index = Number(actualProjectSelect.value);
  if (!projects[index]) {
    alert("Selecione um projeto para remover o resultado obtido.");
    return;
  }

  projects[index].actualFlows = [];
  actualCashFlows.value = "";
  renderResults();
  actualProjectSelect.value = String(index);
}

function downloadHtmlReport() {
  if (projects.length === 0) {
    alert("Cadastre pelo menos um projeto para gerar o relatório.");
    return;
  }

  const report = buildReportHtml(analyzeAllProjects());
  const blob = new Blob([report], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "relatorio_web_financeiro.html";
  link.click();
  URL.revokeObjectURL(url);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const flows = parseCashFlows(cashFlows.value);

  if (flows.length === 0) {
    alert("Informe pelo menos um fluxo de caixa.");
    return;
  }

  projects.push({
    name: projectName.value.trim(),
    initialInvestment: parseNumber(initialInvestment.value),
    rate: parseNumber(discountRate.value) / 100,
    flows,
    actualFlows: [],
  });

  form.reset();
  renderResults();
});

document.querySelector("#clearButton").addEventListener("click", () => {
  if (!confirm("Tem certeza que deseja apagar todos os projetos cadastrados?")) {
    return;
  }
  projects.splice(0, projects.length);
  renderResults();
});

document.querySelector("#addProjectButton").addEventListener("click", () => {
  projectName.focus();
});

document.querySelector("#downloadReportButton").addEventListener("click", downloadHtmlReport);
document.querySelector("#saveActualFlowsButton").addEventListener("click", saveActualFlowsForSelectedProject);
document.querySelector("#clearActualFlowsButton").addEventListener("click", clearActualFlowsForSelectedProject);
simulationTab.addEventListener("click", () => switchResultView("simulation"));
obtainedTab.addEventListener("click", () => switchResultView("obtained"));
customScenarioPercent.addEventListener("input", renderResults);

projects.push(
  {
    name: "Projeto Capitulo 7",
    initialInvestment: 200000,
    rate: 0.12,
    flows: [
      29970.97,
      30225.28,
      30243.71,
      30493.06,
      29608.43,
      30033.63,
      30049.51,
      29673.24,
      30178.50,
      29635.04,
      29616.13,
      30292.29,
      29882.84,
      29585.20,
      29760.76,
    ],
    actualFlows: [],
  },
  {
    name: "Projeto Alternativo",
    initialInvestment: 150000,
    rate: 0.12,
    flows: [25000, 26000, 27000, 28000, 29000, 30000, 30000, 30000, 30000, 30000],
    actualFlows: [],
  },
);

setupTermTooltips();
renderResults();
