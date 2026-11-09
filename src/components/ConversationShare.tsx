import { useMemo, useState, type ReactElement } from 'react'
import { toast } from 'sonner'
import {
  useGetUsersQuery,
  useRequestShareConversationMutation,
  useShareConversationMutation,
} from '@/api/api'
import { apiErrorMessage } from '@/lib/apiError'
import type { ConversationVisibility, ShareState, UserRef } from '@/types'
import { Button, Modal, Spinner, cx } from '@/components/ui'

/* ---------- Ícones ---------- */

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className ?? 'size-3.5'} aria-hidden>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}
function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className ?? 'size-3.5'} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  )
}
function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className ?? 'size-3.5'} aria-hidden>
      <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19" />
      <circle cx="10" cy="8" r="3" />
      <path d="M20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4M15 5.1a3 3 0 0 1 0 5.8" />
    </svg>
  )
}

const VIS_META: Record<
  ConversationVisibility,
  { label: string; Icon: (p: { className?: string }) => ReactElement }
> = {
  PRIVATE: { label: 'Privada', Icon: LockIcon },
  COMPANY: { label: 'Empresa', Icon: GlobeIcon },
  USERS: { label: 'Compartilhada', Icon: PeopleIcon },
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

function UserPill({ user, size = 22 }: { user: UserRef; size?: number }) {
  return (
    <span
      title={user.name}
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-paper-3 text-[10px] font-semibold text-ink-2 ring-2 ring-paper"
    >
      {initials(user.name)}
    </span>
  )
}

/** Cabeçalho da conversa: visibilidade, dono, envolvidos e ação de compartilhar. */
export function ConversationHeader({
  shareState,
  isOwner,
  canWrite,
  onShare,
}: {
  shareState?: ShareState
  isOwner: boolean
  canWrite: boolean
  onShare: () => void
}) {
  if (!shareState) return null
  const meta = VIS_META[shareState.visibility]
  const participants = shareState.participants

  return (
    <div className="flex items-center gap-2 border-b border-line bg-paper/80 px-4 py-2 backdrop-blur-sm sm:gap-3 sm:px-6">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-2 px-2 py-0.5 text-[11px] font-medium text-ink-2">
        <meta.Icon className="size-3 text-ink-3" />
        {meta.label}
      </span>

      {!isOwner && (
        <span className="truncate text-[12px] text-ink-3">
          de <span className="font-medium text-ink-2">{shareState.owner.name}</span>
        </span>
      )}

      {shareState.visibility === 'USERS' && participants.length > 0 && (
        <span className="flex items-center -space-x-1.5">
          {participants.slice(0, 5).map((u) => (
            <UserPill key={u.id} user={u} />
          ))}
          {participants.length > 5 && (
            <span className="flex size-[22px] items-center justify-center rounded-full bg-paper-3 text-[10px] text-ink-3 ring-2 ring-paper">
              +{participants.length - 5}
            </span>
          )}
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        {!canWrite && (
          <span className="inline-flex items-center gap-1 rounded-full bg-paper-3 px-2 py-0.5 text-[11px] font-medium text-ink-3">
            <LockIcon className="size-3" />
            Somente leitura
          </span>
        )}
        {isOwner && (
          <Button variant="secondary" className="h-8 text-[12px]" onClick={onShare}>
            Compartilhar
          </Button>
        )}
      </div>
    </div>
  )
}

/* ---------- Modal de compartilhar ---------- */

const OPTIONS: { value: ConversationVisibility; title: string; desc: string }[] = [
  { value: 'PRIVATE', title: 'Privada', desc: 'Só você acessa esta conversa.' },
  { value: 'COMPANY', title: 'Empresa toda', desc: 'Qualquer pessoa da empresa pode abrir e responder.' },
  { value: 'USERS', title: 'Usuários específicos', desc: 'Só as pessoas escolhidas abaixo.' },
]

export function ShareModal({
  conversationId,
  shareState,
  meId,
  onClose,
}: {
  conversationId: string
  shareState: ShareState
  meId?: string
  onClose: () => void
}) {
  const { data: users } = useGetUsersQuery()
  const [share, { isLoading }] = useShareConversationMutation()
  const [visibility, setVisibility] = useState<ConversationVisibility>(shareState.visibility)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(shareState.participants.map((p) => p.id)),
  )

  const pickable = useMemo(
    () => (users ?? []).filter((u) => u.id !== meId),
    [users, meId],
  )

  async function onSave() {
    try {
      await share({
        id: conversationId,
        visibility,
        userIds: visibility === 'USERS' ? [...selected] : [],
      }).unwrap()
      toast.success('Compartilhamento atualizado.')
      onClose()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível salvar o compartilhamento.'))
    }
  }

  return (
    <Modal open onClose={onClose} title="Compartilhar conversa">
      <div className="space-y-4">
        <div className="space-y-2">
          {OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cx(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors duration-150',
                visibility === opt.value ? 'border-ink bg-paper-2' : 'border-line hover:border-line-2',
              )}
            >
              <input
                type="radio"
                name="visibility"
                className="mt-0.5 accent-black"
                checked={visibility === opt.value}
                onChange={() => setVisibility(opt.value)}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{opt.title}</span>
                <span className="block text-[12px] text-ink-3">{opt.desc}</span>
              </span>
            </label>
          ))}
        </div>

        {visibility === 'USERS' && (
          <div className="rounded-xl border border-line p-2">
            <p className="px-1 pb-1.5 text-[12px] text-ink-3">
              Escolha quem pode ver e responder:
            </p>
            <div className="max-h-56 space-y-0.5 overflow-y-auto scroll-thin">
              {pickable.length === 0 && (
                <p className="px-2 py-1.5 text-[13px] text-ink-3">Nenhum outro usuário na empresa.</p>
              )}
              {pickable.map((u) => (
                <label
                  key={u.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors duration-150 hover:bg-paper-2"
                >
                  <input
                    type="checkbox"
                    className="accent-black"
                    checked={selected.has(u.id)}
                    onChange={(e) => {
                      const next = new Set(selected)
                      if (e.target.checked) next.add(u.id)
                      else next.delete(u.id)
                      setSelected(next)
                    }}
                  />
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-paper-3 text-[11px] font-semibold text-ink-2">
                    {initials(u.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{u.name}</span>
                    <span className="block truncate text-[12px] text-ink-3">{u.email}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            disabled={isLoading || (visibility === 'USERS' && selected.size === 0)}
          >
            {isLoading ? <Spinner /> : null} Salvar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Tela de sem acesso ---------- */

export function NoAccessScreen({ conversationId }: { conversationId: string }) {
  const [request, { isLoading }] = useRequestShareConversationMutation()
  const [asked, setAsked] = useState(false)

  async function onRequest() {
    try {
      await request(conversationId).unwrap()
      setAsked(true)
      toast.success('Pedido enviado ao dono da conversa.')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível solicitar o acesso.'))
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid size-14 place-items-center rounded-2xl border border-line bg-paper-2 text-ink-3">
        <LockIcon className="size-6" />
      </span>
      <div>
        <h1 className="text-lg font-semibold">Conversa privada</h1>
        <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-3">
          Você não tem acesso a esta conversa. Solicite o compartilhamento ao dono
          para poder abri-la.
        </p>
      </div>
      <Button onClick={onRequest} disabled={isLoading || asked}>
        {isLoading ? <Spinner className="border-t-paper border-paper/40" /> : null}
        {asked ? 'Pedido enviado' : 'Solicitar acesso'}
      </Button>
    </div>
  )
}
