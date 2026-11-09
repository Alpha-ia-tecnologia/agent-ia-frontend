import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { StreamEvent } from '@/types'
import { toolLabel } from '@/lib/toolLabel'

/** Especialista acionado pelo Gerente no turno atual. */
export interface TeamMember {
  agentId: string
  name: string
  role: string | null
  task: string
  status: 'working' | 'done' | 'error'
}

interface StreamState {
  /** conversa sendo processada no momento (null = ociosa) */
  activeConversationId: string | null
  /** agente que recebeu a mensagem (o Gerente, na maioria dos turnos) */
  agentId: string | null
  startedAt: number
  /** o que o agente está fazendo agora ("Pensando", "Consultando…") */
  status: string
  team: TeamMember[]
  /** resposta final em streaming */
  streamingText: string
  streamingAgentId: string | null
  isStreaming: boolean
  /** erro do último turno — sobrevive ao fim do stream, com "tentar de novo" */
  error: string | null
  errorConversationId: string | null
}

const initialState: StreamState = {
  activeConversationId: null,
  agentId: null,
  startedAt: 0,
  status: '',
  team: [],
  streamingText: '',
  streamingAgentId: null,
  isStreaming: false,
  error: null,
  errorConversationId: null,
}

const streamSlice = createSlice({
  name: 'stream',
  initialState,
  reducers: {
    streamStarted(
      state,
      action: PayloadAction<{ conversationId: string; agentId?: string }>,
    ) {
      Object.assign(state, initialState, {
        activeConversationId: action.payload.conversationId,
        agentId: action.payload.agentId ?? null,
        startedAt: Date.now(),
        status: 'Pensando',
        isStreaming: true,
      })
    },
    eventReceived(state, action: PayloadAction<StreamEvent>) {
      const ev = action.payload
      switch (ev.type) {
        case 'agent_delegation': {
          const data = (ev.data ?? {}) as {
            status?: TeamMember['status']
            name?: string
            role?: string | null
          }
          if (!ev.agent_id || !data.name) break
          const member: TeamMember = {
            agentId: ev.agent_id,
            name: data.name,
            role: data.role ?? null,
            task: ev.text ?? '',
            status: data.status ?? 'working',
          }
          const i = state.team.findIndex((m) => m.agentId === ev.agent_id)
          if (i === -1) state.team.push(member)
          else state.team[i] = member
          const working = state.team.filter((m) => m.status === 'working')
          state.status = working.length
            ? 'Distribuindo para a equipe'
            : 'Consolidando a resposta'
          break
        }
        case 'tool_call': {
          const label = toolLabel(ev.text)
          if (label) state.status = label
          break
        }
        case 'agent_status':
          if (ev.text) state.status = ev.text
          // o provedor caiu no meio: a reserva refaz a resposta do zero
          if (ev.data?.restart) state.streamingText = ''
          break
        case 'token_chunk':
          state.streamingText += ev.text ?? ''
          if (ev.agent_id) state.streamingAgentId = ev.agent_id
          break
        case 'final_message':
          if (ev.text) state.streamingText = ev.text
          if (ev.agent_id) state.streamingAgentId = ev.agent_id
          state.isStreaming = false
          break
        case 'error':
          state.error = ev.text ?? 'Não foi possível gerar a resposta.'
          state.errorConversationId = state.activeConversationId
          state.isStreaming = false
          break
      }
    },
    streamFinished(state) {
      // o erro fica: a tela mostra o aviso com "tentar de novo"
      const { error, errorConversationId } = state
      Object.assign(state, initialState, { error, errorConversationId })
    },
    streamFailed(state, action: PayloadAction<string>) {
      state.error = action.payload
      state.errorConversationId = state.activeConversationId
      state.isStreaming = false
    },
    errorDismissed(state) {
      state.error = null
      state.errorConversationId = null
    },
  },
})

export const {
  streamStarted,
  eventReceived,
  streamFinished,
  streamFailed,
  errorDismissed,
} = streamSlice.actions
export default streamSlice.reducer
