import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useConfirmAgentsMutation,
  useCreateAgentMutation,
  useCreateDepartmentMutation,
  useCreateUserMutation,
  useDeleteDepartmentMutation,
  useDeleteUserMutation,
  useGenerateAgentMutation,
  useGetAgentsQuery,
  useGetAuditEventsQuery,
  useGetAuditSummaryQuery,
  useArchiveLearnedSkillMutation,
  useGetLearnedSkillsQuery,
  useGetUsageByAgentQuery,
  useGetUsageByUserQuery,
  useGetUsageSummaryQuery,
  useGetDepartmentsQuery,
  useGetUserAgentAccessQuery,
  useGetUsersQuery,
  useSetUserAgentAccessMutation,
  useUpdateDepartmentMutation,
  useUpdateUserMutation,
} from '@/api/api'
import { useAppSelector } from '@/store/hooks'
import { seedForName } from '@/lib/avatar'
import { InvitePanel } from '@/components/InvitePanel'
import { ROLE_LABEL } from '@/lib/roles'
import { apiErrorMessage } from '@/lib/apiError'
import type { Agent, SuggestedAgent, User } from '@/types'
import {
  AgentAvatar,
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Skeleton,
  Spinner,
  cx,
} from '@/components/ui'

type Tab = 'agents' | 'users' | 'departments' | 'audit' | 'usage' | 'learning'

/* ---------- Ícones (stroke, currentColor) ---------- */

type IconProps = { className?: string }
const iconBase = 'h-[15px] w-[15px] shrink-0'

function BuildingIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className ?? 'h-5 w-5'}>
      <path d="M3 21h18M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M9 7h.01M14 7h.01M9 11h.01M14 11h.01M9 15h.01M14 15h.01" />
    </svg>
  )
}
function AgentsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className ?? iconBase}>
      <path d="M17 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="3.5" />
      <path d="M22 20v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
    </svg>
  )
}
function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className ?? iconBase}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
function LayersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className ?? iconBase}>
      <path d="M12 3 2 8l10 5 10-5-10-5Z" />
      <path d="m2 16 10 5 10-5M2 12l10 5 10-5" />
    </svg>
  )
}
function HistoryIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className ?? iconBase}>
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}
function ChartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className ?? iconBase}>
      <path d="M3 3v18h18" />
      <rect x="7" y="12" width="3" height="6" rx="0.5" />
      <rect x="12" y="8" width="3" height="10" rx="0.5" />
      <rect x="17" y="5" width="3" height="13" rx="0.5" />
    </svg>
  )
}
function SparkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className ?? iconBase}>
      <path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export default function OrganizationPage() {
  const [tab, setTab] = useState<Tab>('agents')
  const user = useAppSelector((s) => s.auth.user)
  const isAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN'

  const tabs = [
    { key: 'agents', label: 'Agentes', Icon: AgentsIcon },
    { key: 'users', label: 'Usuários', Icon: UserIcon },
    { key: 'departments', label: 'Setores', Icon: LayersIcon },
    ...(isAdmin
      ? [
          { key: 'audit', label: 'Auditoria', Icon: HistoryIcon },
          { key: 'usage', label: 'Consumo', Icon: ChartIcon },
          { key: 'learning', label: 'Aprendizados', Icon: SparkIcon },
        ]
      : []),
  ] as const

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-up sm:px-6 sm:py-10">
        <header className="flex items-start gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-line bg-paper-2 text-ink">
            <BuildingIcon />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold leading-tight">Escritório</h1>
            <p className="mt-1 text-sm text-ink-2">
              Agentes, usuários e setores trabalhando em conjunto.
            </p>
          </div>
        </header>

        <div className="mt-7 -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          <div className="flex min-w-max gap-0.5 border-b border-line">
            {tabs.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key as Tab)}
                className={cx(
                  'relative flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition-colors duration-150',
                  tab === key ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
                )}
              >
                <Icon className={cx('h-4 w-4 shrink-0 transition-colors', tab === key ? 'text-ink' : 'text-ink-3')} />
                {label}
                {tab === key && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ink" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6">
          {tab === 'agents' && <AgentsTab />}
          {tab === 'users' && <UsersTab />}
          {tab === 'departments' && <DepartmentsTab />}
          {tab === 'audit' && isAdmin && <AuditTab />}
          {tab === 'usage' && isAdmin && <UsageTab />}
          {tab === 'learning' && isAdmin && <LearningTab />}
        </div>
      </div>
    </div>
  )
}

/* ---------- Agentes ---------- */

function AgentsTab() {
  const { data: agents, isLoading } = useGetAgentsQuery()
  const user = useAppSelector((s) => s.auth.user)
  const canEdit = user?.role === 'OWNER' || user?.role === 'ADMIN'
  const [manualOpen, setManualOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)

  const ordered = useMemo(
    () =>
      agents
        ? [...agents].sort(
            (a, b) => Number(b.isManager) - Number(a.isManager) || a.name.localeCompare(b.name),
          )
        : [],
    [agents],
  )

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-ink-3">
          {agents ? `${agents.length} ${agents.length === 1 ? 'agente' : 'agentes'} no escritório` : ''}
        </p>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => setManualOpen(true)}>
              + Novo agente
            </Button>
            <Button className="flex-1 sm:flex-none" onClick={() => setAiOpen(true)}>✦ Criar com IA</Button>
          </div>
        )}
      </div>

      {isLoading && <Skeleton className="h-40 w-full rounded-xl" />}

      {!isLoading && agents?.length === 0 && (
        <EmptyState
          title="Nenhum agente ainda"
          description="Crie seu primeiro agente manualmente ou deixe a IA montar a equipe a partir de uma descrição."
        />
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ordered.map((a) => (
          <AgentCard key={a.id} agent={a} />
        ))}
      </div>

      <ManualAgentModal open={manualOpen} onClose={() => setManualOpen(false)} />
      <AiAgentModal open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  )
}

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Link
      to={`/office/agents/${agent.id}`}
      className="group flex min-w-0 items-center gap-3 rounded-xl border border-line p-3.5 transition-all duration-150 hover:border-line-2 hover:bg-paper-2 hover:shadow-[0_1px_3px_rgba(24,24,27,0.05)]"
    >
      <AgentAvatar seed={agent.avatarSeed} size={40} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{agent.name}</span>
          {agent.isManager && <Badge>Gerente</Badge>}
          {!agent.isActive && <Badge className="text-ink-3">Inativo</Badge>}
        </span>
        <span className="mt-0.5 block truncate text-[12px] text-ink-3">
          {agent.role || 'Sem cargo'}
          {agent.department?.name ? ` · ${agent.department.name}` : ''}
        </span>
      </span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4 shrink-0 text-ink-3 opacity-0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:opacity-100"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </Link>
  )
}

function ManualAgentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: departments } = useGetDepartmentsQuery()
  const [createAgent, { isLoading }] = useCreateAgentMutation()
  const [form, setForm] = useState({
    name: '',
    role: '',
    departmentId: '',
    systemPrompt: '',
  })

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await createAgent({
        name: form.name.trim(),
        role: form.role.trim(),
        systemPrompt: form.systemPrompt.trim(),
        departmentId: form.departmentId || undefined,
      }).unwrap()
      toast.success('Agente criado.')
      onClose()
      setForm({ name: '', role: '', departmentId: '', systemPrompt: '' })
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível criar o agente.'))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo agente">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome">
            <Input
              required
              autoFocus
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex.: Sofia"
            />
          </Field>
          <Field label="Cargo/função">
            <Input
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              placeholder="Ex.: Analista Financeira"
            />
          </Field>
        </div>
        <Field label="Setor">
          <Select
            value={form.departmentId}
            onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
          >
            <option value="">Sem setor</option>
            {departments?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Instruções (system prompt)">
          <textarea
            rows={5}
            value={form.systemPrompt}
            onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
            placeholder="Persona, responsabilidades, tom e limites do agente…"
            className="block w-full resize-y rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-ink"
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || !form.name.trim()}>
            {isLoading ? <Spinner /> : null} Criar agente
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function AiAgentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [generate, { isLoading: generating }] = useGenerateAgentMutation()
  const [confirm, { isLoading: confirming }] = useConfirmAgentsMutation()
  const [description, setDescription] = useState('')
  const [suggestions, setSuggestions] = useState<SuggestedAgent[] | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  function reset() {
    setSuggestions(null)
    setSelected(new Set())
    setDescription('')
  }

  async function onGenerate(e: FormEvent) {
    e.preventDefault()
    try {
      const res = await generate({ description: description.trim() }).unwrap()
      setSuggestions(res.agents.map((a) => ({ ...a, avatarSeed: seedForName(a.name) })))
      setSelected(new Set(res.agents.map((_, i) => i)))
    } catch (err) {
      toast.error(apiErrorMessage(err, 'A IA não conseguiu gerar o agente.'))
    }
  }

  async function onConfirm() {
    if (!suggestions) return
    const chosen = suggestions.filter((_, i) => selected.has(i))
    if (chosen.length === 0) return
    try {
      await confirm({ agents: chosen }).unwrap()
      toast.success(
        chosen.length === 1 ? 'Agente criado.' : `${chosen.length} agentes criados.`,
      )
      onClose()
      reset()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível criar os agentes.'))
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose()
        reset()
      }}
      title="Criar agente com IA"
    >
      {!suggestions ? (
        <form onSubmit={onGenerate} className="space-y-4">
          <p className="text-[13px] leading-relaxed text-ink-2">
            Descreva o que você precisa e a IA monta o agente: nome, cargo,
            setor e instruções. Você revisa antes de criar.
          </p>
          <textarea
            required
            autoFocus
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex.: preciso de um agente que cuide do pós-venda, responda dúvidas de clientes sobre entregas e sugira ações de retenção…"
            className="block w-full resize-y rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-ink"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={generating || description.trim().length < 10}>
              {generating ? <Spinner /> : null}
              {generating ? ' Gerando…' : 'Gerar agente'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-[13px] text-ink-2">
            Revise as sugestões, edite o que quiser e desmarque o que não usar.
          </p>
          <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className={cx(
                  'rounded-xl border p-3.5 transition-colors duration-150',
                  selected.has(i) ? 'border-ink' : 'border-line opacity-60',
                )}
              >
                <label className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    className="accent-black"
                    checked={selected.has(i)}
                    onChange={(e) => {
                      const next = new Set(selected)
                      if (e.target.checked) next.add(i)
                      else next.delete(i)
                      setSelected(next)
                    }}
                  />
                  <AgentAvatar seed={s.avatarSeed || s.name} size={30} />
                  <Input
                    className="h-8 flex-1"
                    value={s.name}
                    onChange={(e) =>
                      setSuggestions((prev) =>
                        prev!.map((p, j) => (j === i ? { ...p, name: e.target.value } : p)),
                      )
                    }
                  />
                </label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <Input
                    className="h-8"
                    value={s.role}
                    placeholder="Cargo"
                    onChange={(e) =>
                      setSuggestions((prev) =>
                        prev!.map((p, j) => (j === i ? { ...p, role: e.target.value } : p)),
                      )
                    }
                  />
                  <Input
                    className="h-8"
                    value={s.department}
                    placeholder="Setor"
                    onChange={(e) =>
                      setSuggestions((prev) =>
                        prev!.map((p, j) =>
                          j === i ? { ...p, department: e.target.value } : p,
                        ),
                      )
                    }
                  />
                </div>
                <textarea
                  rows={3}
                  value={s.systemPrompt}
                  onChange={(e) =>
                    setSuggestions((prev) =>
                      prev!.map((p, j) =>
                        j === i ? { ...p, systemPrompt: e.target.value } : p,
                      ),
                    )
                  }
                  className="mt-2 block w-full resize-y rounded-lg border border-line bg-paper px-3 py-2 text-[13px] outline-none transition-colors duration-150 focus:border-ink"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between gap-2">
            <Button variant="ghost" onClick={reset}>
              ← Descrever de novo
            </Button>
            <Button onClick={onConfirm} disabled={confirming || selected.size === 0}>
              {confirming ? <Spinner /> : null}
              {selected.size === 1 ? ' Criar agente' : ` Criar ${selected.size} agentes`}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ---------- Usuários ---------- */

function UsersTab() {
  const { data: users, isLoading } = useGetUsersQuery()
  const { data: departments } = useGetDepartmentsQuery()
  const me = useAppSelector((s) => s.auth.user)
  const canEdit = me?.role === 'OWNER' || me?.role === 'ADMIN'
  // papel: só o dono altera (e ninguém vira dono)
  const isOwner = me?.role === 'OWNER'
  const [inviteOpen, setInviteOpen] = useState(false)
  const [createUser, { isLoading: creating }] = useCreateUserMutation()
  const [updateUser] = useUpdateUserMutation()
  const [deleteUser] = useDeleteUserMutation()
  const [modalOpen, setModalOpen] = useState(false)
  const [accessUser, setAccessUser] = useState<User | null>(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'MEMBER' })
  const [invited, setInvited] = useState<{ email: string; password: string } | null>(null)

  async function onInvite(e: FormEvent) {
    e.preventDefault()
    try {
      const res = await createUser(form).unwrap()
      setModalOpen(false)
      setForm({ name: '', email: '', role: 'MEMBER' })
      if (res.temporaryPassword) {
        setInvited({ email: res.email, password: res.temporaryPassword })
      } else {
        toast.success('Usuário criado.')
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível convidar o usuário.'))
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-ink-3">
          {users ? `${users.length} ${users.length === 1 ? 'pessoa' : 'pessoas'} com acesso` : ''}
        </p>
        {canEdit && (
          <span className="flex flex-wrap gap-2">
            <Button onClick={() => setInviteOpen(true)}>Convidar com link, QR ou código</Button>
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              + Adicionar por e-mail
            </Button>
          </span>
        )}
      </div>

      {isLoading && <Skeleton className="h-32 w-full rounded-xl" />}

      {!isLoading && users?.length === 0 && (
        <EmptyState
          title="Nenhum usuário convidado"
          description="Convide pessoas da sua empresa para acompanhar e acionar os agentes do escritório."
        />
      )}

      {users && users.length > 0 && (
        <div className="divide-y divide-line rounded-xl border border-line">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-x-3 gap-y-3 px-4 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-paper-3 text-[12px] font-semibold text-ink-2">
                {u.name
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{u.name}</span>
                <span className="block truncate text-[12px] text-ink-3">{u.email}</span>
              </span>
              {canEdit ? (
                <span className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                  <Select
                    className="h-8 min-w-36 flex-1 text-[13px] sm:flex-none"
                    value={u.departmentId ?? ''}
                    onChange={async (e) => {
                      try {
                        await updateUser({ id: u.id, departmentId: e.target.value }).unwrap()
                        toast.success('Setor atualizado.')
                      } catch (err) {
                        toast.error(apiErrorMessage(err))
                      }
                    }}
                  >
                    <option value="">Sem setor</option>
                    {departments?.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                  {isOwner && u.role !== 'OWNER' ? (
                    <Select
                      className="h-8 w-28 text-[13px]"
                      value={u.role}
                      onChange={async (e) => {
                        try {
                          await updateUser({ id: u.id, role: e.target.value }).unwrap()
                          toast.success('Papel atualizado.')
                        } catch (err) {
                          toast.error(apiErrorMessage(err))
                        }
                      }}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Membro</option>
                    </Select>
                  ) : (
                    <Badge>{ROLE_LABEL[u.role] ?? u.role}</Badge>
                  )}
                  <Button
                    variant="secondary"
                    className="h-8 px-2.5 text-[13px]"
                    onClick={() => setAccessUser(u)}
                  >
                    Agentes
                  </Button>
                  {u.role !== 'OWNER' && (u.role !== 'ADMIN' || isOwner) && (
                    <Button
                      variant="danger"
                      className="h-8 px-2.5 text-[13px]"
                      onClick={async () => {
                        try {
                          await deleteUser(u.id).unwrap()
                          toast.success('Pessoa removida da organização.')
                        } catch (err) {
                          toast.error(apiErrorMessage(err))
                        }
                      }}
                    >
                      Remover
                    </Button>
                  )}
                </span>
              ) : (
                <span className="text-[12px] text-ink-3">
                  {u.department?.name ?? 'Sem setor'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <InvitePanel open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Convidar usuário"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="invite-form" disabled={creating}>
              {creating ? <Spinner className="border-t-paper border-paper/40" /> : 'Convidar'}
            </Button>
          </>
        }
      >
        <form id="invite-form" onSubmit={onInvite} className="space-y-4">
          <Field label="Nome">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="E-mail">
            <Input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </Field>
          <Field label="Papel">
            <Select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Membro</option>
            </Select>
          </Field>
        </form>
      </Modal>

      {accessUser && (
        <UserAccessModal user={accessUser} onClose={() => setAccessUser(null)} />
      )}

      <Modal
        open={invited !== null}
        onClose={() => setInvited(null)}
        title="Usuário criado. Envie o acesso"
      >
        {invited && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-ink-2">
              Ainda não enviamos e-mails: repasse estas credenciais para a
              pessoa por um canal seguro. Ela poderá trocar a senha depois.
            </p>
            <div className="space-y-2 rounded-xl border border-line bg-paper-2 p-4 font-mono text-sm">
              <p>
                <span className="text-ink-3">e-mail: </span>
                {invited.email}
              </p>
              <p>
                <span className="text-ink-3">senha temporária: </span>
                {invited.password}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard.writeText(
                    `Acesso à plataforma Governo do Futuro\ne-mail: ${invited.email}\nsenha temporária: ${invited.password}\n${window.location.origin}/login`,
                  )
                  toast.success('Credenciais copiadas.')
                }}
              >
                Copiar credenciais
              </Button>
              <Button onClick={() => setInvited(null)}>Concluir</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function UserAccessModal({ user, onClose }: { user: User; onClose: () => void }) {
  const { data: agents } = useGetAgentsQuery()
  const { data: accessIds, isLoading } = useGetUserAgentAccessQuery(user.id)
  const [setAccess, { isLoading: saving }] = useSetUserAgentAccessMutation()
  const [selected, setSelected] = useState<Set<string> | null>(null)

  const current = selected ?? new Set(accessIds ?? [])

  async function onSave() {
    try {
      await setAccess({ id: user.id, agentIds: [...current] }).unwrap()
      toast.success('Acessos atualizados.')
      onClose()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível salvar os acessos.'))
    }
  }

  return (
    <Modal open onClose={onClose} title={`Agentes de ${user.name}`}>
      <p className="mb-3 text-[13px] leading-relaxed text-ink-2">
        Marque quais agentes este usuário pode acionar. Sem nenhuma marcação, o
        acesso segue a regra padrão da empresa.
      </p>
      {isLoading && <Skeleton className="h-28 w-full rounded-xl" />}
      <div className="max-h-72 space-y-1 overflow-y-auto">
        {agents?.map((a) => (
          <label
            key={a.id}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors duration-150 hover:bg-paper-2"
          >
            <input
              type="checkbox"
              className="accent-black"
              checked={current.has(a.id)}
              onChange={(e) => {
                const next = new Set(current)
                if (e.target.checked) next.add(a.id)
                else next.delete(a.id)
                setSelected(next)
              }}
            />
            <AgentAvatar seed={a.avatarSeed} size={26} />
            <span className="text-sm">{a.name}</span>
            <span className="ml-auto text-[12px] text-ink-3">{a.role}</span>
          </label>
        ))}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={onSave} disabled={saving || selected === null}>
          {saving ? <Spinner /> : null} Salvar
        </Button>
      </div>
    </Modal>
  )
}

/* ---------- Setores ---------- */

function DepartmentsTab() {
  const { data: departments, isLoading } = useGetDepartmentsQuery()
  const { data: agents } = useGetAgentsQuery()
  const { data: users } = useGetUsersQuery()
  const me = useAppSelector((s) => s.auth.user)
  const canEdit = me?.role === 'OWNER' || me?.role === 'ADMIN'
  const [createDepartment, { isLoading: creating }] = useCreateDepartmentMutation()
  const [updateDepartment] = useUpdateDepartmentMutation()
  const [deleteDepartment] = useDeleteDepartmentMutation()
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const agentsByDep = useMemo(() => {
    const map = new Map<string, Agent[]>()
    agents?.forEach((a) => {
      if (!a.departmentId) return
      map.set(a.departmentId, [...(map.get(a.departmentId) ?? []), a])
    })
    return map
  }, [agents])

  const usersByDep = useMemo(() => {
    const map = new Map<string, User[]>()
    users?.forEach((u) => {
      if (!u.departmentId) return
      map.set(u.departmentId, [...(map.get(u.departmentId) ?? []), u])
    })
    return map
  }, [users])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await createDepartment({ name: name.trim() }).unwrap()
      setName('')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível criar o setor.'))
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-ink-3">
          {departments ? `${departments.length} ${departments.length === 1 ? 'setor' : 'setores'}` : ''}
        </p>
        {canEdit && (
          <form onSubmit={onCreate} className="flex w-full gap-2 sm:w-auto">
            <Input
              className="h-9 flex-1 sm:w-56 sm:flex-none"
              placeholder="Nome do novo setor…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit" className="h-9 shrink-0" disabled={creating || !name.trim()}>
              Criar
            </Button>
          </form>
        )}
      </div>

      {isLoading && <Skeleton className="h-28 w-full rounded-xl" />}

      {departments?.length === 0 && (
        <EmptyState
          title="Nenhum setor"
          description="Setores agrupam agentes e usuários por área, como Financeiro ou Marketing."
        />
      )}

      <div className="space-y-3">
        {departments?.map((d) => {
          const depAgents = agentsByDep.get(d.id) ?? []
          const depUsers = usersByDep.get(d.id) ?? []
          return (
            <div key={d.id} className="rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                {editingId === d.id ? (
                  <>
                    <Input
                      className="h-8 min-w-0 flex-1"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                    />
                    <Button
                      className="h-8 px-3 text-[13px]"
                      onClick={async () => {
                        try {
                          await updateDepartment({ id: d.id, name: editingName }).unwrap()
                          setEditingId(null)
                        } catch (err) {
                          toast.error(apiErrorMessage(err))
                        }
                      }}
                    >
                      Salvar
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-8 px-3 text-[13px]"
                      onClick={() => setEditingId(null)}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 truncate text-sm font-semibold">{d.name}</span>
                    <span className="whitespace-nowrap text-[12px] text-ink-3">
                      {depAgents.length} {depAgents.length === 1 ? 'agente' : 'agentes'} ·{' '}
                      {depUsers.length} {depUsers.length === 1 ? 'usuário' : 'usuários'}
                    </span>
                    {canEdit && (
                      <span className="ml-auto flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          className="h-7 px-2 text-[12px]"
                          onClick={() => {
                            setEditingId(d.id)
                            setEditingName(d.name)
                          }}
                        >
                          Renomear
                        </Button>
                        <Button
                          variant="danger"
                          className="h-7 px-2 text-[12px]"
                          onClick={async () => {
                            try {
                              await deleteDepartment(d.id).unwrap()
                              toast.success('Setor removido.')
                            } catch (err) {
                              toast.error(apiErrorMessage(err))
                            }
                          }}
                        >
                          Remover
                        </Button>
                      </span>
                    )}
                  </>
                )}
              </div>

              {(depAgents.length > 0 || depUsers.length > 0) && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {depAgents.map((a) => (
                    <Link
                      key={a.id}
                      to={`/office/agents/${a.id}`}
                      className="flex items-center gap-1.5 rounded-full border border-line py-1 pl-1 pr-2.5 text-[12px] transition-colors duration-150 hover:border-line-2 hover:bg-paper-2"
                    >
                      <AgentAvatar seed={a.avatarSeed} size={20} />
                      {a.name}
                    </Link>
                  ))}
                  {depUsers.map((u) => (
                    <span
                      key={u.id}
                      className="flex items-center gap-1.5 rounded-full bg-paper-3 py-1 pl-1.5 pr-2.5 text-[12px] text-ink-2"
                    >
                      <span className="flex size-5 items-center justify-center rounded-full bg-ink/10 text-[9px] font-semibold">
                        {u.name
                          .split(' ')
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </span>
                      {u.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Auditoria ---------- */

const EVENT_LABEL: Record<string, string> = {
  session_started: 'Sessão iniciada',
  agent_status: 'Status do agente',
  agent_delegation: 'Delegou para especialista',
  tool_call: 'Usou ferramenta',
  tool_call_update: 'Ferramenta concluída',
  tool_executed: 'Ferramenta da empresa executada',
  final_message: 'Respondeu ao usuário',
  provider_fallback: 'Usou provedor reserva',
  channel_connected: 'Canal conectado',
  channel_removed: 'Canal removido',
  subscription_activated: 'Assinatura ativada',
  subscription_connected: 'Assinatura conectada',
  error: 'Erro',
}

function AuditTab() {
  const [type, setType] = useState('')
  const [agentId, setAgentId] = useState('')
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [expanded, setExpanded] = useState<string | null>(null)
  const { data: agents } = useGetAgentsQuery()
  const { data: summary } = useGetAuditSummaryQuery()
  const { data, isLoading, isFetching } = useGetAuditEventsQuery({
    type: type || undefined,
    agentId: agentId || undefined,
    cursor,
  })

  return (
    <div className="space-y-4">
      <p className="text-[13px] leading-relaxed text-ink-2">
        Trilha de tudo que os agentes fizeram: ferramentas usadas, delegações,
        respostas e erros. Somente administradores enxergam esta aba.
      </p>

      {summary && (
        <div className="flex flex-wrap gap-2">
          <Badge>Últimos 7 dias: {summary.total} eventos</Badge>
          {Object.entries(summary.byType).map(([t, n]) => (
            <Badge key={t}>{EVENT_LABEL[t] ?? t}: {n}</Badge>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="min-w-44">
          <Select value={type} onChange={(e) => { setType(e.target.value); setCursor(undefined) }}>
            <option value="">Todos os tipos</option>
            {Object.entries(EVENT_LABEL).map(([t, label]) => (
              <option key={t} value={t}>{label}</option>
            ))}
          </Select>
        </div>
        <div className="min-w-44">
          <Select value={agentId} onChange={(e) => { setAgentId(e.target.value); setCursor(undefined) }}>
            <option value="">Todos os agentes</option>
            {agents?.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading && <Skeleton className="h-40 w-full rounded-xl" />}
      {!isLoading && data?.events.length === 0 && (
        <EmptyState title="Nenhum evento" description="Os eventos de orquestração aparecerão aqui conforme os agentes trabalham." />
      )}

      <div className="divide-y divide-line rounded-xl border border-line">
        {data?.events.map((e) => {
          const payloadText = e.payload && typeof e.payload === 'object' && 'text' in e.payload
            ? String((e.payload as { text?: unknown }).text ?? '')
            : ''
          return (
            <div key={e.id} className="px-4 py-2.5">
              <button
                onClick={() => setExpanded((id) => (id === e.id ? null : e.id))}
                className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 text-left sm:flex-nowrap sm:gap-3"
              >
                <span className="w-16 shrink-0 text-[12px] tabular-nums text-ink-3 sm:w-32">
                  <span className="sm:hidden">{new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="hidden sm:inline">{new Date(e.createdAt).toLocaleString()}</span>
                </span>
                {e.agent ? (
                  <span className="flex min-w-0 shrink-0 items-center gap-1.5 text-[13px] font-medium">
                    <AgentAvatar seed={e.agent.avatarSeed} size={18} />
                    {e.agent.name}
                  </span>
                ) : (
                  <span className="shrink-0 text-[13px] text-ink-3">Sistema</span>
                )}
                <Badge className={cx('max-w-full shrink-0', e.type === 'error' && 'text-danger')}>
                  <span className="min-w-0 truncate">{EVENT_LABEL[e.type] ?? e.type}</span>
                </Badge>
                <span className="min-w-0 basis-full truncate text-[13px] text-ink-2 sm:flex-1 sm:basis-auto">
                  {payloadText}
                </span>
              </button>
              {expanded === e.id && (
                <div className="mt-2 space-y-1.5">
                  {e.conversation && (
                    <Link
                      to={`/office/c/${e.conversation.id}`}
                      className="inline-block text-[12px] text-ink-2 underline underline-offset-2 hover:text-ink"
                    >
                      Conversa: {e.conversation.title}
                    </Link>
                  )}
                  <pre className="max-h-64 overflow-auto rounded-lg bg-paper-3 px-3 py-2 text-[11px] leading-relaxed text-ink-2">
                    {JSON.stringify(e.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {data?.nextCursor && (
        <div className="flex justify-center">
          <Button variant="secondary" disabled={isFetching} onClick={() => setCursor(data.nextCursor!)}>
            {isFetching ? <Spinner /> : null} Carregar mais
          </Button>
        </div>
      )}
    </div>
  )
}

/* ---------- Consumo de tokens ---------- */

const USAGE_PERIODS = [
  ['7', '7 dias'],
  ['30', '30 dias'],
  ['90', '90 dias'],
] as const

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function UsageBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0
  return (
    <div className="h-1.5 w-full rounded-full bg-paper-3">
      <div className="h-1.5 rounded-full bg-ink" style={{ width: `${pct}%` }} />
    </div>
  )
}

function UsageTab() {
  const [days, setDays] = useState<string>('30')
  const from = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - parseInt(days, 10))
    return d.toISOString()
  }, [days])
  const { data: summary, isLoading } = useGetUsageSummaryQuery({ from })
  const { data: byAgent } = useGetUsageByAgentQuery({ from })
  const { data: byUser } = useGetUsageByUserQuery({ from })

  const maxAgent = byAgent?.[0]?.totalTokens ?? 0
  const maxUser = byUser?.[0]?.totalTokens ?? 0

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] leading-relaxed text-ink-2">
          Tokens consumidos pelos agentes, por agente e por usuário solicitante.
        </p>
        <div className="flex gap-1 rounded-lg border border-line p-0.5">
          {USAGE_PERIODS.map(([d, label]) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cx(
                'rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors duration-150',
                days === d ? 'bg-ink text-paper' : 'text-ink-3 hover:text-ink',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <Skeleton className="h-24 w-full rounded-xl" />}

      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ['Total', summary.totalTokens],
              ['Entrada', summary.promptTokens],
              ['Saída', summary.completionTokens],
              ['Interações', summary.turns],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-xl border border-line px-4 py-3">
              <p className="text-[12px] text-ink-3">{label}</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{fmtTokens(value)}</p>
            </div>
          ))}
        </div>
      )}

      {summary && summary.totalTokens === 0 && (
        <EmptyState
          title="Sem consumo no período"
          description="Os tokens aparecem aqui conforme as conversas acontecem. Provedores que não reportam uso não geram registros."
        />
      )}

      {byAgent && byAgent.length > 0 && (
        <div>
          <h3 className="mb-2 text-[13px] font-semibold">Por agente</h3>
          <div className="divide-y divide-line rounded-xl border border-line">
            {byAgent.map((r, i) => (
              <div key={r.agent?.id ?? i} className="flex items-center gap-3 px-4 py-2.5">
                {r.agent ? (
                  <span className="flex w-28 min-w-0 shrink-0 items-center gap-2 text-[13px] font-medium sm:w-48">
                    <AgentAvatar seed={r.agent.avatarSeed} size={22} />
                    <span className="truncate">{r.agent.name}</span>
                  </span>
                ) : (
                  <span className="w-28 shrink-0 truncate text-[13px] text-ink-3 sm:w-48">Agente removido</span>
                )}
                <div className="min-w-0 flex-1">
                  <UsageBar value={r.totalTokens} max={maxAgent} />
                </div>
                <span className="w-16 shrink-0 text-right text-[13px] tabular-nums sm:w-20">
                  {fmtTokens(r.totalTokens)}
                </span>
                <span className="hidden w-24 shrink-0 text-right text-[12px] text-ink-3 sm:block">
                  {r.turns} interações
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {byUser && byUser.length > 0 && (
        <div>
          <h3 className="mb-2 text-[13px] font-semibold">Por usuário</h3>
          <div className="divide-y divide-line rounded-xl border border-line">
            {byUser.map((r, i) => (
              <div key={r.user?.id ?? i} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-28 min-w-0 shrink-0 truncate text-[13px] font-medium sm:w-48">
                  {r.user?.name ?? 'Usuário removido'}
                </span>
                <div className="min-w-0 flex-1">
                  <UsageBar value={r.totalTokens} max={maxUser} />
                </div>
                <span className="w-16 shrink-0 text-right text-[13px] tabular-nums sm:w-20">
                  {fmtTokens(r.totalTokens)}
                </span>
                <span className="hidden w-24 shrink-0 text-right text-[12px] text-ink-3 sm:block">
                  {r.turns} interações
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- Aprendizados (skills dos agentes) ---------- */

function LearningTab() {
  const { data, isLoading, isError } = useGetLearnedSkillsQuery()
  const [archive, { isLoading: archiving }] = useArchiveLearnedSkillMutation()
  const [expanded, setExpanded] = useState<string | null>(null)

  const active = data?.skills.filter((s) => !s.archived) ?? []
  const archived = data?.skills.filter((s) => s.archived) ?? []

  async function onArchive(name: string) {
    try {
      await archive(name).unwrap()
      toast.success(`"${name}" arquivada. Vale a partir das próximas sessões dos agentes.`)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível arquivar.'))
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] leading-relaxed text-ink-2">
        Habilidades que os agentes aprenderam com o uso: procedimentos, regras e
        preferências da empresa. Elas moldam o comportamento futuro: arquive o
        que estiver errado ou desatualizado (nada é excluído; fica recuperável).
      </p>

      {isLoading && <Skeleton className="h-32 w-full rounded-xl" />}
      {isError && (
        <EmptyState
          title="Não foi possível carregar"
          description="O serviço de agentes (bridge) parece indisponível. Tente novamente em instantes."
        />
      )}
      {!isLoading && !isError && data?.skills.length === 0 && (
        <EmptyState
          title="Nenhum aprendizado ainda"
          description='Ensine algo a um agente no chat (ex.: "aprenda que reembolsos acima de R$ 500 precisam de aprovação do financeiro") e o registro aparecerá aqui.'
        />
      )}

      {active.length > 0 && (
        <div className="divide-y divide-line rounded-xl border border-line">
          {active.map((s) => (
            <div key={s.name} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setExpanded((n) => (n === s.name ? null : s.name))}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-[13px] font-medium">{s.name}</span>
                  <span className="block truncate text-[12px] text-ink-3">
                    {s.description || 'Sem descrição'} ·{' '}
                    {new Date(s.updatedAt * 1000).toLocaleDateString()}
                  </span>
                </button>
                <Button
                  variant="secondary"
                  className="h-7 shrink-0 text-[12px]"
                  disabled={archiving}
                  onClick={() => onArchive(s.name)}
                >
                  Arquivar
                </Button>
              </div>
              {expanded === s.name && (
                <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-paper-3 px-3 py-2 text-[12px] leading-relaxed text-ink-2">
                  {s.content}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <div>
          <h3 className="mb-2 text-[13px] font-semibold text-ink-3">
            Arquivadas ({archived.length})
          </h3>
          <div className="divide-y divide-line rounded-xl border border-line opacity-60">
            {archived.map((s) => (
              <div key={`arch-${s.name}`} className="px-4 py-2.5">
                <span className="block truncate text-[13px]">{s.name}</span>
                <span className="block truncate text-[12px] text-ink-3">
                  {s.description || 'Sem descrição'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
