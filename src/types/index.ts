export type Role = 'OWNER' | 'ADMIN' | 'MEMBER'
export type OnboardingStatus = 'PENDING' | 'GENERATED' | 'COMPLETED'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  companyId: string
  departmentId?: string | null
  department?: { id: string; name: string } | null
}

/** Organização da qual a pessoa faz parte (seletor de organização). */
export interface OrgSummary {
  id: string
  name: string
  role: Role
  onboardingStatus: OnboardingStatus
}

/** Quem está logado; companyId/role = organização ativa (null = sem org ainda). */
export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role | null
  companyId: string | null
  companyName?: string | null
}

export interface AuthResponse {
  token: string
  user: SessionUser & { onboardingStatus?: OnboardingStatus | null }
  onboardingStatus?: OnboardingStatus
  orgs?: OrgSummary[]
}

export interface SignupPayload {
  /** sem nome de empresa: cria só a conta (entra depois por convite) */
  companyName?: string
  businessDescription?: string
  industry?: string
  name: string
  email: string
  password: string
}

export interface OrgInvite {
  id: string
  /** formato de exibição: XXXX-XXXX */
  code: string
  expiresAt: string | null
  maxUses: number | null
  uses: number
  revokedAt: string | null
  createdAt: string
  createdBy?: string | null
  /** true: quem entra acessa todos os agentes; false: só os de agentIds */
  allAgents: boolean
  agentIds: string[]
}

export interface InvitePreview {
  code: string
  companyName: string
}

export interface Department {
  id: string
  name: string
}

export interface TextGenerationCapability {
  provider?: string
  model?: string
  temperature: number
}

export interface Agent {
  id: string
  name: string
  slug: string
  avatarSeed: string
  role: string
  description: string
  systemPrompt: string
  isManager: boolean
  departmentId: string | null
  department?: Department | null
  capabilities: {
    text_generation?: TextGenerationCapability
  }
  isActive: boolean
}

export type Provider =
  | 'openai'
  | 'anthropic'
  | 'deepseek'
  | 'google'
  | 'openrouter'
  | 'custom'

export interface ProviderKey {
  id: string
  provider: Provider
  label: string
  fallbackPriority?: number
  maskedKey: string
  baseUrl?: string | null
  defaultModel?: string | null
  /** atende as mensagens enquanto estiver no ar */
  isPrimary?: boolean
  /** falhou há pouco: as mensagens estão indo para a reserva */
  isDown?: boolean
}

export interface SuggestedAgent {
  name: string
  role: string
  department: string
  systemPrompt: string
  avatarSeed: string
}

export type ConversationVisibility = 'PRIVATE' | 'COMPANY' | 'USERS'

export interface UserRef {
  id: string
  name: string
}

export interface Conversation {
  id: string
  title: string
  pinned: boolean
  projectId?: string | null
  createdAt: string
  updatedAt: string
  visibility?: ConversationVisibility
  owner?: UserRef
  participants?: UserRef[]
  isOwner?: boolean
  canWrite?: boolean
}

export interface ShareState {
  id: string
  visibility: ConversationVisibility
  owner: UserRef
  participants: UserRef[]
}

export interface ShareRequest {
  id: string
  status: 'PENDING' | 'APPROVED' | 'DENIED'
  createdAt: string
  requester: UserRef
  conversation: { id: string; title: string }
}

export interface Company {
  id: string
  name: string
  businessDescription?: string | null
  industry?: string | null
}

export interface Message {
  id: string
  conversationId: string
  content: string
  // O Prisma serializa os enums em caixa alta ('USER' | 'AGENT' | 'SYSTEM')
  sender: string
  type?: string
  agentId?: string | null
  user?: UserRef | null
  createdAt: string
  metadata?: Record<string, unknown>
}

export type KnowledgeStatus = 'PROCESSING' | 'READY' | 'ERROR'

export interface KnowledgeDocument {
  id: string
  title: string
  mimeType: string
  status: KnowledgeStatus
  error?: string | null
  chunkCount: number
  createdAt: string
  agent?: { id: string; name: string } | null
}

export interface EmbeddingStats {
  configured: boolean
  broken: boolean
  keyId: string | null
  model: string | null
  total: number
  embedded: number
  upToDate: number
  reindexing: boolean
}

export type ProjectStatus = 'AGUARDANDO_INICIO' | 'EM_ANDAMENTO' | 'FINALIZADO'
export type ProjectAnalysisStatus = 'IDLE' | 'RUNNING' | 'DONE' | 'ERROR'
export type TaskStatus = 'A_FAZER' | 'EM_ANDAMENTO' | 'EM_REVISAO' | 'CONCLUIDA'
export type TaskPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'

export interface Project {
  id: string
  name: string
  description?: string | null
  status: ProjectStatus
  allDepartments: boolean
  requirements?: string | null
  analysisStatus: ProjectAnalysisStatus
  analysisError?: string | null
  createdAt: string
  updatedAt: string
  departments: { id: string; department: { id: string; name: string } }[]
  _count: { tasks: number; conversations: number; documents: number }
  taskCounts?: Partial<Record<TaskStatus, number>>
  taskLists?: TaskList[]
  documents?: { id: string; title: string; status: KnowledgeStatus; mimeType: string; createdAt: string }[]
}

export interface TaskList {
  id: string
  projectId?: string | null
  name: string
  position: number
  _count?: { tasks: number }
}

export interface TaskMember {
  id: string
  user?: { id: string; name: string } | null
  agent?: { id: string; name: string; avatarSeed: string } | null
}

export interface Task {
  id: string
  projectId?: string | null
  listId?: string | null
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string | null
  position: number
  createdByAgent: boolean
  createdAt: string
  updatedAt: string
  list?: { id: string; name: string } | null
  project?: { id: string; name: string } | null
  members: TaskMember[]
}

export interface ConnectorSummary {
  id: string
  name: string
  status: 'online' | 'offline'
  lastSeenAt: string | null
  folders: { path: string; readOnly: boolean }[]
  createdAt: string
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ToolParamProperty {
  type: string
  description?: string
}

export interface ToolParamsSchema {
  type: 'object'
  properties: Record<string, ToolParamProperty>
  required?: string[]
}

export interface CustomTool {
  id: string
  name: string
  displayName: string
  description: string
  method: HttpMethod
  url: string
  headerKeys: string[]
  paramsSchema: ToolParamsSchema
  timeoutMs: number
  isActive: boolean
}

export interface CustomToolPayload {
  name: string
  displayName: string
  description: string
  method: HttpMethod
  url: string
  headers?: Record<string, string>
  paramsSchema: ToolParamsSchema
  timeoutMs?: number
}

export interface ToolTestResult {
  ok: boolean
  status?: number
  body?: unknown
  error?: string
}

export type StreamEventType =
  | 'session_started'
  | 'agent_status'
  | 'agent_delegation'
  | 'tool_call'
  | 'tool_call_update'
  | 'token_chunk'
  | 'thought_chunk'
  | 'final_message'
  | 'error'
  | 'ping'

export interface StreamEvent {
  type: StreamEventType
  agent_id?: string
  text?: string
  data?: Record<string, unknown>
}
