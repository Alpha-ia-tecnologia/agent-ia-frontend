/**
 * Nome técnico da ferramenta (ex.: "mcp_aao_1a2b_buscar_conhecimento") → o
 * que a pessoa vê enquanto o agente trabalha. null = não mostrar (o acionamento
 * de especialista já aparece na árvore da equipe).
 */
const LABELS: [RegExp, string | null][] = [
  [/especialista_acionar/, null],
  [/buscar_conhecimento|knowledge/, 'Consultando a base de conhecimento'],
  [/dados_|dataset/, 'Analisando os dados'],
  [/grafico/, 'Montando o gráfico'],
  [/relatorio/, 'Preparando o relatório'],
  [/tarefas_/, 'Atualizando as tarefas'],
  [/projeto/, 'Consultando o projeto'],
  [/informacoes_empresa/, 'Consultando a equipe'],
  [/canal|mensagens/, 'Lendo as mensagens do canal'],
  [/arquivo|connector|read_file|search_files|list_dir/, 'Lendo arquivos'],
  [/write_file|patch/, 'Escrevendo o arquivo'],
  [/agentes_criar/, 'Criando o agente'],
  [/usuarios_criar/, 'Adicionando a pessoa'],
  [/guia/, 'Consultando o guia da plataforma'],
  [/skill/, 'Aplicando o que já aprendeu'],
  [/vision|image/, 'Analisando a imagem'],
  [/terminal/, 'Executando no computador'],
  [/web_search|browser/, 'Pesquisando'],
]

export function toolLabel(name: string | undefined): string | null {
  const n = (name ?? '').toLowerCase()
  for (const [re, label] of LABELS) if (re.test(n)) return label
  return 'Trabalhando'
}
