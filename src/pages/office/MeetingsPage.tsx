import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useGetAgentsQuery,
  useGetMeetingChannelsQuery,
  useListMeetingAccountsQuery,
} from '@/api/api'
import { Skeleton, cx } from '@/components/ui'
import { MeetingsList } from './meetings/MeetingsList'
import { NewMeetingForm } from './meetings/NewMeetingForm'
import { MeetingBotSettings } from './meetings/MeetingBotSettings'

/**
 * Página de Reuniões: enviar o bot para uma reunião, acompanhar o histórico e
 * configurar o comportamento do bot (agente, entregas, consentimento).
 * A conexão da conta do escritório (Google/Microsoft) fica em Configurações,
 * junto das demais credenciais.
 */
export default function MeetingsPage() {
  const { data: agents } = useGetAgentsQuery()
  const { data: channels, isLoading: loadingChannel } = useGetMeetingChannelsQuery()
  const { data: accounts } = useListMeetingAccountsQuery()
  const [showConfig, setShowConfig] = useState(false)

  const channel = channels?.[0]
  const hasAgentConfig = Boolean(channel)
  const googleConnected = accounts?.some(
    (a) => a.provider === 'GOOGLE' && a.status === 'CONNECTED',
  )

  return (
    <div className="h-full overflow-y-auto">
      <main className="mx-auto w-full max-w-3xl space-y-6 px-6 py-6">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
          <div>
            <h1 className="text-lg font-semibold">Reuniões</h1>
            <p className="mt-1 max-w-lg text-[12px] leading-relaxed text-ink-3">
              O bot entra na reunião pelo link, grava, transcreve e o agente gera
              as entregas configuradas. Participantes são avisados da gravação.
              Reuniões de até 2h30: no limite, o bot encerra e transcreve o que
              foi capturado.
            </p>
          </div>
          <button
            className={cx(
              'shrink-0 text-[12px] underline underline-offset-2 transition-colors duration-100',
              showConfig ? 'text-ink' : 'text-ink-2 hover:text-ink',
            )}
            onClick={() => setShowConfig((v) => !v)}
          >
            {showConfig ? 'Ocultar configuração' : 'Configurar bot'}
          </button>
        </header>

        {!googleConnected && (
          <p className="rounded-lg border border-line bg-paper-2 px-3 py-2 text-[12px] text-ink-3">
            Conta Google não conectada: reuniões do Google Meet ficam indisponíveis
            (o Teams funciona normalmente).{' '}
            <Link to="/office/settings?tab=channels" className="underline underline-offset-2 hover:text-ink-2">
              Conectar em Configurações
            </Link>
            .
          </p>
        )}

        {showConfig && (
          <section aria-label="Configuração do bot" className="rounded-lg border border-line bg-paper-2 p-4">
            {loadingChannel ? (
              <Skeleton className="h-24 w-full rounded-lg" />
            ) : (
              <MeetingBotSettings agents={agents} channel={channel} />
            )}
          </section>
        )}

        <NewMeetingForm disabled={!loadingChannel && !hasAgentConfig} />

        <section aria-label="Histórico de reuniões" className="space-y-2">
          <h2 className="text-[12px] font-medium text-ink-2">Histórico</h2>
          <MeetingsList />
        </section>
      </main>
    </div>
  )
}
