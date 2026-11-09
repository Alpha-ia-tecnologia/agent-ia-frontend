export interface TrailStation {
  number: number
  title: string
  tagline: string
  question: string
  challenge: string
  care: string
  /** agente responsável pelo passo Solução da estação */
  specialist: string
}

export interface TrailRun {
  id: string
  number: number
  name: string
  capacity: number
  members: string[]
  /** medalhas da mesa */
  approved: number[]
  current: number
  maxOpen: number
  finished: boolean
  releasedUpTo: number
}

/** Andamento da própria pessoa na trilha. */
export interface TrailMe {
  largadaDone: boolean
  done: number[]
  /** 0 é a Largada */
  current: number
  maxOpen: number
  finished: boolean
  chegadaOpen: boolean
  chegadaDone: boolean
}

export interface TrailState {
  run: TrailRun | null
  me: TrailMe | null
  pilotOpen: boolean
}

export interface TrailMessage {
  id: string
  role: 'user' | 'assistant' | 'event' | 'lesson'
  authorName: string | null
  content: string
}

export interface TrailDocumentOption {
  id: string
  title: string
  subtitle: string
}

export interface TrailStep {
  key: string
  title: string
  minutes: number
  status: 'done' | 'current' | 'pending'
}

export interface TrailTable {
  name: string
  doneCount: number
  memberCount: number
  quorum: number
  medal: boolean
}

export interface TrailSession {
  stage: {
    number: number
    title: string
    question: string
    care: string
    material: string
    capabilities: string[]
  }
  steps: TrailStep[]
  phase: 'answer' | 'attach' | 'prompt' | 'done'
  attachLabel: string
  documents: TrailDocumentOption[]
  document: { title: string; text: string } | null
  startPrompt: string
  options: string[]
  busy: boolean
  completed: boolean
  idea: string | null
  /** o que a pessoa construiu e aprendeu nesta etapa, ao concluir */
  recap: { title: string; note: string | null; lesson: string | null }[]
  table: TrailTable
  messages: TrailMessage[]
}

export interface TrailMural {
  table: TrailTable
  people: {
    name: string
    department: string | null
    mine: boolean
    status: 'waiting' | 'active' | 'done'
    step: string | null
  }[]
  notes: {
    id: string
    authorName: string
    department: string | null
    label: string
    isIdea: boolean
    text: string
  }[]
}

export interface SheetField {
  key: string
  label: string
  hint: string
  value: string
}

export interface TrailPilot {
  open: boolean
  status: 'none' | 'generating' | 'voting' | 'drafting' | 'ready'
  table: TrailTable
  voteQuorum: number
  voters: number
  myVote: number | null
  candidates: {
    station: number
    stationTitle: string
    title: string
    summary: string
    votes: number
  }[]
  chosen: { station: number; title: string; summary: string } | null
  sheet: SheetField[]
}

export interface TrailPublicVote {
  open: boolean
  myVote: string | null
  options: { runId: string; name: string; title: string; summary: string }[]
}

export interface TrailSheetEntry {
  runId: string
  name: string
  title: string
  sheet: SheetField[]
}

/** Plano de ação de 90 dias, montado na Chegada. */
export interface TrailPlanContent {
  titulo: string
  objetivo: string
  dor: { descricao: string; afetados: string; consequencia: string }
  dado: { fonte: string; mostra: string; lacunas: string; responsavel: string }
  dono: { responsavel: string; apoio: string; decisao: string }
  solucao: {
    capacidade: string
    descricao: string
    papelIa: string
    papelServidor: string
    foraDoEscopo: string
  }
  indicadores: { nome: string; comoMedir: string; pontoDePartida: string; meta: string }[]
  fases: {
    periodo: string
    nome: string
    foco: string
    acoes: { acao: string; responsavel: string; entrega: string }[]
  }[]
  primeiraSemana: string[]
  riscos: { risco: string; prevencao: string }[]
  cuidados: { dados: string; revisaoHumana: string; transparencia: string }
  recursos: { jaTemos: string[]; precisamos: string[] }
  decisaoDia90: { continuar: string; ajustar: string; parar: string }
  trilha: { estacao: string; aproveitamento: string }[]
  conexaoPiloto: string
  aConferir: string[]
}

export interface TrailStationDocument {
  station: number
  title: string
  question: string
  care: string
  name: string
  department: string | null
  tableName: string
  completedAt: string
  material: string | null
  steps: { title: string; note: string }[]
  result: string | null
  lessons: { title: string; text: string }[]
}

export interface TrailPlan {
  status: 'none' | 'generating' | 'ready' | 'failed'
  chegadaDone: boolean
  name: string
  department: string | null
  tableName: string
  plan: TrailPlanContent | null
}

export interface OfficeAgent {
  slug: string
  name: string
  role: string | null
  avatarSeed: string
  station: number | null
}

export interface TrailActivity {
  id: string
  runName: string
  station: number
  action: 'analysis' | 'turn' | 'plan'
  agentSlug: string
  agentName: string
  phase: 'routing' | 'working' | 'done'
  /** ação da conversa da própria pessoa */
  mine?: boolean
}

export type TrailBoardRun = TrailRun & {
  /** em qual estação cada pessoa da mesa está (0 é a Largada) */
  peopleAt: number[]
  doneByStation: number[]
  chegadaDone: number
  pilotStatus: TrailPilot['status']
  pilotTitle: string | null
  publicVotes: number
}

export interface TrailBoard {
  releasedUpTo: number
  pilotOpen: boolean
  voteOpen: boolean
  chegadaOpen: boolean
  plansReady: number
  aiReady: boolean
  highlights: {
    id: string
    runName: string
    authorName: string
    department: string | null
    station: number
    text: string
  }[]
  runs: TrailBoardRun[]
}
