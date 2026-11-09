import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  useConfirmOfficeMutation,
  useGenerateOfficeMutation,
} from '@/api/api'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setOnboardingStatus } from '@/store/authSlice'
import { apiErrorMessage } from '@/lib/apiError'
import { applyGenderToSeed, randomSeed, seedForName } from '@/lib/avatar'
import type { SuggestedAgent } from '@/types'
import { AnimatedLogo } from '@/components/Logo'
import { SpotlightBackground } from '@/components/SpotlightBackground'
import {
  AgentAvatar,
  Badge,
  Button,
  Field,
  Input,
  Modal,
  Spinner,
  Textarea,
} from '@/components/ui'

type Step = 'business' | 'generating' | 'confirm'

/** Escritório-modelo usado quando o usuário pula a conexão de IA. */
const GENERATING_MESSAGES = [
  'Analisando o perfil do seu negócio…',
  'Definindo os setores do escritório…',
  'Contratando especialistas…',
  'Escrevendo as instruções de cada agente…',
  'Organizando as mesas…',
  'Quase lá, últimos ajustes…',
]

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('business')
  const [agents, setAgents] = useState<SuggestedAgent[]>([])
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  const [generate] = useGenerateOfficeMutation()
  const [confirm, { isLoading: confirming }] = useConfirmOfficeMutation()

  async function startGeneration() {
    setStep('generating')
    try {
      const res = await generate().unwrap()
      setAgents(res.agents.map((a) => ({ ...a, avatarSeed: seedForName(a.name) })))
      setStep('confirm')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Falha ao gerar o escritório.'))
      setStep('business')
    }
  }

  async function onConfirm() {
    try {
      await confirm({ agents }).unwrap()
      dispatch(setOnboardingStatus('COMPLETED'))
      navigate('/office', { replace: true })
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Falha ao confirmar o escritório.'))
    }
  }

  return (
    <div className="min-h-full">
      <SpotlightBackground baseClassName="bg-paper-2" />
      <header className="flex h-14 items-center justify-between border-b border-line bg-paper/80 px-6 backdrop-blur-sm">
        <AnimatedLogo />
        {user && <span className="text-[13px] text-ink-2">{user.name}</span>}
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <StepIndicator
          current={{ business: 0, generating: 1, confirm: 2 }[step]}
        />

        {step === 'business' && <BusinessStep onNext={() => void startGeneration()} />}
        {step === 'generating' && <GeneratingScreen />}
        {step === 'confirm' && (
          <ConfirmStep
            agents={agents}
            setAgents={setAgents}
            onConfirm={onConfirm}
            confirming={confirming}
          />
        )}
      </main>
    </div>
  )
}

function StepIndicator({ current }: { current: number }) {
  const steps = ['Seu negócio', 'Montagem', 'Confirmação']
  return (
    <ol
      aria-label="Progresso do onboarding"
      className="mb-10 flex items-center justify-center gap-0"
    >
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={s} className="flex items-center">
            <span className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-2.5">
              <span
                aria-current={active ? 'step' : undefined}
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all duration-300 ${
                  done
                    ? 'bg-ink text-paper'
                    : active
                      ? 'bg-ink text-paper ring-4 ring-ink/10'
                      : 'border border-line bg-paper text-ink-3'
                }`}
              >
                {done ? (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 6.5L4.8 9.2 10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`text-[11px] sm:text-[13px] ${
                  active ? 'font-semibold text-ink' : done ? 'text-ink-2' : 'text-ink-3'
                }`}
              >
                {s}
              </span>
            </span>
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`mx-2 h-px w-6 transition-colors duration-300 sm:mx-3 sm:w-12 ${
                  i < current ? 'bg-ink' : 'bg-line'
                }`}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

/* ---------- Passo 1: descrição refinada ---------- */

function BusinessStep({ onNext }: { onNext: () => void }) {
  return (
    <section className="animate-fade-up rounded-xl border border-line bg-paper p-8">
      <h1 className="text-xl font-semibold">Vamos montar seu escritório</h1>
      <p className="mt-2 max-w-lg text-sm text-ink-2 leading-relaxed">
        Com base no que você contou no cadastro, vamos sugerir uma equipe de
        agentes de IA especializados nos setores da sua empresa: financeiro,
        marketing, jurídico e o que mais fizer sentido para o seu negócio.
      </p>
      <ul className="mt-6 space-y-2.5 text-sm text-ink-2">
        {[
          'Cada agente tem um papel, um avatar e instruções próprias.',
          'Você revisa e edita tudo antes de confirmar.',
          'Um Agente Gerente coordena a equipe nas conversas.',
        ].map((t) => (
          <li key={t} className="flex items-start gap-2.5">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink" />
            {t}
          </li>
        ))}
      </ul>
      <div className="mt-8 flex justify-end">
        <Button onClick={onNext}>Continuar</Button>
      </div>
    </section>
  )
}

/* ---------- Tela de geração ---------- */

function GeneratingScreen() {
  const [msgIndex, setMsgIndex] = useState(0)
  useEffect(() => {
    const t = setInterval(
      () => setMsgIndex((i) => Math.min(i + 1, GENERATING_MESSAGES.length - 1)),
      2600,
    )
    return () => clearInterval(t)
  }, [])

  return (
    <section className="animate-fade-up py-6 text-center">
      <div className="mx-auto mb-6 flex justify-center">
        <span className="relative inline-flex">
          <span
            aria-hidden="true"
            className="absolute -inset-4 animate-pulse-soft rounded-full bg-[radial-gradient(closest-side,rgb(99_102_241/0.18),transparent)]"
          />
          <AnimatedLogo size="xl" />
        </span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Montando seu <span className="text-gradient-agents">escritório</span>…
      </h1>
      <p
        key={msgIndex}
        aria-live="polite"
        className="mt-2.5 animate-fade-up text-sm text-ink-2"
      >
        {GENERATING_MESSAGES[msgIndex]}
      </p>
      <motion.div
        className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } } }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            variants={{
              hidden: { opacity: 0, y: 16, scale: 0.94 },
              show: { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="skeleton-shimmer rounded-xl border border-line bg-paper p-5"
            style={{ ['--sweep-delay' as string]: `${i * 0.18}s` }}
          >
            <div className="mx-auto size-16 rounded-full bg-paper-3" />
            <div className="mx-auto mt-4 h-3.5 w-24 rounded bg-paper-3" />
            <div className="mx-auto mt-2 h-3 w-32 rounded bg-paper-3" />
            <div className="mx-auto mt-3 h-4 w-16 rounded-full bg-paper-3" />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

/* ---------- Confirmação ---------- */

function ConfirmStep({
  agents,
  setAgents,
  onConfirm,
  confirming,
}: {
  agents: SuggestedAgent[]
  setAgents: (a: SuggestedAgent[]) => void
  onConfirm: () => void
  confirming: boolean
}) {
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)

  const departments = useMemo(
    () => [...new Set(agents.map((a) => a.department))],
    [agents],
  )

  return (
    <section className="animate-fade-up">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Sua equipe está pronta para revisão
        </h1>
        <p className="mt-2 text-sm text-ink-2">
          {agents.length} agentes em {departments.length}{' '}
          {departments.length === 1 ? 'setor' : 'setores'}. Edite, remova ou
          adicione antes de confirmar.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent, i) => (
          <div
            key={`${agent.avatarSeed}-${i}`}
            className="group relative animate-fade-up rounded-xl border border-line bg-paper p-5 text-center transition-all duration-200 ease-[var(--ease-alpha)] hover:-translate-y-0.5 hover:border-line-2 hover:shadow-[0_10px_28px_-12px_rgb(0_0_0/0.16)]"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <button
              onClick={() => setAgents(agents.filter((_, j) => j !== i))}
              aria-label={`Remover ${agent.name}`}
              className="absolute right-2.5 top-2.5 rounded-md p-1 text-ink-3 opacity-0 transition-all duration-150 hover:bg-paper-3 hover:text-danger group-hover:opacity-100"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <AgentAvatar
              seed={agent.avatarSeed}
              size={68}
              className="mx-auto transition-transform duration-200 ease-[var(--ease-alpha)] group-hover:scale-105"
            />
            <p className="mt-3 text-sm font-semibold">{agent.name}</p>
            <p className="mt-0.5 text-[13px] text-ink-2">{agent.role}</p>
            <div className="mt-2.5">
              <Badge>{agent.department}</Badge>
            </div>
            <Button
              variant="ghost"
              className="mt-3 h-8 w-full text-[13px]"
              onClick={() => setEditIndex(i)}
            >
              Editar
            </Button>
          </div>
        ))}

        <button
          onClick={() => setAdding(true)}
          className="flex min-h-[190px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-2 text-ink-3 transition-colors duration-150 hover:border-ink hover:text-ink"
        >
          <span className="text-2xl leading-none">+</span>
          <span className="text-[13px] font-medium">Adicionar agente</span>
        </button>
      </div>

      <div className="mt-10 flex justify-center">
        <Button onClick={onConfirm} disabled={confirming || agents.length === 0} className="px-8">
          {confirming ? <><Spinner className="border-t-paper border-paper/40" /> Confirmando…</> : 'Confirmar equipe e entrar no escritório'}
        </Button>
      </div>

      <AgentFormModal
        open={editIndex !== null}
        title="Editar agente"
        initial={editIndex !== null ? agents[editIndex] : undefined}
        onClose={() => setEditIndex(null)}
        onSave={(a) => {
          setAgents(agents.map((x, j) => (j === editIndex ? a : x)))
          setEditIndex(null)
        }}
      />
      <AgentFormModal
        open={adding}
        title="Adicionar agente"
        onClose={() => setAdding(false)}
        onSave={(a) => {
          setAgents([...agents, a])
          setAdding(false)
        }}
      />
    </section>
  )
}

function AgentFormModal({
  open,
  title,
  initial,
  onClose,
  onSave,
}: {
  open: boolean
  title: string
  initial?: SuggestedAgent
  onClose: () => void
  onSave: (a: SuggestedAgent) => void
}) {
  const [form, setForm] = useState<SuggestedAgent>({
    name: '',
    role: '',
    department: '',
    systemPrompt: '',
    avatarSeed: randomSeed(),
  })

  useEffect(() => {
    if (open) {
      setForm(
        initial ?? {
          name: '',
          role: '',
          department: '',
          systemPrompt: '',
          avatarSeed: randomSeed(),
        },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() =>
              onSave({ ...form, avatarSeed: applyGenderToSeed(form.name, form.avatarSeed) })
            }
            disabled={!form.name.trim() || !form.role.trim()}
          >
            Salvar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <AgentAvatar seed={applyGenderToSeed(form.name, form.avatarSeed)} size={56} />
          <Button
            variant="secondary"
            className="h-8 text-[13px]"
            onClick={() => setForm((f) => ({ ...f, avatarSeed: randomSeed() }))}
          >
            ↻ Regenerar avatar
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex.: Sarah" />
          </Field>
          <Field label="Setor">
            <Input value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} placeholder="Ex.: Financeiro" />
          </Field>
        </div>
        <Field label="Papel">
          <Input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="Ex.: Analista financeira" />
        </Field>
        <Field label="Instruções (system prompt)">
          <Textarea
            rows={6}
            value={form.systemPrompt}
            onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
            placeholder="Como este agente deve se comportar, o que sabe fazer e seus limites…"
          />
        </Field>
      </div>
    </Modal>
  )
}
