# Investe+ - Sistema de Apoio à Decisão em Orçamento de Capital

O **Investe+** é uma aplicação para análise de projetos de investimento com base em conceitos de Administração Financeira. O sistema utiliza indicadores de orçamento de capital para comparar alternativas, analisar risco e apoiar a tomada de decisão.

O projeto possui duas versões:

- **Versão web:** interface em HTML, CSS e JavaScript, executada diretamente no navegador.
- **Versão Python:** aplicação de terminal mais simples, mantida como alternativa de execução e registro da primeira versão do projeto.

> A versão web é a versão principal e mais completa do Investe+. A versão Python não possui todos os recursos adicionados posteriormente ao site, como API, seções expansíveis, gráficos completos e ferramentas opcionais avançadas.


## Demonstração

Versão online:

https://victorsrh.github.io/InvesteMais/

## Objetivo

O objetivo do sistema é avaliar se um ou mais projetos de investimento tendem a gerar valor financeiro. Para isso, a aplicação calcula indicadores como VPL, TIR, payback descontado, VPL anual equivalente e cenários de risco.

A aplicação não substitui a decisão gerencial. Ela apresenta uma sugestão com base nos indicadores calculados, permitindo que o usuário compare alternativas e interprete os resultados.

## Funcionalidades

- Cadastro de um ou mais projetos de investimento.
- Entrada do investimento inicial, taxa mínima de atratividade e fluxos de caixa previstos.
- Aceitação de fluxos separados por ponto e vírgula ou informados um por linha.
- Separação entre cadastro principal e ferramentas opcionais em seções expansíveis.
- Projeção automática de fluxos a partir de receita, crescimento, custos, impostos e capital de giro.
- Cálculo de valor presente dos fluxos de caixa.
- Cálculo de VPL, TIR, margem da TIR e payback descontado.
- Cálculo do VPL anual equivalente para comparar projetos com prazos diferentes.
- Cálculo opcional de WACC para estimar a taxa mínima de atratividade.
- Consulta opcional de dados reais via API do Banco Central, usando Selic e IPCA como contexto econômico.
- Cálculo opcional de taxa sugerida com Selic da API ou taxa base manual somada ao prêmio de risco.
- Ranking dos projetos por VPL.
- Análise de risco por cenários pessimista, provável, otimista e personalizado.
- Análise de sensibilidade para medir como o VPL muda com taxa, fluxos e investimento.
- Curva VPL x taxa, mostrando como o VPL varia quando a taxa de desconto muda.
- Gráficos comparativos de VPL e fluxos de caixa.
- Aba de comparação entre valores previstos e resultados obtidos posteriormente.
- Geração de relatório HTML com fundamentação financeira, ranking, análise de risco, gráficos e conclusão final.
- Botão para restaurar os exemplos usados na demonstração.

## Conceitos financeiros utilizados

- **Valor presente:** traz valores futuros para o valor equivalente no momento atual.
- **VPL (Valor Presente Líquido):** mede a criação de valor do projeto após descontar o investimento inicial.
- **TIR (Taxa Interna de Retorno):** taxa estimada de retorno que faz o VPL ser igual a zero.
- **Taxa mínima de atratividade:** retorno mínimo esperado para que o investimento seja considerado viável.
- **WACC:** custo médio ponderado de capital, usado para estimar a taxa de desconto com base em dívida e capital próprio.
- **Payback descontado:** tempo necessário para recuperar o investimento considerando o valor do dinheiro no tempo.
- **VPL anual equivalente:** transforma o VPL total em um valor periódico equivalente, útil para comparar projetos com durações diferentes.
- **Risco por cenários:** simula alterações nos fluxos de caixa para observar como o resultado muda em situações diferentes.
- **Dados econômicos reais:** a Selic pode servir como referência para a taxa mínima, e o IPCA contextualiza o ambiente inflacionário.
- **Análise de sensibilidade:** mede a variação do VPL quando uma premissa muda, como taxa, fluxos ou investimento inicial.
- **Derivada aproximada do VPL:** estima quanto o VPL muda quando a taxa de desconto aumenta 1 ponto percentual.
- **Previsto x resultado obtido:** compara os fluxos estimados inicialmente com os valores reais obtidos depois da execução do projeto.

## Projeção, WACC e sensibilidade

A versão web possui ferramentas auxiliares para aproximar o projeto de uma análise real.

- **Ferramentas opcionais:** ficam recolhidas em seções expansíveis e podem preencher o formulário ou atualizar um projeto salvo selecionado.
- **Dados econômicos reais:** usa a API do Banco Central ou uma taxa base manual para sugerir uma taxa mínima.
- **Projetar fluxos:** gera fluxos previstos com base em receita inicial, crescimento esperado, custos, impostos e capital de giro.
- **Calcular WACC:** estima a taxa mínima usando proporção de dívida, custo da dívida, custo do capital próprio e imposto.
- **Análise de sensibilidade:** mostra quanto o VPL muda quando a taxa sobe ou cai, quando os fluxos variam e quando o investimento inicial aumenta.
- **Curva VPL x taxa:** calcula o VPL em várias taxas e mostra graficamente onde o projeto perde atratividade.

Essas ferramentas não substituem a análise gerencial, mas ajudam a justificar as premissas usadas no VPL e a identificar quais variáveis mais afetam a decisão.

## Uso de API

Na versão web, a área **Dados econômicos reais** permite consultar indicadores do Banco Central do Brasil.

- **Selic:** usada como referência de taxa base.
- **IPCA mensal:** usado como contexto de inflação.
- **Prêmio de risco:** informado pelo usuário para ajustar a taxa ao risco do projeto.
- **Taxa base manual:** alternativa para calcular a taxa sugerida sem depender da API.

A taxa sugerida pode seguir uma destas ideias:

```text
Taxa mínima sugerida = Selic + prêmio de risco
Taxa mínima sugerida = taxa base manual + prêmio de risco
```

Esse recurso é opcional. Se a API não carregar, o usuário pode informar uma taxa base manual na própria ferramenta ou digitar a taxa mínima diretamente no cadastro do projeto.

## Fluxo de uso na versão web

O cadastro principal exige apenas os dados necessários para calcular os indicadores:

- nome do projeto;
- investimento inicial;
- taxa mínima de atratividade;
- fluxos de caixa previstos.

As seções de **Ferramentas opcionais** podem ser abertas somente quando o usuário quiser apoiar a análise com dados econômicos, projetar fluxos automaticamente ou calcular o WACC. Elas podem ser usadas de duas formas:

- preencher o formulário principal antes de salvar um novo projeto;
- atualizar a taxa ou os fluxos de um projeto já cadastrado, escolhendo esse projeto no seletor de ferramentas opcionais.

Isso evita que o usuário interprete todos os campos laterais como obrigatórios e também permite refinar projetos já salvos.

## Regras de interpretação

- VPL positivo indica tendência de geração de valor.
- VPL negativo indica tendência de destruição de valor.
- Entre projetos concorrentes, maior VPL indica maior geração total de valor.
- Quando os projetos possuem prazos diferentes, o VPL anual equivalente ajuda a equilibrar a comparação.
- A TIR deve ser comparada com a taxa mínima de atratividade.
- O payback descontado mostra em quanto tempo o investimento é recuperado em valor presente.
- A análise por cenários mostra a sensibilidade do projeto a variações nos fluxos de caixa.

## Como executar a versão web

### Acesso online (recomendado)

A versão web do Investe+ está disponível em:

https://victorsrh.github.io/InvesteMais/

Não é necessário instalar ou configurar nenhum software. Basta acessar o link em um navegador.

### Execução local

Abra o arquivo:

```text
index.html
```

ou utilize um servidor local:

```bash
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

## Como executar a versão Python

No terminal, execute:

```bash
python administracao_financeira_app.py
```

Essa versão funciona como uma alternativa simples em terminal. Ela não representa todos os recursos da versão web, que é a versão recomendada para apresentação e uso completo do projeto.

## Formato dos fluxos de caixa

Na versão web, os fluxos de caixa podem ser informados de mais de uma forma.

Separados por ponto e vírgula:

```text
10000; 12000; 15000
```

Com centavos no formato brasileiro:

```text
29970,97; 30225,28; 30243,71
```

Um valor por linha:

```text
10000
12000
15000
```

Para valores com centavos no formato brasileiro, recomenda-se usar ponto e vírgula ou um valor por linha.

## Saídas geradas

Na versão web, a aplicação apresenta:

- cards com os principais indicadores;
- ranking dos projetos;
- gráficos de VPL;
- gráficos dos fluxos de caixa;
- análise de risco por cenários;
- comparação entre previsto e resultado obtido;
- relatório HTML para download.

Na versão Python, a aplicação gera:

- `relatorio_financeiro.txt`;
- `comparacao_projetos.csv`;
- `relatorio_graficos.html`.

Essas saídas pertencem à versão simples de terminal e podem ser diferentes do relatório HTML gerado pela versão web.

## Estrutura dos arquivos

- `index.html`: estrutura da interface web.
- `styles.css`: estilos visuais da aplicação.
- `app.js`: lógica da versão web, cálculos financeiros, gráficos e relatório HTML.
- `administracao_financeira_app.py`: versão em Python executada pelo terminal.
- `README.md`: documentação do projeto.


1. Envie os arquivos do projeto para um repositório no GitHub.
2. No repositório, acesse `Settings > Pages`.
3. Em `Build and deployment`, selecione a branch principal e a pasta raiz.
4. O GitHub Pages irá gerar um link público para abrir a versão web.

## Exemplos de teste

Projeto 1:

- Nome: `Loja Online da Chocolateria`
- Investimento inicial: `120000`
- Taxa mínima: `12`
- Fluxos: `28000; 34000; 41000; 48000; 56000; 64000`

Projeto 2:

- Nome: `Máquina de Embalagem`
- Investimento inicial: `180000`
- Taxa mínima: `12`
- Fluxos: `42000; 47000; 52000; 57000; 62000; 67000; 72000`

Projeto 3:

- Nome: `Unidade de Delivery`
- Investimento inicial: `95000`
- Taxa mínima: `12`
- Fluxos: `22000; 26000; 30000; 34000; 38000`

Com esses dados, a aplicação compara alternativas com investimentos, prazos e fluxos diferentes, gerando ranking por VPL, TIR, payback descontado, VPL anual equivalente e cenários de risco.
