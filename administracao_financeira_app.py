"""
Investe+ - Sistema de Apoio a Decisao em Orcamento de Capital

Temas escolhidos:
    - Valor do dinheiro no tempo
    - Regras de decisao de investimento
    - NPV/VPL, TIR e payback descontado
    - Risco e retorno por analise de cenarios

Objetivo da aplicacao:
    Capturar dados de varios projetos de investimento, calcular indicadores
    financeiros, comparar os projetos, simular cenarios de risco e gerar
    relatorios com tabelas e graficos. A aplicacao apoia a decisao de aceitar
    ou rejeitar projetos de orcamento de capital, usando apenas a biblioteca
    padrao do Python para facilitar a execucao pelo docente.
"""

from datetime import datetime
import html
import os
import tempfile


# Captura um texto digitado pelo usuario e impede valor em branco.
def ler_texto(mensagem):
    while True:
        valor = input(mensagem).strip()
        if valor:
            return valor
        print("Entrada invalida. Digite um texto nao vazio.")


# Captura um numero decimal, aceitando virgula ou ponto.
def ler_float(mensagem):
    while True:
        try:
            texto = input(mensagem).strip().replace(",", ".")
            return float(texto)
        except ValueError:
            print("Entrada invalida. Digite um numero. Exemplo: 1250.50")


# Captura um numero inteiro positivo para representar quantidades.
def ler_inteiro_positivo(mensagem):
    while True:
        try:
            valor = int(input(mensagem).strip())
            if valor > 0:
                return valor
            print("Digite um numero maior que zero.")
        except ValueError:
            print("Entrada invalida. Digite um numero inteiro.")


# Calcula o valor presente de um fluxo futuro.
#
# Formula:
#     VP = VF / (1 + i) ** n
#
# Onde:
#     VP = valor presente
#     VF = valor futuro
#     i  = taxa de desconto por periodo
#     n  = numero do periodo
def calcular_valor_presente(valor_futuro, taxa, periodo):
    return valor_futuro / ((1 + taxa) ** periodo)


# Calcula o valor futuro de um valor atual.
#
# Formula:
#     VF = VP * (1 + i) ** n
def calcular_valor_futuro(valor_presente, taxa, periodo):
    return valor_presente * ((1 + taxa) ** periodo)


# Calcula o Valor Presente Liquido (VPL ou NPV).
#
# Formula:
#     VPL = -Investimento Inicial + soma(FCt / (1 + i) ** t)
#
# Interpretacao:
#     VPL > 0: projeto tende a gerar valor acima da taxa exigida.
#     VPL = 0: projeto remunera exatamente a taxa exigida.
#     VPL < 0: projeto tende a destruir valor frente a taxa exigida.
def calcular_vpl(investimento_inicial, fluxos, taxa):
    vpl = -investimento_inicial
    for periodo, fluxo in enumerate(fluxos, start=1):
        vpl += calcular_valor_presente(fluxo, taxa, periodo)
    return vpl


# Calcula o VPL anual equivalente.
#
# Esse indicador transforma o VPL total em um valor periodico equivalente.
# Ele ajuda a comparar projetos com horizontes diferentes, por exemplo um
# projeto de 10 periodos contra outro de 15 periodos.
def calcular_vpl_anual_equivalente(vpl, taxa, periodos):
    if periodos <= 0:
        return 0
    if taxa == 0:
        return vpl / periodos
    return vpl * (taxa / (1 - (1 + taxa) ** -periodos))


# Calcula o payback descontado.
#
# O payback descontado mede em qual periodo o investimento inicial e
# recuperado, considerando o valor do dinheiro no tempo. Diferente do
# payback simples, cada fluxo de caixa e trazido a valor presente.
def calcular_payback_descontado(investimento_inicial, fluxos, taxa):
    acumulado = -investimento_inicial

    for periodo, fluxo in enumerate(fluxos, start=1):
        fluxo_descontado = calcular_valor_presente(fluxo, taxa, periodo)
        saldo_anterior = acumulado
        acumulado += fluxo_descontado

        if acumulado >= 0:
            falta_no_inicio = abs(saldo_anterior)
            fracao_periodo = falta_no_inicio / fluxo_descontado
            return periodo - 1 + fracao_periodo

    return None


# Estima a Taxa Interna de Retorno (TIR) por busca binaria.
#
# A TIR e a taxa que faz o VPL ser aproximadamente zero. Aqui usamos busca
# binaria porque evita dependencias externas e deixa o codigo facil de
# executar em qualquer instalacao padrao do Python.
def calcular_tir(investimento_inicial, fluxos):
    taxa_minima = -0.99
    taxa_maxima = 10.0
    tolerancia = 0.000001
    max_iteracoes = 200

    vpl_minimo = calcular_vpl(investimento_inicial, fluxos, taxa_minima)
    vpl_maximo = calcular_vpl(investimento_inicial, fluxos, taxa_maxima)

    if vpl_minimo * vpl_maximo > 0:
        return None

    for _ in range(max_iteracoes):
        taxa_media = (taxa_minima + taxa_maxima) / 2
        vpl_medio = calcular_vpl(investimento_inicial, fluxos, taxa_media)

        if abs(vpl_medio) < tolerancia:
            return taxa_media

        if vpl_minimo * vpl_medio < 0:
            taxa_maxima = taxa_media
            vpl_maximo = vpl_medio
        else:
            taxa_minima = taxa_media
            vpl_minimo = vpl_medio

    return (taxa_minima + taxa_maxima) / 2


# Formata valores monetarios no padrao brasileiro.
def formatar_moeda(valor):
    return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


# Converte taxa decimal em percentual com duas casas decimais.
def formatar_percentual(taxa):
    return f"{taxa * 100:.2f}%".replace(".", ",")


# Formata a diferenca entre TIR e taxa minima de atratividade.
def formatar_margem_tir(margem):
    if margem is None:
        return "Nao calculada"
    return f"{margem * 100:.2f} ponto(s) percentual(is)".replace(".", ",")


# Formata o payback descontado para exibicao.
def formatar_payback(payback):
    if payback is None:
        return "Nao recupera no horizonte analisado"
    return f"{payback:.2f} periodo(s)".replace(".", ",")


# Retorna os conceitos financeiros utilizados pela aplicacao.
def montar_fundamentacao_financeira():
    return [
        "Valor presente: traz fluxos futuros para o valor de hoje usando uma taxa de desconto.",
        "VPL/NPV: soma dos fluxos de caixa em valor presente menos o investimento inicial.",
        "TIR/IRR: taxa que faz o VPL ser aproximadamente zero.",
        "Payback descontado: prazo de recuperacao do investimento considerando o valor do dinheiro no tempo.",
        "Orcamento de capital: processo de analisar oportunidades de investimento e decidir quais projetos aceitar.",
        "Risco por cenarios: comparacao do VPL em situacoes pessimista, provavel e otimista.",
    ]


# Monta linhas detalhadas dos fluxos para exibicao e relatorio.
def montar_linhas_fluxos(fluxos, taxa):
    linhas = []
    acumulado_presente = 0

    for periodo, fluxo in enumerate(fluxos, start=1):
        valor_presente = calcular_valor_presente(fluxo, taxa, periodo)
        valor_futuro = calcular_valor_futuro(fluxo, taxa, periodo)
        acumulado_presente += valor_presente
        linhas.append(
            {
                "periodo": periodo,
                "fluxo": fluxo,
                "valor_presente": valor_presente,
                "valor_futuro": valor_futuro,
                "acumulado_presente": acumulado_presente,
            }
        )

    return linhas


# Salva um arquivo em um dos caminhos disponiveis.
#
# A funcao tenta gravar no diretorio atual e, se houver erro de escrita,
# tenta gravar no diretorio temporario do sistema.
def salvar_arquivo_com_fallback(nome_arquivo, conteudo):
    caminhos_possiveis = [
        os.path.join(os.getcwd(), nome_arquivo),
        os.path.join(tempfile.gettempdir(), nome_arquivo),
    ]

    ultimo_erro = None
    for caminho in caminhos_possiveis:
        try:
            with open(caminho, "w", encoding="utf-8") as arquivo:
                arquivo.write(conteudo)
            return caminho
        except OSError as erro:
            ultimo_erro = erro

    print(f"\nAviso: nao foi possivel salvar {nome_arquivo}. Erro: {ultimo_erro}")
    return None


# Realiza a captura de dados de um projeto.
def capturar_dados_do_projeto(numero_projeto):
    print(f"\n=== Projeto {numero_projeto} ===")
    nome_projeto = ler_texto("Nome do projeto analisado: ")
    investimento_inicial = ler_float("Investimento inicial do projeto (R$): ")
    taxa_percentual = ler_float("Taxa minima de atratividade por periodo (%): ")
    quantidade_periodos = ler_inteiro_positivo("Quantidade de periodos analisados: ")

    fluxos = []
    print("\nDigite os fluxos de caixa esperados para cada periodo.")
    for periodo in range(1, quantidade_periodos + 1):
        fluxo = ler_float(f"Fluxo de caixa do periodo {periodo} (R$): ")
        fluxos.append(fluxo)

    return {
        "nome_projeto": nome_projeto,
        "investimento_inicial": investimento_inicial,
        "taxa": taxa_percentual / 100,
        "fluxos": fluxos,
    }


# Captura varios projetos para comparacao.
def capturar_projetos():
    print("\n=== Investe+ ===")
    print("Sistema de Apoio a Decisao em Orcamento de Capital")
    print("Tema: Orcamento de capital, valor do dinheiro no tempo, risco e retorno\n")
    quantidade = ler_inteiro_positivo("Quantos projetos deseja comparar? ")

    projetos = []
    for numero in range(1, quantidade + 1):
        projetos.append(capturar_dados_do_projeto(numero))

    return projetos


# Calcula cenarios de risco alterando os fluxos de caixa esperados.
#
# Cenario pessimista: fluxos 20% menores.
# Cenario provavel: fluxos informados pelo usuario.
# Cenario otimista: fluxos 20% maiores.
#
# Essa abordagem mostra a sensibilidade do VPL quando a expectativa de
# entrada de caixa muda, ligando a aplicacao ao tema de risco e retorno.
def calcular_cenarios_risco(dados):
    cenarios = [
        ("Pessimista", 0.80),
        ("Provavel", 1.00),
        ("Otimista", 1.20),
    ]
    resultado = []

    for nome, fator in cenarios:
        fluxos_cenario = [fluxo * fator for fluxo in dados["fluxos"]]
        vpl = calcular_vpl(dados["investimento_inicial"], fluxos_cenario, dados["taxa"])
        resultado.append({"cenario": nome, "fator": fator, "vpl": vpl})

    return resultado


# Gera conclusao automatica da analise de risco.
#
# A conclusao observa se o VPL continua positivo no cenario pessimista, se
# fica positivo apenas no provavel/otimista, ou se permanece negativo.
def interpretar_risco(cenarios):
    vpl_pessimista = cenarios[0]["vpl"]
    vpl_provavel = cenarios[1]["vpl"]
    vpl_otimista = cenarios[2]["vpl"]

    if vpl_pessimista > 0:
        return (
            "O projeto apresenta maior margem de seguranca, pois o VPL permanece "
            "positivo mesmo no cenario pessimista."
        )
    if vpl_provavel > 0 and vpl_pessimista <= 0:
        return (
            "O projeto e sensivel ao risco: ele cria valor no cenario provavel, "
            "mas pode destruir valor se os fluxos forem 20% menores."
        )
    if vpl_otimista > 0 and vpl_provavel <= 0:
        return (
            "O projeto e mais arriscado, pois depende do cenario otimista para "
            "apresentar VPL positivo."
        )
    return (
        "O projeto apresenta risco elevado, pois o VPL permanece negativo mesmo "
        "no cenario otimista."
    )


# Calcula os indicadores, cenarios de risco e interpretacao financeira.
def analisar_projeto(dados):
    investimento_inicial = dados["investimento_inicial"]
    fluxos = dados["fluxos"]
    taxa = dados["taxa"]

    vpl = calcular_vpl(investimento_inicial, fluxos, taxa)
    vpl_anual_equivalente = calcular_vpl_anual_equivalente(vpl, taxa, len(fluxos))
    tir = calcular_tir(investimento_inicial, fluxos)
    payback = calcular_payback_descontado(investimento_inicial, fluxos, taxa)
    linhas_fluxos = montar_linhas_fluxos(fluxos, taxa)
    cenarios = calcular_cenarios_risco(dados)
    margem_tir = None if tir is None else tir - taxa
    conclusao_risco = interpretar_risco(cenarios)

    if vpl > 0:
        decisao = "Aceitar o projeto"
        interpretacao = (
            "O VPL positivo indica que o projeto gera valor acima da taxa minima "
            "de atratividade informada."
        )
    elif vpl < 0:
        decisao = "Rejeitar o projeto"
        interpretacao = (
            "O VPL negativo indica que o projeto nao recupera o investimento "
            "com a remuneracao exigida."
        )
    else:
        decisao = "Indiferente"
        interpretacao = (
            "O VPL igual a zero indica que o projeto remunera exatamente a taxa "
            "minima de atratividade."
        )

    tir_formatada = "Nao encontrada para os fluxos informados"
    if tir is not None:
        tir_formatada = formatar_percentual(tir)

    return {
        "dados": dados,
        "vpl": vpl,
        "vpl_anual_equivalente": vpl_anual_equivalente,
        "tir": tir,
        "tir_formatada": tir_formatada,
        "margem_tir": margem_tir,
        "margem_tir_formatada": formatar_margem_tir(margem_tir),
        "payback": payback,
        "payback_formatado": formatar_payback(payback),
        "decisao": decisao,
        "interpretacao": interpretacao,
        "linhas_fluxos": linhas_fluxos,
        "cenarios": cenarios,
        "conclusao_risco": conclusao_risco,
    }


# Ordena os projetos por VPL.
#
# O VPL e usado como criterio principal porque mede a geracao de valor em
# moeda atual, ja considerando a taxa minima de atratividade.
def comparar_projetos(analises):
    return sorted(analises, key=lambda analise: analise["vpl"], reverse=True)


# Verifica se os projetos possuem quantidades diferentes de periodos.
def projetos_tem_horizontes_diferentes(analises):
    periodos = {len(analise["dados"]["fluxos"]) for analise in analises}
    return len(periodos) > 1


# Monta aviso sobre comparacao de projetos com horizontes diferentes.
def montar_aviso_horizontes(analises):
    periodos = sorted({len(analise["dados"]["fluxos"]) for analise in analises})
    if len(periodos) <= 1:
        return ""
    periodos_texto = ", ".join(str(periodo) for periodo in periodos)
    return (
        f"Os projetos possuem horizontes diferentes ({periodos_texto} periodos). "
        "Nesses casos, comparar apenas o VPL total pode favorecer projetos mais longos. "
        "Por isso, o relatorio tambem apresenta o VPL anual equivalente."
    )


# Gera um relatorio textual com comparacao, indicadores e risco.
def gerar_relatorio_txt(analises, ranking):
    conteudo = []
    conteudo.append("INVESTE+")
    conteudo.append("Sistema de Apoio a Decisao em Orcamento de Capital")
    conteudo.append("RELATORIO DE ORCAMENTO DE CAPITAL")
    conteudo.append("Tema: Decisao de investimento com VPL, TIR, payback descontado e risco")
    conteudo.append(f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    conteudo.append("\nFUNDAMENTACAO FINANCEIRA")
    for conceito in montar_fundamentacao_financeira():
        conteudo.append(f"- {conceito}")
    conteudo.append("\nREGRAS DE DECISAO")
    conteudo.append("- Aceitar projetos com VPL positivo.")
    conteudo.append("- Rejeitar projetos com VPL negativo.")
    conteudo.append("- Em projetos concorrentes, priorizar o maior VPL.")
    conteudo.append("- Comparar a TIR com a taxa minima de atratividade.")
    aviso_horizontes = montar_aviso_horizontes(analises)
    if aviso_horizontes:
        conteudo.append(f"\nAVISO SOBRE HORIZONTES DIFERENTES\n{aviso_horizontes}")

    conteudo.append("\nRANKING POR VPL")
    for posicao, analise in enumerate(ranking, start=1):
        dados = analise["dados"]
        conteudo.append(
            f"{posicao}. {dados['nome_projeto']} | "
            f"VPL: {formatar_moeda(analise['vpl'])} | "
            f"VPL anual equivalente: {formatar_moeda(analise['vpl_anual_equivalente'])} | "
            f"TIR: {analise['tir_formatada']} | "
            f"Payback: {analise['payback_formatado']} | "
            f"Decisao: {analise['decisao']}"
        )

    for analise in analises:
        dados = analise["dados"]
        conteudo.append(f"\nPROJETO: {dados['nome_projeto']}")
        conteudo.append(f"Investimento inicial: {formatar_moeda(dados['investimento_inicial'])}")
        conteudo.append(f"Taxa minima de atratividade: {formatar_percentual(dados['taxa'])}")
        conteudo.append(f"VPL: {formatar_moeda(analise['vpl'])}")
        conteudo.append(f"VPL anual equivalente: {formatar_moeda(analise['vpl_anual_equivalente'])}")
        conteudo.append(f"TIR: {analise['tir_formatada']}")
        conteudo.append(f"Margem de seguranca da TIR: {analise['margem_tir_formatada']}")
        conteudo.append(f"Payback descontado: {analise['payback_formatado']}")
        conteudo.append(f"Decisao sugerida: {analise['decisao']}")
        conteudo.append(f"Interpretacao: {analise['interpretacao']}")

        conteudo.append("\nFluxos de caixa")
        conteudo.append("Periodo; Fluxo; Valor Presente; Valor Futuro; Acumulado em VP")
        for linha in analise["linhas_fluxos"]:
            conteudo.append(
                f"{linha['periodo']}; "
                f"{formatar_moeda(linha['fluxo'])}; "
                f"{formatar_moeda(linha['valor_presente'])}; "
                f"{formatar_moeda(linha['valor_futuro'])}; "
                f"{formatar_moeda(linha['acumulado_presente'])}"
            )

        conteudo.append("\nAnalise de risco por cenarios")
        for cenario in analise["cenarios"]:
            conteudo.append(f"{cenario['cenario']}: VPL {formatar_moeda(cenario['vpl'])}")
        conteudo.append(f"Conclusao de risco: {analise['conclusao_risco']}")

    return salvar_arquivo_com_fallback("relatorio_financeiro.txt", "\n".join(conteudo))


# Gera CSV consolidado com indicadores e cenarios de risco.
def gerar_relatorio_csv(analises):
    conteudo = [
        "projeto;taxa;investimento_inicial;periodos;vpl;vpl_anual_equivalente;tir;margem_tir;payback;decisao;cenario;vpl_cenario;conclusao_risco"
    ]

    for analise in analises:
        dados = analise["dados"]
        tir = "" if analise["tir"] is None else f"{analise['tir']:.6f}"
        margem_tir = "" if analise["margem_tir"] is None else f"{analise['margem_tir']:.6f}"
        payback = "" if analise["payback"] is None else f"{analise['payback']:.2f}"
        for cenario in analise["cenarios"]:
            conteudo.append(
                f"{dados['nome_projeto']};"
                f"{dados['taxa']:.6f};"
                f"{dados['investimento_inicial']:.2f};"
                f"{len(dados['fluxos'])};"
                f"{analise['vpl']:.2f};"
                f"{analise['vpl_anual_equivalente']:.2f};"
                f"{tir};"
                f"{margem_tir};"
                f"{payback};"
                f"{analise['decisao']};"
                f"{cenario['cenario']};"
                f"{cenario['vpl']:.2f};"
                f"{analise['conclusao_risco']}"
            )

    return salvar_arquivo_com_fallback("comparacao_projetos.csv", "\n".join(conteudo))


# Prepara escala para graficos com valores positivos e negativos.
def calcular_escala_grafico(valores, altura):
    menor = min(valores + [0])
    maior = max(valores + [0])
    intervalo = maior - menor
    if intervalo == 0:
        intervalo = 1

    def converter_y(valor):
        margem = 20
        area = altura - 2 * margem
        return margem + ((maior - valor) / intervalo) * area

    return converter_y


# Gera um grafico SVG de barras comparando VPL dos projetos.
def gerar_grafico_barras_vpl(ranking):
    largura = 760
    altura = 320
    valores = [analise["vpl"] for analise in ranking]
    converter_y = calcular_escala_grafico(valores, altura)
    y_zero = converter_y(0)
    largura_barra = max(32, int(520 / max(1, len(ranking))))
    espacamento = 28

    partes = [
        f'<svg viewBox="0 0 {largura} {altura}" role="img" aria-label="Grafico de VPL por projeto">',
        f'<line x1="40" y1="{y_zero:.2f}" x2="730" y2="{y_zero:.2f}" stroke="#555" stroke-width="1"/>',
    ]

    for indice, analise in enumerate(ranking):
        x = 70 + indice * (largura_barra + espacamento)
        y_valor = converter_y(analise["vpl"])
        y = min(y_valor, y_zero)
        altura_barra = abs(y_zero - y_valor)
        cor = "#2e7d32" if analise["vpl"] >= 0 else "#c62828"
        nome = html.escape(analise["dados"]["nome_projeto"][:14])
        partes.append(
            f'<rect x="{x}" y="{y:.2f}" width="{largura_barra}" height="{altura_barra:.2f}" fill="{cor}"/>'
        )
        partes.append(
            f'<text x="{x + largura_barra / 2}" y="{y - 6:.2f}" text-anchor="middle" font-size="12">'
            f'{html.escape(formatar_moeda(analise["vpl"]))}</text>'
        )
        partes.append(
            f'<text x="{x + largura_barra / 2}" y="300" text-anchor="middle" font-size="12">{nome}</text>'
        )

    partes.append("</svg>")
    return "\n".join(partes)


# Gera um grafico SVG de linha para os VPLs dos cenarios de risco.
def gerar_grafico_cenarios(analise):
    largura = 500
    altura = 260
    cenarios = analise["cenarios"]
    valores = [cenario["vpl"] for cenario in cenarios]
    converter_y = calcular_escala_grafico(valores, altura)
    pontos = []
    partes = [
        f'<svg viewBox="0 0 {largura} {altura}" role="img" aria-label="Grafico de cenarios">',
        f'<line x1="45" y1="{converter_y(0):.2f}" x2="470" y2="{converter_y(0):.2f}" stroke="#777" stroke-width="1"/>',
    ]

    for indice, cenario in enumerate(cenarios):
        x = 80 + indice * 170
        y = converter_y(cenario["vpl"])
        pontos.append(f"{x},{y:.2f}")
        partes.append(f'<circle cx="{x}" cy="{y:.2f}" r="5" fill="#1565c0"/>')
        partes.append(
            f'<text x="{x}" y="{y - 10:.2f}" text-anchor="middle" font-size="11">'
            f'{html.escape(formatar_moeda(cenario["vpl"]))}</text>'
        )
        partes.append(
            f'<text x="{x}" y="240" text-anchor="middle" font-size="12">'
            f'{html.escape(cenario["cenario"])}</text>'
        )

    partes.insert(2, f'<polyline points="{" ".join(pontos)}" fill="none" stroke="#1565c0" stroke-width="2"/>')
    partes.append("</svg>")
    return "\n".join(partes)


# Gera um grafico SVG de barras com os fluxos de caixa por periodo.
def gerar_grafico_fluxos_caixa(analise):
    linhas = analise["linhas_fluxos"]
    largura = max(640, len(linhas) * 54 + 90)
    altura = 280
    valores = [linha["fluxo"] for linha in linhas]
    converter_y = calcular_escala_grafico(valores, altura)
    y_zero = converter_y(0)
    largura_slot = (largura - 90) / max(1, len(linhas))
    largura_barra = max(14, min(44, largura_slot * 0.62))
    mostrar_rotulos = len(linhas) <= 6

    partes = [
        f'<svg viewBox="0 0 {largura} {altura}" role="img" aria-label="Grafico de fluxos de caixa">',
        f'<line x1="40" y1="{y_zero:.2f}" x2="{largura - 25}" y2="{y_zero:.2f}" stroke="#777" stroke-width="1"/>',
    ]

    for indice, linha in enumerate(linhas):
        x = 50 + indice * largura_slot + (largura_slot - largura_barra) / 2
        y_valor = converter_y(linha["fluxo"])
        y = min(y_valor, y_zero)
        altura_barra = abs(y_zero - y_valor)
        cor = "#2e7d32" if linha["fluxo"] >= 0 else "#c62828"
        partes.append(
            f'<rect x="{x:.2f}" y="{y:.2f}" width="{largura_barra:.2f}" height="{altura_barra:.2f}" fill="{cor}">'
            f'<title>P{linha["periodo"]}: {html.escape(formatar_moeda(linha["fluxo"]))}</title>'
            f'</rect>'
        )
        if mostrar_rotulos:
            partes.append(
                f'<text x="{x + largura_barra / 2:.2f}" y="{y - 6:.2f}" text-anchor="middle" font-size="11">'
                f'{html.escape(formatar_moeda(linha["fluxo"]))}</text>'
            )
        partes.append(
            f'<text x="{x + largura_barra / 2:.2f}" y="260" text-anchor="middle" font-size="12">P{linha["periodo"]}</text>'
        )

    partes.append("</svg>")
    return "\n".join(partes)


# Gera um relatorio HTML com tabelas e graficos em SVG.
def gerar_relatorio_html(analises, ranking):
    linhas_ranking = []
    for posicao, analise in enumerate(ranking, start=1):
        dados = analise["dados"]
        linhas_ranking.append(
            "<tr>"
            f"<td>{posicao}</td>"
            f"<td>{html.escape(dados['nome_projeto'])}</td>"
            f"<td>{formatar_moeda(analise['vpl'])}</td>"
            f"<td>{formatar_moeda(analise['vpl_anual_equivalente'])}</td>"
            f"<td>{analise['tir_formatada']}</td>"
            f"<td>{analise['margem_tir_formatada']}</td>"
            f"<td>{analise['payback_formatado']}</td>"
            f"<td>{analise['decisao']}</td>"
            "</tr>"
        )

    secoes_projetos = []
    for analise in analises:
        dados = analise["dados"]
        linhas_fluxo = []
        for linha in analise["linhas_fluxos"]:
            linhas_fluxo.append(
                "<tr>"
                f"<td>{linha['periodo']}</td>"
                f"<td>{formatar_moeda(linha['fluxo'])}</td>"
                f"<td>{formatar_moeda(linha['valor_presente'])}</td>"
                f"<td>{formatar_moeda(linha['valor_futuro'])}</td>"
                f"<td>{formatar_moeda(linha['acumulado_presente'])}</td>"
                "</tr>"
            )

        linhas_cenarios = []
        for cenario in analise["cenarios"]:
            linhas_cenarios.append(
                "<tr>"
                f"<td>{cenario['cenario']}</td>"
                f"<td>{int(cenario['fator'] * 100)}%</td>"
                f"<td>{formatar_moeda(cenario['vpl'])}</td>"
                "</tr>"
            )

        secoes_projetos.append(
            f"""
            <section>
                <h2>{html.escape(dados['nome_projeto'])}</h2>
                <p><strong>Investimento inicial:</strong> {formatar_moeda(dados['investimento_inicial'])}</p>
                <p><strong>Taxa minima:</strong> {formatar_percentual(dados['taxa'])}</p>
                <p><strong>Quantidade de periodos:</strong> {len(dados['fluxos'])}</p>
                <p><strong>VPL anual equivalente:</strong> {formatar_moeda(analise['vpl_anual_equivalente'])}</p>
                <p><strong>Margem de seguranca da TIR:</strong> {analise['margem_tir_formatada']}</p>
                <p><strong>Decisao sugerida:</strong> {analise['decisao']}</p>
                <p>{html.escape(analise['interpretacao'])}</p>

                <h3>Fluxos de caixa</h3>
                {gerar_grafico_fluxos_caixa(analise)}
                <table>
                    <thead>
                        <tr>
                            <th>Periodo</th>
                            <th>Fluxo</th>
                            <th>Valor presente</th>
                            <th>Valor futuro</th>
                            <th>Acumulado em VP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {''.join(linhas_fluxo)}
                    </tbody>
                </table>

                <h3>Analise de risco por cenarios</h3>
                {gerar_grafico_cenarios(analise)}
                <p><strong>Conclusao de risco:</strong> {html.escape(analise['conclusao_risco'])}</p>
                <table>
                    <thead>
                        <tr><th>Cenario</th><th>Fluxo considerado</th><th>VPL</th></tr>
                    </thead>
                    <tbody>
                        {''.join(linhas_cenarios)}
                    </tbody>
                </table>
            </section>
            """
        )

    conteudo = f"""
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Investe+ - Relatorio Financeiro</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            margin: 32px;
            color: #222;
            background: #f6f7f9;
        }}
        h1, h2, h3 {{
            color: #12355b;
        }}
        section {{
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin: 18px 0;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }}
        th {{
            background: #e9eef5;
        }}
        svg {{
            width: 100%;
            max-width: 780px;
            display: block;
            margin: 12px 0;
            background: #fff;
        }}
    </style>
</head>
<body>
    <h1>Investe+</h1>
    <h2>Sistema de Apoio a Decisao em Orcamento de Capital</h2>
    <h2>Relatorio de Orcamento de Capital</h2>
    <p>Gerado em {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</p>

    <section>
        <h2>Fundamentacao financeira</h2>
        <ul>
            {''.join(f'<li>{html.escape(conceito)}</li>' for conceito in montar_fundamentacao_financeira())}
        </ul>
        <h3>Regras de decisao</h3>
        <ul>
            <li>Aceitar projetos com VPL positivo.</li>
            <li>Rejeitar projetos com VPL negativo.</li>
            <li>Em projetos concorrentes, priorizar o maior VPL.</li>
            <li>Comparar a TIR com a taxa minima de atratividade.</li>
        </ul>
    </section>

    {f'<section><h2>Aviso sobre horizontes diferentes</h2><p>{html.escape(montar_aviso_horizontes(analises))}</p></section>' if projetos_tem_horizontes_diferentes(analises) else ''}

    <section>
        <h2>Ranking por VPL</h2>
        {gerar_grafico_barras_vpl(ranking)}
        <table>
            <thead>
                <tr>
                    <th>Posicao</th>
                    <th>Projeto</th>
                    <th>VPL</th>
                    <th>VPL anual equivalente</th>
                    <th>TIR</th>
                    <th>Margem da TIR</th>
                    <th>Payback</th>
                    <th>Decisao</th>
                </tr>
            </thead>
            <tbody>
                {''.join(linhas_ranking)}
            </tbody>
        </table>
    </section>

    {''.join(secoes_projetos)}
</body>
</html>
"""
    return salvar_arquivo_com_fallback("relatorio_graficos.html", conteudo)


# Mostra no console um resumo dos resultados calculados.
def exibir_resultado(analises, ranking, caminhos_relatorios):
    print("\n=== Comparacao dos Projetos ===")
    for posicao, analise in enumerate(ranking, start=1):
        dados = analise["dados"]
        print(
            f"{posicao}. {dados['nome_projeto']} | "
            f"VPL: {formatar_moeda(analise['vpl'])} | "
            f"VPL anual equivalente: {formatar_moeda(analise['vpl_anual_equivalente'])} | "
            f"TIR: {analise['tir_formatada']} | "
            f"Margem TIR: {analise['margem_tir_formatada']} | "
            f"Payback: {analise['payback_formatado']} | "
            f"{analise['decisao']}"
        )

    aviso_horizontes = montar_aviso_horizontes(analises)
    if aviso_horizontes:
        print(f"\nAviso: {aviso_horizontes}")

    print("\n=== Analise de Risco por Cenarios ===")
    for analise in analises:
        print(f"\nProjeto: {analise['dados']['nome_projeto']}")
        for cenario in analise["cenarios"]:
            print(f"- {cenario['cenario']}: VPL {formatar_moeda(cenario['vpl'])}")
        print(f"Conclusao: {analise['conclusao_risco']}")

    print("\nRelatorios gerados:")
    algum_relatorio = False
    for caminho in caminhos_relatorios:
        if caminho:
            print(f"- {caminho}")
            algum_relatorio = True
    if not algum_relatorio:
        print("Nenhum relatorio pode ser salvo, mas os resultados foram exibidos no console.")


# Funcao principal que organiza a captura, os calculos e os relatorios.
def main():
    projetos = capturar_projetos()
    analises = [analisar_projeto(projeto) for projeto in projetos]
    ranking = comparar_projetos(analises)

    caminho_txt = gerar_relatorio_txt(analises, ranking)
    caminho_csv = gerar_relatorio_csv(analises)
    caminho_html = gerar_relatorio_html(analises, ranking)

    exibir_resultado(analises, ranking, [caminho_txt, caminho_csv, caminho_html])


if __name__ == "__main__":
    main()
