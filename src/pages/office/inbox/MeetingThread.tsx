import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  API_BASE,
  useGetMessagesQuery,
  useLazyGetMeetingTranscriptQuery,
  useListMeetingsQuery,
} from '@/api/api'
import type { MeetingSession } from '@/api/api'
import { ReportMessage, type ReportSpec } from '@/components/ReportMessage'
import type { RootState } from '@/store'
import { Badge, Skeleton, cx } from '@/components/ui'
import {
  HIGHLIGHT_META,
  STATUS_META,
  formatHms,
  formatWhen,
  platformLabel,
} from '../meetings/MeetingsList'

/** Extrai os nomes de falante de uma transcrição "[HH:MM:SS] Falante: fala". */
function speakersFromTranscript(text: string): string[] {
  const found = new Set<string>()
  for (const match of text.matchAll(/^\[\d{2}:\d{2}:\d{2}\]\s*([^:\n]+):/gm)) {
    const name = match[1].trim()
    if (name) found.add(name)
  }
  return [...found]
}

/**
 * Conversa de reunião no inbox: em vez do chat cru, um dossiê da reunião com
 * cabeçalho (assunto, plataforma, data, duração, participantes, status),
 * gravação, pontos importantes e a seção de materiais gerados pelo agente.
 */
export function MeetingThread({
  contact,
  onBack,
}: {
  contact: { name: string; externalId: string; conversationId: string }
  onBack: () => void
}) {
  const { data: meetings, isLoading } = useListMeetingsQuery()
  const meeting: MeetingSession | undefined = meetings?.find(
    (m) => m.conversationId === contact.conversationId || m.id === contact.externalId,
  )

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-[13px] font-medium text-ink">Reunião não encontrada</p>
        <p className="max-w-xs text-[12px] text-ink-3">
          Esta conversa veio do bot de reuniões, mas a sessão não está mais no
          histórico. Os materiais gerados continuam disponíveis no chat da conversa.
        </p>
      </div>
    )
  }

  return <MeetingDossier meeting={meeting} onBack={onBack} />
}

function MeetingDossier({ meeting, onBack }: { meeting: MeetingSession; onBack: () => void }) {
  const token = useSelector((s: RootState) => s.auth.token)
  const audioRef = useRef<HTMLAudioElement>(null)
  const statusMeta = STATUS_META[meeting.status]
  const highlights = meeting.highlights ?? []

  const [fetchTranscript, { data: transcript, isFetching: loadingTranscript }] =
    useLazyGetMeetingTranscriptQuery()
  const [showTranscript, setShowTranscript] = useState(false)

  const { data: convMessages, isLoading: loadingMessages } = useGetMessagesQuery(
    meeting.conversationId ?? '',
    { skip: !meeting.conversationId },
  )
  const agentMessages = (convMessages ?? []).filter((m) => m.sender === 'AGENT')
  const reports = agentMessages.flatMap((m) =>
    Array.isArray(m.metadata?.reports) ? (m.metadata.reports as ReportSpec[]) : [],
  )
  const agentText = agentMessages.at(-1)?.content ?? null

  // Participantes: falantes dos highlights; sem highlights, cai nos falantes da
  // transcrição (carregada sob demanda junto do "Ver transcrição").
  const participants = useMemo(() => {
    const fromHighlights = [
      ...new Set(highlights.map((h) => h.speaker?.trim()).filter(Boolean) as string[]),
    ]
    if (fromHighlights.length) return fromHighlights
    if (transcript?.text) return speakersFromTranscript(transcript.text)
    return []
  }, [highlights, transcript?.text])

  function seek(ts: number) {
    const el = audioRef.current
    if (!el) return
    el.currentTime = ts
    void el.play()
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-line px-4 py-3 sm:px-5">
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            aria-label="Voltar para a lista"
            className="-ml-1 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-2 transition-colors duration-150 hover:bg-ink/[0.04] hover:text-ink md:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[14px] font-semibold">
                {meeting.subject?.trim() || platformLabel(meeting.platform)}
              </h2>
              <Badge className={cx('shrink-0', statusMeta.tone)}>{statusMeta.label}</Badge>
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-ink-3">
              <span>{platformLabel(meeting.platform)}</span>
              {(meeting.startedAt || meeting.scheduledAt) && (
                <span>· {formatWhen(meeting.startedAt ?? meeting.scheduledAt)}</span>
              )}
              {meeting.durationSec ? <span>· {formatHms(meeting.durationSec)}</span> : null}
            </p>
            {participants.length > 0 && (
              <p className="mt-1 text-[12px] text-ink-3">
                <span className="font-medium text-ink-2">Participantes:</span>{' '}
                {participants.join(', ')}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="scroll-thin flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5">
        {meeting.recordingKey && token && (
          <section aria-label="Gravação">
            <h3 className="mb-1.5 text-[12px] font-medium text-ink-2">Gravação</h3>
            <audio
              ref={audioRef}
              controls
              preload="none"
              className="w-full"
              src={`${API_BASE}/meetings/${meeting.id}/recording?token=${encodeURIComponent(token)}`}
            />
          </section>
        )}

        {highlights.length > 0 && (
          <section aria-label="Pontos importantes">
            <h3 className="mb-1.5 text-[12px] font-medium text-ink-2">Pontos importantes</h3>
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
          </section>
        )}

        <section aria-label="Materiais">
          <h3 className="mb-1.5 text-[12px] font-medium text-ink-2">Materiais</h3>
          {loadingMessages ? (
            <Skeleton className="h-24 w-full rounded-lg" />
          ) : reports.length > 0 ? (
            <div className="space-y-2">
              {reports.map((spec, i) => (
                <ReportMessage key={i} spec={spec} />
              ))}
              {agentText && (
                <div className="rounded-lg border border-line bg-paper p-3">
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">
                    {agentText}
                  </p>
                </div>
              )}
            </div>
          ) : agentText ? (
            <div className="rounded-lg border border-line bg-paper p-3">
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">{agentText}</p>
              <p className="mt-1.5 text-[11px] text-ink-3">
                Nenhum documento anexado nesta reunião.
              </p>
            </div>
          ) : (
            <p className="text-[12px] text-ink-3">
              {meeting.status === 'DONE'
                ? 'O agente ainda não respondeu. Os materiais aparecem aqui quando ficarem prontos.'
                : 'Os materiais aparecem aqui quando a reunião terminar de processar.'}
            </p>
          )}
        </section>

        <section aria-label="Transcrição" className="pb-2">
          <div className="flex flex-wrap items-center gap-3 text-[12px]">
            {meeting.transcriptKey && (
              <button
                className="text-ink-2 underline underline-offset-2 hover:text-ink"
                onClick={() => {
                  setShowTranscript((v) => !v)
                  if (!transcript) void fetchTranscript(meeting.id)
                }}
              >
                {showTranscript ? 'Ocultar transcrição' : 'Ver transcrição'}
              </button>
            )}
            <Link to="/office/meetings" className="text-ink-3 underline underline-offset-2 hover:text-ink-2">
              Abrir em Reuniões
            </Link>
          </div>
          {showTranscript &&
            (loadingTranscript ? (
              <Skeleton className="mt-2 h-24 w-full rounded-lg" />
            ) : (
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-paper p-2 text-[12px] text-ink-2">
                {transcript?.text || 'Transcrição indisponível.'}
              </pre>
            ))}
        </section>
      </div>
    </div>
  )
}
