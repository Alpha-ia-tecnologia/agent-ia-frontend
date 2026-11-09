import { ChartMessage, type ChartSpec } from '@/components/ChartMessage'
import { ReportMessage, type ReportSpec } from '@/components/ReportMessage'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { SpotlightBackground } from '@/components/SpotlightBackground'
import {
  ConversationHeader,
  NoAccessScreen,
  ShareModal,
} from '@/components/ConversationShare'
import {
  useCreateConversationMutation,
  useGetAgentsQuery,
  useGetConversationsQuery,
  useGetMessagesQuery,
  useGetShareStateQuery,
  useSendMessageMutation,
  useUploadFileMutation,
} from '@/api/api'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { errorDismissed } from '@/store/streamSlice'
import { useConversationStream } from '@/lib/useConversationStream'
import { apiErrorMessage } from '@/lib/apiError'
import type { Agent, Message } from '@/types'
import {
  TeamSummary,
  WorkingTurn,
  type TeamEntry,
} from '@/components/chat/TeamActivity'
import {
  AgentAvatar,
  Button,
  EmptyState,
  Skeleton,
  Spinner,
  cx,
} from '@/components/ui'

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const { data: agents } = useGetAgentsQuery()
  const me = useAppSelector((s) => s.auth.user)
  const {
    data: messages,
    isLoading: loadingMessages,
    error: messagesError,
  } = useGetMessagesQuery(conversationId!, { skip: !conversationId })
  const { data: shareState } = useGetShareStateQuery(conversationId!, {
    skip: !conversationId,
  })
  const canWrite = !shareState
    ? true
    : shareState.owner.id === me?.id ||
      shareState.visibility === 'COMPANY' ||
      shareState.participants.some((p) => p.id === me?.id)
  const isOwner = shareState ? shareState.owner.id === me?.id : true
  const noAccess =
    !!conversationId &&
    !!messagesError &&
    typeof messagesError === 'object' &&
    'status' in messagesError &&
    ((messagesError as { status?: number }).status === 404 ||
      (messagesError as { status?: number }).status === 403)
  const [createConversation] = useCreateConversationMutation()
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation()
  const [uploadFile, { isLoading: uploading }] = useUploadFileMutation()
  const stream = useAppSelector((s) => s.stream)
  const dispatch = useAppDispatch()
  const { start } = useConversationStream(conversationId)

  const scrollRef = useRef<HTMLDivElement>(null)
  const agentById = useMemo(() => {
    const map = new Map<string, Agent>()
    agents?.forEach((a) => map.set(a.id, a))
    return map
  }, [agents])

  const isProcessing =
    stream.activeConversationId === conversationId && stream.isStreaming
  const turnError =
    !isProcessing && stream.errorConversationId === conversationId
      ? stream.error
      : null
  // quem está respondendo: o agente do envio; sem ele, o Gerente
  const workingAgent =
    (stream.agentId ? agentById.get(stream.agentId) : undefined) ??
    agents?.find((a) => a.isManager)
  const lastUserMessage = messages
    ?.filter((m) => m.sender.toLowerCase() === 'user' && m.type?.toLowerCase() !== 'file')
    .at(-1)

  const suggestions = useMemo(() => buildSuggestions(agents), [agents])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, stream.team.length, stream.status, stream.streamingText, turnError])

  async function handleSend(
    content: string,
    file: File | null,
    agentId?: string,
    retry = false,
  ) {
    let id = conversationId
    dispatch(errorDismissed())
    try {
      if (!id) {
        const conv = await createConversation({
          title: content.slice(0, 60),
        }).unwrap()
        id = conv.id
      }
      if (file) await uploadFile({ conversationId: id, file }).unwrap()
      const sent = await sendMessage({
        conversationId: id,
        content,
        agentId,
        retry: retry || undefined,
      }).unwrap()
      if (!conversationId) {
        sessionStorage.setItem('aao.pendingStream', id)
        sessionStorage.setItem('aao.pendingAgent', sent.agentId)
        navigate(`/office/c/${id}`)
      } else {
        start(sent.agentId)
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível enviar a mensagem.'))
    }
  }

  // ao navegar para a conversa recém-criada, o stream inicia aqui
  useEffect(() => {
    if (
      conversationId &&
      sessionStorage.getItem('aao.pendingStream') === conversationId
    ) {
      sessionStorage.removeItem('aao.pendingStream')
      const agentId = sessionStorage.getItem('aao.pendingAgent') ?? undefined
      sessionStorage.removeItem('aao.pendingAgent')
      start(agentId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  const onSubmit = handleSend

  const [shareOpen, setShareOpen] = useState(false)

  if (noAccess && conversationId) {
    return <NoAccessScreen conversationId={conversationId} />
  }

  if (!conversationId) {
    return (
      <div className="relative flex h-full flex-col">
        <SpotlightBackground position="absolute" />
        <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6">
          <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center py-8 animate-fade-up text-center">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Como o escritório pode{' '}
              <span className="text-gradient-agents">ajudar</span> hoje?
            </h1>
            <p className="mt-2 text-[13px] text-ink-2 sm:text-sm">
              Sua mensagem vai para o Agente Gerente, que aciona os
              especialistas certos para a tarefa.
            </p>
            <div className="mt-6 text-left sm:mt-8">
              <Composer
                onSend={onSubmit}
                busy={sending || uploading}
                agents={agents}
                autoFocus
              />
              <Suggestions
                items={suggestions}
                onPick={(text) => onSubmit(text, null)}
                disabled={sending || uploading}
              />
              <BetaNotice />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col">
      <SpotlightBackground position="absolute" />
      <div className="relative z-10">
        <ConversationHeader
          shareState={shareState}
          isOwner={isOwner}
          canWrite={canWrite}
          onShare={() => setShareOpen(true)}
        />
        <ProjectChip conversationId={conversationId} />
      </div>
      {shareOpen && shareState && (
        <ShareModal
          conversationId={conversationId}
          shareState={shareState}
          meId={me?.id}
          onClose={() => setShareOpen(false)}
        />
      )}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          {loadingMessages && (
            <div className="space-y-6">
              <Skeleton className="ml-auto h-14 w-2/3 rounded-xl" />
              <Skeleton className="h-24 w-3/4 rounded-xl" />
            </div>
          )}
          {!loadingMessages && messages?.length === 0 && !isProcessing && (
            <EmptyState
              title="Conversa vazia"
              description="Envie uma mensagem para colocar seus agentes para trabalhar."
            />
          )}
          <div className="space-y-6">
            {messages?.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                agent={m.agentId ? agentById.get(m.agentId) : undefined}
                meId={me?.id}
                agentById={agentById}
              />
            ))}

            {/* enquanto não chega texto: quem trabalha e a equipe; quando a
                resposta começa, a árvore recolhe no topo do balão */}
            <AnimatePresence initial={false}>
              {isProcessing && !stream.streamingText && (
                <WorkingTurn
                  key="working"
                  agent={workingAgent}
                  status={stream.status}
                  team={stream.team}
                  agentById={agentById}
                />
              )}
            </AnimatePresence>
            {isProcessing && stream.streamingText && (
              <StreamingBubble
                text={stream.streamingText}
                agent={
                  (stream.streamingAgentId
                    ? agentById.get(stream.streamingAgentId)
                    : undefined) ?? workingAgent
                }
                team={stream.team}
                durationMs={Date.now() - stream.startedAt}
                agentById={agentById}
              />
            )}
            {turnError && (
              <TurnError
                agent={workingAgent}
                text={turnError}
                onRetry={
                  lastUserMessage && canWrite
                    ? () => handleSend(lastUserMessage.content, null, undefined, true)
                    : undefined
                }
                busy={sending}
              />
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-line bg-paper px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto max-w-3xl">
          {canWrite ? (
            <>
              <Composer
                onSend={onSubmit}
                busy={sending || uploading || stream.isStreaming}
                agents={agents}
              />
              <BetaNotice />
            </>
          ) : (
            <p className="rounded-xl border border-line bg-paper-2 px-4 py-3 text-center text-[13px] text-ink-3">
              Você está vendo esta conversa em modo somente leitura. Peça o
              compartilhamento ao dono para poder responder.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/** Chip do projeto quando a conversa acontece no contexto de um. */
function ProjectChip({ conversationId }: { conversationId: string }) {
  const { data: conversations } = useGetConversationsQuery()
  const conv = conversations?.find((c) => c.id === conversationId)
  if (!conv?.projectId) return null
  return (
    <div className="border-b border-line px-4 py-2 sm:px-6">
      <Link
        to={`/office/projects/${conv.projectId}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-2 px-2.5 py-1 text-[12px] font-medium text-ink-2 transition-colors duration-150 hover:border-line-2 hover:text-ink"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18M15 3v12" />
        </svg>
        Conversa do projeto · abrir quadro
      </Link>
    </div>
  )
}

/* ---------- Mensagens ---------- */

function MessageBubble({
  message,
  agent,
  meId,
  agentById,
}: {
  message: Message
  agent?: Agent
  meId?: string
  agentById: Map<string, Agent>
}) {
  const isUser = message.sender.toLowerCase() === 'user'
  const isFile = message.type?.toLowerCase() === 'file'
  // Em conversa compartilhada, identifica quem escreveu (quando não sou eu).
  const authorName =
    message.user && message.user.id !== meId ? message.user.name : null
  if (isUser) {
    return (
      <div className="flex flex-col items-end animate-fade-up">
        {authorName && (
          <span className="mb-1 pr-1 text-[11px] font-medium text-ink-3">{authorName}</span>
        )}
        {isFile ? (
          <div className="flex items-center gap-2 rounded-2xl rounded-br-md border border-line bg-paper-2 px-4 py-2.5 text-sm text-ink-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
            {message.content}
          </div>
        ) : (
          <div className="max-w-[80%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm text-paper whitespace-pre-wrap">
            {message.content}
          </div>
        )}
      </div>
    )
  }
  return (
    <div className="flex gap-3 animate-fade-up">
      <AgentAvatar
        seed={agent?.avatarSeed ?? 'aao'}
        size={30}
        className="mt-0.5"
      />
      <div className="min-w-0 max-w-[85%]">
        {agent && (
          <p className="mb-1 flex items-baseline gap-1.5 text-[12px] leading-none">
            <span className="font-semibold text-ink">{agent.name}</span>
            {agent.role && <span className="truncate text-ink-3">{agent.role}</span>}
          </p>
        )}
        {Array.isArray(message.metadata?.team) && (
          <TeamSummary
            team={message.metadata.team as TeamEntry[]}
            durationMs={
              typeof message.metadata.durationMs === 'number'
                ? message.metadata.durationMs
                : undefined
            }
            agentById={agentById}
          />
        )}
        <div className="prose-chat text-sm text-ink">
          <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
        </div>
        {Array.isArray(message.metadata?.charts) &&
          (message.metadata.charts as ChartSpec[]).map((spec, i) => (
            <ChartMessage key={i} spec={spec} />
          ))}
        {Array.isArray(message.metadata?.reports) &&
          (message.metadata.reports as ReportSpec[]).map((spec, i) => (
            <ReportMessage key={i} spec={spec} />
          ))}
      </div>
    </div>
  )
}

function StreamingBubble({
  text,
  agent,
  team,
  durationMs,
  agentById,
}: {
  text: string
  agent?: Agent
  team: TeamEntry[]
  durationMs: number
  agentById: Map<string, Agent>
}) {
  return (
    <div className="flex gap-3">
      <AgentAvatar
        seed={agent?.avatarSeed ?? 'aao'}
        size={30}
        className="mt-0.5"
      />
      <div className="min-w-0 max-w-[85%]">
        {agent && (
          <p className="mb-1 flex items-baseline gap-1.5 text-[12px] leading-none">
            <span className="font-semibold text-ink">{agent.name}</span>
            {agent.role && <span className="truncate text-ink-3">{agent.role}</span>}
          </p>
        )}
        <TeamSummary team={team} durationMs={durationMs} agentById={agentById} />
        <div className="prose-chat stream-caret text-sm text-ink">
          <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
        </div>
      </div>
    </div>
  )
}

/** O turno falhou: diz o que houve e deixa tentar de novo — nunca some calado. */
function TurnError({
  agent,
  text,
  onRetry,
  busy,
}: {
  agent?: Agent
  text: string
  onRetry?: () => void
  busy: boolean
}) {
  return (
    <div className="flex gap-3 animate-fade-up" role="alert">
      <AgentAvatar
        seed={agent?.avatarSeed ?? 'aao'}
        size={30}
        className="mt-0.5 opacity-60"
      />
      <div className="min-w-0 max-w-[85%] rounded-xl border border-line bg-paper px-4 py-3">
        <p className="text-[13px] font-medium text-ink">
          {agent?.name ?? 'O agente'} não conseguiu responder
        </p>
        <p className="mt-0.5 text-[13px] text-ink-2">{text}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={busy}
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-line-2 bg-paper px-3 py-1.5 text-[12.5px] font-medium text-ink transition-colors duration-150 hover:border-ink disabled:opacity-50"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M3 12a9 9 0 0115.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 01-15.5 6.3L3 16M3 21v-5h5" />
            </svg>
            Tentar de novo
          </button>
        )}
      </div>
    </div>
  )
}

/* ---------- Composer ---------- */

/** Detecta um "@algo" em digitação imediatamente antes do caret. */
function mentionQueryAt(
  text: string,
  caret: number,
): { start: number; query: string } | null {
  const upToCaret = text.slice(0, caret)
  const at = upToCaret.lastIndexOf('@')
  if (at === -1) return null
  // o @ deve iniciar palavra (início do texto ou após espaço/quebra)
  if (at > 0 && !/[\s]/.test(upToCaret[at - 1])) return null
  const query = upToCaret.slice(at + 1)
  if (/[\n@]/.test(query) || query.length > 30) return null
  return { start: at, query }
}

function Composer({
  onSend,
  busy,
  agents,
  autoFocus,
}: {
  onSend: (
    content: string,
    file: File | null,
    agentId?: string,
  ) => void | Promise<void>
  busy: boolean
  agents?: Agent[]
  autoFocus?: boolean
}) {
  const [value, setValue] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [mention, setMention] = useState<Agent | null>(null)
  const [menu, setMenu] = useState<{ start: number; query: string } | null>(
    null,
  )
  const [highlight, setHighlight] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const options = useMemo(() => {
    if (!menu || !agents) return []
    const q = menu.query.toLowerCase()
    return agents.filter((a) => a.name.toLowerCase().includes(q)).slice(0, 6)
  }, [menu, agents])

  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  function refreshMenu(text: string) {
    const caret = textareaRef.current?.selectionStart ?? text.length
    setMenu(mentionQueryAt(text, caret))
    setHighlight(0)
  }

  function pickAgent(agent: Agent) {
    if (!menu) return
    const caret = textareaRef.current?.selectionStart ?? value.length
    const next = `${value.slice(0, menu.start)}@${agent.name} ${value.slice(caret)}`
    setValue(next)
    setMention(agent)
    setMenu(null)
    textareaRef.current?.focus()
  }

  function submit() {
    const content = value.trim()
    if (!content || busy) return
    // a menção só vale se o @Nome continuar no texto enviado
    const agentId =
      mention && content.includes(`@${mention.name}`) ? mention.id : undefined
    void onSend(content, file, agentId)
    setValue('')
    setFile(null)
    setMention(null)
    setMenu(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (menu && options.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlight((h) => (h + 1) % options.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlight((h) => (h - 1 + options.length) % options.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        pickAgent(options[highlight])
        return
      }
      if (e.key === 'Escape') {
        setMenu(null)
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="relative rounded-2xl border border-line bg-paper transition-colors duration-150 focus-within:border-ink hover:border-line-2 focus-within:hover:border-ink">
      {menu && options.length > 0 && (
        <div className="absolute inset-x-3 bottom-full z-10 mb-2 overflow-hidden rounded-xl border border-line bg-paper shadow-lg">
          {options.map((a, i) => (
            <button
              key={a.id}
              onMouseDown={(e) => {
                e.preventDefault()
                pickAgent(a)
              }}
              onMouseEnter={() => setHighlight(i)}
              className={cx(
                'flex w-full items-center gap-2.5 px-3 py-2 text-left',
                i === highlight ? 'bg-paper-3' : 'bg-paper',
              )}
            >
              <AgentAvatar seed={a.avatarSeed} size={24} />
              <span className="truncate text-[13px] font-medium">{a.name}</span>
              <span className="ml-auto truncate text-[11px] text-ink-3">
                {a.role}
              </span>
            </button>
          ))}
        </div>
      )}
      {mention && value.includes(`@${mention.name}`) && (
        <div className="flex items-center gap-2 border-b border-line px-4 py-2 text-[12px] text-ink-2">
          <AgentAvatar seed={mention.avatarSeed} size={18} />
          <span>
            <span className="font-medium">{mention.name}</span> vai responder
            esta mensagem
          </span>
          <button
            onClick={() => setMention(null)}
            className="ml-auto text-ink-3 hover:text-danger"
            aria-label="Remover menção"
          >
            ✕
          </button>
        </div>
      )}
      {file && (
        <div className="flex items-center gap-2 border-b border-line px-4 py-2 text-[13px] text-ink-2">
          <span>📎 {file.name}</span>
          <button
            onClick={() => setFile(null)}
            className="text-ink-3 hover:text-danger"
            aria-label="Remover anexo"
          >
            ✕
          </button>
        </div>
      )}
      <textarea
        ref={textareaRef}
        rows={2}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          refreshMenu(e.target.value)
          autoResize()
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setMenu(null)}
        placeholder="Escreva uma mensagem… (@ menciona um agente, Enter envia)"
        className="block w-full resize-none bg-transparent px-4 pt-3.5 text-sm text-ink outline-none placeholder:text-ink-3"
        style={{ outline: 'none' }}
      />
      <div className="flex items-center justify-between px-3 pb-3 pt-1">
        <input
          ref={fileRef}
          type="file"
          hidden
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button
          onClick={() => fileRef.current?.click()}
          aria-label="Anexar arquivo"
          className="rounded-lg p-2 text-ink-3 transition-colors duration-150 hover:bg-paper-3 hover:text-ink"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <Button
          onClick={submit}
          disabled={busy || !value.trim()}
          className="h-8 px-4"
        >
          {busy ? (
            <Spinner className="border-t-paper border-paper/40" />
          ) : (
            'Enviar'
          )}
        </Button>
      </div>
    </div>
  )
}

/* ---------- Sugestões (tela vazia) ---------- */

const GENERIC_SUGGESTIONS = [
  'Me dê um resumo dos principais números do mês.',
  'Organize minhas tarefas e prioridades para esta semana.',
  'Ajude a responder uma dúvida de um cliente sobre nossos serviços.',
  'Escreva uma comunicação interna para a equipe.',
]

/** Modelo de pedido por domínio, casado pelo nome do setor/papel do agente. */
function suggestionForDomain(name: string): string | null {
  const n = name.toLowerCase()
  if (/financ|cont(á|a)b|fp&a|fpa|caixa/.test(n))
    return 'Peça ao Financeiro um resumo dos números do mês.'
  if (/market|divulg|social|conte(ú|u)do/.test(n))
    return 'Crie um plano de marketing para a próxima campanha.'
  if (/jur(í|i)|legal|contrat|complian/.test(n))
    return 'Analise um contrato e aponte os principais riscos.'
  if (/vend|comerc|neg(ó|o)ci/.test(n))
    return 'Monte um follow-up para os clientes em negociação.'
  if (/atend|suporte|client|sac/.test(n))
    return 'Ajude a responder uma dúvida de um cliente.'
  if (/oper|process|log(í|i)st/.test(n))
    return 'Organize os processos e as tarefas da semana.'
  if (/rh|pessoas|recursos|gente/.test(n))
    return 'Escreva uma comunicação interna para a equipe.'
  if (/dado|bi|analy|indicador|m(é|e)trica/.test(n))
    return 'Gere um gráfico com os principais indicadores.'
  return null
}

/** Sugestões contextuais a partir dos setores/papéis dos agentes da empresa. */
function buildSuggestions(agents?: Agent[]): string[] {
  if (!agents || agents.length === 0) return GENERIC_SUGGESTIONS.slice(0, 6)

  const specialists = agents.filter((a) => !a.isManager)
  const depts = Array.from(
    new Set(specialists.map((a) => a.department?.name).filter(Boolean)),
  ) as string[]
  const domains = depts.length
    ? depts
    : (Array.from(new Set(specialists.map((a) => a.role).filter(Boolean))) as string[])

  const out: string[] = []
  for (const d of domains) {
    const s = suggestionForDomain(d) ?? `Peça ajuda ao setor de ${d}.`
    if (!out.includes(s)) out.push(s)
  }
  for (const g of GENERIC_SUGGESTIONS) {
    if (out.length >= 6) break
    if (!out.includes(g)) out.push(g)
  }
  return out.slice(0, 6)
}

function Suggestions({
  items,
  onPick,
  disabled,
}: {
  items: string[]
  onPick: (text: string) => void
  disabled?: boolean
}) {
  if (items.length === 0) return null
  return (
    <div className="mt-5">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-3">
        Sugestões
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((prompt, i) => (
          <button
            key={prompt}
            onClick={() => onPick(prompt)}
            disabled={disabled}
            className={cx(
              'group flex items-start gap-2 rounded-xl border border-line bg-paper/70 px-3.5 py-3 text-left backdrop-blur-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-line-2 hover:bg-paper hover:shadow-[0_8px_24px_-14px_rgb(24_24_27/0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-50',
              // em telas pequenas, mostra só as 3 primeiras
              i >= 3 && 'hidden sm:flex',
            )}
          >
            <span className="line-clamp-2 min-w-0 flex-1 text-[13px] text-ink-2 group-hover:text-ink">
              {prompt}
            </span>
            <span
              aria-hidden
              className="mt-0.5 shrink-0 text-ink-3 opacity-0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-ink group-hover:opacity-100"
            >
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

/** Aviso de beta exibido sob o campo de mensagem. */
function BetaNotice() {
  return (
    <p className="mt-2 text-center text-[11px] text-ink-3">
      A plataforma está em fase beta. Erros e respostas imprecisas
      podem acontecer, verifique informações importantes antes de decidir.
    </p>
  )
}
