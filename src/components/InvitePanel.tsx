import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import {
  useCreateInviteMutation,
  useGetAgentsQuery,
  useGetInvitesQuery,
  useRevokeInviteMutation,
} from '@/api/api'
import { Badge, Button, Field, Modal, Select, Spinner } from '@/components/ui'
import { apiErrorMessage } from '@/lib/apiError'
import { useOrgName } from '@/lib/useOrgName'
import type { OrgInvite } from '@/types'

const linkFor = (code: string) => `${window.location.origin}/join/${code}`

function inviteState(i: OrgInvite): { label: string; active: boolean } {
  if (i.revokedAt) return { label: 'Revogado', active: false }
  if (i.expiresAt && new Date(i.expiresAt) <= new Date()) return { label: 'Expirado', active: false }
  if (i.maxUses != null && i.uses >= i.maxUses) return { label: 'Esgotado', active: false }
  return { label: 'Ativo', active: true }
}

/** Convidar pessoas: link, QR code e código (e modo apresentação para eventos). */
export function InvitePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const orgName = useOrgName() ?? 'Organização'
  const { data: invites, isLoading } = useGetInvitesQuery(undefined, { skip: !open })
  const [createInvite, { isLoading: creating }] = useCreateInviteMutation()
  const [revokeInvite] = useRevokeInviteMutation()
  const [expiresInHours, setExpires] = useState('')
  // acesso de quem entrar: todos os agentes ou só os marcados
  const [allAgents, setAllAgents] = useState(true)
  const [agentIds, setAgentIds] = useState<string[]>([])
  const { data: agents } = useGetAgentsQuery(undefined, { skip: !open })
  const agentName = (id: string) => agents?.find((a) => a.id === id)?.name ?? 'agente removido'
  const accessLabel = (i: OrgInvite) =>
    i.allAgents
      ? 'Todos os agentes'
      : i.agentIds.length === 1
        ? agentName(i.agentIds[0])
        : `${i.agentIds.length} agentes`
  const [current, setCurrent] = useState<OrgInvite | null>(null)
  const [presenting, setPresenting] = useState(false)

  // abre mostrando o convite ativo mais recente, se houver
  useEffect(() => {
    if (open && !current && invites) {
      setCurrent(invites.find((i) => inviteState(i).active) ?? null)
    }
  }, [open, current, invites])

  async function onCreate() {
    try {
      if (!allAgents && agentIds.length === 0) {
        toast.error('Marque ao menos um agente para este convite.')
        return
      }
      const inv = await createInvite({
        ...(expiresInHours ? { expiresInHours: Number(expiresInHours) } : {}),
        allAgents,
        ...(allAgents ? {} : { agentIds }),
      }).unwrap()
      setCurrent(inv)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível criar o convite.'))
    }
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${what} copiado.`)
    } catch {
      toast.error('Não foi possível copiar. Selecione e copie manualmente.')
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Convidar pessoas" wide>
        {current ? (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="rounded-xl border border-line bg-white p-3">
              <QRCodeSVG value={linkFor(current.code)} size={176} level="M" />
            </div>
            <div className="w-full min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-xs text-ink-3">Código</p>
                <p className="font-mono text-2xl font-semibold tracking-[0.15em]">{current.code}</p>
              </div>
              <div>
                <p className="text-xs text-ink-3">Link</p>
                <p className="truncate text-[13px] text-ink-2">{linkFor(current.code)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => copy(linkFor(current.code), 'Link')}>Copiar link</Button>
                <Button variant="secondary" onClick={() => copy(current.code, 'Código')}>
                  Copiar código
                </Button>
                <Button variant="secondary" onClick={() => setPresenting(true)}>
                  Modo apresentação
                </Button>
              </div>
              <p className="text-[13px] text-ink-2">
                <span className="text-ink-3">Acesso: </span>
                {current.allAgents
                  ? 'todos os agentes'
                  : current.agentIds.map(agentName).join(', ')}
              </p>
              <p className="text-[12px] text-ink-3">
                Quem entrar pelo convite vira membro. Só o dono pode promover alguém a admin.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-2">
            Gere um convite e compartilhe o link, o QR code ou o código com quem vai entrar na
            organização.
          </p>
        )}

        <fieldset className="mt-5 border-t border-line pt-4">
          <legend className="mb-2 text-xs font-medium text-ink-2">
            Quem entrar com o novo convite terá acesso a
          </legend>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="invite-access" checked={allAgents} onChange={() => setAllAgents(true)} />
              Todos os agentes
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="invite-access" checked={!allAgents} onChange={() => setAllAgents(false)} />
              Agentes específicos
            </label>
          </div>
          {!allAgents && (
            <div className="mt-3 max-h-44 space-y-1.5 overflow-auto rounded-lg border border-line p-3">
              {agents?.map((a) => (
                <label key={a.id} className="flex items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    checked={agentIds.includes(a.id)}
                    onChange={(e) =>
                      setAgentIds((ids) =>
                        e.target.checked ? [...ids, a.id] : ids.filter((x) => x !== a.id),
                      )
                    }
                  />
                  {a.name}
                  {a.isManager && <span className="text-ink-3">(Gerente)</span>}
                </label>
              ))}
              {agents?.length === 0 && <p className="text-[13px] text-ink-3">Nenhum agente ainda.</p>}
            </div>
          )}
        </fieldset>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Field label="Validade do novo convite">
            <Select value={expiresInHours} onChange={(e) => setExpires(e.target.value)} className="h-9 min-w-40">
              <option value="">Sem validade</option>
              <option value="24">24 horas</option>
              <option value="168">7 dias</option>
              <option value="720">30 dias</option>
            </Select>
          </Field>
          <Button onClick={onCreate} disabled={creating}>
            {creating ? <Spinner className="border-t-paper border-paper/40" /> : 'Gerar novo convite'}
          </Button>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-medium text-ink-2">Convites</p>
          {isLoading && <Spinner />}
          {invites && invites.length === 0 && <p className="text-[13px] text-ink-3">Nenhum convite ainda.</p>}
          {invites && invites.length > 0 && (
            <div className="max-h-56 divide-y divide-line overflow-auto rounded-lg border border-line">
              {invites.map((i) => {
                const st = inviteState(i)
                return (
                  <div key={i.id} className="flex items-center gap-3 px-3 py-2 text-[13px]">
                    <button className="font-mono tracking-wider hover:underline" onClick={() => setCurrent(i)}>
                      {i.code}
                    </button>
                    <Badge>{st.label}</Badge>
                    <span className="truncate text-ink-2">{accessLabel(i)}</span>
                    <span className="text-ink-3">
                      {i.uses} {i.uses === 1 ? 'entrada' : 'entradas'}
                    </span>
                    {st.active && (
                      <button
                        className="ml-auto text-danger hover:underline"
                        onClick={async () => {
                          try {
                            await revokeInvite(i.id).unwrap()
                            if (current?.id === i.id) setCurrent(null)
                            toast.success('Convite revogado.')
                          } catch (err) {
                            toast.error(apiErrorMessage(err))
                          }
                        }}
                      >
                        Revogar
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Modal>

      {presenting && current && (
        <Presentation code={current.code} orgName={orgName} onClose={() => setPresenting(false)} />
      )}
    </>
  )
}

/** Tela cheia para projetar: QR grande + código + link. Esc fecha. */
function Presentation({ code, orgName, onClose }: { code: string; orgName: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Convite para ${orgName}`}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-white p-6 text-center text-black"
    >
      <p className="text-[clamp(1.25rem,3vw,2.25rem)] font-semibold">Entre em {orgName}</p>
      <div className="rounded-2xl border border-black/10 p-4">
        <QRCodeSVG value={linkFor(code)} size={Math.min(window.innerWidth, window.innerHeight) * 0.5} level="M" />
      </div>
      <p className="font-mono text-[clamp(2rem,6vw,4.5rem)] font-bold tracking-[0.2em]">{code}</p>
      <p className="text-[clamp(0.9rem,1.6vw,1.25rem)] text-black/60">
        Aponte a câmera para o QR code — ou crie sua conta em {window.location.host} e use o código
      </p>
      <button onClick={onClose} className="absolute right-5 top-5 rounded-md px-3 py-1.5 text-sm text-black/60 hover:bg-black/5">
        Fechar (Esc)
      </button>
    </div>,
    document.body,
  )
}
