import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { avatarUri } from '@/lib/avatar'
import { L } from './labels'
import type { OfficeAgent, TrailActivity } from './types'
import './office.css'

const ORCHESTRATOR = 'orquestrador'

type DeskState = 'idle' | 'routing' | 'working' | 'done'

interface Flight {
  id: string
  label: string
  from: { x: number; y: number }
  to: { x: number; y: number }
}

/** "Especialista em Acessibilidade" cabe melhor na mesa como "Acessibilidade". */
const shortName = (agent: OfficeAgent) => (agent.station ? agent.role : agent.name)

function describe(activity: TrailActivity, showRoom: boolean): string {
  if (activity.phase === 'routing') return 'Direcionando a ação'
  if (activity.phase === 'done') return showRoom ? `Entregue à ${activity.runName}` : 'Entrega concluída'
  if (activity.action === 'plan') {
    return showRoom ? `Planejando para a ${activity.runName}` : 'Montando o seu plano'
  }
  if (activity.action === 'analysis') {
    return showRoom ? `Analisando para a ${activity.runName}` : 'Analisando o documento'
  }
  return showRoom ? `Atendendo a ${activity.runName}` : 'Lendo sua resposta'
}

function deskState(mine: TrailActivity[]): DeskState {
  if (mine.some((a) => a.phase === 'working')) return 'working'
  if (mine.some((a) => a.phase === 'routing')) return 'routing'
  if (mine.length > 0) return 'done'
  return 'idle'
}

/** Mesa com o agente, o monitor e o teclado; as animações vêm de office.css. */
function DeskStage({ seed }: { seed: string }) {
  return (
    <div className="desk-stage" aria-hidden>
      <svg className="desk-stage__art" viewBox="0 0 170 92">
        <rect x="88" y="6" width="72" height="48" rx="5" fill="var(--navy-900)" />
        <rect className="art-screen" x="93" y="11" width="62" height="38" rx="2" />
        <g>
          <rect className="art-line" x="98" y="16" width="40" height="3" rx="1.5" />
          <rect className="art-line" x="98" y="23" width="50" height="3" rx="1.5" />
          <rect className="art-line" x="98" y="30" width="32" height="3" rx="1.5" />
          <rect className="art-line" x="98" y="37" width="44" height="3" rx="1.5" />
        </g>
        <path
          className="art-check"
          d="M114 30 l7 8 l14 -16"
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="119" y="54" width="10" height="9" fill="var(--navy-900)" />
      </svg>
      <div className="desk-stage__agent">
        <img src={avatarUri(seed)} alt="" />
      </div>
      <svg className="desk-stage__front" viewBox="0 0 170 92">
        <rect x="4" y="63" width="162" height="9" rx="3" fill="var(--paper-50)" opacity="0.9" />
        <rect x="16" y="72" width="7" height="20" fill="var(--paper-50)" opacity="0.55" />
        <rect x="147" y="72" width="7" height="20" fill="var(--paper-50)" opacity="0.55" />
        <rect x="16" y="56" width="50" height="7" rx="2" fill="var(--navy-900)" />
        <circle className="art-hand" cx="30" cy="55" r="4" />
        <circle className="art-hand art-hand--right" cx="52" cy="55" r="4" />
        <rect className="art-paper" x="72" y="58" width="16" height="5" rx="1" opacity="0.7" />
        <rect className="art-paper art-paper--top" x="74" y="54" width="16" height="5" rx="1" />
      </svg>
    </div>
  )
}

export function AgentOffice({
  agents,
  activities,
  showRoom = false,
  compact = false,
}: {
  agents: OfficeAgent[]
  activities: TrailActivity[]
  /** no telão, cada ação mostra de qual mesa veio */
  showRoom?: boolean
  /** versão baixa, para deixar a conversa em primeiro plano */
  compact?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const desks = useRef(new Map<string, HTMLDivElement>())
  const dispatched = useRef(new Set<string>())
  const [flights, setFlights] = useState<Flight[]>([])
  const reduceMotion = useReducedMotion()

  // cada ação direcionada a um especialista voa uma vez até a mesa dele
  useEffect(() => {
    if (reduceMotion || !rootRef.current) return
    const root = rootRef.current.getBoundingClientRect()
    const origin = desks.current.get(ORCHESTRATOR)?.getBoundingClientRect()
    if (!origin) return
    const center = (r: DOMRect) => ({
      x: r.left - root.left + r.width / 2 - 46,
      y: r.top - root.top + r.height / 2 - 20,
    })
    const created: Flight[] = []
    for (const a of activities) {
      if (a.agentSlug === ORCHESTRATOR || dispatched.current.has(a.id)) continue
      dispatched.current.add(a.id)
      const target = desks.current.get(a.agentSlug)?.getBoundingClientRect()
      if (target) {
        created.push({
          id: a.id,
          label: `${L.station} ${a.station}`,
          from: center(origin),
          to: center(target),
        })
      }
    }
    if (created.length) setFlights((f) => [...f, ...created])
  }, [activities, reduceMotion])

  // especialistas à direita de quem distribui as ações
  const ordered = [
    ...agents.filter((a) => a.slug === ORCHESTRATOR),
    ...agents.filter((a) => a.slug !== ORCHESTRATOR),
  ]

  return (
    <section
      className={`office ${compact ? 'office--compact' : ''}`}
      ref={rootRef}
      aria-label="Escritório de agentes"
    >
      <p className="office__title">Escritório de agentes</p>
      <div className="office__floor">
        {ordered.map((agent) => {
          const mine = activities.filter((a) => a.agentSlug === agent.slug)
          const state = deskState(mine)
          const shown = mine.find((a) => a.phase !== 'done') ?? mine[0]
          const extra = mine.filter((a) => a.phase !== 'done').length - 1
          return (
            <div
              key={agent.slug}
              className={`desk desk--${state}`}
              ref={(el) => {
                if (el) desks.current.set(agent.slug, el)
                else desks.current.delete(agent.slug)
              }}
            >
              {shown && (
                <div className="desk__bubble" role="status">
                  {describe(shown, showRoom)}
                  {extra > 0 && <span className="desk__count">+{extra}</span>}
                </div>
              )}
              <DeskStage seed={agent.avatarSeed} />
              <p className="desk__name">{shortName(agent)}</p>
              <p className="desk__role">{agent.station ? `${L.station} ${agent.station}` : 'Conduz a trilha'}</p>
            </div>
          )
        })}
      </div>

      <AnimatePresence>
        {flights.map((f) => (
          <motion.div
            key={f.id}
            className="task-card"
            initial={{ x: f.from.x, y: f.from.y, opacity: 0, scale: 0.7 }}
            animate={{ x: f.to.x, y: f.to.y, opacity: [0, 1, 1, 0], scale: 1 }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
            onAnimationComplete={() => setFlights((all) => all.filter((x) => x.id !== f.id))}
          >
            {f.label}
            <span className="task-card__line" />
            <span className="task-card__line" style={{ width: '70%' }} />
          </motion.div>
        ))}
      </AnimatePresence>
    </section>
  )
}

/** Agente responsável, no canto da tela, enquanto trabalha na ação. */
export function AgentCorner({
  agents,
  activities,
}: {
  agents: OfficeAgent[]
  activities: TrailActivity[]
}) {
  const current = activities.find((a) => a.phase !== 'done') ?? activities[0]
  const agent = current && agents.find((a) => a.slug === current.agentSlug)
  const state: DeskState = current ? current.phase : 'idle'
  return (
    <AnimatePresence>
      {current && agent && (
        <motion.aside
          key="agent-corner"
          className={`agent-corner desk--${state}`}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25 }}
        >
          <DeskStage seed={agent.avatarSeed} />
          <div>
            <p className="agent-corner__who">{agent.name}</p>
            <p className="agent-corner__what">{describe(current, false)}</p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
