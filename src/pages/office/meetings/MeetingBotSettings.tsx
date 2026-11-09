import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  useCreateMeetingChannelMutation,
  useUpdateMeetingChannelMutation,
} from '@/api/api'
import type { MeetingChannel, MeetingDelivery } from '@/api/api'
import { apiErrorMessage } from '@/lib/apiError'
import { Button, Field, Input, Select, Spinner } from '@/components/ui'

const DELIVERY_TYPES = [
  'Resumo executivo',
  'Ata formal',
  'Action items',
  'Planilha de decisões',
  'Personalizado',
]
const DELIVERY_FORMATS = ['Texto', 'PDF', 'Planilha (XLSX)']

/** Configuração do bot de reunião: agente responsável, entregas e consentimento. */
export function MeetingBotSettings({
  agents,
  channel,
}: {
  agents?: { id: string; name: string; isManager: boolean }[]
  channel?: MeetingChannel
}) {
  const [createChannel, { isLoading: creating }] = useCreateMeetingChannelMutation()
  const [updateChannel, { isLoading: updating }] = useUpdateMeetingChannelMutation()

  const [agentId, setAgentId] = useState(channel?.agentId ?? '')
  const [deliveries, setDeliveries] = useState<MeetingDelivery[]>(
    channel?.config?.deliveries?.length
      ? channel.config.deliveries
      : [{ type: 'Resumo executivo', format: 'Texto', instruction: '' }],
  )

  const [botName, setBotName] = useState(channel?.config?.botName ?? '')
  const [announce, setAnnounce] = useState(channel?.config?.consent?.announce !== false)
  const [consentMessage, setConsentMessage] = useState(channel?.config?.consent?.message ?? '')

  // ressincroniza quando o canal carrega
  useEffect(() => {
    if (channel) {
      setAgentId(channel.agentId ?? '')
      if (channel.config?.deliveries?.length) setDeliveries(channel.config.deliveries)
      setBotName(channel.config?.botName ?? '')
      setAnnounce(channel.config?.consent?.announce !== false)
      setConsentMessage(channel.config?.consent?.message ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel?.id])

  function setDelivery(i: number, patch: Partial<MeetingDelivery>) {
    setDeliveries((d) => d.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  }
  function addDelivery() {
    setDeliveries((d) => [...d, { type: 'Ata formal', format: 'PDF', instruction: '' }])
  }
  function removeDelivery(i: number) {
    setDeliveries((d) => d.filter((_, j) => j !== i))
  }

  async function onSave() {
    const payload = {
      agentId: agentId || null,
      deliveries,
      botName: botName.trim(),
      consent: { announce, message: consentMessage.trim() },
    }
    try {
      if (channel) {
        await updateChannel({ id: channel.id, ...payload }).unwrap()
      } else {
        await createChannel(payload).unwrap()
      }
      toast.success('Configuração salva.')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível salvar.'))
    }
  }

  return (
    <div className="space-y-3">
      <div className="w-full sm:w-64">
        <Field label="Agente responsável">
          <Select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
            <option value="">Agente Gerente (padrão)</option>
            {agents?.filter((a) => !a.isManager).map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="space-y-2">
        <span className="block text-[12px] font-medium text-ink-2">Entregas pós-reunião</span>
        {deliveries.map((d, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border border-line p-2">
            <div className="w-full sm:w-44">
              <Field label="Tipo">
                <Select value={d.type ?? ''} onChange={(e) => setDelivery(i, { type: e.target.value })}>
                  {DELIVERY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Field>
            </div>
            <div className="w-full sm:w-40">
              <Field label="Formato">
                <Select value={d.format ?? ''} onChange={(e) => setDelivery(i, { format: e.target.value })}>
                  {DELIVERY_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </Field>
            </div>
            <div className="min-w-0 flex-1">
              <Field label="Instrução (opcional)">
                <Input
                  placeholder="Ex.: destacar decisões, responsáveis e prazos"
                  value={d.instruction ?? ''}
                  onChange={(e) => setDelivery(i, { instruction: e.target.value })}
                />
              </Field>
            </div>
            <Button
              variant="ghost"
              className="h-9 px-2.5 text-[13px] text-danger"
              disabled={deliveries.length === 1}
              onClick={() => removeDelivery(i)}
            >
              Remover
            </Button>
          </div>
        ))}
        <Button variant="ghost" className="h-8 px-2.5 text-[13px]" onClick={addDelivery}>
          + Adicionar entrega
        </Button>
      </div>

      <div className="space-y-2 rounded-lg border border-line p-2">
        <span className="block text-[12px] font-medium text-ink-2">Gravação e consentimento</span>
        <div className="w-full sm:w-72">
          <Field label="Nome do bot na reunião">
            <Input
              placeholder="Assistente AAO (gravando)"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-[12px] text-ink-2">
          <input type="checkbox" checked={announce} onChange={(e) => setAnnounce(e.target.checked)} />
          Avisar no chat que a reunião está sendo gravada
        </label>
        {announce && (
          <Field label="Mensagem do aviso (opcional)">
            <Input
              placeholder="Deixe em branco para usar o aviso padrão"
              value={consentMessage}
              onChange={(e) => setConsentMessage(e.target.value)}
            />
          </Field>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={creating || updating}>
          {creating || updating ? <Spinner className="border-t-paper border-paper/40" /> : 'Salvar configuração'}
        </Button>
      </div>
    </div>
  )
}
