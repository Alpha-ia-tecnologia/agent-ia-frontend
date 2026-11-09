import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useDeleteChannelMutation,
  useGetAgentsQuery,
  useGetChannelsQuery,
  useUpdateChannelMutation,
} from '@/api/api'
import { apiErrorMessage } from '@/lib/apiError'
import { Badge, Button, EmptyState, Select, Skeleton, cx } from '@/components/ui'

const TYPE_LABEL: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  TELEGRAM: 'Telegram',
  EMAIL: 'E-mail',
  MEETINGS: 'Reuniões',
}

/**
 * Gestão do dia a dia dos canais conectados: agente atendente, modo de
 * resposta, pausa e remoção. As credenciais (token, senha, QR, conta do bot)
 * ficam em Configurações > Conexões.
 */
export function ConnectedChannels() {
  const { data: channels, isLoading } = useGetChannelsQuery()
  const { data: agents } = useGetAgentsQuery()
  const [updateChannel] = useUpdateChannelMutation()
  const [deleteChannel] = useDeleteChannelMutation()

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (!channels?.length) {
    return (
      <div className="p-4">
        <EmptyState
          title="Nenhum canal conectado"
          description="Conecte um bot do Telegram, uma caixa de e-mail ou o WhatsApp para os clientes falarem com os agentes."
          action={
            <Link
              to="/office/settings?tab=channels"
              className="text-[12px] font-medium underline underline-offset-2 hover:text-ink"
            >
              Conectar em Configurações
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4">
      <div className="divide-y divide-line rounded-lg border border-line">
        {channels.map((c) => {
          const isMeetings = c.type === 'MEETINGS'
          return (
            <div
              key={c.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 transition-colors duration-150 hover:bg-paper-2"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{c.name}</span>
                <span className="block text-[12px] text-ink-3">
                  {TYPE_LABEL[c.type] ?? c.type}
                  {!isMeetings && <> · {c.contacts} contato(s)</>}
                </span>
              </span>
              <Badge className={cx('shrink-0', !c.isActive && 'opacity-60')}>
                {c.isActive ? 'ativo' : 'pausado'}
              </Badge>
              {isMeetings ? (
                <Link
                  to="/office/meetings"
                  className="shrink-0 text-[12px] text-ink-2 underline underline-offset-2 hover:text-ink"
                >
                  Configurar em Reuniões
                </Link>
              ) : (
                <span className="flex basis-full flex-wrap items-center justify-end gap-2 sm:ml-auto sm:basis-auto">
                  <label className="flex items-center gap-1.5 text-[12px] text-ink-3">
                    Agente
                    <Select
                      className="h-8 w-40 text-[12px]"
                      value={c.agentId ?? ''}
                      onChange={async (e) => {
                        try {
                          await updateChannel({ id: c.id, agentId: e.target.value || null }).unwrap()
                          toast.success('Agente atualizado.')
                        } catch (err) {
                          toast.error(apiErrorMessage(err))
                        }
                      }}
                    >
                      <option value="">Agente Gerente (padrão)</option>
                      {agents?.filter((a) => !a.isManager).map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </Select>
                  </label>
                  <Button
                    variant="ghost"
                    className="h-8 px-2.5 text-[13px]"
                    title="Com o modo automático desligado, as mensagens só aparecem em Mensagens e você responde manualmente"
                    onClick={() => updateChannel({ id: c.id, autoRespond: !(c.autoRespond ?? true) })}
                  >
                    <span
                      className={cx(
                        'mr-1.5 inline-block size-1.5 rounded-full align-middle',
                        (c.autoRespond ?? true) ? 'bg-ok' : 'bg-line-2',
                      )}
                    />
                    {(c.autoRespond ?? true) ? 'Auto' : 'Manual'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-8 px-2.5 text-[13px]"
                    onClick={() => updateChannel({ id: c.id, isActive: !c.isActive })}
                  >
                    {c.isActive ? 'Pausar' : 'Retomar'}
                  </Button>
                  <Button
                    variant="danger"
                    className="h-8 px-2.5 text-[13px]"
                    onClick={async () => {
                      try {
                        await deleteChannel(c.id).unwrap()
                        toast.success('Canal removido.')
                      } catch (err) {
                        toast.error(apiErrorMessage(err))
                      }
                    }}
                  >
                    Remover
                  </Button>
                </span>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-[12px] text-ink-3">
        Para conectar um canal novo (token, e-mail ou QR do WhatsApp), use{' '}
        <Link to="/office/settings?tab=channels" className="underline underline-offset-2 hover:text-ink-2">
          Configurações, aba Conexões
        </Link>
        .
      </p>
    </div>
  )
}
