import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { avatarUri } from '@/lib/avatar'

/**
 * Cena decorativa animada da tela de login.
 * Loop de ~14s em 5 fases: idle → focus → burst → working → collapse.
 * Calibre as durações (ms) ajustando apenas o objeto TIMELINE abaixo.
 */
export const TIMELINE = {
  idle: 3000,
  focus: 800,
  burst: 600,
  working: 6000,
  collapse: 1000,
} as const

export type Phase = keyof typeof TIMELINE

const PHASES: Phase[] = ['idle', 'focus', 'burst', 'working', 'collapse']

/** Máquina de estados por setTimeout encadeado, lendo TIMELINE. */
function useAnimationPhase(enabled: boolean): Phase {
  const [phase, setPhase] = useState<Phase>('idle')

  useEffect(() => {
    if (!enabled) return
    const id = setTimeout(() => {
      setPhase((p) => PHASES[(PHASES.indexOf(p) + 1) % PHASES.length])
    }, TIMELINE[phase])
    return () => clearTimeout(id)
  }, [phase, enabled])

  return phase
}

interface AgentConfig {
  name: string
  status: string
  /** posição final em px relativa ao centro (elipse determinística) */
  x: number
  y: number
}

// 7 pontos pré-calculados numa elipse (rx=250, ry=170), começando no topo.
// angle_i = -90° + i * (360/7)°
const RX = 250
const RY = 170
const AGENTS: AgentConfig[] = [
  { name: 'Sofia', status: 'analisando documentos…' },
  { name: 'Lucas', status: 'organizando respostas…' },
  { name: 'Ana', status: 'revisando contratos…' },
  { name: 'Pedro', status: 'respondendo clientes…' },
  { name: 'Marina', status: 'agendando reuniões…' },
  { name: 'Caio', status: 'resumindo e-mails…' },
  { name: 'Lia', status: 'preparando relatório…' },
].map((a, i) => {
  const angle = (-90 + i * (360 / 7)) * (Math.PI / 180)
  return {
    ...a,
    x: Math.round(RX * Math.cos(angle)),
    y: Math.round(RY * Math.sin(angle)),
  }
})

const SPRING = { type: 'spring', stiffness: 260, damping: 20 } as const

function TypingDots() {
  return (
    <span className="ml-1 inline-flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-[3px] w-[3px] rounded-full bg-current"
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </span>
  )
}

function AgentBubble({ agent, index }: { agent: AgentConfig; index: number }) {
  const below = agent.y < 0
  return (
    <motion.div
      initial={{ opacity: 0, y: below ? -6 : 6, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ ...SPRING, delay: index * 0.35 }}
      className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] text-neutral-700 shadow-sm ${
        below ? 'top-full mt-2' : 'bottom-full mb-2'
      }`}
    >
      <span className="font-semibold text-neutral-900">{agent.name}</span>{' '}
      {agent.status}
      <TypingDots />
    </motion.div>
  )
}

function AgentAvatar({
  agent,
  index,
  phase,
  uri,
}: {
  agent: AgentConfig
  index: number
  phase: Phase
  uri: string
}) {
  const working = phase === 'working'
  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
      animate={{ x: agent.x, y: agent.y, scale: 1, opacity: 1 }}
      exit={{
        x: 0,
        y: 0,
        scale: 0,
        opacity: 0,
        transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      }}
      transition={{ ...SPRING, delay: index * 0.04 }}
      style={{ marginLeft: -28, marginTop: -28 }}
    >
      {/* flutuação suave separada (só transform) */}
      <motion.div
        className="relative"
        animate={working ? { y: [0, -7, 0] } : { y: 0 }}
        transition={
          working
            ? {
                duration: 2.6 + index * 0.25,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: index * 0.2,
              }
            : { duration: 0.3 }
        }
      >
        <img
          src={uri}
          alt=""
          width={56}
          height={56}
          className="h-14 w-14 rounded-full border border-black/10 bg-white shadow-sm"
          draggable={false}
        />
        <AnimatePresence>
          {working && <AgentBubble agent={agent} index={index} />}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

/** Versão estática para prefers-reduced-motion: logo + avatares ao redor. */
function StaticScene({ uris }: { uris: string[] }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <span className="inline-flex items-baseline whitespace-nowrap text-4xl font-bold tracking-tight text-neutral-900">
        Alpha&nbsp;
        <span className="italic font-extrabold text-gradient-agents">
          Agents
        </span>
        &nbsp;Office
      </span>
      {AGENTS.map((a, i) => (
        <img
          key={a.name}
          src={uris[i]}
          alt=""
          className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full border border-black/10 bg-white shadow-sm"
          style={{
            transform: `translate(${a.x - 24}px, ${a.y - 24}px)`,
          }}
          draggable={false}
        />
      ))}
    </div>
  )
}

const WORD_SPRING = { type: 'spring', stiffness: 200, damping: 24 } as const

export function AgentsBurstScene() {
  const reduced = useReducedMotion()
  const phase = useAnimationPhase(!reduced)

  // data-URIs memoizados (seed fixo = nome do agente)
  const uris = useMemo(() => AGENTS.map((a) => avatarUri(a.name)), [])

  if (reduced) {
    return (
      <div aria-hidden className="h-full w-full select-none">
        <StaticScene uris={uris} />
      </div>
    )
  }

  const sideWordsVisible = phase === 'idle'
  const agentsVisible = phase === 'burst' || phase === 'working'
  const agentsWordVisible = !agentsVisible

  return (
    <div
      aria-hidden
      className="relative h-full w-full select-none overflow-hidden"
    >
      {/* Palavra central / logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-baseline whitespace-nowrap text-4xl font-bold tracking-tight text-neutral-900 xl:text-5xl">
          <AnimatePresence mode="popLayout">
            {sideWordsVisible && (
              <motion.span
                key="alpha"
                initial={{ opacity: 0, x: -32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -48 }}
                transition={WORD_SPRING}
              >
                Alpha&nbsp;
              </motion.span>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {agentsWordVisible && (
              <motion.span
                key="agents"
                layout
                className="italic font-extrabold text-gradient-agents"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{
                  opacity: 1,
                  scale: phase === 'focus' ? 2 : 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 2.6,
                  transition: { duration: 0.25, ease: 'easeIn' },
                }}
                transition={WORD_SPRING}
              >
                Agents
              </motion.span>
            )}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {sideWordsVisible && (
              <motion.span
                key="office"
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 48 }}
                transition={WORD_SPRING}
              >
                &nbsp;Office
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Avatares em explosão */}
      <AnimatePresence>
        {agentsVisible &&
          AGENTS.map((a, i) => (
            <AgentAvatar
              key={a.name}
              agent={a}
              index={i}
              phase={phase}
              uri={uris[i]}
            />
          ))}
      </AnimatePresence>
    </div>
  )
}
