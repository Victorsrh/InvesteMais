# Investe+ - Sistema de Apoio à Decisão em Orçamento de Capital

O **Investe+** é uma aplicação para análise de projetos de investimento baseada em conceitos de Administração Financeira. O sistema utiliza indicadores de orçamento de capital para comparar alternativas, analisar riscos e apoiar a tomada de decisão.

O projeto possui duas versões:

- **Versão web:** interface em HTML, CSS e JavaScript executada diretamente no navegador.
- **Versão Python:** aplicação em terminal mantida como registro da primeira versão do projeto.

> A versão web é a versão principal e mais completa do Investe+. A versão Python não possui todos os recursos adicionados posteriormente ao site, como API, gráficos, análise de sensibilidade e ferramentas avançadas.

## Demonstração

Versão online:

https://victorsrh.github.io/InvesteMais/

## Objetivo

O objetivo do sistema é avaliar se um ou mais projetos de investimento tendem a gerar valor financeiro.

Para isso, a aplicação calcula indicadores como:

- Valor Presente Líquido (VPL)
- Taxa Interna de Retorno (TIR)
- Payback descontado
- VPL Anual Equivalente
- Cenários de risco

A aplicação não substitui a decisão gerencial. Ela apresenta uma sugestão baseada nos indicadores calculados para auxiliar a comparação entre alternativas.

## Como usar o sistema

### Fluxo recomendado

O uso básico do sistema segue as etapas abaixo.

#### 1. Cadastrar um projeto

Informe:

- Nome do projeto
- Investimento inicial
- Taxa mínima de atratividade
- Fluxos de caixa previstos

Clique em **Salvar projeto**.

#### 2. Cadastrar outras alternativas

Caso deseje comparar mais de um projeto, repita o processo para cada alternativa.

#### 3. Analisar os resultados

Após salvar um projeto, o sistema calcula automaticamente:

- VPL
- TIR
- Margem da TIR
- Payback descontado
- VPL Anual Equivalente

Também são exibidos:

- Ranking dos projetos
- Gráficos comparativos
- Cenários de risco
- Análise de sensibilidade

#### 4. Consultar a recomendação final

A aplicação apresenta uma conclusão baseada principalmente no VPL e nos demais indicadores calculados.

#### 5. Gerar o relatório HTML

O relatório consolida os principais indicadores, gráficos e recomendações produzidos pela análise.

## Fluxo de utilização

```text
Cadastro do projeto
        ↓
Salvar projeto
        ↓
Análise automática
        ↓
Comparação dos projetos
        ↓
Recomendação final
        ↓
Relatório HTML
```

## Uso avançado

Além do cadastro tradicional, o Investe+ oferece ferramentas para análises mais próximas de situações reais.

> Importante:
>
> Apenas os seguintes campos são obrigatórios:
>
> - Nome do projeto
> - Investimento inicial
> - Taxa mínima de atratividade
> - Fluxos de caixa previstos
>
> Todas as demais ferramentas são opcionais.

### Dados econômicos reais

Permite consultar indicadores do Banco Central do Brasil.

- Selic
- IPCA
- Prêmio de risco
- Taxa mínima sugerida

Fluxo de utilização:

```text
Carregar API
      ↓
Definir prêmio de risco
      ↓
Gerar taxa sugerida
      ↓
Aplicar ao projeto
```

A taxa sugerida pode seguir uma das abordagens:

```text
Taxa mínima sugerida = Selic + prêmio de risco
```

ou

```text
Taxa mínima sugerida = taxa base manual + prêmio de risco
```

### Projetar fluxos

Utilize esta ferramenta quando ainda não possuir os fluxos de caixa do projeto.

Informe:

- Receita inicial
- Crescimento esperado
- Custos
- Impostos
- Capital de giro

O sistema gera automaticamente os fluxos previstos.

### Calcular WACC

Permite estimar a taxa mínima de atratividade utilizando:

- Estrutura de dívida
- Custo da dívida
- Custo do capital próprio
- Impostos

O resultado pode ser aplicado diretamente ao formulário ou a um projeto já cadastrado.

### Análise de sensibilidade

Mostra como o VPL varia quando ocorrem alterações em:

- Taxa de desconto
- Fluxos de caixa
- Investimento inicial

### Comparação entre previsto e realizado

Permite comparar os fluxos previstos inicialmente com os resultados efetivamente obtidos após a execução do projeto.

## Exemplo rápido

A forma mais rápida de testar o sistema é:

1. Abrir a aplicação.
2. Clicar em **Restaurar exemplos**.
3. Observar os projetos carregados.
4. Consultar o ranking.
5. Analisar a recomendação final.
6. Gerar o relatório HTML.

## Funcionalidades

- Cadastro de um ou mais projetos de investimento.
- Entrada do investimento inicial, taxa mínima de atratividade e fluxos de caixa previstos.
- Aceitação de fluxos separados por ponto e vírgula ou informados um por linha.
- Projeção automática de fluxos.
- Cálculo de valor presente.
- Cálculo de VPL, TIR, margem da TIR e payback descontado.
- Cálculo do VPL anual equivalente.
- Cálculo opcional de WACC.
- Consulta opcional de dados econômicos reais.
- Ranking dos projetos por VPL.
- Análise de risco por cenários.
- Análise de sensibilidade.
- Curva VPL x taxa.
- Gráficos comparativos.
- Comparação entre previsto e realizado.
- Relatório HTML para download.
- Restauração dos exemplos da demonstração.

## Conceitos financeiros utilizados

- Valor Presente
- Valor Presente Líquido (VPL)
- Taxa Interna de Retorno (TIR)
- Taxa Mínima de Atratividade (TMA)
- WACC
- Payback descontado
- VPL Anual Equivalente
- Risco por cenários
- Dados econômicos reais
- Análise de sensibilidade
- Derivada aproximada do VPL
- Comparação entre previsto e realizado

## Regras de interpretação

- VPL positivo indica tendência de geração de valor.
- VPL negativo indica tendência de destruição de valor.
- Entre projetos concorrentes, maior VPL indica maior geração total de valor.
- Quando os projetos possuem prazos diferentes, o VPL anual equivalente auxilia na comparação.
- A TIR deve ser comparada com a taxa mínima de atratividade.
- O payback descontado mostra em quanto tempo o investimento é recuperado em valor presente.
- A análise por cenários demonstra a sensibilidade do projeto a variações nos fluxos.

## Como executar a versão web

### Acesso online (recomendado)

https://victorsrh.github.io/InvesteMais/

Não é necessário instalar ou configurar nenhum software.

### Execução local

Abra:

```text
index.html
```

ou execute:

```bash
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

## Como executar a versão Python

```bash
python administracao_financeira_app.py
```

## Formato dos fluxos de caixa

Separados por ponto e vírgula:

```text
10000; 12000; 15000
```

Com centavos:

```text
29970,97; 30225,28; 30243,71
```

Um valor por linha:

```text
10000
12000
15000
```

## Saídas geradas

### Versão web

- Cards de indicadores
- Ranking dos projetos
- Gráficos de VPL
- Gráficos de fluxos
- Cenários de risco
- Comparação previsto × realizado
- Relatório HTML

### Versão Python

- relatorio_financeiro.txt
- comparacao_projetos.csv
- relatorio_graficos.html

## Estrutura dos arquivos

- index.html
- styles.css
- app.js
- administracao_financeira_app.py
- README.md

## Exemplos de teste

### Loja Online da Chocolateria

- Investimento inicial: 120000
- Taxa mínima: 12%
- Fluxos: 28000; 34000; 41000; 48000; 56000; 64000

### Máquina de Embalagem

- Investimento inicial: 180000
- Taxa mínima: 12%
- Fluxos: 42000; 47000; 52000; 57000; 62000; 67000; 72000

### Unidade de Delivery

- Investimento inicial: 95000
- Taxa mínima: 12%
- Fluxos: 22000; 26000; 30000; 34000; 38000
