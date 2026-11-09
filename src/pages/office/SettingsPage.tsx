import { useEffect, useRef, useState, type FormEvent } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { DesktopDownloads } from '@/components/DesktopDownloads'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useDeleteAccountMutation,
  useGetConnectorsQuery,
  useCreateConnectorMutation,
  useRevokeConnectorMutation,
  useCreatePairCodeMutation,
  useGetAgentsQuery,
  useCreateTelegramChannelMutation,
  useCreateEmailChannelMutation,
  useCreateWhatsAppChannelMutation,
  useLazyGetWhatsAppStatusQuery,
  useListMeetingAccountsQuery,
  useConnectMeetingAccountMutation,
  useDisconnectMeetingAccountMutation,
} from '@/api/api'
import { apiErrorMessage } from '@/lib/apiError'
import { MeetLoginModal } from '@/components/MeetLoginModal'
import { logout } from '@/store/authSlice'
import type { RootState } from '@/store'
import {
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

type Tab = 'connector' | 'channels' | 'account'

const settingsIcon = 'h-4 w-4 shrink-0'
function GearIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className ?? 'h-5 w-5'}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}
function LaptopIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className ?? settingsIcon}>
      <rect x="4" y="5" width="16" height="11" rx="2" />
      <path d="M2 20h20" />
    </svg>
  )
}
function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className ?? settingsIcon}>
      <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z" />
    </svg>
  )
}
function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className ?? settingsIcon}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>(() => {
    const t = new URLSearchParams(window.location.search).get('tab')
    return (['connector', 'channels', 'account'].includes(t ?? '')
      ? (t as Tab)
      : 'connector')
  })

  const tabs = [
    { key: 'connector', label: 'Conector local', Icon: LaptopIcon },
    { key: 'channels', label: 'Conexões', Icon: ChatIcon },
    { key: 'account', label: 'Conta', Icon: UserIcon },
  ] as const

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-up sm:px-6 sm:py-10">
        <header className="flex items-start gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-line bg-paper-2 text-ink">
            <GearIcon />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold leading-tight">Configurações</h1>
            <p className="mt-1 text-sm text-ink-2">Conector local, conexões e sua conta.</p>
          </div>
        </header>

        <div className="mt-7 -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          <div className="flex min-w-max gap-0.5 border-b border-line">
            {tabs.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cx(
                  'relative flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition-colors duration-150',
                  tab === key ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
                )}
              >
                <Icon className={cx('h-4 w-4 shrink-0 transition-colors', tab === key ? 'text-ink' : 'text-ink-3')} />
                {label}
                {tab === key && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ink" />}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6">
          {tab === 'connector' && <ConnectorTab />}
          {tab === 'channels' && <ChannelsTab />}
          {tab === 'account' && <AccountTab />}
        </div>
      </div>
    </div>
  )
}

/* ---------- Conector local ---------- */

function ConnectorTab() {
  const { data: connectors, isLoading } = useGetConnectorsQuery(undefined, {
    pollingInterval: 10_000, // status online/offline sem refresh manual
    skipPollingIfUnfocused: true,
  })
  const [createConnector, { isLoading: creating }] = useCreateConnectorMutation()
  const [revokeConnector] = useRevokeConnectorMutation()
  const [name, setName] = useState('')
  const [created, setCreated] = useState<{ name: string; token: string } | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [createPairCode, { isLoading: generatingCode }] = useCreatePairCodeMutation()
  const [pairCode, setPairCode] = useState<string | null>(null)

  const npxCommand = created
    ? `npx @alphatech/aao-connector --token ${created.token} --pasta "C:\\MinhaPasta"`
    : ''

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const res = await createConnector({ name: name.trim() }).unwrap()
      setCreated({ name: res.name, token: res.token })
      setName('')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível criar o conector.'))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold">Conector local</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-2">
          Compartilhe pastas de um computador com os agentes do escritório. Um
          pequeno aplicativo roda na máquina e cria um túnel seguro de saída, sem
          precisar abrir nenhuma porta. Os agentes podem listar, ler,
          buscar e criar/editar arquivos nas pastas autorizadas,{' '}
          <span className="font-medium text-ink">nunca excluir</span>.
        </p>
        <p className="mt-2 text-[12px] text-ink-3">
          Independente da "Área de atuação" (aba Agentes): aquela controla o
          ambiente dos agentes no servidor; o conector controla o acesso às
          pastas do seu computador. As duas coexistem.
        </p>
      </div>

      <div className="rounded-xl border border-line p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[13px] font-semibold">Conectar este computador (app desktop)</h3>
            <p className="mt-0.5 text-[12px] text-ink-3">
              Instale o AAO Desktop, gere um código e digite-o no aplicativo. Vale por 10 minutos.
            </p>
            <div className="mt-3">
              <DesktopDownloads />
            </div>
          </div>
          <Button
            variant="secondary"
            className="h-8 shrink-0 text-[12px]"
            disabled={generatingCode}
            onClick={async () => {
              try {
                const res = await createPairCode().unwrap()
                setPairCode(res.code)
              } catch (err) {
                toast.error(apiErrorMessage(err, 'Não foi possível gerar o código.'))
              }
            }}
          >
            {generatingCode ? <Spinner /> : 'Gerar código'}
          </Button>
        </div>
        {pairCode && (
          <p className="mt-3 select-all text-center font-mono text-2xl font-semibold tracking-widest">
            {pairCode}
          </p>
        )}
      </div>

      <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <Field label="Nome do conector">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Computador da recepção"
            />
          </Field>
        </div>
        <Button type="submit" className="shrink-0" disabled={creating || !name.trim()}>
          {creating ? <Spinner /> : null} Criar conector
        </Button>
      </form>

      {isLoading && <Skeleton className="h-24 w-full rounded-xl" />}
      {connectors?.length === 0 && (
        <EmptyState
          title="Nenhum conector ainda"
          description="Crie um conector para dar aos agentes acesso a pastas de um computador da empresa."
        />
      )}

      {connectors && connectors.length > 0 && (
        <div className="divide-y divide-line rounded-xl border border-line">
          {connectors.map((c) => (
            <div key={c.id} className="px-4 py-3 transition-colors duration-150 hover:bg-paper-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span
                  className={cx(
                    'size-2 shrink-0 rounded-full',
                    c.status === 'online' ? 'bg-ok' : 'bg-line-2',
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.name}</span>
                  <span className="block text-[12px] text-ink-3">
                    {c.status === 'online'
                      ? 'Conectado agora'
                      : c.lastSeenAt
                        ? `Visto por último em ${new Date(c.lastSeenAt).toLocaleString()}`
                        : 'Nunca conectou'}
                  </span>
                </span>
                <Badge className={cx('shrink-0', c.status === 'online' && 'text-ok')}>
                  {c.status === 'online' ? 'Online' : 'Offline'}
                </Badge>
                {confirmId === c.id ? (
                  <span className="flex shrink-0 items-center gap-1.5">
                    <Button
                      variant="danger"
                      className="h-7 px-2.5 text-[12px]"
                      onClick={async () => {
                        try {
                          await revokeConnector(c.id).unwrap()
                          toast.success('Conector revogado.')
                        } catch (err) {
                          toast.error(apiErrorMessage(err))
                        } finally {
                          setConfirmId(null)
                        }
                      }}
                    >
                      Confirmar
                    </Button>
                    <Button variant="secondary" className="h-7 px-2.5 text-[12px]" onClick={() => setConfirmId(null)}>
                      Cancelar
                    </Button>
                  </span>
                ) : (
                  <Button variant="ghost" className="h-8 px-2.5 text-[13px]" onClick={() => setConfirmId(c.id)}>
                    Revogar
                  </Button>
                )}
              </div>
              {c.folders.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 pl-5">
                  {c.folders.map((f) => (
                    <span
                      key={f.path}
                      className="inline-flex items-center gap-1.5 rounded-md bg-paper-3 px-2 py-0.5 font-mono text-[11px] text-ink-2"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-3 shrink-0 text-ink-3" aria-hidden>
                        <path d="M4 20a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5l2 2.5h9a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2Z" />
                      </svg>
                      {f.path}
                      {f.readOnly && <span className="text-ink-3">· somente leitura</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={created !== null}
        onClose={() => setCreated(null)}
        title={`Conector "${created?.name}" criado`}
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-ink-2">
            Execute o comando abaixo no computador que terá as pastas
            compartilhadas (troque o caminho pela pasta desejada; adicione{' '}
            <code className="rounded bg-paper-3 px-1 font-mono text-[12px]">:ro</code>{' '}
            no final de uma pasta para permitir apenas leitura):
          </p>
          <div className="rounded-lg bg-ink px-3 py-2.5 font-mono text-[12px] leading-relaxed text-paper break-all">
            {npxCommand}
          </div>
          <p className="flex gap-2 rounded-lg bg-paper-3 px-3 py-2 text-[13px] leading-relaxed text-ink-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden>
              <path d="M10.3 3.3 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
            <span>
              Este token não será exibido novamente. Guarde-o com segurança. Se
              perder, revogue o conector e crie outro.
            </span>
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                void navigator.clipboard.writeText(npxCommand)
                toast.success('Comando copiado.')
              }}
            >
              Copiar comando
            </Button>
            <Button onClick={() => setCreated(null)}>Concluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ---------- Conta ---------- */

function AccountTab() {
  const user = useSelector((s: RootState) => s.auth.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [deleteAccount, { isLoading }] = useDeleteAccountMutation()
  const [modalOpen, setModalOpen] = useState(false)
  const [password, setPassword] = useState('')

  const isOwner = user?.role === 'OWNER'

  async function onDelete(e: FormEvent) {
    e.preventDefault()
    try {
      await deleteAccount({ password }).unwrap()
      toast.success(isOwner ? 'Empresa excluída.' : 'Conta excluída.')
      dispatch(logout())
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível excluir a conta.'))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold">Sua conta</h2>
        <p className="mt-1 text-sm text-ink-2">
          {user?.name} · {user?.email}
        </p>
      </div>

      <div className="rounded-lg border border-red-200 p-4">
        <h3 className="text-sm font-semibold text-danger">Zona de perigo</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
          {isOwner
            ? 'Você é o proprietário: excluir sua conta apaga a empresa inteira (agentes, conversas, ferramentas, chaves e todos os usuários). Essa ação não pode ser desfeita.'
            : 'Excluir sua conta remove seu acesso e seus dados pessoais. Essa ação não pode ser desfeita.'}
        </p>
        <div className="mt-3">
          <Button variant="danger" onClick={() => setModalOpen(true)}>
            Excluir conta
          </Button>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setPassword('')
        }}
        title={isOwner ? 'Excluir empresa e conta' : 'Excluir conta'}
      >
        <form onSubmit={onDelete} className="space-y-4">
          <p className="text-sm leading-relaxed text-ink-2">
            {isOwner
              ? 'Isso apagará permanentemente a empresa e todos os dados dela. Digite sua senha para confirmar.'
              : 'Isso apagará permanentemente sua conta. Digite sua senha para confirmar.'}
          </p>
          <Field label="Senha">
            <Input
              required
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha atual"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="danger" disabled={!password || isLoading}>
              {isLoading ? <Spinner /> : null} Excluir definitivamente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

/* ---------- Canais (omnichannel) ---------- */

function ChannelsTab() {
  const { data: agents } = useGetAgentsQuery()
  const [createTelegram, { isLoading: creating }] = useCreateTelegramChannelMutation()
  const [token, setToken] = useState('')
  const [agentId, setAgentId] = useState('')

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      const res = await createTelegram({ token: token.trim(), agentId: agentId || undefined }).unwrap()
      toast.success(`Bot ${res.name} conectado! Mande uma mensagem para ele no Telegram.`)
      setToken('')
      setAgentId('')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível conectar o bot.'))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold">Conexões</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-2">
          Credenciais e contas usadas pelo escritório: bots de atendimento
          (Telegram, e-mail, WhatsApp) e a conta que o bot de reuniões usa para
          entrar nas chamadas. A gestão do dia a dia fica em{' '}
          <a className="underline underline-offset-2" href="/office/inbox?view=channels">Canais</a>{' '}
          e em <a className="underline underline-offset-2" href="/office/meetings">Reuniões</a>.
        </p>
      </div>

      <form onSubmit={onCreate} className="space-y-3 rounded-xl border border-line p-4">
        <h3 className="text-[13px] font-semibold">Conectar bot do Telegram</h3>
        <p className="text-[12px] text-ink-3">
          Crie um bot com o <a className="underline underline-offset-2" href="https://t.me/BotFather" target="_blank" rel="noreferrer">@BotFather</a>{' '}
          (comando /newbot) e cole o token abaixo.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full min-w-0 sm:w-auto sm:min-w-64 sm:flex-1">
            <Field label="Token do bot">
              <Input
                placeholder="123456789:AAF..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </Field>
          </div>
          <div className="w-full sm:w-56">
            <Field label="Agente atendente">
              <Select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
                <option value="">Agente Gerente (padrão)</option>
                {agents?.filter((a) => !a.isManager).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Button type="submit" className="w-full sm:w-auto" disabled={creating || !token.trim()}>
            {creating ? <Spinner className="border-t-paper border-paper/40" /> : 'Conectar'}
          </Button>
        </div>
      </form>

      <EmailChannelForm agents={agents} />

      <WhatsAppChannelForm agents={agents} />

      <MeetIntegrationsSection />
    </div>
  )
}

const EMAIL_PRESETS: Record<string, { imapHost: string; imapPort: number; smtpHost: string; smtpPort: number }> = {
  gmail: { imapHost: 'imap.gmail.com', imapPort: 993, smtpHost: 'smtp.gmail.com', smtpPort: 587 },
  outlook: { imapHost: 'outlook.office365.com', imapPort: 993, smtpHost: 'smtp.office365.com', smtpPort: 587 },
}

function EmailChannelForm({ agents }: { agents?: { id: string; name: string; isManager: boolean }[] }) {
  const [createEmail, { isLoading }] = useCreateEmailChannelMutation()
  const [form, setForm] = useState({
    address: '',
    password: '',
    imapHost: '',
    imapPort: 993,
    smtpHost: '',
    smtpPort: 587,
    agentId: '',
  })
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: k.endsWith('Port') ? Number(e.target.value) : e.target.value }))

  function applyPreset(key: string) {
    const preset = EMAIL_PRESETS[key]
    if (preset) setForm((f) => ({ ...f, ...preset }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      const res = await createEmail({
        ...form,
        agentId: form.agentId || undefined,
      }).unwrap()
      toast.success(`Caixa ${res.name} conectada! Novos e-mails viram conversas.`)
      setForm({ address: '', password: '', imapHost: '', imapPort: 993, smtpHost: '', smtpPort: 587, agentId: '' })
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível conectar a caixa de e-mail.'))
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-line p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-semibold">Conectar caixa de e-mail</h3>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="h-7 text-[12px]" onClick={() => applyPreset('gmail')}>Gmail</Button>
          <Button type="button" variant="ghost" className="h-7 text-[12px]" onClick={() => applyPreset('outlook')}>Outlook</Button>
        </div>
      </div>
      <p className="text-[12px] text-ink-3">
        Use uma <strong>senha de aplicativo</strong> (Gmail: Conta Google → Segurança →
        Senhas de app), não a senha normal. Você pode conectar várias caixas.
      </p>
      <div className="rounded-lg border border-line bg-paper-2 px-3 py-2 text-[12px] leading-relaxed text-ink-2">
        Conecta em <strong>modo caixa de entrada</strong>: a resposta automática vem{' '}
        <strong>desativada</strong>. Os e-mails aparecem em <strong>Canais</strong> e o
        agente pode <strong>ler, resumir e responder perguntas</strong> sobre eles, mas
        só responde no thread se você ligar o modo <strong>Auto</strong> na lista acima.
        Promoções, newsletters e no-reply são ignorados automaticamente.
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Endereço">
          <Input placeholder="atendimento@empresa.com" value={form.address} onChange={set('address')} />
        </Field>
        <Field label="Senha de aplicativo">
          <Input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
        </Field>
        <Field label="Servidor IMAP (entrada)">
          <Input placeholder="imap.gmail.com" value={form.imapHost} onChange={set('imapHost')} />
        </Field>
        <Field label="Porta IMAP">
          <Input type="number" value={form.imapPort} onChange={set('imapPort')} />
        </Field>
        <Field label="Servidor SMTP (saída)">
          <Input placeholder="smtp.gmail.com" value={form.smtpHost} onChange={set('smtpHost')} />
        </Field>
        <Field label="Porta SMTP">
          <Input type="number" value={form.smtpPort} onChange={set('smtpPort')} />
        </Field>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:w-56">
          <Field label="Agente atendente">
            <Select value={form.agentId} onChange={set('agentId')}>
              <option value="">Agente Gerente (padrão)</option>
              {agents?.filter((a) => !a.isManager).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || !form.address || !form.password || !form.imapHost || !form.smtpHost}>
          {isLoading ? <Spinner className="border-t-paper border-paper/40" /> : 'Conectar'}
        </Button>
      </div>
    </form>
  )
}

function WhatsAppChannelForm({ agents }: { agents?: { id: string; name: string; isManager: boolean }[] }) {
  const [createWhatsApp, { isLoading }] = useCreateWhatsAppChannelMutation()
  const [agentId, setAgentId] = useState('')
  const [pairingId, setPairingId] = useState<string | null>(null)

  async function onCreate() {
    try {
      const res = await createWhatsApp({ agentId: agentId || undefined }).unwrap()
      setPairingId(res.id)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível iniciar o WhatsApp.'))
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-line p-4">
      <h3 className="text-[13px] font-semibold">Conectar WhatsApp</h3>
      <p className="text-[12px] text-ink-3">
        Conecta um número comum escaneando um QR code (via WhatsApp Web).{' '}
        <span className="font-medium text-ink">Atenção:</span> método não
        oficial. Contas com alto volume de mensagens correm risco de
        banimento pelo WhatsApp. Use um número dedicado ao atendimento.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full sm:w-56">
          <Field label="Agente atendente">
            <Select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
              <option value="">Agente Gerente (padrão)</option>
              {agents?.filter((a) => !a.isManager).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Button onClick={onCreate} className="w-full sm:w-auto" disabled={isLoading}>
          {isLoading ? <Spinner className="border-t-paper border-paper/40" /> : 'Gerar QR code'}
        </Button>
      </div>
      {pairingId && <WhatsAppPairModal channelId={pairingId} onClose={() => setPairingId(null)} />}
    </div>
  )
}

function WhatsAppPairModal({ channelId, onClose }: { channelId: string; onClose: () => void }) {
  const [poll] = useLazyGetWhatsAppStatusQuery()
  const [qr, setQr] = useState<string | null>(null)
  const [state, setState] = useState('starting')

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await poll(channelId).unwrap()
        setState(res.state)
        setQr(res.qr)
        if (res.state === 'connected') clearInterval(timer)
      } catch {
        /* bridge subindo */
      }
    }, 2500)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId])

  return (
    <Modal
      open
      onClose={onClose}
      title="Conectar WhatsApp"
      footer={<Button variant="ghost" onClick={onClose}>{state === 'connected' ? 'Fechar' : 'Cancelar'}</Button>}
    >
      {state === 'connected' ? (
        <p className="flex items-center gap-2 text-[14px]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0 text-ok" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
          </svg>
          WhatsApp conectado! As mensagens recebidas já viram conversas.
        </p>
      ) : qr ? (
        <div className="space-y-3 text-center">
          <p className="text-[13px] text-ink-2">
            No celular: WhatsApp → Configurações → <strong>Aparelhos conectados</strong> →
            Conectar aparelho → escaneie:
          </p>
          <div className="flex justify-center rounded-xl border border-line bg-paper p-4">
            <WhatsAppQr value={qr} />
          </div>
          <p className="text-[12px] text-ink-3">O código renova sozinho. Mantenha esta janela aberta.</p>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-[13px] text-ink-2">
          <Spinner /> Preparando o QR code…
        </p>
      )}
    </Modal>
  )
}

function WhatsAppQr({ value }: { value: string }) {
  return <QRCodeSVG value={value} size={224} level="M" />
}

/* ---------- Reuniões (bot aao-scribe: Teams + Meet por link) ---------- */

/**
 * Conexão da conta do escritório (Google/Microsoft) para o bot entrar LOGADO.
 * O Google bloqueia bots anônimos, então sem conta conectada não dá para criar
 * reunião do Meet. A sessão é gerada uma vez no host (`npm run debug:login` →
 * meet-auth.json) e subida aqui; o backend cifra e nunca devolve o segredo.
 */
function MeetIntegrationsSection() {
  const { data: accounts, isLoading } = useListMeetingAccountsQuery()
  const [connect, { isLoading: connecting }] = useConnectMeetingAccountMutation()
  const [disconnect] = useDisconnectMeetingAccountMutation()
  const fileRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const [loginOpen, setLoginOpen] = useState(false)

  const google = accounts?.find((a) => a.provider === 'GOOGLE' && a.status !== 'DISCONNECTED')

  async function onPick(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as { cookies?: unknown }
      if (!parsed || !Array.isArray(parsed.cookies)) {
        toast.error('Arquivo inválido: esperado o meet-auth.json do Playwright.')
        return
      }
      await connect({ provider: 'GOOGLE', storageState: text, email: email.trim() || undefined }).unwrap()
      toast.success('Conta Google conectada.')
      setEmail('')
    } catch (err) {
      if (err instanceof SyntaxError) toast.error('Arquivo inválido: não é um JSON.')
      else toast.error(apiErrorMessage(err, 'Não foi possível conectar a conta.'))
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const statusBadge = () => {
    if (!google) return <Badge className="bg-paper-3 text-ink-3">Desconectado</Badge>
    if (google.status === 'EXPIRED')
      return <Badge className="bg-danger/10 text-danger">Sessão expirada</Badge>
    return <Badge className="bg-ok/10 text-ok">Conectado</Badge>
  }

  return (
    <div className="space-y-3 rounded-xl border border-line p-4">
      <h3 className="text-[13px] font-semibold">Conta do bot de reuniões</h3>
      <p className="text-[12px] text-ink-3">
        Conecte a conta do escritório para o bot entrar logado nas reuniões. O
        Google bloqueia participantes anônimos, então sem a conta conectada as
        reuniões do Google Meet não podem ser criadas.
      </p>

      {isLoading ? (
        <Skeleton className="h-16 w-full rounded-lg" />
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-line p-3">
          <div className="min-w-0">
            <div className="text-[13px] font-medium">Conta Google</div>
            <div className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-3">
              {statusBadge()}
              {google?.email ? <span className="truncate">{google.email}</span> : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {google ? (
              <Button
                variant="ghost"
                onClick={async () => {
                  try {
                    await disconnect(google.id).unwrap()
                    toast.success('Conta desconectada.')
                  } catch (err) {
                    toast.error(apiErrorMessage(err))
                  }
                }}
              >
                Desconectar
              </Button>
            ) : null}
            <Button onClick={() => setLoginOpen(true)}>
              {google ? 'Reconectar' : 'Conectar'}
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => void onPick(e.target.files)}
          />
        </div>
      )}

      <p className="text-[11px] text-ink-3">
        Ao conectar, abre um navegador seguro no painel para você logar na conta
        Google do escritório (com 2FA se houver). Nada é instalado.{' '}
        <button
          type="button"
          className="underline hover:text-ink-2"
          onClick={() => fileRef.current?.click()}
          disabled={connecting}
        >
          {connecting ? 'enviando…' : 'enviar arquivo de sessão manualmente'}
        </button>
        .
      </p>

      <MeetLoginModal
        open={loginOpen}
        provider="GOOGLE"
        onClose={() => setLoginOpen(false)}
        onConnected={() => setLoginOpen(false)}
      />
    </div>
  )
}
