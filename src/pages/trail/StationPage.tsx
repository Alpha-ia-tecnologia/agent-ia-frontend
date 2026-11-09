import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import { Link, Navigate, useParams } from 'react-router-dom'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import {
  useAnswerTrailStepMutation,
  useAttachTrailDocumentMutation,
  useGetTrailActivityQuery,
  useGetTrailAgentsQuery,
  useGetTrailMuralQuery,
  useGetTrailSessionQuery,
  useGetTrailStateQuery,
  useGetTrailStationsQuery,
} from '@/api/api'
import { Spinner } from '@/components/ui'
import { Badge, Button, Icon, Modal, ProgressBar } from '@/design-system'
import { apiErrorMessage } from '@/lib/apiError'
import { useAppSelector } from '@/store/hooks'
import { AgentCorner, AgentOffice } from './AgentOffice'
import { Medal, TrailShell } from './components'
import { CHEGADA, L, LARGADA, TOTAL_STATIONS as TOTAL } from './labels'
import type {
  TrailActivity,
  TrailDocumentOption,
  TrailMe,
  TrailMessage,
  TrailMural,
  TrailRun,
  TrailSession,
  TrailStation,
} from './types'

const ATTACH_MS = 900
const FIRST_MESSAGE_MS = 900
const GUIDE_NAME = 'Guia da Trilha'
const SESSION_POLL_MS = 15000
const MURAL_POLL_MS = 8000
const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches

function Message({ message }: { message: TrailMessage }) {
  if (message.role === 'event') {
    return (
      <div className="chat-event">
        <Icon name="file" size={16} />
        {message.content}
      </div>
    )
  }
  if (message.role === 'assistant') {
    return (
      <div className="bubble bubble--ia">
        <div className="bubble__who">
          <Badge tone="ia">IA</Badge>
          {message.authorName}
        </div>
        <div className="prose-chat bubble__md">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
      </div>
    )
  }
  return <div className="bubble bubble--me">{message.content}</div>
}

function Typing({ who }: { who: string }) {
  return (
    <div className="bubble bubble--ia bubble--typing" role="status">
      <span className="typing-dots" aria-hidden>
        <span />
        <span />
        <span />
      </span>
      {who} está escrevendo
    </div>
  )
}

function DocumentOptions({
  label,
  documents,
  attaching,
  disabled,
  onAttach,
}: {
  label: string
  documents: TrailDocumentOption[]
  attaching: { id: string; value: number } | null
  disabled: boolean
  onAttach: (doc: TrailDocumentOption) => void
}) {
  return (
    <div className="doc-options">
      <p className="doc-options__label">{label}</p>
      {documents.map((doc) => (
        <button
          key={doc.id}
          type="button"
          className="doc-option"
          disabled={disabled}
          onClick={() => onAttach(doc)}
        >
          <span className="doc-option__icon">
            <Icon name="file" size={20} />
          </span>
          <span className="doc-option__text">
            <strong>{doc.title}</strong>
            <span>{doc.subtitle}</span>
            {attaching?.id === doc.id && (
              <ProgressBar label="Anexando" value={attaching.value} valueText="Anexando" />
            )}
          </span>
          <span className="doc-option__action">
            <Icon name="upload" size={16} />
            Anexar
          </span>
        </button>
      ))}
    </div>
  )
}

function Steps({ session }: { session: TrailSession }) {
  return (
    <ol className="conv-steps" aria-label="Passos desta etapa">
      {session.steps.map((step) => (
        <li key={step.key} className={`conv-step conv-step--${step.status}`}>
          <Icon name={step.status === 'done' ? 'check-circle' : 'clock'} size={16} />
          <span>{step.title}</span>
          {session.stage.number !== LARGADA && <span className="conv-step__min">{step.minutes} min</span>}
        </li>
      ))}
    </ol>
  )
}

function TableProgress({ table }: { table: TrailMural['table'] }) {
  const value = Math.min(100, Math.round((table.doneCount / table.quorum) * 100))
  const label = table.medal ? 'Medalha da mesa conquistada' : 'Medalha da mesa'
  const text = `${table.doneCount} de ${table.medal ? table.memberCount : table.quorum}`
  return <ProgressBar label={label} value={value} valueText={text} />
}

function Mural({ data, showMedal }: { data: TrailMural | undefined; showMedal: boolean }) {
  if (!data) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    )
  }
  return (
    <section className="mural" aria-label={`Mural da ${data.table.name}`}>
      <p className="ds-overline">Mural da {data.table.name}</p>
      {showMedal && <TableProgress table={data.table} />}
      <ul className="mural-people">
        {data.people.map((p, i) => (
          <li key={`${p.name}-${i}`} className={`person person--${p.status}`}>
            <span className="person__dot" aria-hidden />
            <span className="person__name">
              {p.name}
              {p.mine ? ' (você)' : ''}
            </span>
            <span className="person__status">
              {p.status === 'done' ? 'Concluiu' : p.status === 'active' ? p.step : 'Ainda não começou'}
            </span>
          </li>
        ))}
      </ul>
      {data.notes.length === 0 ? (
        <p className="ds-small ds-muted" style={{ margin: 0 }}>
          O que a mesa concluir em cada passo aparece aqui.
        </p>
      ) : (
        <ul className="mural-notes">
          {data.notes.map((n) => (
            <li key={n.id} className={n.isIdea ? 'note note--idea' : 'note'}>
              <p className="note__who">
                {n.authorName}
                {n.department ? ` · ${n.department}` : ''}
              </p>
              <p className="note__label">{n.label}</p>
              <p className="note__text">{n.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function nextOf(stage: number) {
  if (stage === CHEGADA) return { to: '/trilha/plano', label: 'Montar meu plano de 90 dias' }
  if (stage === TOTAL) return { to: '/trilha/piloto', label: 'Ir para a escolha do piloto' }
  return { to: `/trilha/estacao/${stage + 1}`, label: `Começar a ${L.station} ${stage + 1}` }
}

function Workspace({
  stageNumber,
  station,
  run,
}: {
  stageNumber: number
  station: TrailStation | undefined
  run: TrailRun
}) {
  const [tab, setTab] = useState<'chat' | 'mural'>('chat')
  const { data: session } = useGetTrailSessionQuery(stageNumber, { pollingInterval: SESSION_POLL_MS })
  // no celular o mural só é consultado com a aba aberta: são centenas de aparelhos
  const { data: mural } = useGetTrailMuralQuery(stageNumber, {
    skip: tab !== 'mural' && !isDesktop(),
    pollingInterval: MURAL_POLL_MS,
  })
  const { data: agents = [] } = useGetTrailAgentsQuery()
  const [attach, { isLoading: analyzing }] = useAttachTrailDocumentMutation()
  const [answer, { isLoading: answering }] = useAnswerTrailStepMutation()
  const [draft, setDraft] = useState('')
  const [sent, setSent] = useState<{ text: string; count: number } | null>(null)
  const [attaching, setAttaching] = useState<{ id: string; value: number } | null>(null)
  const [showDocument, setShowDocument] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const promptLoaded = useRef(false)

  const working = !!session?.busy || answering || analyzing
  const { data: serverActivities = [] } = useGetTrailActivityQuery(undefined, {
    pollingInterval: working ? 2500 : isDesktop() ? 6000 : 0,
  })

  const messageCount = session?.messages.length ?? 0
  const isFresh = messageCount === 1 && session?.messages[0].role === 'assistant'

  // a primeira mensagem chega como em uma conversa, depois de um instante
  useEffect(() => {
    if (!session) return
    if (!isFresh) {
      setRevealed(true)
      return
    }
    const timer = setTimeout(() => setRevealed(true), FIRST_MESSAGE_MS)
    return () => clearTimeout(timer)
  }, [isFresh, session])

  // a própria mensagem fica na tela até a resposta do servidor chegar
  useEffect(() => {
    if (sent && messageCount > sent.count) setSent(null)
  }, [messageCount, sent])

  // ao anexar o documento, o prompt de partida entra no campo para ajustar
  useEffect(() => {
    if (session?.phase === 'prompt' && !promptLoaded.current) {
      promptLoaded.current = true
      setDraft(session.startPrompt)
    }
    if (session?.phase !== 'prompt') promptLoaded.current = false
  }, [session?.phase, session?.startPrompt])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`
  }, [draft, session?.phase])

  useEffect(() => {
    if (!revealed || tab !== 'chat') return
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // o campo de resposta é o último item da página: a última mensagem fica logo acima dele
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: calm ? 'auto' : 'smooth' })
  }, [messageCount, sent, working, revealed, session?.phase, tab])

  useEffect(() => {
    if (tab === 'mural') window.scrollTo({ top: 0 })
  }, [tab])

  // a mesa do Guia reage na hora, antes da próxima consulta ao servidor
  const localAction = analyzing || attaching ? 'analysis' : answering ? 'turn' : null
  const myActivities = serverActivities.filter((a) => a.mine)
  const shownCorner: TrailActivity[] =
    localAction && !myActivities.some((a) => a.phase !== 'done')
      ? [
          {
            id: 'local',
            runName: run.name,
            station: stageNumber,
            action: localAction,
            agentSlug: 'orquestrador',
            agentName: '',
            phase: 'routing',
            mine: true,
          },
        ]
      : myActivities

  function startAttach(doc: TrailDocumentOption) {
    if (attaching || analyzing) return
    setAttaching({ id: doc.id, value: 8 })
    const timer = setInterval(() => {
      setAttaching((a) => (a ? { ...a, value: Math.min(100, a.value + 18) } : a))
    }, ATTACH_MS / 6)
    setTimeout(() => {
      clearInterval(timer)
      setAttaching(null)
      attach({ station: stageNumber, documentId: doc.id })
        .unwrap()
        .catch((err: unknown) => {
          toast.error(apiErrorMessage(err, 'Não foi possível anexar. Tente de novo.'))
        })
    }, ATTACH_MS)
  }

  async function send(text: string) {
    const content = text.trim()
    if (!content || working) return
    setDraft('')
    setSent({ text: content, count: messageCount })
    try {
      await answer({ station: stageNumber, content }).unwrap()
    } catch (err) {
      setSent(null)
      setDraft(content)
      toast.error(apiErrorMessage(err, 'A conexão caiu. Seu texto continua no campo: tente de novo.'))
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(draft)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && isDesktop()) {
      e.preventDefault()
      void send(draft)
    }
  }

  if (!session) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  const isLargada = stageNumber === LARGADA
  const isChegada = stageNumber === CHEGADA
  const isTrailStation = !isLargada && !isChegada
  const canType = session.phase === 'answer' || session.phase === 'prompt'
  const pendingEcho = sent && messageCount <= sent.count ? sent.text : null
  const current = session.steps.find((s) => s.status === 'current')
  const typingWho =
    current?.key === 'solucao' && station?.specialist ? station.specialist : GUIDE_NAME
  const showOptions = revealed && canType && !working && session.options.length > 0
  const next = nextOf(stageNumber)
  const noteCount = mural?.notes.length ?? 0
  const placeLabel = isTrailStation ? `${L.station} ${stageNumber} de ${TOTAL}` : session.stage.title

  return (
    <div className="conv">
      <header className="conv-head">
        <Link to="/trilha/mapa" className="conv-back" aria-label="Ver o mapa da trilha">
          <Icon name="chevron-left" size={24} />
        </Link>
        {isTrailStation && <Medal number={stageNumber} earned={session.table.medal} size={40} />}
        <div className="conv-head__text">
          <p className="ds-overline">
            {placeLabel} · {run.name}
          </p>
          <h1 className="conv-title">{session.stage.title}</h1>
        </div>
        {session.document && (
          <Button
            variant="ghost"
            size="sm"
            icon="file"
            aria-label="Abrir o documento anexado"
            onClick={() => setShowDocument(true)}
          />
        )}
      </header>

      {session.steps.length > 1 && <Steps session={session} />}

      <div className="conv-tabs" role="tablist" aria-label="Conversa e mural">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'chat'}
          className="conv-tab"
          onClick={() => setTab('chat')}
        >
          Minha conversa
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'mural'}
          className="conv-tab"
          onClick={() => setTab('mural')}
        >
          Mural da mesa{noteCount > 0 ? ` (${noteCount})` : ''}
        </button>
      </div>

      <div className="conv-grid" data-tab={tab}>
        <section className="conv-chat" aria-label="Minha conversa">
          <div className="conv-log" aria-live="polite">
            {!revealed && <Typing who={GUIDE_NAME} />}
            {revealed && session.messages.map((m) => <Message key={m.id} message={m} />)}
            {pendingEcho && <div className="bubble bubble--me">{pendingEcho}</div>}
            {working && <Typing who={typingWho} />}
            {session.phase === 'attach' && !working && (
              <DocumentOptions
                label={session.attachLabel}
                documents={session.documents}
                attaching={attaching}
                disabled={!!attaching}
                onAttach={startAttach}
              />
            )}
            {session.completed && (
              <div className="conv-done">
                {session.idea && (
                  <div className="conv-idea">
                    <p className="ds-overline">Ideia anotada no mural</p>
                    <p className="conv-idea__text">{session.idea}</p>
                  </div>
                )}
                {isTrailStation && <TableProgress table={session.table} />}
                <Link to={next.to}>
                  <Button variant="primary" iconRight="chevron-right" fullWidth>
                    {next.label}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {canType && revealed && (
            <form className="conv-composer" onSubmit={onSubmit}>
              {session.phase === 'prompt' && (
                <p className="conv-hint">
                  <Icon name="lightbulb" size={16} />
                  Um bom pedido tem papel, tarefa, público, contexto, formato e limites.
                </p>
              )}
              {showOptions && (
                <div className="chips" role="group" aria-label="Respostas sugeridas">
                  {session.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className="chip"
                      onClick={() => void send(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
              <div className="composer-row">
                <textarea
                  ref={inputRef}
                  className="composer-input"
                  rows={1}
                  maxLength={20000}
                  value={draft}
                  placeholder={session.options.length ? 'Ou escreva aqui' : 'Escreva sua resposta'}
                  aria-label="Sua resposta"
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKeyDown}
                />
                <Button
                  type="submit"
                  variant="primary"
                  icon="send"
                  aria-label={session.phase === 'prompt' ? 'Enviar o prompt' : 'Enviar resposta'}
                  disabled={!draft.trim() || working}
                />
              </div>
              <p className="conv-privacy">Não escreva dados pessoais nem sigilosos.</p>
            </form>
          )}
        </section>

        <aside className="conv-side">
          {agents.length > 0 && (
            <div className="conv-office">
              <AgentOffice agents={agents} activities={serverActivities} compact />
            </div>
          )}
          <Mural data={mural} showMedal={isTrailStation} />
          {!isLargada && (
            <p className="conv-care">
              <strong>Cuidado nesta {isChegada ? 'etapa' : L.station.toLowerCase()}.</strong> {session.stage.care}
            </p>
          )}
        </aside>
      </div>

      <AgentCorner agents={agents} activities={working ? shownCorner : []} />
      {session.document && (
        <Modal open={showDocument} title={session.document.title} onClose={() => setShowDocument(false)} size="lg">
          <pre className="document-text">{session.document.text}</pre>
        </Modal>
      )}
    </div>
  )
}

function canOpen(me: TrailMe, stage: number) {
  if (stage === CHEGADA) return me.chegadaOpen
  return stage === LARGADA || stage <= me.maxOpen
}

export default function StationPage() {
  const { n = '0' } = useParams()
  const number = Number(n)
  const userName = useAppSelector((s) => s.auth.user?.name)
  const { data: stations } = useGetTrailStationsQuery()
  const { data: state, isLoading } = useGetTrailStateQuery(undefined, { pollingInterval: 20000 })

  if (isLoading || !stations || !state) {
    return (
      <TrailShell userName={userName}>
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </TrailShell>
    )
  }

  const station = stations.find((s) => s.number === number)
  const known = number === LARGADA || number === CHEGADA || !!station
  if (!known || !state.run || !state.me || !canOpen(state.me, number)) {
    return <Navigate to="/trilha" replace />
  }

  return (
    <TrailShell userName={userName} flush>
      <Workspace key={number} stageNumber={number} station={station} run={state.run} />
    </TrailShell>
  )
}
