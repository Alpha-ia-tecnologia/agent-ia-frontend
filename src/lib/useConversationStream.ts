import { useEffect, useRef } from 'react'
import { API_BASE, api } from '@/api/api'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  eventReceived,
  streamFailed,
  streamFinished,
  streamStarted,
} from '@/store/streamSlice'
import type { StreamEvent } from '@/types'

/** A API manda ping a cada 15 s: sem nada por este tempo, a conexão morreu. */
const SILENCE_MS = 45_000

/**
 * Assina o SSE de uma conversa enquanto ela estiver processando.
 * Chame `start()` logo após enviar uma mensagem.
 */
export function useConversationStream(conversationId: string | undefined) {
  const dispatch = useAppDispatch()
  const token = useAppSelector((s) => s.auth.token)
  const sourceRef = useRef<EventSource | null>(null)
  const watchdogRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const close = () => {
    sourceRef.current?.close()
    sourceRef.current = null
    if (watchdogRef.current) clearInterval(watchdogRef.current)
    watchdogRef.current = null
  }

  /** Encerra o turno: recarrega o que foi gravado e limpa o estado ao vivo. */
  const finish = (id: string) => {
    close()
    dispatch(api.util.invalidateTags(['Task', 'TaskList', 'Project', 'Usage']))
    dispatch(
      api.util.invalidateTags([{ type: 'Message', id }, 'Conversation']),
    )
    dispatch(streamFinished())
  }

  const start = (agentId?: string) => {
    if (!conversationId || !token) return
    const id = conversationId
    close()
    dispatch(streamStarted({ conversationId: id, agentId }))
    const url = `${API_BASE}/conversations/${id}/stream?token=${encodeURIComponent(token)}`
    const es = new EventSource(url)
    sourceRef.current = es

    let lastEventAt = Date.now()
    watchdogRef.current = setInterval(() => {
      if (Date.now() - lastEventAt < SILENCE_MS) return
      dispatch(
        streamFailed('A conexão com o servidor caiu antes da resposta. Tente de novo.'),
      )
      finish(id)
    }, 5_000)

    es.onmessage = (msg) => {
      lastEventAt = Date.now()
      let ev: StreamEvent
      try {
        ev = JSON.parse(msg.data) as StreamEvent
      } catch {
        return
      }
      if (ev.type === 'ping') return
      dispatch(eventReceived(ev))
      // agente mexeu em tarefas/agentes/usuários via tool → atualiza as telas na hora
      if (ev.type === 'tool_call' && typeof ev.text === 'string') {
        if (ev.text.includes('tarefas_')) {
          dispatch(api.util.invalidateTags(['Task', 'TaskList', 'Project']))
        }
        if (ev.text.includes('agentes_criar')) {
          dispatch(api.util.invalidateTags(['Agent']))
        }
        if (ev.text.includes('usuarios_criar')) {
          dispatch(api.util.invalidateTags(['User']))
        }
      }
      if (ev.type === 'final_message' || ev.type === 'error') finish(id)
    }

    es.onerror = () => {
      // EventSource tenta reconectar sozinho; só falha de vez se fechado
      if (es.readyState === EventSource.CLOSED) {
        dispatch(streamFailed('A conexão com o servidor caiu. Tente de novo.'))
        finish(id)
      }
    }
  }

  useEffect(() => close, [conversationId])

  return { start, stop: close }
}
