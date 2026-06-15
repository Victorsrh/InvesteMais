// Lista em memoria com os projetos cadastrados durante o uso da pagina.
// Como a aplicacao roda direto no navegador, os dados sao reiniciados ao recarregar a pagina.
const projects = [];

// Referencias aos elementos do HTML. Esses campos conectam a interface com os calculos em JavaScript.
const form = document.querySelector("#projectForm");
const projectName = document.querySelector("#projectName");
const initialInvestment = document.querySelector("#initialInvestment");
const discountRate = document.querySelector("#discountRate");
const manualBaseRate = document.querySelector("#manualBaseRate");
const riskPremium = document.querySelector("#riskPremium");
const suggestedRate = document.querySelector("#suggestedRate");
const economicDataStatus = document.querySelector("#economicDataStatus");
const loadEconomicDataButton = document.querySelector("#loadEconomicDataButton");
const applySuggestedRateButton = document.querySelector("#applySuggestedRateButton");
const customScenarioPercent = document.querySelector("#customScenarioPercent");
const cashFlows = document.querySelector("#cashFlows");
const actualCashFlows = document.querySelector("#actualCashFlows");
const actualProjectSelect = document.querySelector("#actualProjectSelect");
const projectionRevenue = document.querySelector("#projectionRevenue");
const projectionGrowth = document.querySelector("#projectionGrowth");
const projectionCostPercent = document.querySelector("#projectionCostPercent");
const projectionTaxPercent = document.querySelector("#projectionTaxPercent");
const projectionPeriods = document.querySelector("#projectionPeriods");
const projectionWorkingCapital = document.querySelector("#projectionWorkingCapital");
const projectFlowsButton = document.querySelector("#projectFlowsButton");
const waccDebtWeight = document.querySelector("#waccDebtWeight");
const waccDebtCost = document.querySelector("#waccDebtCost");
const waccEquityCost = document.querySelector("#waccEquityCost");
const waccTaxRate = document.querySelector("#waccTaxRate");
const waccStatus = document.querySelector("#waccStatus");
const calculateWaccButton = document.querySelector("#calculateWaccButton");
const applyWaccButton = document.querySelector("#applyWaccButton");
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
const sensitivityAnalysis = document.querySelector("#sensitivityAnalysis");

let latestEconomicData = null;
let latestWacc = null;

// Evita que textos digitados pelo usuario sejam interpretados como HTML ao aparecerem na tela ou no relatorio.
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

function formatPercentFromNumber(value) {
  return `${value.toFixed(2).replace(".", ",")}%`;
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

// Consulta uma serie do Sistema Gerenciador de Series Temporais do Banco Central.
// No projeto, os codigos usados sao 432 para Selic e 433 para IPCA mensal.
async function fetchBcbSeriesValue(seriesCode) {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${seriesCode}/dados/ultimos/1?formato=json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Falha ao buscar serie ${seriesCode}`);
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`Serie ${seriesCode} sem dados`);
  }

  return {
    date: data[0].data,
    value: parseNumber(data[0].valor),
  };
}

// Calcula a taxa minima sugerida: taxa base manual + premio de risco, ou Selic + premio de risco.
// A taxa sugerida e apenas uma referencia; o usuario ainda decide se vai aplica-la ao projeto.
function calculateSuggestedDiscountRate() {
  const manualBase = parseNumber(manualBaseRate.value);
  const premium = parseNumber(riskPremium.value);
  if (Number.isNaN(premium)) {
    return null;
  }

  if (!Number.isNaN(manualBase)) {
    return manualBase + premium;
  }

  if (latestEconomicData) {
    return latestEconomicData.selic.value + premium;
  }

  return null;
}

// Atualiza o painel de dados economicos conforme o usuario carrega a API ou informa uma taxa base manual.
function renderEconomicDataStatus() {
  const manualBase = parseNumber(manualBaseRate.value);
  const premium = parseNumber(riskPremium.value);
  const suggested = calculateSuggestedDiscountRate();

  if (suggested === null || Number.isNaN(premium)) {
    economicDataStatus.textContent = "Carregue a API ou informe uma taxa base manual para calcular a taxa sugerida.";
    suggestedRate.value = "";
    return;
  }

  suggestedRate.value = formatPercentFromNumber(suggested);

  if (!Number.isNaN(manualBase)) {
    economicDataStatus.innerHTML = `
      <strong>Taxa base manual:</strong> ${formatPercentFromNumber(manualBase)}<br>
      <strong>Prêmio de risco:</strong> ${formatPercentFromNumber(premium)}<br>
      <strong>Taxa sugerida:</strong> taxa base + prêmio de risco = ${formatPercentFromNumber(suggested)}
    `;
    return;
  }

  if (!latestEconomicData) {
    economicDataStatus.textContent = "Carregue a API ou informe uma taxa base manual para calcular a taxa sugerida.";
    suggestedRate.value = "";
    return;
  }

  economicDataStatus.innerHTML = `
    <strong>Selic:</strong> ${formatPercentFromNumber(latestEconomicData.selic.value)} (${latestEconomicData.selic.date})<br>
    <strong>IPCA mensal:</strong> ${formatPercentFromNumber(latestEconomicData.ipca.value)} (${latestEconomicData.ipca.date})<br>
    <strong>Taxa sugerida:</strong> Selic + prêmio de risco = ${formatPercentFromNumber(suggested)}
  `;
}

// Busca Selic e IPCA reais no Banco Central para aproximar a analise de um contexto economico atual.
async function loadEconomicData() {
  loadEconomicDataButton.disabled = true;
  economicDataStatus.textContent = "Carregando dados do Banco Central...";

  try {
    const [selic, ipca] = await Promise.all([
      fetchBcbSeriesValue(432),
      fetchBcbSeriesValue(433),
    ]);

    latestEconomicData = {
      source: "Banco Central do Brasil - SGS",
      selic,
      ipca,
      loadedAt: new Date().toLocaleString("pt-BR"),
    };

    renderEconomicDataStatus();
  } catch (error) {
    latestEconomicData = null;
    suggestedRate.value = "";
    economicDataStatus.textContent = "Não foi possível carregar a API. Use a taxa mínima manualmente ou tente pelo GitHub Pages/servidor local.";
  } finally {
    loadEconomicDataButton.disabled = false;
  }
}

// Copia a taxa sugerida para o campo principal de taxa minima do projeto.
function applySuggestedRate() {
  const suggested = calculateSuggestedDiscountRate();
  if (suggested === null || Number.isNaN(suggested)) {
    alert("Carregue os dados econômicos ou informe uma taxa base manual e um prêmio de risco válido.");
    return;
  }

  discountRate.value = suggested.toFixed(2);
  discountRate.dataset.source = Number.isNaN(parseNumber(manualBaseRate.value)) ? "api-bcb" : "manual";
}

// Gera fluxos de caixa a partir de premissas operacionais simples:
// receita, crescimento, custos, impostos e capital de giro.
function projectCashFlowsFromAssumptions() {
  const revenue = parseNumber(projectionRevenue.value);
  const growth = parseNumber(projectionGrowth.value) / 100;
  const costPercent = parseNumber(projectionCostPercent.value) / 100;
  const taxPercent = parseNumber(projectionTaxPercent.value) / 100;
  const periods = Number.parseInt(projectionPeriods.value, 10);
  const workingCapital = parseNumber(projectionWorkingCapital.value);

  if (
    Number.isNaN(revenue) ||
    Number.isNaN(growth) ||
    Number.isNaN(costPercent) ||
    Number.isNaN(taxPercent) ||
    Number.isNaN(periods) ||
    periods <= 0
  ) {
    alert("Preencha receita, crescimento, custos, impostos e períodos para projetar os fluxos.");
    return;
  }

  const flows = [];
  for (let period = 1; period <= periods; period += 1) {
    // A receita cresce periodo a periodo, e o fluxo livre considera custos e impostos.
    const projectedRevenue = revenue * (1 + growth) ** (period - 1);
    const operatingCost = projectedRevenue * costPercent;
    const operatingProfit = projectedRevenue - operatingCost;
    const taxes = Math.max(0, operatingProfit) * taxPercent;
    const freeCashFlow = operatingProfit - taxes;
    flows.push(freeCashFlow);
  }

  if (!Number.isNaN(workingCapital) && workingCapital > 0 && flows.length > 0) {
    // O capital de giro e tratado como saida no inicio e recuperacao no ultimo periodo.
    flows[0] -= workingCapital;
    flows[flows.length - 1] += workingCapital;
  }

  cashFlows.value = flows.map((flow) => flow.toFixed(2).replace(".", ",")).join("\n");
}

// Calcula o WACC: custo medio ponderado de capital.
// Formula usada: WACC = D% * Kd * (1 - imposto) + E% * Ke.
function calculateWaccValue() {
  const debtWeight = parseNumber(waccDebtWeight.value) / 100;
  const debtCost = parseNumber(waccDebtCost.value) / 100;
  const equityCost = parseNumber(waccEquityCost.value) / 100;
  const taxRate = parseNumber(waccTaxRate.value) / 100;

  if (
    Number.isNaN(debtWeight) ||
    Number.isNaN(debtCost) ||
    Number.isNaN(equityCost) ||
    Number.isNaN(taxRate) ||
    debtWeight < 0 ||
    debtWeight > 1
  ) {
    return null;
  }

  const equityWeight = 1 - debtWeight;
  return debtWeight * debtCost * (1 - taxRate) + equityWeight * equityCost;
}

// Mostra o WACC calculado e guarda o valor para que ele possa ser usado como taxa minima.
function renderWaccStatus() {
  const wacc = calculateWaccValue();
  if (wacc === null) {
    latestWacc = null;
    waccStatus.textContent = "Preencha os dados corretamente para calcular o WACC.";
    return;
  }

  latestWacc = wacc;
  waccStatus.innerHTML = `
    <strong>WACC calculado:</strong> ${formatPercent(wacc)}<br>
    <small>Considera benefício fiscal da dívida: custo da dívida x (1 - imposto).</small>
  `;
}

// Aplica o WACC no campo de taxa minima do projeto.
function applyWaccRate() {
  if (latestWacc === null) {
    renderWaccStatus();
  }

  if (latestWacc === null) {
    alert("Calcule o WACC antes de usar a taxa.");
    return;
  }

  discountRate.value = (latestWacc * 100).toFixed(2);
  discountRate.dataset.source = "wacc";
}

// Valor presente: traz um fluxo futuro para o valor equivalente no periodo zero.
function presentValue(futureValue, rate, period) {
  return futureValue / (1 + rate) ** period;
}

// Valor futuro: leva um valor atual para um periodo futuro pela taxa informada.
function futureValue(presentValueAmount, rate, period) {
  return presentValueAmount * (1 + rate) ** period;
}

// VPL: soma os fluxos futuros em valor presente e desconta o investimento inicial.
function calculateNpv(initialValue, flows, rate) {
  return flows.reduce((total, flow, index) => {
    return total + presentValue(flow, rate, index + 1);
  }, -initialValue);
}

// VPL anual equivalente: transforma o VPL total em uma serie anual equivalente.
// Isso ajuda a comparar projetos com duracoes diferentes.
function calculateEquivalentAnnualNpv(npv, rate, periods) {
  if (periods <= 0) {
    return 0;
  }
  if (rate === 0) {
    return npv / periods;
  }
  return npv * (rate / (1 - (1 + rate) ** -periods));
}

// Payback descontado: calcula em qual periodo o investimento e recuperado em valor presente.
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

// TIR aproximada por busca binaria.
// A TIR e a taxa que faz o VPL se aproximar de zero.
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

// Interpreta o risco comparando VPL nos cenarios pessimista, provavel e otimista.
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

// Consolida todos os indicadores de um projeto em um unico objeto de analise.
// Essa funcao e a base para ranking, graficos, relatorio e recomendacao.
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
    // Os cenarios simulam variacoes nos fluxos previstos para observar sensibilidade ao risco.
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

// Explica de onde veio a taxa minima: digitada manualmente, sugerida pela API ou calculada por WACC.
function describeRateSource(project) {
  if (project.rateSource === "api-bcb" && project.economicData) {
    return `Taxa sugerida com base na Selic (${formatPercentFromNumber(project.economicData.selic.value)}) + prêmio de risco de ${formatPercentFromNumber(project.economicData.riskPremium)}.`;
  }

  return "Taxa informada manualmente pelo usuário.";
}

function describeDecisionInputs(project) {
  if (project.rateSource === "wacc" && project.waccData) {
    return (
      `Taxa calculada por WACC: ${formatPercent(project.waccData.wacc)}. ` +
      `A decisao considera custo da divida, custo do capital proprio e efeito fiscal da divida.`
    );
  }

  return describeRateSource(project);
}

// Analisa todos os projetos e ordena pelo VPL, colocando no topo o maior gerador de valor.
function analyzeAllProjects() {
  return projects
    .map(analyzeProject)
    .sort((first, second) => second.npv - first.npv);
}

// Atualiza a lista visual de projetos cadastrados.
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

// Preenche o seletor usado na aba de comparacao entre previsto e resultado obtido.
function renderActualProjectOptions() {
  actualProjectSelect.innerHTML = projects
    .map((project, index) => `<option value="${index}">${escapeHtml(project.name)}</option>`)
    .join("");
}

function classByValue(value) {
  return value >= 0 ? "positive" : "negative";
}

// Renderiza a tabela principal de ranking dos projetos.
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

// Destaca o melhor projeto pelo criterio principal do sistema: maior VPL.
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

// Monta uma recomendacao textual a partir dos indicadores calculados.
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

// Alerta quando os projetos possuem quantidades diferentes de periodos.
// Nesses casos, o VPL anual equivalente ajuda a deixar a comparacao mais equilibrada.
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

// Cria um grafico SVG simples para comparar o VPL dos projetos sem depender de bibliotecas externas.
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

// Testa variacoes nas principais premissas para mostrar quais fatores mais alteram o VPL.
function calculateSensitivityRows(project) {
  const baseNpv = project.npv;
  const tests = [
    {
      variable: "Taxa +1 p.p.",
      npv: calculateNpv(project.initialInvestment, project.flows, project.rate + 0.01),
    },
    {
      variable: "Taxa -1 p.p.",
      npv: calculateNpv(project.initialInvestment, project.flows, Math.max(0, project.rate - 0.01)),
    },
    {
      variable: "Fluxos +10%",
      npv: calculateNpv(project.initialInvestment, project.flows.map((flow) => flow * 1.1), project.rate),
    },
    {
      variable: "Fluxos -10%",
      npv: calculateNpv(project.initialInvestment, project.flows.map((flow) => flow * 0.9), project.rate),
    },
    {
      variable: "Investimento +10%",
      npv: calculateNpv(project.initialInvestment * 1.1, project.flows, project.rate),
    },
  ];

  return tests.map((test) => ({
    ...test,
    impact: test.npv - baseNpv,
  }));
}

// Gera pontos da curva VPL x taxa, usada para visualizar a relacao entre taxa de desconto e valor do projeto.
function calculateRateCurve(project) {
  const points = [];
  for (let percent = 0; percent <= 25; percent += 2.5) {
    const rate = percent / 100;
    points.push({
      rate,
      npv: calculateNpv(project.initialInvestment, project.flows, rate),
    });
  }
  return points;
}

// Aproxima a derivada do VPL em relacao a taxa.
// Na pratica, mostra quanto o VPL muda quando a taxa aumenta 1 ponto percentual.
function calculateRateDerivative(project) {
  const step = 0.01;
  const currentNpv = calculateNpv(project.initialInvestment, project.flows, project.rate);
  const higherRateNpv = calculateNpv(project.initialInvestment, project.flows, project.rate + step);
  return {
    currentNpv,
    higherRateNpv,
    impactPerPercentagePoint: higherRateNpv - currentNpv,
    derivativePerUnitRate: (higherRateNpv - currentNpv) / step,
  };
}

// Desenha a curva VPL x taxa em SVG.
function buildRateCurveChart(project) {
  const width = 620;
  const height = 260;
  const points = calculateRateCurve(project);
  const npvValues = points.map((point) => point.npv);
  const minNpv = Math.min(0, ...npvValues);
  const maxNpv = Math.max(0, ...npvValues);
  const range = maxNpv - minNpv || 1;
  const x = (rate) => 50 + (rate / 0.25) * (width - 90);
  const y = (npv) => 20 + ((maxNpv - npv) / range) * (height - 60);
  const zeroY = y(0);
  const polyline = points.map((point) => `${x(point.rate).toFixed(2)},${y(point.npv).toFixed(2)}`).join(" ");
  const currentX = x(Math.min(0.25, Math.max(0, project.rate)));

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Curva VPL por taxa de ${escapeHtml(project.name)}">
      <line x1="40" y1="${zeroY.toFixed(2)}" x2="${width - 25}" y2="${zeroY.toFixed(2)}" stroke="#667085"></line>
      <line x1="50" y1="20" x2="50" y2="${height - 40}" stroke="#c8d0da"></line>
      <polyline points="${polyline}" fill="none" stroke="#1f6feb" stroke-width="3"></polyline>
      <line x1="${currentX.toFixed(2)}" y1="20" x2="${currentX.toFixed(2)}" y2="${height - 40}" stroke="#a15c07" stroke-dasharray="4 4"></line>
      ${points.map((point) => `
        <circle cx="${x(point.rate).toFixed(2)}" cy="${y(point.npv).toFixed(2)}" r="3" fill="#1f6feb">
          <title>${formatPercent(point.rate)}: ${formatCurrency(point.npv)}</title>
        </circle>
      `).join("")}
      <text x="50" y="${height - 14}" text-anchor="middle" font-size="11">0%</text>
      <text x="${width - 40}" y="${height - 14}" text-anchor="middle" font-size="11">25%</text>
      <text x="${currentX.toFixed(2)}" y="14" text-anchor="middle" font-size="11">taxa usada</text>
    </svg>
  `;
}

// Monta a tabela de sensibilidade de um projeto.
function buildSensitivityTable(project) {
  const rows = calculateSensitivityRows(project);
  const mostRelevant = [...rows].sort((first, second) => Math.abs(second.impact) - Math.abs(first.impact))[0];
  const rateDerivative = calculateRateDerivative(project);

  return `
    <div class="sensitivity-card">
      <h4>${escapeHtml(project.name)}</h4>
      <div class="rate-curve">
        ${buildRateCurveChart(project)}
      </div>
      <p>
        Sensibilidade aproximada à taxa:
        <strong class="${classByValue(rateDerivative.impactPerPercentagePoint)}">${formatCurrency(rateDerivative.impactPerPercentagePoint)}</strong>
        para cada +1 ponto percentual na taxa.
      </p>
      <table>
        <thead>
          <tr>
            <th>Variação</th>
            <th>VPL resultante</th>
            <th>Impacto no VPL</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${row.variable}</td>
              <td class="${classByValue(row.npv)}">${formatCurrency(row.npv)}</td>
              <td class="${classByValue(row.impact)}">${formatCurrency(row.impact)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <p>Maior impacto observado: <strong>${mostRelevant.variable}</strong>.</p>
    </div>
  `;
}

function renderSensitivityAnalysis(analyses) {
  sensitivityAnalysis.innerHTML = analyses
    .map((project) => buildSensitivityTable(project))
    .join("");
}

// Alterna entre a aba de simulacao prevista e a aba de comparacao com resultados obtidos.
function switchResultView(view) {
  const showingSimulation = view === "simulation";
  simulationView.classList.toggle("hidden", !showingSimulation);
  obtainedView.classList.toggle("hidden", showingSimulation);
  simulationTab.classList.toggle("active", showingSimulation);
  obtainedTab.classList.toggle("active", !showingSimulation);
}

// A partir daqui, as funcoes montam o relatorio HTML baixavel pelo usuario.
// O relatorio reaproveita os mesmos calculos vistos na tela para registrar a analise.
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
        <p><strong>Origem da taxa:</strong> ${escapeHtml(describeDecisionInputs(project))}</p>
        ${buildCashFlowChart(project)}
      </section>
    `)
    .join("");
}

function buildSensitivityReportSection(analyses) {
  return `
    <section class="report-section">
      <h2>Análise de sensibilidade</h2>
      <p>Esta seção aproxima a ideia de derivada: mede quanto o VPL muda quando uma variável financeira é alterada. Na curva VPL x taxa, a sensibilidade mostra a variação aproximada do VPL para cada aumento de 1 ponto percentual na taxa de desconto.</p>
      ${analyses.map((project) => buildSensitivityTable(project)).join("")}
    </section>
  `;
}

function buildExecutiveSummarySection(analyses) {
  const best = analyses[0];
  const sensitivityRows = calculateSensitivityRows(best);
  const mostSensitive = [...sensitivityRows].sort(
    (first, second) => Math.abs(second.impact) - Math.abs(first.impact),
  )[0];

  return `
    <section class="report-section">
      <h2>Resumo executivo</h2>
      <div class="summary-grid">
        <div><span>Projeto recomendado</span><strong>${escapeHtml(best.name)}</strong></div>
        <div><span>Decisão sugerida</span><strong>${best.decision}</strong></div>
        <div><span>Principal risco observado</span><strong>${escapeHtml(best.riskConclusion)}</strong></div>
        <div><span>Variável mais sensível</span><strong>${mostSensitive.variable}</strong></div>
      </div>
      <p><strong>Origem da taxa do projeto recomendado:</strong> ${escapeHtml(describeDecisionInputs(best))}</p>
      <p><strong>Conclusão:</strong> ${escapeHtml(buildFinalRecommendation(analyses))}</p>
    </section>
  `;
}

function buildEconomicDataReportSection(analyses) {
  const projectsUsingApi = analyses.filter((project) => project.rateSource === "api-bcb" && project.economicData);

  if (projectsUsingApi.length === 0 && !latestEconomicData) {
    return `
      <section class="report-section">
        <h2>Dados econômicos reais</h2>
        <p>Nenhum indicador externo foi usado neste relatório. As taxas mínimas foram informadas manualmente.</p>
      </section>
    `;
  }

  const data = projectsUsingApi[0]?.economicData || latestEconomicData;
  const suggested = data.selic.value + (data.riskPremium || parseNumber(riskPremium.value) || 0);

  return `
    <section class="report-section">
      <h2>Dados econômicos reais</h2>
      <p>Fonte: ${escapeHtml(data.source || "Banco Central do Brasil - SGS")}.</p>
      <div class="summary-grid">
        <div><span>Selic</span><strong>${formatPercentFromNumber(data.selic.value)}</strong><small>${data.selic.date}</small></div>
        <div><span>IPCA mensal</span><strong>${formatPercentFromNumber(data.ipca.value)}</strong><small>${data.ipca.date}</small></div>
        <div><span>Prêmio de risco</span><strong>${formatPercentFromNumber(data.riskPremium || parseNumber(riskPremium.value) || 0)}</strong></div>
        <div><span>Taxa sugerida</span><strong>${formatPercentFromNumber(suggested)}</strong></div>
      </div>
      <p>Na análise, a Selic foi usada como referência de taxa livre de risco. O prêmio de risco foi somado a ela para estimar uma taxa mínima de atratividade. Quanto maior essa taxa, menor tende a ser o VPL dos projetos, pois os fluxos futuros são descontados com mais intensidade.</p>
    </section>
  `;
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
    .sensitivity-card { border: 1px solid #d9e0e8; border-radius: 8px; padding: 14px; background: #fff; margin-top: 12px; overflow-x: auto; }
    .sensitivity-card h4 { margin: 0 0 10px; color: #12355b; }
    .sensitivity-card p { margin: 10px 0 0; color: #344054; }
    .rate-curve { border: 1px solid #edf1f5; border-radius: 8px; padding: 8px; margin-bottom: 10px; background: #fbfcfe; }
    .rate-curve svg { width: 100%; height: auto; display: block; }
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

    ${buildEconomicDataReportSection(analyses)}

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

    ${buildExecutiveSummarySection(analyses)}

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

    ${buildSensitivityReportSection(analyses)}

    ${buildActualComparisonSection(analyses)}

    ${buildProjectDetailSections(analyses)}
  </main>
</body>
</html>`;
}

// Recalcula tudo e atualiza a interface sempre que projetos ou premissas mudam.
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
  renderSensitivityAnalysis(analyses);
}

// Cria tooltips para explicar termos financeiros sem ocupar muito espaco na tela.
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

// Remove um projeto cadastrado e recalcula a analise.
function removeProject(index) {
  projects.splice(index, 1);
  actualCashFlows.value = "";
  renderResults();
}

// Salva fluxos reais/obtidos para comparar o planejado com o resultado posterior do projeto.
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

// Gera um arquivo HTML com a analise completa para entrega ou apresentacao.
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

// Projetos de exemplo usados para demonstrar o sistema sem exigir digitacao inicial.
function buildExampleProjects() {
  return [
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
      rateSource: "manual",
      economicData: null,
      waccData: null,
    },
    {
      name: "Projeto Alternativo",
      initialInvestment: 150000,
      rate: 0.12,
      flows: [25000, 26000, 27000, 28000, 29000, 30000, 30000, 30000, 30000, 30000],
      actualFlows: [],
      rateSource: "manual",
      economicData: null,
      waccData: null,
    },
  ];
}

function restoreExampleProjects() {
  projects.splice(0, projects.length, ...buildExampleProjects());
  actualCashFlows.value = "";
  renderResults();
}

// Cadastro do projeto principal: valida entradas, converte taxa para decimal e guarda dados para analise.
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const flows = parseCashFlows(cashFlows.value);
  const name = projectName.value.trim();
  const investment = parseNumber(initialInvestment.value);
  const rate = parseNumber(discountRate.value);

  if (name === "") {
    alert("Informe o nome do projeto.");
    return;
  }
  if (projects.some((project) => project.name.toLowerCase() === name.toLowerCase())) {
    alert("Já existe um projeto com esse nome.");
    return;
  }
  if (Number.isNaN(investment) || investment <= 0) {
    alert("Informe um investimento inicial maior que zero.");
    return;
  }
  if (Number.isNaN(rate) || rate < 0) {
    alert("Informe uma taxa mínima válida.");
    return;
  }
  if (flows.length === 0) {
    alert("Informe pelo menos um fluxo de caixa.");
    return;
  }
  if (flows.every((flow) => flow === 0)) {
    alert("Informe ao menos um fluxo de caixa diferente de zero.");
    return;
  }

  projects.push({
    name,
    initialInvestment: investment,
    rate: rate / 100,
    flows,
    actualFlows: [],
    rateSource: discountRate.dataset.source || "manual",
    economicData: discountRate.dataset.source === "api-bcb" && latestEconomicData
      ? {
          ...latestEconomicData,
          riskPremium: parseNumber(riskPremium.value),
        }
      : null,
    waccData: discountRate.dataset.source === "wacc" && latestWacc !== null
      ? {
          wacc: latestWacc,
          debtWeight: parseNumber(waccDebtWeight.value) / 100,
          equityWeight: 1 - parseNumber(waccDebtWeight.value) / 100,
          debtCost: parseNumber(waccDebtCost.value) / 100,
          equityCost: parseNumber(waccEquityCost.value) / 100,
          taxRate: parseNumber(waccTaxRate.value) / 100,
        }
      : null,
  });

  form.reset();
  delete discountRate.dataset.source;
  renderResults();
});

// Eventos dos botoes e campos da interface.
document.querySelector("#clearButton").addEventListener("click", () => {
  if (!confirm("Tem certeza que deseja apagar todos os projetos cadastrados?")) {
    return;
  }
  projects.splice(0, projects.length);
  renderResults();
});

document.querySelector("#restoreExamplesButton").addEventListener("click", () => {
  if (projects.length > 0 && !confirm("Restaurar os exemplos substituirá os projetos atuais. Continuar?")) {
    return;
  }
  restoreExampleProjects();
});

document.querySelector("#addProjectButton").addEventListener("click", () => {
  projectName.focus();
});

document.querySelector("#downloadReportButton").addEventListener("click", downloadHtmlReport);
document.querySelector("#saveActualFlowsButton").addEventListener("click", saveActualFlowsForSelectedProject);
document.querySelector("#clearActualFlowsButton").addEventListener("click", clearActualFlowsForSelectedProject);
loadEconomicDataButton.addEventListener("click", loadEconomicData);
applySuggestedRateButton.addEventListener("click", applySuggestedRate);
projectFlowsButton.addEventListener("click", projectCashFlowsFromAssumptions);
calculateWaccButton.addEventListener("click", renderWaccStatus);
applyWaccButton.addEventListener("click", applyWaccRate);
manualBaseRate.addEventListener("input", renderEconomicDataStatus);
riskPremium.addEventListener("input", renderEconomicDataStatus);
discountRate.addEventListener("input", () => {
  delete discountRate.dataset.source;
});
simulationTab.addEventListener("click", () => switchResultView("simulation"));
obtainedTab.addEventListener("click", () => switchResultView("obtained"));
customScenarioPercent.addEventListener("input", renderResults);

// Inicializacao da pagina: ativa explicacoes dos termos e carrega exemplos padrao.
setupTermTooltips();
restoreExampleProjects();
