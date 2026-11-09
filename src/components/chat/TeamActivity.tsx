import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AgentAvatar, cx } from '@/components/ui'
import type { Agent } from '@/types'

/** Especialista que trabalhou (ou trabalha) num turno do Gerente. */
export interface TeamEntry {
  agentId: string
  name: string
  role: string | null
  task: string
  status?: 'working' | 'done' | 'error'
}

const ease = [0.22, 1, 0.36, 1] as const

export function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length <= 3) {
    return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`
  }
  return `${names.slice(0, 2).join(', ')} e mais ${names.length - 2}`
}

export function formatDuration(ms: number) {
  const s = Math.max(1, Math.round(ms / 1000))
  if (s < 60) return `${s} s`
  return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`
}

/** Pontinhos de "trabalhando" ao lado do especialista. */
function TypingDots() {
  return (
    <span className="typing-dots" aria-hidden>
      <i />
      <i />
      <i />
    </span>
  )
}

function StatusMark({ status }: { status?: TeamEntry['status'] }) {
  if (status === 'done') {
    return (
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease }}
        className="grid size-3.5 place-items-center rounded-full bg-ok text-paper"
        aria-label="concluído"
      >
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
          <path d="M5 12l5 5 9-10" />
        </svg>
      </motion.span>
    )
  }
  if (status === 'error') {
    return <span className="text-[11px] text-danger">não concluiu</span>
  }
  return <TypingDots />
}

/** A árvore: cada especialista entra deslizando sob o Gerente. */
export function TeamTree({
  team,
  agentById,
}: {
  team: TeamEntry[]
  agentById: Map<string, Agent>
}) {
  return (
    <ol className="mt-2.5 ml-[13px] space-y-2.5 border-l border-line-2 pl-4">
      <AnimatePresence initial={false}>
        {team.map((m) => (
          <motion.li
            key={m.agentId}
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease }}
            className="relative flex min-w-0 items-center gap-2 text-[12.5px]"
          >
            <span className="absolute top-1/2 -left-4 h-px w-3 bg-line-2" aria-hidden />
            <span
              className={cx(
                'relative shrink-0',
                m.status === 'working' && 'avatar-ring',
              )}
            >
              <AgentAvatar seed={agentById.get(m.agentId)?.avatarSeed ?? m.name} size={22} />
            </span>
            <span className="shrink-0 font-medium text-ink">{m.name}</span>
            <span className="min-w-0 truncate text-ink-3" title={m.task}>
              {m.role ? `${m.role} · ` : ''}
              {m.task}
            </span>
            <span className="ml-auto shrink-0 pl-1">
              <StatusMark status={m.status} />
            </span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  )
}

/**
 * Enquanto o agente trabalha e ainda não há texto: avatar, nome, o que ele
 * está fazendo (com brilho) e a equipe acionada.
 */
export function WorkingTurn({
  agent,
  status,
  team,
  agentById,
}: {
  agent?: Agent
  status: string
  team: TeamEntry[]
  agentById: Map<string, Agent>
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease }}
      className="flex gap-3"
      aria-live="polite"
    >
      <span className={cx('relative mt-0.5 self-start', team.length === 0 && 'avatar-ring')}>
        <AgentAvatar seed={agent?.avatarSeed ?? 'aao'} size={30} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="mb-1 flex items-baseline gap-1.5 text-[12px] leading-none">
          <span className="font-semibold text-ink">{agent?.name ?? 'Agente'}</span>
          {agent?.role && <span className="truncate text-ink-3">{agent.role}</span>}
        </p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={status}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.25, ease }}
            className="text-[13px] font-medium text-shimmer"
          >
            {status}
          </motion.p>
        </AnimatePresence>
        {team.length > 0 && <TeamTree team={team} agentById={agentById} />}
      </div>
    </motion.div>
  )
}

/**
 * A árvore recolhida: avatares empilhados + "Camila e Beatriz contribuíram ·
 * 7 s". Clicar abre a árvore de novo. Vai no balão da resposta (ao vivo e
 * depois de gravada).
 */
export function TeamSummary({
  team,
  durationMs,
  agentById,
}: {
  team: TeamEntry[]
  durationMs?: number
  agentById: Map<string, Agent>
}) {
  const [open, setOpen] = useState(false)
  if (!team.length) return null
  const names = joinNames(team.map((m) => m.name))
  const verb = team.length === 1 ? 'contribuiu' : 'contribuíram'
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="mb-2"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="-ml-1.5 flex items-center gap-2 rounded-lg border border-transparent px-1.5 py-1 text-[12px] text-ink-2 transition-colors duration-150 hover:border-line hover:bg-paper"
      >
        <span className="flex -space-x-1.5">
          {team.slice(0, 4).map((m) => (
            <AgentAvatar
              key={m.agentId}
              seed={agentById.get(m.agentId)?.avatarSeed ?? m.name}
              size={20}
              className="ring-2 ring-paper"
            />
          ))}
        </span>
        <span>
          {names} {verb}
          {durationMs ? ` · ${formatDuration(durationMs)}` : ''}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={cx('text-ink-3 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <TeamTree
              team={team.map((m) => ({ ...m, status: m.status ?? 'done' }))}
              agentById={agentById}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
