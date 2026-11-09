import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'
import {
  useListMeetingsQuery,
  useCancelMeetingMutation,
  useStopMeetingMutation,
  useRemoveMeetingMutation,
  useLazyGetMeetingTranscriptQuery,
  useGetMessagesQuery,
  API_BASE,
} from '@/api/api'
import type { MeetingSession, MeetingStatus, MeetingHighlight } from '@/api/api'
import { apiErrorMessage } from '@/lib/apiError'
import { ReportMessage, type ReportSpec } from '@/components/ReportMessage'
import type { RootState } from '@/store'
import { Badge, EmptyState, Skeleton, cx } from '@/components/ui'

export const STATUS_META: Record<MeetingStatus, { label: string; tone: string }> = {
  PENDING: { label: 'Na fila', tone: 'bg-paper-3 text-ink-2' },
  JOINING: { label: 'Entrando', tone: 'bg-paper-3 text-ink-2' },
  LOBBY: { label: 'Sala de espera', tone: 'bg-paper-3 text-ink-2' },
  RECORDING: { label: 'Gravando', tone: 'bg-danger/10 text-danger' },
  LEFT: { label: 'Processando', tone: 'bg-paper-3 text-ink-2' },
  TRANSCRIBING: { label: 'Transcrevendo', tone: 'bg-paper-3 text-ink-2' },
  PROCESSING: { label: 'Gerando entregas', tone: 'bg-paper-3 text-ink-2' },
  DONE: { label: 'Pronto', tone: 'bg-ok/10 text-ok' },
  FAILED: { label: 'Falhou', tone: 'bg-danger/10 text-danger' },
}
export const LIVE_STATUSES: MeetingStatus[] = [
  'PENDING', 'JOINING', 'LOBBY', 'RECORDING', 'LEFT', 'TRANSCRIBING', 'PROCESSING',
]
export const HIGHLIGHT_META: Record<MeetingHighlight['kind'], string> = {
  decision: 'Decisão',
  action: 'Ação',
  topic: 'Tópico',
}

export function platformLabel(p: MeetingSession['platform']): string {
  return p === 'MEET' ? 'Google Meet' : 'Microsoft Teams'
}
export function formatHms(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const mm = String(m).padStart(2, '0')
  const sss = String(ss).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${sss}` : `${m}:${sss}`
}
export function formatWhen(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function MeetingsList() {
  // poll só enquanto houver reunião em andamento, para o status atualizar
  // sozinho sem bater na API à toa quando tudo já concluiu.
  const [live, setLive] = useState(false)
  const { data: meetings, isLoading } = useListMeetingsQuery(undefined, {
    pollingInterval: live ? 5000 : 0,
  })
  useEffect(() => {
    setLive(Boolean(meetings?.some((m) => LIVE_STATUSES.includes(m.status))))
  }, [meetings])

  if (isLoading) {
    return (
      <div className="divide-y divide-line rounded-lg border border-line">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse space-y-2 p-3">
            <div className="h-3 w-48 rounded bg-paper-3" />
            <div className="h-2.5 w-32 rounded bg-paper-2" />
          </div>
        ))}
      </div>
    )
  }
  if (!meetings?.length) {
    return (
      <EmptyState
        title="Nenhuma reunião ainda"
        description="Cole o link de uma reunião acima e o bot entra, grava e transcreve. O histórico aparece aqui."
      />
    )
  }

  return (
    <div className="divide-y divide-line rounded-lg border border-line">
      {meetings.map((m) => (
        <MeetingRow key={m.id} meeting={m} />
      ))}
    </div>
  )
}

function MeetingRow({ meeting }: { meeting: MeetingSession }) {
  const [open, setOpen] = useState(false)
  const [cancelMeeting, { isLoading: cancelling }] = useCancelMeetingMutation()
  const [stopMeeting, { isLoading: stopping }] = useStopMeetingMutation()
  const [removeMeeting, { isLoading: removing }] = useRemoveMeetingMutation()
  const meta = STATUS_META[meeting.status]
  const canCancel = ['PENDING', 'JOINING', 'LOBBY'].includes(meeting.status)
  const canStop = ['JOINING', 'LOBBY', 'RECORDING'].includes(meeting.status)
  const canRemove = ['DONE', 'FAILED', 'LEFT'].includes(meeting.status)
  const canOpen = meeting.status === 'DONE' || Boolean(meeting.recordingKey)

  return (
    <div className="p-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13px] font-medium">
              {meeting.subject?.trim() || platformLabel(meeting.platform)}
            </span>
            <Badge className={cx('shrink-0', meta.tone)}>{meta.label}</Badge>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-3">
            <span>{platformLabel(meeting.platform)}</span>
            {meeting.scheduledAt && <span>· agendada {formatWhen(meeting.scheduledAt)}</span>}
            {meeting.durationSec ? <span>· {formatHms(meeting.durationSec)}</span> : null}
            {meeting.status === 'FAILED' && meeting.error && (
              <span className="text-danger">· {meeting.error}</span>
            )}
          </div>
        </div>
        {canStop && (
          <button
            className="shrink-0 text-[12px] text-ink-1 underline underline-offset-2 disabled:opacity-50"
            disabled={stopping}
            onClick={async () => {
              try {
                await stopMeeting(meeting.id).unwrap()
                toast.success('Bot saindo da reunião. A transcrição começa em instantes.')
              } catch (err) {
                toast.error(apiErrorMessage(err))
              }
            }}
          >
            Parar e transcrever
          </button>
        )}
        {canCancel && (
          <button
            className="shrink-0 text-[12px] text-danger underline underline-offset-2 disabled:opacity-50"
            disabled={cancelling}
            onClick={async () => {
              try {
                await cancelMeeting(meeting.id).unwrap()
                toast.success('Reunião cancelada.')
              } catch (err) {
                toast.error(apiErrorMessage(err))
              }
            }}
          >
            Cancelar
          </button>
        )}
        {canOpen && (
          <button
            className="shrink-0 text-[12px] text-ink-2 underline underline-offset-2"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Fechar' : 'Ver'}
          </button>
        )}
        {canRemove && (
          <button
            className="shrink-0 text-[12px] text-ink-3 underline underline-offset-2 hover:text-danger disabled:opacity-50"
            disabled={removing}
            onClick={async () => {
              try {
                await removeMeeting(meeting.id).unwrap()
                toast.success('Removida do histórico.')
              } catch (err) {
                toast.error(apiErrorMessage(err))
              }
            }}
          >
            Excluir
          </button>
        )}
      </div>
      {open && canOpen && <MeetingDetails meeting={meeting} />}
    </div>
  )
}

export function MeetingDetails({ meeting }: { meeting: MeetingSession }) {
  const token = useSelector((s: RootState) => s.auth.token)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [fetchTranscript, { data: transcript, isFetching }] = useLazyGetMeetingTranscriptQuery()
  const [showTranscript, setShowTranscript] = useState(false)
  const highlights = meeting.highlights ?? []
  const { data: convMessages } = useGetMessagesQuery(meeting.conversationId ?? '', {
    skip: !meeting.conversationId,
  })
  const agentMessages = (convMessages ?? []).filter((m) => m.sender === 'AGENT')
  const reports = agentMessages.flatMap((m) =>
    Array.isArray(m.metadata?.reports) ? (m.metadata.reports as ReportSpec[]) : [],
  )
  const lastAgentText = agentMessages.at(-1)?.content ?? null

  function seek(ts: number) {
    const el = audioRef.current
    if (!el) return
    el.currentTime = ts
    void el.play()
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-line bg-paper-2 p-3">
      {meeting.recordingKey && token && (
        <audio
          ref={audioRef}
          controls
          preload="none"
          className="w-full"
          src={`${API_BASE}/meetings/${meeting.id}/recording?token=${encodeURIComponent(token)}`}
        />
      )}

      {highlights.length > 0 ? (
        <div className="space-y-1.5">
          <span className="block text-[12px] font-medium text-ink-2">Pontos importantes</span>
          <ul className="space-y-1">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px]">
                <button
                  className="shrink-0 font-mono text-ink-3 underline underline-offset-2 hover:text-ink"
                  onClick={() => seek(h.ts)}
                  title="Ir para este momento"
                >
                  {formatHms(h.ts)}
                </button>
                <Badge className="shrink-0 bg-paper-3 text-ink-2">{HIGHLIGHT_META[h.kind]}</Badge>
                <span className="min-w-0 text-ink-2">
                  {h.text}
                  {h.speaker ? <span className="text-ink-3">, {h.speaker}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        meeting.status === 'DONE' && (
          <p className="text-[12px] text-ink-3">Sem pontos destacados para esta reunião.</p>
        )
      )}

      {meeting.conversationId && (
        <div className="space-y-1.5">
          <span className="block text-[12px] font-medium text-ink-2">Entregas</span>
          {reports.length > 0 ? (
            <div className="space-y-2">
              {reports.map((spec, i) => (
                <ReportMessage key={i} spec={spec} />
              ))}
            </div>
          ) : lastAgentText ? (
            <div className="rounded-lg border border-line bg-paper p-2">
              <p className="max-h-32 overflow-auto whitespace-pre-wrap text-[12px] text-ink-2">
                {lastAgentText}
              </p>
              <p className="mt-1 text-[11px] text-ink-3">
                Resposta do agente no inbox. Nenhum documento anexado nesta reunião.
              </p>
            </div>
          ) : (
            <p className="text-[12px] text-ink-3">
              O agente ainda não respondeu. As entregas aparecem aqui quando ficarem prontas.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-[12px]">
        {meeting.transcriptKey && (
          <button
            className="text-ink-2 underline underline-offset-2"
            onClick={() => {
              setShowTranscript((v) => !v)
              if (!transcript) void fetchTranscript(meeting.id)
            }}
          >
            {showTranscript ? 'Ocultar transcrição' : 'Ver transcrição'}
          </button>
        )}
        {meeting.conversationId && (
          <a className="text-ink-2 underline underline-offset-2" href="/office/inbox">
            Abrir no inbox
          </a>
        )}
      </div>

      {showTranscript && (
        isFetching ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : (
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-paper p-2 text-[12px] text-ink-2">
            {transcript?.text || 'Transcrição indisponível.'}
          </pre>
        )
      )}
    </div>
  )
}
