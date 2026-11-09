import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '@/store'
import type {
  OfficeAgent,
  TrailActivity,
  TrailBoard,
  TrailMural,
  TrailPilot,
  TrailPlan,
  TrailPublicVote,
  TrailSession,
  TrailSheetEntry,
  TrailState,
  TrailStation,
} from '@/pages/trail/types'
import type {
  Agent,
  CustomTool,
  CustomToolPayload,
  ToolTestResult,
  AuthResponse,
  InvitePreview,
  OrgInvite,
  OrgSummary,
  Company,
  ConnectorSummary,
  EmbeddingStats,
  KnowledgeDocument,
  Conversation,
  ConversationVisibility,
  Department,
  Message,
  Project,
  ProjectStatus,
  ProviderKey,
  ShareRequest,
  ShareState,
  SignupPayload,
  Task,
  TaskList,
  TaskMember,
  TaskPriority,
  TaskStatus,
  SuggestedAgent,
  User,
} from '@/types'

export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ??
  'http://localhost:3000/api'

export interface AuditEvent {
  id: string
  type: string
  payload: Record<string, unknown>
  createdAt: string
  agent: { id: string; name: string; avatarSeed: string } | null
  conversation: { id: string; title: string } | null
}
export interface AuditEventsResponse {
  events: AuditEvent[]
  nextCursor: string | null
}

export interface UsageSummary {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  turns: number
  daily: { day: string; total: number }[]
}
export interface UsageAgent {
  id: string
  name: string
  role: string
  avatarSeed: string
}
export interface UsageUser {
  id: string
  name: string
  email: string
}
export interface UsageRow<T> {
  agent?: T | null
  user?: T | null
  promptTokens: number
  completionTokens: number
  totalTokens: number
  turns: number
}

export interface DatasetColumn {
  id: string
  name: string
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'CURRENCY'
  description: string
  position: number
}
export interface Dataset {
  id: string
  name: string
  description: string
  sourceType: string
  fileName: string | null
  rowCount: number
  quality: 'OK' | 'WITH_ISSUES'
  qualityNotes: string[]
  createdAt: string
  updatedAt: string
  columns: DatasetColumn[]
}
export interface DatasetRowsResponse {
  rows: { rowIndex: number; data: Record<string, unknown> }[]
  total: number
  page: number
  pageSize: number
}

export interface LearnedSkill {
  name: string
  description: string
  version: string
  archived: boolean
  updatedAt: number
  content: string
}

export interface SubscriptionStatus {
  active: { provider: string; model: string | null } | null
  providers?: Record<string, { connected: boolean; expires_in_s?: number }>
}
export interface SubscriptionFlow {
  status: 'none' | 'starting' | 'pending' | 'connected' | 'error' | 'expired'
  verification?: { uri: string; code: string } | null
  error?: string | null
}

export interface InboxContact {
  id: string
  name: string
  externalId: string
  channel: { id: string; type: string; name: string; autoRespond: boolean }
  unreadCount: number
  lastMessageAt: string | null
  preview: { direction: string; content: string } | null
}
export interface InboxMessage {
  id: string
  direction: 'IN' | 'OUT'
  author: string
  content: string
  createdAt: string
}

export interface Channel {
  id: string
  type: string
  name: string
  agentId: string | null
  isActive: boolean
  autoRespond?: boolean
  contacts: number
  createdAt: string
}

export interface TaskFilter {
  projectId?: string
  isolated?: boolean
  listId?: string
}

export interface MeetingDelivery {
  type?: string
  format?: string
  instruction?: string
}

export interface MeetingConsent {
  announce?: boolean
  message?: string
}

export interface MeetingChannel {
  id: string
  name: string
  agentId: string | null
  isActive?: boolean
  autoRespond?: boolean
  config?: { deliveries?: MeetingDelivery[]; botName?: string; consent?: MeetingConsent }
}

export interface MeetingChannelInput {
  name?: string
  agentId?: string | null
  isActive?: boolean
  autoRespond?: boolean
  deliveries?: MeetingDelivery[]
  botName?: string
  consent?: MeetingConsent
}

export type MeetingPlatform = 'TEAMS' | 'MEET'

export type MeetingStatus =
  | 'PENDING'
  | 'JOINING'
  | 'LOBBY'
  | 'RECORDING'
  | 'LEFT'
  | 'TRANSCRIBING'
  | 'PROCESSING'
  | 'DONE'
  | 'FAILED'

export interface MeetingHighlight {
  kind: 'decision' | 'action' | 'topic'
  ts: number
  text: string
  speaker?: string
}

export interface MeetingSession {
  id: string
  platform: MeetingPlatform
  joinUrl: string
  subject: string
  scheduledAt?: string | null
  status: MeetingStatus
  startedAt?: string | null
  durationSec?: number | null
  recordingKey?: string | null
  transcriptKey?: string | null
  highlights?: MeetingHighlight[] | null
  conversationId?: string | null
  error?: string | null
  createdAt: string
}

export interface CreateMeetingInput {
  joinUrl: string
  subject?: string
  scheduledAt?: string | null
  maxDurationSec?: number
}

export type MeetingBotProvider = 'GOOGLE' | 'MICROSOFT'

/** Conta Google/Microsoft do escritório que o bot usa para entrar logado. */
export interface MeetingBotAccount {
  id: string
  provider: MeetingBotProvider
  email: string | null
  status: 'CONNECTED' | 'EXPIRED' | 'DISCONNECTED'
  lastValidatedAt: string | null
  lastError: string | null
  updatedAt: string
}

export interface ConnectMeetingAccountInput {
  provider: MeetingBotProvider
  /** storageState do Playwright (conteúdo do meet-auth.json), como texto. */
  storageState: string
  email?: string
}

/** Sessão de login hospedado (browser streamado) para conectar sem terminal. */
export interface ConnectSession {
  sessionId: string
  token: string
  /** URL do WebSocket para o painel abrir o browser ao vivo. */
  wsUrl: string
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: [
    'Agent',
    'Department',
    'User',
    'ProviderKey',
    'Connector',
    'Project',
    'TaskList',
    'Task',
    'Audit',
    'Usage',
    'Dataset',
    'Learning',
    'Subscription',
    'Channel',
    'Meeting',
    'MeetingAccount',
    'Conversation',
    'Message',
    'ShareRequest',
    'AgentAccess',
    'Tool',
    'AgentTools',
    'Company',
    'Knowledge',
    'Org',
    'Invite',
    'TrailState',
    'TrailSession',
    'TrailBoard',
    'TrailMural',
    'TrailPilot',
    'TrailPlan',
    'TrailVote',
    'EventEntry',
  ],
  endpoints: (build) => ({
    // Auth
    signup: build.mutation<AuthResponse, SignupPayload>({
      query: (body) => ({ url: '/auth/signup', method: 'POST', body }),
    }),
    login: build.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    // Organizações (organização ativa = a do token)
    switchOrg: build.mutation<AuthResponse, string>({
      query: (companyId) => ({ url: '/auth/switch-org', method: 'POST', body: { companyId } }),
    }),
    getMyOrgs: build.query<OrgSummary[], void>({
      query: () => '/orgs',
      providesTags: ['Org'],
    }),
    createOrg: build.mutation<
      AuthResponse,
      { name: string; industry?: string; businessDescription?: string }
    >({
      query: (body) => ({ url: '/orgs', method: 'POST', body }),
    }),
    // Convites (link, QR e código)
    getInvites: build.query<OrgInvite[], void>({
      query: () => '/org/invites',
      providesTags: ['Invite'],
    }),
    createInvite: build.mutation<
      OrgInvite,
      { expiresInHours?: number; maxUses?: number; allAgents?: boolean; agentIds?: string[] }
    >({
      query: (body) => ({ url: '/org/invites', method: 'POST', body }),
      invalidatesTags: ['Invite'],
    }),
    revokeInvite: build.mutation<{ revoked: boolean }, string>({
      query: (id) => ({ url: `/org/invites/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Invite'],
    }),
    previewInvite: build.query<InvitePreview, string>({
      query: (code) => `/invites/${encodeURIComponent(code)}`,
    }),
    acceptInvite: build.mutation<AuthResponse, string>({
      query: (code) => ({ url: `/invites/${encodeURIComponent(code)}/accept`, method: 'POST' }),
    }),
    enterEvent: build.mutation<AuthResponse, { name: string }>({
      query: (body) => ({ url: '/invites/evento/enter', method: 'POST', body }),
    }),
    getEventEntry: build.query<{ open: boolean }, void>({
      query: () => '/org/invites/evento',
      providesTags: ['EventEntry'],
    }),
    setEventEntry: build.mutation<{ open: boolean }, { open: boolean }>({
      query: (body) => ({ url: '/org/invites/evento', method: 'POST', body }),
      invalidatesTags: ['EventEntry'],
    }),
    enterWithCode: build.mutation<AuthResponse, { code: string; name: string }>({
      query: ({ code, name }) => ({
        url: `/invites/${encodeURIComponent(code)}/enter`,
        method: 'POST',
        body: { name },
      }),
    }),

    // Trilha da Inovação
    getTrailStations: build.query<TrailStation[], void>({
      query: () => '/trail/stations',
    }),
    getTrailAgents: build.query<OfficeAgent[], void>({
      query: () => '/trail/agents',
    }),
    getTrailActivity: build.query<TrailActivity[], void>({
      query: () => '/trail/activity',
    }),
    getTrailState: build.query<TrailState, void>({
      query: () => '/trail/state',
      providesTags: ['TrailState'],
    }),
    joinTrail: build.mutation<TrailState, void>({
      query: () => ({ url: '/trail/join', method: 'POST' }),
      invalidatesTags: ['TrailState'],
    }),
    getTrailSession: build.query<TrailSession, number>({
      query: (station) => `/trail/stations/${station}/session`,
      providesTags: ['TrailSession'],
    }),
    getTrailMural: build.query<TrailMural, number>({
      query: (station) => `/trail/stations/${station}/mural`,
      providesTags: ['TrailMural'],
    }),
    attachTrailDocument: build.mutation<TrailSession, { station: number; documentId: string }>({
      query: ({ station, documentId }) => ({
        url: `/trail/stations/${station}/attach`,
        method: 'POST',
        body: { documentId },
      }),
      invalidatesTags: ['TrailSession'],
    }),
    answerTrailStep: build.mutation<TrailSession, { station: number; content: string }>({
      query: ({ station, content }) => ({
        url: `/trail/stations/${station}/answer`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: ['TrailSession', 'TrailState', 'TrailMural'],
    }),
    getTrailPilot: build.query<TrailPilot, void>({
      query: () => '/trail/pilot',
      providesTags: ['TrailPilot'],
    }),
    startTrailPilot: build.mutation<TrailPilot, void>({
      query: () => ({ url: '/trail/pilot/start', method: 'POST' }),
      invalidatesTags: ['TrailPilot'],
    }),
    voteTrailPilot: build.mutation<TrailPilot, number>({
      query: (station) => ({ url: '/trail/pilot/vote', method: 'POST', body: { station } }),
      invalidatesTags: ['TrailPilot'],
    }),
    closeTrailPilot: build.mutation<TrailPilot, void>({
      query: () => ({ url: '/trail/pilot/close', method: 'POST' }),
      invalidatesTags: ['TrailPilot'],
    }),
    editTrailSheet: build.mutation<TrailPilot, { field: string; value: string }>({
      query: (body) => ({ url: '/trail/pilot/sheet', method: 'POST', body }),
      invalidatesTags: ['TrailPilot'],
    }),
    getTrailPlan: build.query<TrailPlan, void>({
      query: () => '/trail/plan',
      providesTags: ['TrailPlan'],
    }),
    startTrailPlan: build.mutation<TrailPlan, void>({
      query: () => ({ url: '/trail/plan', method: 'POST' }),
      invalidatesTags: ['TrailPlan'],
    }),
    getTrailVote: build.query<TrailPublicVote, void>({
      query: () => '/trail/vote',
      providesTags: ['TrailVote'],
    }),
    castTrailVote: build.mutation<TrailPublicVote, string>({
      query: (runId) => ({ url: '/trail/vote', method: 'POST', body: { runId } }),
      invalidatesTags: ['TrailVote'],
    }),
    getTrailBoard: build.query<TrailBoard, void>({
      query: () => '/trail/board',
      providesTags: ['TrailBoard'],
    }),
    getTrailPilots: build.query<TrailSheetEntry[], void>({
      query: () => '/trail/pilots',
      providesTags: ['TrailBoard'],
    }),
    releaseTrailRoom: build.mutation<TrailBoard, { upTo: number }>({
      query: (body) => ({ url: '/trail/release', method: 'POST', body }),
      invalidatesTags: ['TrailBoard'],
    }),
    releaseTrailRun: build.mutation<TrailBoard, { runId: string; upTo: number }>({
      query: ({ runId, upTo }) => ({
        url: `/trail/runs/${runId}/release`,
        method: 'POST',
        body: { upTo },
      }),
      invalidatesTags: ['TrailBoard'],
    }),
    setTrailPilotOpen: build.mutation<TrailBoard, boolean>({
      query: (open) => ({ url: '/trail/pilot-open', method: 'POST', body: { open } }),
      invalidatesTags: ['TrailBoard'],
    }),
    setTrailChegadaOpen: build.mutation<TrailBoard, boolean>({
      query: (open) => ({ url: '/trail/chegada-open', method: 'POST', body: { open } }),
      invalidatesTags: ['TrailBoard'],
    }),
    setTrailVoteOpen: build.mutation<TrailBoard, boolean>({
      query: (open) => ({ url: '/trail/vote-open', method: 'POST', body: { open } }),
      invalidatesTags: ['TrailBoard'],
    }),

    // Departments
    getDepartments: build.query<Department[], void>({
      query: () => '/departments',
      providesTags: ['Department'],
    }),
    createDepartment: build.mutation<Department, { name: string }>({
      query: (body) => ({ url: '/departments', method: 'POST', body }),
      invalidatesTags: ['Department'],
    }),
    updateDepartment: build.mutation<Department, { id: string; name: string }>({
      query: ({ id, ...body }) => ({
        url: `/departments/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Department', 'Agent'],
    }),
    deleteDepartment: build.mutation<void, string>({
      query: (id) => ({ url: `/departments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Department', 'Agent'],
    }),

    // Agents
    getAgents: build.query<Agent[], void>({
      query: () => '/agents',
      providesTags: ['Agent'],
    }),
    getAgent: build.query<Agent, string>({
      query: (id) => `/agents/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Agent', id }],
    }),
    createAgent: build.mutation<Agent, Partial<Agent>>({
      query: (body) => ({ url: '/agents', method: 'POST', body }),
      invalidatesTags: ['Agent'],
    }),
    updateAgent: build.mutation<Agent, { id: string } & Partial<Agent>>({
      query: ({ id, ...body }) => ({
        url: `/agents/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => ['Agent', { type: 'Agent', id }],
    }),
    deleteAgent: build.mutation<void, string>({
      query: (id) => ({ url: `/agents/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Agent'],
    }),
    getAgentAccess: build.query<{ userIds: string[] }, string>({
      query: (id) => `/agents/${id}/access`,
      transformResponse: (res: { userIds: string[] } | string[]) =>
        Array.isArray(res) ? { userIds: res } : res,
      providesTags: (_r, _e, id) => [{ type: 'AgentAccess', id }],
    }),
    setAgentAccess: build.mutation<void, { id: string; userIds: string[] }>({
      query: ({ id, userIds }) => ({
        url: `/agents/${id}/access`,
        method: 'POST',
        body: { userIds },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'AgentAccess', id }],
    }),

    // Ferramentas dinâmicas
    getTools: build.query<CustomTool[], void>({
      query: () => '/tools',
      providesTags: ['Tool'],
    }),
    createTool: build.mutation<CustomTool, CustomToolPayload>({
      query: (body) => ({ url: '/tools', method: 'POST', body }),
      invalidatesTags: ['Tool'],
    }),
    updateTool: build.mutation<
      CustomTool,
      { id: string } & Partial<CustomToolPayload> & { isActive?: boolean }
    >({
      query: ({ id, ...body }) => ({ url: `/tools/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Tool'],
    }),
    deleteTool: build.mutation<void, string>({
      query: (id) => ({ url: `/tools/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Tool'],
    }),
    testTool: build.mutation<ToolTestResult, { id: string; args: Record<string, unknown> }>({
      query: ({ id, args }) => ({ url: `/tools/${id}/test`, method: 'POST', body: { args } }),
    }),
    getAgentTools: build.query<{ toolIds: string[] }, string>({
      query: (id) => `/agents/${id}/tools`,
      providesTags: (_r, _e, id) => [{ type: 'AgentTools', id }],
    }),
    setAgentTools: build.mutation<void, { id: string; toolIds: string[] }>({
      query: ({ id, toolIds }) => ({
        url: `/agents/${id}/tools`,
        method: 'POST',
        body: { toolIds },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'AgentTools', id }],
    }),

    deleteAccount: build.mutation<{ deleted: boolean; scope: 'company' | 'user' }, { password: string }>({
      query: (body) => ({ url: '/auth/account', method: 'DELETE', body }),
    }),

    // Company
    getCompany: build.query<Company, void>({
      query: () => '/company',
      providesTags: ['Company'],
    }),
    updateCompany: build.mutation<Company, { name?: string }>({
      query: (body) => ({ url: '/company', method: 'PATCH', body }),
      invalidatesTags: ['Company'],
    }),

    // Knowledge
    getKnowledgeDocs: build.query<KnowledgeDocument[], void>({
      query: () => '/knowledge',
      providesTags: ['Knowledge'],
    }),
    uploadKnowledgeDoc: build.mutation<KnowledgeDocument, { file: File; agentId?: string }>({
      query: ({ file, agentId }) => {
        const form = new FormData()
        form.append('file', file)
        if (agentId) form.append('agentId', agentId)
        return { url: '/knowledge', method: 'POST', body: form }
      },
      invalidatesTags: ['Knowledge'],
    }),
    addKnowledgeText: build.mutation<
      KnowledgeDocument,
      { title: string; content: string; agentId?: string }
    >({
      query: (body) => ({ url: '/knowledge/text', method: 'POST', body }),
      invalidatesTags: ['Knowledge'],
    }),
    addKnowledgeUrl: build.mutation<KnowledgeDocument, { url: string; agentId?: string }>({
      query: (body) => ({ url: '/knowledge/url', method: 'POST', body }),
      invalidatesTags: ['Knowledge'],
    }),
    deleteKnowledgeDoc: build.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/knowledge/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Knowledge'],
    }),
    getEmbeddingConfig: build.query<EmbeddingStats, void>({
      query: () => '/knowledge/embeddings',
      providesTags: ['Knowledge'],
    }),
    setEmbeddingConfig: build.mutation<
      EmbeddingStats,
      { keyId: string | null; model: string | null }
    >({
      query: (body) => ({ url: '/knowledge/embeddings', method: 'PATCH', body }),
      invalidatesTags: ['Knowledge'],
    }),
    reindexEmbeddings: build.mutation<{ started: boolean; reindexing: boolean }, void>({
      query: () => ({ url: '/knowledge/embeddings/reindex', method: 'POST' }),
      invalidatesTags: ['Knowledge'],
    }),

    // Projetos & tasks
    getProjects: build.query<Project[], void>({
      query: () => '/projects',
      providesTags: ['Project'],
    }),
    getProject: build.query<Project, string>({
      query: (id) => `/projects/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Project', id }, 'Project'],
    }),
    createProject: build.mutation<
      Project,
      { name: string; description?: string; allDepartments?: boolean; departmentIds?: string[] }
    >({
      query: (body) => ({ url: '/projects', method: 'POST', body }),
      invalidatesTags: ['Project'],
    }),
    updateProject: build.mutation<
      Project,
      { id: string; name?: string; description?: string; allDepartments?: boolean; departmentIds?: string[] }
    >({
      query: ({ id, ...body }) => ({ url: `/projects/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Project'],
    }),
    updateProjectStatus: build.mutation<Project, { id: string; status: ProjectStatus }>({
      query: ({ id, status }) => ({ url: `/projects/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Project'],
    }),
    deleteProject: build.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/projects/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Project', 'Task', 'TaskList'],
    }),
    analyzeProject: build.mutation<{ analysisStatus: string }, string>({
      query: (id) => ({ url: `/projects/${id}/analyze`, method: 'POST' }),
      invalidatesTags: ['Project'],
    }),
    uploadProjectDocument: build.mutation<unknown, { projectId: string; file: File }>({
      query: ({ projectId, file }) => {
        const form = new FormData()
        form.append('file', file)
        return { url: `/projects/${projectId}/documents`, method: 'POST', body: form }
      },
      invalidatesTags: ['Project', 'Knowledge'],
    }),

    getTaskLists: build.query<TaskList[], string | void>({
      query: (projectId) => `/task-lists${projectId ? `?projectId=${projectId}` : ''}`,
      providesTags: ['TaskList'],
    }),
    createTaskList: build.mutation<TaskList, { name: string; projectId?: string }>({
      query: (body) => ({ url: '/task-lists', method: 'POST', body }),
      invalidatesTags: ['TaskList'],
    }),
    renameTaskList: build.mutation<TaskList, { id: string; name: string }>({
      query: ({ id, name }) => ({ url: `/task-lists/${id}`, method: 'PATCH', body: { name } }),
      invalidatesTags: ['TaskList', 'Task'],
    }),
    deleteTaskList: build.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/task-lists/${id}`, method: 'DELETE' }),
      invalidatesTags: ['TaskList', 'Task'],
    }),

    getTasks: build.query<Task[], TaskFilter>({
      query: (filter) => {
        const params = new URLSearchParams()
        if (filter.projectId) params.set('projectId', filter.projectId)
        if (filter.isolated) params.set('isolated', 'true')
        if (filter.listId) params.set('listId', filter.listId)
        const qs = params.toString()
        return `/tasks${qs ? `?${qs}` : ''}`
      },
      providesTags: ['Task'],
    }),
    createTask: build.mutation<
      Task,
      {
        title: string
        description?: string
        projectId?: string
        listId?: string
        priority?: TaskPriority
        dueDate?: string
        memberUserIds?: string[]
        memberAgentIds?: string[]
      }
    >({
      query: (body) => ({ url: '/tasks', method: 'POST', body }),
      invalidatesTags: ['Task', 'TaskList', 'Project'],
    }),
    updateTask: build.mutation<
      Task,
      { id: string; title?: string; description?: string; status?: TaskStatus; priority?: TaskPriority; listId?: string | null; dueDate?: string | null }
    >({
      query: ({ id, ...body }) => ({ url: `/tasks/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Task'],
    }),
    moveTask: build.mutation<
      Task,
      { id: string; status: TaskStatus; position: number; filter: TaskFilter }
    >({
      query: ({ id, status, position }) => ({
        url: `/tasks/${id}/move`,
        method: 'PATCH',
        body: { status, position },
      }),
      // optimistic: o card muda de coluna na hora do drop
      async onQueryStarted({ id, status, position, filter }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          api.util.updateQueryData('getTasks', filter, (draft) => {
            const task = draft.find((t) => t.id === id)
            if (task) {
              task.status = status
              task.position = position - 0.5 // entra antes do ocupante da posição
            }
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: ['Task'],
    }),
    deleteTask: build.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/tasks/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Task', 'TaskList', 'Project'],
    }),
    addTaskMember: build.mutation<TaskMember, { taskId: string; userId?: string; agentId?: string }>({
      query: ({ taskId, ...body }) => ({ url: `/tasks/${taskId}/members`, method: 'POST', body }),
      invalidatesTags: ['Task'],
    }),
    removeTaskMember: build.mutation<{ deleted: boolean }, { taskId: string; memberId: string }>({
      query: ({ taskId, memberId }) => ({
        url: `/tasks/${taskId}/members/${memberId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task'],
    }),

    // Auditoria
    getAuditEvents: build.query<
      AuditEventsResponse,
      { type?: string; agentId?: string; cursor?: string }
    >({
      query: (f) => {
        const params = new URLSearchParams()
        if (f.type) params.set('type', f.type)
        if (f.agentId) params.set('agentId', f.agentId)
        if (f.cursor) params.set('cursor', f.cursor)
        const qs = params.toString()
        return `/audit/events${qs ? `?${qs}` : ''}`
      },
      providesTags: ['Audit'],
    }),
    getAuditSummary: build.query<
      { since: string; total: number; byType: Record<string, number> },
      void
    >({
      query: () => '/audit/summary',
      providesTags: ['Audit'],
    }),

    // Consumo de tokens
    getUsageSummary: build.query<UsageSummary, { from?: string } | void>({
      query: (f) => `/usage/summary${f?.from ? `?from=${f.from}` : ''}`,
      providesTags: ['Usage'],
    }),
    getUsageByAgent: build.query<UsageRow<UsageAgent>[], { from?: string } | void>({
      query: (f) => `/usage/by-agent${f?.from ? `?from=${f.from}` : ''}`,
      providesTags: ['Usage'],
    }),
    getUsageByUser: build.query<UsageRow<UsageUser>[], { from?: string } | void>({
      query: (f) => `/usage/by-user${f?.from ? `?from=${f.from}` : ''}`,
      providesTags: ['Usage'],
    }),

    // Dados estruturados (datasets)
    getDatasets: build.query<Dataset[], void>({
      query: () => '/datasets',
      providesTags: ['Dataset'],
    }),
    getDataset: build.query<Dataset, string>({
      query: (id) => `/datasets/${id}`,
      providesTags: ['Dataset'],
    }),
    getDatasetRows: build.query<DatasetRowsResponse, { id: string; page?: number }>({
      query: ({ id, page }) => `/datasets/${id}/rows${page ? `?page=${page}` : ''}`,
      providesTags: ['Dataset'],
    }),
    uploadDataset: build.mutation<Dataset, FormData>({
      query: (body) => ({ url: '/datasets', method: 'POST', body }),
      invalidatesTags: ['Dataset'],
    }),
    updateDataset: build.mutation<Dataset, { id: string; name?: string; description?: string }>({
      query: ({ id, ...body }) => ({ url: `/datasets/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Dataset'],
    }),
    updateDatasetColumn: build.mutation<
      DatasetColumn,
      { datasetId: string; columnId: string; type?: string; description?: string }
    >({
      query: ({ datasetId, columnId, ...body }) => ({
        url: `/datasets/${datasetId}/columns/${columnId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Dataset'],
    }),
    deleteDataset: build.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/datasets/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Dataset'],
    }),

    // Aprendizados (skills dos agentes)
    getLearnedSkills: build.query<{ skills: LearnedSkill[] }, void>({
      query: () => '/learning/skills',
      providesTags: ['Learning'],
    }),
    archiveLearnedSkill: build.mutation<{ archived: boolean }, string>({
      query: (name) => ({
        url: `/learning/skills/${encodeURIComponent(name)}/archive`,
        method: 'POST',
      }),
      invalidatesTags: ['Learning'],
    }),

    // Assinaturas (BYOA)
    getSubscriptionStatus: build.query<SubscriptionStatus, void>({
      query: () => '/providers/subscription/status',
      providesTags: ['Subscription'],
    }),
    startSubscriptionFlow: build.mutation<
      { status: string; verification?: { uri: string; code: string } },
      string
    >({
      query: (provider) => ({
        url: `/providers/subscription/${provider}/start`,
        method: 'POST',
      }),
    }),
    getSubscriptionFlow: build.query<SubscriptionFlow, string>({
      query: (provider) => `/providers/subscription/${provider}/flow`,
    }),
    getAnthropicAuthUrl: build.mutation<{ auth_url: string }, void>({
      query: () => ({ url: '/providers/subscription/anthropic/url', method: 'POST' }),
    }),
    exchangeAnthropicCode: build.mutation<{ connected: boolean }, string>({
      query: (code) => ({
        url: '/providers/subscription/anthropic/exchange',
        method: 'POST',
        body: { code },
      }),
      invalidatesTags: ['Subscription'],
    }),
    activateSubscription: build.mutation<unknown, { provider: string; model: string }>({
      query: (body) => ({ url: '/providers/subscription/activate', method: 'POST', body }),
      invalidatesTags: ['Subscription'],
    }),
    deactivateSubscription: build.mutation<unknown, void>({
      query: () => ({ url: '/providers/subscription/deactivate', method: 'POST' }),
      invalidatesTags: ['Subscription'],
    }),
    removeSubscription: build.mutation<unknown, string>({
      query: (provider) => ({
        url: `/providers/subscription/${provider}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Subscription'],
    }),

    createPairCode: build.mutation<{ code: string; expiresInSeconds: number }, void>({
      query: () => ({ url: '/connectors/pair-code', method: 'POST' }),
    }),

    // Canais (omnichannel)
    getChannels: build.query<Channel[], void>({
      query: () => '/channels',
      providesTags: ['Channel'],
    }),
    createTelegramChannel: build.mutation<Channel, { token: string; agentId?: string }>({
      query: (body) => ({ url: '/channels/telegram', method: 'POST', body }),
      invalidatesTags: ['Channel'],
    }),
    createEmailChannel: build.mutation<
      Channel,
      {
        address: string
        password: string
        imapHost: string
        imapPort: number
        smtpHost: string
        smtpPort: number
        agentId?: string
      }
    >({
      query: (body) => ({ url: '/channels/email', method: 'POST', body }),
      invalidatesTags: ['Channel'],
    }),
    setProviderKeyFallback: build.mutation<unknown, { id: string; priority: number }>({
      query: ({ id, priority }) => ({
        url: `/provider-keys/${id}/fallback`,
        method: 'PATCH',
        body: { priority },
      }),
      invalidatesTags: ['ProviderKey'],
    }),
    createWhatsAppChannel: build.mutation<Channel, { agentId?: string }>({
      query: (body) => ({ url: '/channels/whatsapp', method: 'POST', body }),
      invalidatesTags: ['Channel'],
    }),
    getWhatsAppStatus: build.query<{ state: string; qr: string | null }, string>({
      query: (id) => `/channels/${id}/whatsapp-status`,
    }),
    getInboxContacts: build.query<InboxContact[], { type?: string } | void>({
      query: (f) => `/channels/inbox/contacts${f?.type ? `?type=${f.type}` : ''}`,
      providesTags: ['Channel'],
    }),
    getInboxMessages: build.query<
      { contact: InboxContact & { conversationId: string }; messages: InboxMessage[] },
      string
    >({
      query: (id) => `/channels/inbox/contacts/${id}/messages`,
      providesTags: ['Channel'],
    }),
    replyInbox: build.mutation<{ sent: boolean }, { contactId: string; content: string }>({
      query: ({ contactId, content }) => ({
        url: `/channels/inbox/contacts/${contactId}/reply`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: ['Channel'],
    }),
    updateChannel: build.mutation<
      unknown,
      { id: string; isActive?: boolean; agentId?: string | null; autoRespond?: boolean }
    >({
      query: ({ id, ...body }) => ({ url: `/channels/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Channel'],
    }),
    deleteChannel: build.mutation<unknown, string>({
      query: (id) => ({ url: `/channels/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Channel'],
    }),

    // Reuniões (bot aao-scribe): entra por link, grava e transcreve
    getMeetingChannels: build.query<MeetingChannel[], void>({
      query: () => '/meetings/channels',
      providesTags: ['Meeting'],
    }),
    createMeetingChannel: build.mutation<MeetingChannel, MeetingChannelInput>({
      query: (body) => ({ url: '/meetings/channels', method: 'POST', body }),
      invalidatesTags: ['Meeting', 'Channel'],
    }),
    updateMeetingChannel: build.mutation<MeetingChannel, { id: string } & MeetingChannelInput>({
      query: ({ id, ...body }) => ({ url: `/meetings/channels/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Meeting', 'Channel'],
    }),
    listMeetings: build.query<MeetingSession[], void>({
      query: () => '/meetings',
      providesTags: ['Meeting'],
    }),
    createMeeting: build.mutation<MeetingSession, CreateMeetingInput>({
      query: (body) => ({ url: '/meetings', method: 'POST', body }),
      invalidatesTags: ['Meeting'],
    }),
    cancelMeeting: build.mutation<MeetingSession, string>({
      query: (id) => ({ url: `/meetings/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Meeting'],
    }),
    stopMeeting: build.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/meetings/${id}/stop`, method: 'POST' }),
      invalidatesTags: ['Meeting'],
    }),
    removeMeeting: build.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/meetings/${id}/remove`, method: 'POST' }),
      invalidatesTags: ['Meeting'],
    }),
    getMeetingTranscript: build.query<{ text: string }, string>({
      query: (id) => `/meetings/${id}/transcript`,
    }),

    // Contas do escritório para o bot entrar logado (Google/Microsoft)
    listMeetingAccounts: build.query<MeetingBotAccount[], void>({
      query: () => '/meetings/accounts',
      providesTags: ['MeetingAccount'],
    }),
    connectMeetingAccount: build.mutation<MeetingBotAccount, ConnectMeetingAccountInput>({
      query: (body) => ({ url: '/meetings/accounts', method: 'POST', body }),
      invalidatesTags: ['MeetingAccount'],
    }),
    disconnectMeetingAccount: build.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/meetings/accounts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MeetingAccount'],
    }),
    startConnectSession: build.mutation<ConnectSession, { provider: MeetingBotProvider }>({
      query: (body) => ({ url: '/meetings/accounts/connect-session', method: 'POST', body }),
    }),
    finishConnectSession: build.mutation<
      MeetingBotAccount,
      { sessionId: string; token: string; provider: MeetingBotProvider; email?: string }
    >({
      query: (body) => ({ url: '/meetings/accounts/connect-session/finish', method: 'POST', body }),
      invalidatesTags: ['MeetingAccount'],
    }),
    cancelConnectSession: build.mutation<{ ok: true }, { sessionId: string }>({
      query: (body) => ({ url: '/meetings/accounts/connect-session/cancel', method: 'POST', body }),
    }),

    // Conector local
    getConnectors: build.query<ConnectorSummary[], void>({
      query: () => '/connectors',
      providesTags: ['Connector'],
    }),
    createConnector: build.mutation<{ id: string; name: string; token: string }, { name: string }>({
      query: (body) => ({ url: '/connectors', method: 'POST', body }),
      invalidatesTags: ['Connector'],
    }),
    revokeConnector: build.mutation<{ revoked: boolean }, string>({
      query: (id) => ({ url: `/connectors/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Connector'],
    }),

    // Users
    getUsers: build.query<User[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),
    createUser: build.mutation<
      User & { temporaryPassword?: string },
      { name: string; email: string; role: string; password?: string }
    >({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    updateUser: build.mutation<
      User,
      { id: string; role?: string; name?: string; departmentId?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    deleteUser: build.mutation<void, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['User'],
    }),

    // Provider keys
    getProviderKeys: build.query<ProviderKey[], void>({
      query: () => '/provider-keys',
      providesTags: ['ProviderKey'],
    }),
    createProviderKey: build.mutation<
      ProviderKey,
      { provider: string; apiKey: string; label: string; baseUrl?: string; defaultModel?: string }
    >({
      query: (body) => ({ url: '/provider-keys', method: 'POST', body }),
      invalidatesTags: ['ProviderKey'],
    }),
    deleteProviderKey: build.mutation<void, string>({
      query: (id) => ({ url: `/provider-keys/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ProviderKey'],
    }),
    testProviderKey: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/provider-keys/${id}/test`, method: 'POST' }),
    }),

    // Onboarding
    getUserAgentAccess: build.query<string[], string>({
      query: (id) => `/users/${id}/agent-access`,
      providesTags: (_r, _e, id) => [{ type: 'AgentAccess', id }],
    }),
    setUserAgentAccess: build.mutation<string[], { id: string; agentIds: string[] }>({
      query: ({ id, agentIds }) => ({
        url: `/users/${id}/agent-access`,
        method: 'PUT',
        body: { agentIds },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'AgentAccess', id }],
    }),
    generateAgent: build.mutation<{ agents: SuggestedAgent[] }, { description: string }>({
      query: (body) => ({ url: '/onboarding/generate-agent', method: 'POST', body }),
    }),
    confirmAgents: build.mutation<{ agents: Agent[] }, { agents: SuggestedAgent[] }>({
      query: (body) => ({ url: '/onboarding/confirm-agent', method: 'POST', body }),
      invalidatesTags: ['Agent', 'Department'],
    }),
    generateOffice: build.mutation<{ agents: SuggestedAgent[] }, void>({
      query: () => ({ url: '/onboarding/generate', method: 'POST' }),
    }),
    confirmOffice: build.mutation<void, { agents: SuggestedAgent[] }>({
      query: (body) => ({ url: '/onboarding/confirm', method: 'POST', body }),
      invalidatesTags: ['Agent', 'Department'],
    }),

    // Conversations
    getConversations: build.query<Conversation[], { scope?: 'all' } | void>({
      query: (arg) =>
        arg && arg.scope === 'all' ? '/conversations?scope=all' : '/conversations',
      providesTags: ['Conversation'],
    }),
    createConversation: build.mutation<
      Conversation,
      { title?: string; projectId?: string } | void
    >({
      query: (body) => ({
        url: '/conversations',
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: ['Conversation'],
    }),
    updateConversation: build.mutation<
      Conversation,
      { id: string; title?: string; pinned?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/conversations/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Conversation'],
    }),
    deleteConversation: build.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/conversations/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Conversation'],
    }),
    getMessages: build.query<Message[], string>({
      query: (id) => `/conversations/${id}/messages`,
      providesTags: (_r, _e, id) => [{ type: 'Message', id }],
    }),
    sendMessage: build.mutation<
      { agentId: string },
      {
        conversationId: string
        content: string
        agentId?: string
        /** reprocessa a última mensagem sem gravá-la de novo */
        retry?: boolean
      }
    >({
      query: ({ conversationId, ...body }) => ({
        url: `/conversations/${conversationId}/messages`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { conversationId }) => [
        { type: 'Message', id: conversationId },
        'Conversation',
      ],
    }),
    uploadFile: build.mutation<
      { id: string; name: string },
      { conversationId: string; file: File }
    >({
      query: ({ conversationId, file }) => {
        const form = new FormData()
        form.append('file', file)
        return {
          url: `/conversations/${conversationId}/files`,
          method: 'POST',
          body: form,
        }
      },
    }),
    // Compartilhamento de conversas
    getShareState: build.query<ShareState, string>({
      query: (id) => `/conversations/${id}/share`,
      providesTags: (_r, _e, id) => [{ type: 'Conversation', id }],
    }),
    shareConversation: build.mutation<
      ShareState,
      { id: string; visibility: ConversationVisibility; userIds?: string[] }
    >({
      query: ({ id, ...body }) => ({
        url: `/conversations/${id}/share`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Conversation', id }, 'Conversation'],
    }),
    requestShareConversation: build.mutation<{ requested: boolean }, string>({
      query: (id) => ({ url: `/conversations/${id}/share-request`, method: 'POST' }),
    }),
    getShareRequests: build.query<ShareRequest[], void>({
      query: () => '/conversations/share-requests',
      providesTags: ['ShareRequest'],
    }),
    resolveShareRequest: build.mutation<
      { ok: boolean },
      { reqId: string; action: 'approve' | 'deny' }
    >({
      query: ({ reqId, action }) => ({
        url: `/conversations/share-requests/${reqId}`,
        method: 'PATCH',
        body: { action },
      }),
      invalidatesTags: ['ShareRequest', 'Conversation'],
    }),
  }),
})

export const {
  useSignupMutation,
  useLoginMutation,
  useSwitchOrgMutation,
  useGetMyOrgsQuery,
  useCreateOrgMutation,
  useGetInvitesQuery,
  useCreateInviteMutation,
  useRevokeInviteMutation,
  usePreviewInviteQuery,
  useAcceptInviteMutation,
  useEnterEventMutation,
  useGetEventEntryQuery,
  useSetEventEntryMutation,
  useEnterWithCodeMutation,
  useGetTrailStationsQuery,
  useGetTrailAgentsQuery,
  useGetTrailActivityQuery,
  useGetTrailStateQuery,
  useJoinTrailMutation,
  useGetTrailSessionQuery,
  useAttachTrailDocumentMutation,
  useGetTrailMuralQuery,
  useAnswerTrailStepMutation,
  useGetTrailPilotQuery,
  useStartTrailPilotMutation,
  useVoteTrailPilotMutation,
  useCloseTrailPilotMutation,
  useEditTrailSheetMutation,
  useGetTrailPlanQuery,
  useStartTrailPlanMutation,
  useGetTrailVoteQuery,
  useCastTrailVoteMutation,
  useGetTrailBoardQuery,
  useGetTrailPilotsQuery,
  useSetTrailPilotOpenMutation,
  useSetTrailVoteOpenMutation,
  useSetTrailChegadaOpenMutation,
  useReleaseTrailRoomMutation,
  useReleaseTrailRunMutation,
  useDeleteAccountMutation,
  useGetCompanyQuery,
  useUpdateCompanyMutation,
  useGetKnowledgeDocsQuery,
  useUploadKnowledgeDocMutation,
  useAddKnowledgeTextMutation,
  useAddKnowledgeUrlMutation,
  useDeleteKnowledgeDocMutation,
  useGetEmbeddingConfigQuery,
  useSetEmbeddingConfigMutation,
  useReindexEmbeddingsMutation,
  useGetConnectorsQuery,
  useCreateConnectorMutation,
  useRevokeConnectorMutation,
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useUpdateProjectStatusMutation,
  useDeleteProjectMutation,
  useAnalyzeProjectMutation,
  useUploadProjectDocumentMutation,
  useGetTaskListsQuery,
  useCreateTaskListMutation,
  useRenameTaskListMutation,
  useDeleteTaskListMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useMoveTaskMutation,
  useDeleteTaskMutation,
  useAddTaskMemberMutation,
  useRemoveTaskMemberMutation,
  useGetAuditEventsQuery,
  useGetAuditSummaryQuery,
  useGetUsageSummaryQuery,
  useGetDatasetsQuery,
  useGetLearnedSkillsQuery,
  useGetSubscriptionStatusQuery,
  useCreatePairCodeMutation,
  useGetChannelsQuery,
  useCreateTelegramChannelMutation,
  useCreateEmailChannelMutation,
  useCreateWhatsAppChannelMutation,
  useSetProviderKeyFallbackMutation,
  useLazyGetWhatsAppStatusQuery,
  useUpdateChannelMutation,
  useGetInboxContactsQuery,
  useGetInboxMessagesQuery,
  useReplyInboxMutation,
  useDeleteChannelMutation,
  useGetMeetingChannelsQuery,
  useCreateMeetingChannelMutation,
  useUpdateMeetingChannelMutation,
  useListMeetingsQuery,
  useCreateMeetingMutation,
  useCancelMeetingMutation,
  useStopMeetingMutation,
  useRemoveMeetingMutation,
  useLazyGetMeetingTranscriptQuery,
  useListMeetingAccountsQuery,
  useConnectMeetingAccountMutation,
  useDisconnectMeetingAccountMutation,
  useStartConnectSessionMutation,
  useFinishConnectSessionMutation,
  useCancelConnectSessionMutation,
  useStartSubscriptionFlowMutation,
  useLazyGetSubscriptionFlowQuery,
  useGetAnthropicAuthUrlMutation,
  useExchangeAnthropicCodeMutation,
  useActivateSubscriptionMutation,
  useDeactivateSubscriptionMutation,
  useRemoveSubscriptionMutation,
  useArchiveLearnedSkillMutation,
  useGetDatasetQuery,
  useGetDatasetRowsQuery,
  useUploadDatasetMutation,
  useUpdateDatasetMutation,
  useUpdateDatasetColumnMutation,
  useDeleteDatasetMutation,
  useGetUsageByAgentQuery,
  useGetUsageByUserQuery,
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetAgentsQuery,
  useGetAgentQuery,
  useCreateAgentMutation,
  useUpdateAgentMutation,
  useDeleteAgentMutation,
  useGetAgentAccessQuery,
  useSetAgentAccessMutation,
  useGetUserAgentAccessQuery,
  useSetUserAgentAccessMutation,
  useGenerateAgentMutation,
  useConfirmAgentsMutation,
  useGetToolsQuery,
  useCreateToolMutation,
  useUpdateToolMutation,
  useDeleteToolMutation,
  useTestToolMutation,
  useGetAgentToolsQuery,
  useSetAgentToolsMutation,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetProviderKeysQuery,
  useCreateProviderKeyMutation,
  useDeleteProviderKeyMutation,
  useTestProviderKeyMutation,
  useGenerateOfficeMutation,
  useConfirmOfficeMutation,
  useGetConversationsQuery,
  useCreateConversationMutation,
  useUpdateConversationMutation,
  useDeleteConversationMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useUploadFileMutation,
  useGetShareStateQuery,
  useShareConversationMutation,
  useRequestShareConversationMutation,
  useGetShareRequestsQuery,
  useResolveShareRequestMutation,
} = api
