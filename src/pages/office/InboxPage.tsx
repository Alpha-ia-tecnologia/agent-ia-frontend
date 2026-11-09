import { useEffect, useRef, useState, type ComponentType, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ConnectedChannels } from './inbox/ConnectedChannels'
import { MeetingThread } from './inbox/MeetingThread'
import {
  useGetInboxContactsQuery,
  useGetInboxMessagesQuery,
  useReplyInboxMutation,
} from '@/api/api'
import { apiErrorMessage } from '@/lib/apiError'
import { Badge, EmptyState, Skeleton, Spinner, cx } from '@/components/ui'

/* ---------- Ícones dos canais (stroke, currentColor) ---------- */

type IconProps = { className?: string }

function AllChannelsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}
function WhatsappIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-4-1L3 21l2-5.5a8.5 8.5 0 0 1-1-4 8.38 8.38 0 0 1 8.5-8.5A8.38 8.38 0 0 1 21 11.5Z" />
      <path d="M8.8 8.4c-.2 0-.5.1-.7.4-.2.3-.7.8-.7 1.9s.8 2.2.9 2.4c.1.2 1.6 2.6 4 3.5 2 .8 2.4.6 2.8.6.5 0 1.4-.5 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.3-.2-.6-.3l-1.2-.6c-.2-.1-.4-.1-.5.1l-.5.7c-.1.2-.3.2-.5.1-.7-.3-1.4-.6-2-1.5-.2-.3 0-.5.1-.6l.4-.5c.1-.2.1-.3 0-.5l-.6-1.4c-.2-.4-.3-.3-.5-.3h-.4Z" />
    </svg>
  )
}
function TelegramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m22 3-9.5 9.5M22 3l-6.5 18-4-8.5L3 8.5 22 3Z" />
    </svg>
  )
}
function EmailIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </svg>
  )
}
function SendIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
    </svg>
  )
}

function MeetingIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="m22 8-6 4 6 4V8Z" />
    </svg>
  )
}

type ChannelType = 'WHATSAPP' | 'TELEGRAM' | 'EMAIL' | 'MEETINGS'
const CHANNEL_META: Record<ChannelType, { label: string; Icon: ComponentType<IconProps>; dot: string }> = {
  WHATSAPP: { label: 'WhatsApp', Icon: WhatsappIcon, dot: 'bg-emerald-500' },
  TELEGRAM: { label: 'Telegram', Icon: TelegramIcon, dot: 'bg-sky-500' },
  EMAIL: { label: 'E-mail', Icon: EmailIcon, dot: 'bg-amber-500' },
  MEETINGS: { label: 'Reunião', Icon: MeetingIcon, dot: 'bg-violet-500' },
}

const TABS: { key: string; label: string; Icon: ComponentType<IconProps> }[] = [
  { key: '', label: 'Geral', Icon: AllChannelsIcon },
  { key: 'WHATSAPP', label: 'WhatsApp', Icon: WhatsappIcon },
  { key: 'TELEGRAM', label: 'Telegram', Icon: TelegramIcon },
  { key: 'EMAIL', label: 'E-mail', Icon: EmailIcon },
]

function channelLabel(type: string) {
  return CHANNEL_META[type as ChannelType]?.label ?? type
}

function initials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || '?'
  )
}

function timeLabel(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  return d.toDateString() === today.toDateString()
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

/** Avatar de contato com badge do canal de origem. */
function ContactAvatar({ name, type, size = 38 }: { name: string; type: string; size?: number }) {
  const meta = CHANNEL_META[type as ChannelType]
  const Icon = meta?.Icon
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      <span
        className="flex size-full items-center justify-center rounded-full bg-paper-3 text-[12px] font-semibold text-ink-2"
      >
        {initials(name)}
      </span>
      {Icon && (
        <span
          className={cx(
            'absolute -bottom-0.5 -right-0.5 grid size-[17px] place-items-center rounded-full text-paper ring-2 ring-paper',
            meta.dot,
          )}
        >
          <Icon className="size-2.5" />
        </span>
      )}
    </span>
  )
}

/** Alterna entre o inbox de mensagens e a gestão dos canais conectados. */
function ViewSwitch({
  view,
  onChange,
}: {
  view: 'messages' | 'channels'
  onChange: (v: 'messages' | 'channels') => void
}) {
  return (
    <div className="mt-3 flex items-center gap-1 rounded-lg border border-line bg-paper p-0.5 text-[12px] font-medium">
      {(
        [
          { key: 'messages', label: 'Mensagens' },
          { key: 'channels', label: 'Canais conectados' },
        ] as const
      ).map((v) => (
        <button
          key={v.key}
          onClick={() => onChange(v.key)}
          className={cx(
            'flex-1 rounded-md px-2.5 py-1.5 transition-colors duration-100',
            view === v.key ? 'bg-paper-3 text-ink' : 'text-ink-3 hover:text-ink-2',
          )}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}

/** Área de Canais: inbox estilo CRM das conversas externas (clientes). */
export default function InboxPage() {
  const [tab, setTab] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const view: 'messages' | 'channels' =
    searchParams.get('view') === 'channels' ? 'channels' : 'messages'
  const setView = (v: 'messages' | 'channels') => {
    setSearchParams(v === 'channels' ? { view: 'channels' } : {}, { replace: true })
    setSelected(null)
  }
  const { data: contacts, isLoading } = useGetInboxContactsQuery(
    tab ? { type: tab } : undefined,
    { pollingInterval: view === 'messages' ? 10_000 : 0, skipPollingIfUnfocused: true },
  )

  if (view === 'channels') {
    return (
      <div className="h-full overflow-y-auto">
        <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">
          <header className="px-0">
            <h1 className="text-lg font-semibold">Canais</h1>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-3">
              Gestão dos canais conectados: agente atendente, modo de resposta e pausa.
            </p>
            <div className="max-w-xs">
              <ViewSwitch view={view} onChange={setView} />
            </div>
          </header>
          <ConnectedChannels />
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* coluna de contatos: tela cheia no mobile, oculta quando há conversa aberta */}
      <div
        className={cx(
          'w-full flex-col border-r border-line bg-paper-2/40 md:flex md:w-96 md:shrink-0',
          selected ? 'hidden md:flex' : 'flex',
        )}
      >
        <div className="border-b border-line px-4 pb-0 pt-5">
          <h1 className="text-lg font-semibold">Canais</h1>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-3">
            Mensagens de clientes por WhatsApp, Telegram e e-mail, num só lugar.
          </p>
          <ViewSwitch view={view} onChange={setView} />
          <div className="scroll-thin -mx-4 mt-2 flex items-center gap-1 overflow-x-auto px-4">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key)
                  setSelected(null)
                }}
                className={cx(
                  'relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-2 py-2 text-[12px] font-medium transition-colors duration-150',
                  tab === t.key ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
                )}
              >
                <t.Icon className={cx('size-3.5 shrink-0', tab === t.key ? 'text-ink' : 'text-ink-3')} />
                {t.label}
                {tab === t.key && (
                  <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-ink" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="scroll-thin flex-1 overflow-y-auto">
          {isLoading && (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          )}
          {!isLoading && contacts?.length === 0 && (
            <div className="p-4">
              <EmptyState
                title="Nenhuma conversa"
                description="Conecte canais em Configurações → Canais. As mensagens dos seus clientes aparecerão aqui."
              />
            </div>
          )}
          {contacts?.map((c) => {
            const unread = c.unreadCount > 0
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={cx(
                  'flex w-full items-center gap-3 border-b border-line/70 px-4 py-3 text-left transition-colors duration-100',
                  selected === c.id ? 'bg-paper-3' : 'hover:bg-paper-2',
                )}
              >
                <ContactAvatar name={c.name} type={c.channel.type} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cx('truncate text-[13px]', unread ? 'font-semibold text-ink' : 'font-medium')}>
                      {c.name}
                    </span>
                    <span className="ml-auto shrink-0 text-[11px] text-ink-3">
                      {timeLabel(c.lastMessageAt)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className={cx('truncate text-[12px]', unread ? 'text-ink-2' : 'text-ink-3')}>
                      {c.preview
                        ? `${c.preview.direction === 'OUT' ? '↩ ' : ''}${c.preview.content}`
                        : 'Sem mensagens ainda'}
                    </span>
                    {unread && (
                      <span className="ml-auto flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-paper">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* thread: tela cheia no mobile quando há conversa; placeholder só no desktop */}
      <div
        className={cx(
          'min-w-0 flex-1',
          selected ? 'flex flex-col' : 'hidden md:flex md:flex-col',
        )}
      >
        {selected ? (
          <ContactThread contactId={selected} onBack={() => setSelected(null)} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="grid size-14 place-items-center rounded-2xl border border-line bg-paper-2 text-ink-3">
              <AllChannelsIcon className="size-6" />
            </span>
            <p className="max-w-xs text-[13px] leading-relaxed text-ink-3">
              Selecione uma conversa ao lado para ver o histórico e responder pelo canal.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ContactThread({ contactId, onBack }: { contactId: string; onBack: () => void }) {
  const { data, isLoading } = useGetInboxMessagesQuery(contactId, {
    pollingInterval: 8_000,
    skipPollingIfUnfocused: true,
  })
  const [reply, { isLoading: sending }] = useReplyInboxMutation()
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [data?.messages.length])

  async function send() {
    if (!text.trim()) return
    try {
      await reply({ contactId, content: text.trim() }).unwrap()
      setText('')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível enviar.'))
    }
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  if (isLoading || !data) {
    return (
      <div className="p-6">
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  // Conversa vinda do bot de reuniões: mostra o dossiê da reunião (cabeçalho,
  // gravação, pontos importantes, materiais) em vez do chat cru.
  if (data.contact.channel.type === 'MEETINGS') {
    return (
      <MeetingThread
        contact={{
          name: data.contact.name,
          externalId: data.contact.externalId,
          conversationId: data.contact.conversationId,
        }}
        onBack={onBack}
      />
    )
  }

  const autoRespond = data.contact.channel.autoRespond

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
        <button
          onClick={onBack}
          aria-label="Voltar para a lista"
          className="-ml-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-2 transition-colors duration-150 hover:bg-ink/[0.04] hover:text-ink md:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <ContactAvatar name={data.contact.name} type={data.contact.channel.type} size={36} />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium">{data.contact.name}</p>
          <p className="truncate text-[12px] text-ink-3">
            {channelLabel(data.contact.channel.type)} · {data.contact.channel.name}
          </p>
        </div>
        <Badge className={cx('ml-auto shrink-0', autoRespond && 'text-ok')}>
          {autoRespond ? '● agente responde' : '● modo manual'}
        </Badge>
      </div>

      <div className="scroll-thin flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {data.messages.length === 0 && (
          <p className="text-center text-[12px] text-ink-3">Sem mensagens ainda.</p>
        )}
        {data.messages.map((m) => (
          <div key={m.id} className={cx('flex', m.direction === 'OUT' && 'justify-end')}>
            <div
              className={cx(
                'max-w-[75%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[13px] shadow-[0_1px_2px_rgba(24,24,27,0.04)]',
                m.direction === 'OUT'
                  ? 'rounded-br-md bg-ink text-paper'
                  : 'rounded-bl-md border border-line bg-paper text-ink',
              )}
            >
              {m.direction === 'OUT' && m.author && (
                <p className="mb-0.5 text-[10px] opacity-70">{m.author}</p>
              )}
              {m.content}
              <p className={cx('mt-1 text-[10px]', m.direction === 'OUT' ? 'text-paper/60' : 'text-ink-3')}>
                {new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-line p-3">
        <div className="flex items-end gap-2">
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder="Responder pelo canal… (Enter envia)"
            className="min-h-10 flex-1 resize-none rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[13px] outline-none transition-colors duration-150 focus:border-line-2"
          />
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-ink px-4 text-[13px] font-medium text-paper transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
          >
            {sending ? (
              <Spinner className="border-t-paper border-paper/40" />
            ) : (
              <>
                <SendIcon className="size-4" />
                Enviar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
