import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import {
  useGetAgentAccessQuery,
  useGetAgentQuery,
  useGetAgentToolsQuery,
  useGetProviderKeysQuery,
  useGetSubscriptionStatusQuery,
  useGetToolsQuery,
  useGetUsersQuery,
  useSetAgentAccessMutation,
  useSetAgentToolsMutation,
  useUpdateAgentMutation,
} from '@/api/api'
import { SUBSCRIPTIONS } from '@/components/subscriptions'
import { apiErrorMessage } from '@/lib/apiError'
import { seedForName } from '@/lib/avatar'
import type { Agent } from '@/types'
import {
  AgentAvatar,
  Badge,
  Button,
  Field,
  Input,
  Select,
  Skeleton,
  Spinner,
  Textarea,
  cx,
} from '@/components/ui'

type Tab = 'config' | 'tools' | 'access'

export default function AgentPage() {
  const { id } = useParams<{ id: string }>()
  const { data: agent, isLoading } = useGetAgentQuery(id!)
  const [tab, setTab] = useState<Tab>('config')

  if (isLoading || !agent) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <Skeleton className="mt-8 h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-up sm:px-6 sm:py-10">
        <AgentHeader agent={agent} />

        <div className="mt-8 flex gap-1 border-b border-line">
          {(
            [
              ['config', 'Configuração'],
              ['tools', 'Ferramentas'],
              ['access', 'Acesso'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cx(
                'relative px-3.5 py-2 text-[13px] font-medium transition-colors duration-150',
                tab === key ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
              )}
            >
              {label}
              {tab === key && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ink" />}
            </button>
          ))}
        </div>

        <div className="pt-6">
          {tab === 'config' && <ConfigTab agent={agent} />}
          {tab === 'tools' && <ToolsTab agentId={agent.id} />}
          {tab === 'access' && <AccessTab agentId={agent.id} />}
        </div>
      </div>
    </div>
  )
}

function AgentHeader({ agent }: { agent: Agent }) {
  const [updateAgent, { isLoading }] = useUpdateAgentMutation()

  async function regenerateAvatar() {
    try {
      await updateAgent({ id: agent.id, avatarSeed: seedForName(agent.name) }).unwrap()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <div className="flex items-center gap-5">
      <AgentAvatar seed={agent.avatarSeed} size={72} />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-xl font-semibold">{agent.name}</h1>
          {agent.isManager && <Badge>Gerente</Badge>}
          {!agent.isActive && <Badge className="text-danger">Inativo</Badge>}
        </div>
        <p className="mt-0.5 truncate text-sm text-ink-2">{agent.role}</p>
        <Button variant="secondary" className="mt-2.5 h-8 text-[13px]" onClick={regenerateAvatar} disabled={isLoading}>
          {isLoading ? <Spinner /> : '↻'} Regenerar avatar
        </Button>
      </div>
    </div>
  )
}

function ConfigTab({ agent }: { agent: Agent }) {
  const { data: keys } = useGetProviderKeysQuery()
  const { data: subStatus } = useGetSubscriptionStatusQuery()
  const [updateAgent, { isLoading: saving }] = useUpdateAgentMutation()
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const [form, setForm] = useState(() => ({
    name: agent.name,
    role: agent.role,
    description: agent.description ?? '',
    systemPrompt: agent.systemPrompt ?? '',
    isActive: agent.isActive,
    provider: agent.capabilities?.text_generation?.provider ?? '',
    model: agent.capabilities?.text_generation?.model ?? '',
    temperature: agent.capabilities?.text_generation?.temperature ?? 0.7,
  }))

  useEffect(() => {
    setForm({
      name: agent.name,
      role: agent.role,
      description: agent.description ?? '',
      systemPrompt: agent.systemPrompt ?? '',
      isActive: agent.isActive,
      provider: agent.capabilities?.text_generation?.provider ?? '',
      model: agent.capabilities?.text_generation?.model ?? '',
      temperature: agent.capabilities?.text_generation?.temperature ?? 0.7,
    })
  }, [agent])

  // "Provider" é um só conceito com dois tipos: assinatura ativa OU chave de
  // API. O agente pode apontar para qualquer um deles.
  const activeSub = subStatus?.active
  const subMeta = activeSub
    ? SUBSCRIPTIONS.find((s) => s.key === activeSub.provider)
    : undefined
  const providerOptions = [
    ...(activeSub
      ? [
          {
            value: activeSub.provider,
            label: `${subMeta?.label ?? activeSub.provider} · assinatura`,
          },
        ]
      : []),
    ...[...new Set((keys ?? []).map((k) => k.provider))].map((p) => ({
      value: p,
      label: `${p} · chave de API`,
    })),
  ]
  // com assinatura ativa e sem escolha explícita, o provider efetivo é a
  // assinatura — reflete isso no select em vez de mostrar "Selecione…".
  const selectedProvider = form.provider || (activeSub?.provider ?? '')
  const subSelected = !!activeSub && selectedProvider === activeSub.provider

  // modelos sugeridos + qual é o modelo GLOBAL (padrão herdado). Modelo vazio
  // no agente = usa o global; um valor = sobrescreve só para este agente.
  const modelChoices = SUBSCRIPTIONS.find((s) => s.key === selectedProvider)?.models ?? []
  const globalModel = subSelected
    ? activeSub?.model ?? ''
    : (keys ?? []).find((k) => k.provider === selectedProvider)?.defaultModel ?? ''
  const modelIsCustom = form.model !== '' && !modelChoices.includes(form.model)
  const modelSelectValue = form.model === '' ? '' : modelIsCustom ? '__outro__' : form.model

  async function save() {
    try {
      await updateAgent({
        id: agent.id,
        name: form.name,
        role: form.role,
        description: form.description,
        systemPrompt: form.systemPrompt,
        isActive: form.isActive,
        capabilities: {
          ...(agent.capabilities ?? {}),
          text_generation: {
            // '__CUSTOM__' é o modo "digitar" ainda vazio → salva como global
            ...(form.provider ? { provider: form.provider } : {}),
            ...(form.model && form.model !== '__CUSTOM__'
              ? { model: form.model.trim() }
              : {}),
            temperature: form.temperature,
          },
        },
      }).unwrap()
      toast.success('Agente atualizado.')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível salvar o agente.'))
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nome">
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </Field>
        <Field label="Papel">
          <Input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="Ex.: Analista financeiro" />
        </Field>
      </div>
      <Field label="Descrição">
        <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="O que este agente faz, em uma ou duas frases." />
      </Field>

      {/* Avançado */}
      <div className="rounded-xl border border-line">
        <button
          onClick={() => setAdvancedOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-[13px] font-medium text-ink transition-colors duration-150 hover:bg-paper-2"
        >
          Avançado
          <span className={cx('text-ink-3 transition-transform duration-150', advancedOpen && 'rotate-180')}>▾</span>
        </button>
        {advancedOpen && (
          <div className="space-y-5 border-t border-line px-4 py-4 animate-fade-up">
            <Field label="Instruções (system prompt)" hint="Define o comportamento, o tom e as restrições do agente.">
              <Textarea rows={8} value={form.systemPrompt} onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))} />
            </Field>

            <div>
              <p className="mb-2.5 text-[13px] font-semibold">Geração de texto</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Provedor"
                  hint={
                    providerOptions.length === 0
                      ? 'Conecte uma assinatura ou cadastre uma chave em Configurações → Provedores.'
                      : subSelected
                        ? 'Assinatura ativa da empresa — usada pelos agentes.'
                        : undefined
                  }
                >
                  <Select value={selectedProvider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}>
                    <option value="">Selecione…</option>
                    {providerOptions.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Modelo"
                  hint="Padrão = o modelo global. Escolha outro só para este agente."
                >
                  {modelChoices.length > 0 ? (
                    <>
                      <Select
                        value={modelSelectValue}
                        onChange={(e) => {
                          const v = e.target.value
                          setForm((f) => ({
                            ...f,
                            // '' = padrão global; preset = valor; Outro = modo digitar
                            model:
                              v === '__outro__'
                                ? modelIsCustom
                                  ? f.model
                                  : '__CUSTOM__'
                                : v,
                          }))
                        }}
                      >
                        <option value="">
                          {globalModel ? `Padrão global (${globalModel})` : 'Padrão global'}
                        </option>
                        {modelChoices.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                        <option value="__outro__">Outro (digitar)…</option>
                      </Select>
                      {modelIsCustom && (
                        <Input
                          className="mt-2"
                          autoFocus
                          value={form.model === '__CUSTOM__' ? '' : form.model}
                          onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                          placeholder="ex.: claude-opus-4-8"
                        />
                      )}
                    </>
                  ) : (
                    <Input
                      value={form.model === '__CUSTOM__' ? '' : form.model}
                      onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                      placeholder={globalModel ? `Padrão: ${globalModel}` : 'Ex.: gpt-4o, claude-sonnet-4-5'}
                    />
                  )}
                </Field>
              </div>
              <div className="mt-4">
                <label className="block">
                  <span className="mb-1.5 flex items-center justify-between text-[13px] font-medium">
                    Temperatura
                    <span className="font-normal tabular-nums text-ink-2">{form.temperature.toFixed(1)}</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.1}
                    value={form.temperature}
                    onChange={(e) => setForm((f) => ({ ...f, temperature: Number(e.target.value) }))}
                    className="w-full accent-ink"
                  />
                  <span className="mt-1 flex justify-between text-[11px] text-ink-3">
                    <span>Preciso</span>
                    <span>Criativo</span>
                  </span>
                </label>
              </div>
            </div>

            <label className="flex items-center justify-between rounded-lg border border-line px-3.5 py-3">
              <span>
                <span className="block text-[13px] font-medium">Agente ativo</span>
                <span className="block text-[12px] text-ink-3">Agentes inativos não participam das conversas.</span>
              </span>
              <button
                role="switch"
                aria-checked={form.isActive}
                onClick={(e) => {
                  e.preventDefault()
                  setForm((f) => ({ ...f, isActive: !f.isActive }))
                }}
                className={cx(
                  'relative h-5.5 w-10 rounded-full transition-colors duration-150',
                  form.isActive ? 'bg-ink' : 'bg-line-2',
                )}
              >
                <span
                  className={cx(
                    'absolute top-0.5 size-4.5 rounded-full bg-paper transition-all duration-150',
                    form.isActive ? 'left-5' : 'left-0.5',
                  )}
                />
              </button>
            </label>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving || !form.name.trim()}>
          {saving ? <><Spinner className="border-t-paper border-paper/40" /> Salvando…</> : 'Salvar alterações'}
        </Button>
      </div>
    </div>
  )
}

function ToolsTab({ agentId }: { agentId: string }) {
  const { data: tools, isLoading: loadingTools } = useGetToolsQuery()
  const { data: agentTools, isLoading: loadingAgentTools } = useGetAgentToolsQuery(agentId)
  const [setAgentTools, { isLoading: saving }] = useSetAgentToolsMutation()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (agentTools) setSelected(new Set(agentTools.toolIds))
  }, [agentTools])

  async function save() {
    try {
      await setAgentTools({ id: agentId, toolIds: [...selected] }).unwrap()
      toast.success('Ferramentas do agente atualizadas.')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível salvar as ferramentas.'))
    }
  }

  if (loadingTools || loadingAgentTools) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (!tools || tools.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line-2 px-6 py-10 text-center">
        <p className="text-sm font-medium">Nenhuma ferramenta cadastrada</p>
        <p className="mx-auto mt-1 max-w-sm text-[13px] text-ink-2">
          Cadastre ferramentas HTTP para que este agente possa executar ações nos
          sistemas da sua empresa.
        </p>
        <Link
          to="/office/tools"
          className="mt-4 inline-flex h-9 items-center rounded-lg bg-ink px-4 text-sm font-medium text-paper transition-colors duration-150 hover:bg-zinc-700"
        >
          Ir para Ferramentas
        </Link>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-4 text-[13px] text-ink-2">
        Selecione quais ferramentas este agente pode usar durante as conversas.
      </p>
      <div className="divide-y divide-line rounded-xl border border-line">
        {tools.map((t) => (
          <label
            key={t.id}
            className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-paper-2"
          >
            <input
              type="checkbox"
              checked={selected.has(t.id)}
              onChange={(e) => {
                setSelected((prev) => {
                  const next = new Set(prev)
                  if (e.target.checked) next.add(t.id)
                  else next.delete(t.id)
                  return next
                })
              }}
              className="size-4 accent-ink"
            />
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">{t.displayName}</span>
                {!t.isActive && <Badge className="text-danger">Inativa</Badge>}
              </span>
              <span className="block truncate font-mono text-[12px] text-ink-3">{t.name}</span>
            </span>
            <Badge className="ml-auto font-mono">{t.method}</Badge>
          </label>
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <><Spinner className="border-t-paper border-paper/40" /> Salvando…</> : 'Salvar ferramentas'}
        </Button>
      </div>
    </div>
  )
}

function AccessTab({ agentId }: { agentId: string }) {
  const { data: users, isLoading: loadingUsers } = useGetUsersQuery()
  const { data: access, isLoading: loadingAccess } = useGetAgentAccessQuery(agentId)
  const [setAccess, { isLoading: saving }] = useSetAgentAccessMutation()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (access) setSelected(new Set(access.userIds))
  }, [access])

  async function save() {
    try {
      await setAccess({ id: agentId, userIds: [...selected] }).unwrap()
      toast.success('Acesso atualizado.')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível salvar o acesso.'))
    }
  }

  if (loadingUsers || loadingAccess) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <p className="mb-4 text-[13px] text-ink-2">
        Selecione quem pode conversar com este agente. Donos e administradores
        sempre têm acesso.
      </p>
      <div className="divide-y divide-line rounded-xl border border-line">
        {users?.map((u) => (
          <label key={u.id} className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-paper-2">
            <input
              type="checkbox"
              checked={selected.has(u.id)}
              onChange={(e) => {
                setSelected((prev) => {
                  const next = new Set(prev)
                  if (e.target.checked) next.add(u.id)
                  else next.delete(u.id)
                  return next
                })
              }}
              className="size-4 accent-ink"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{u.name}</span>
              <span className="block truncate text-[12px] text-ink-3">{u.email}</span>
            </span>
            <Badge className="ml-auto">{u.role}</Badge>
          </label>
        ))}
        {users?.length === 0 && (
          <p className="px-4 py-6 text-center text-[13px] text-ink-3">Nenhum usuário na empresa ainda.</p>
        )}
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <><Spinner className="border-t-paper border-paper/40" /> Salvando…</> : 'Salvar acesso'}
        </Button>
      </div>
    </div>
  )
}
