import { useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  useGetTrailStateQuery,
  useGetTrailStationsQuery,
  useJoinTrailMutation,
} from '@/api/api'
import { Spinner } from '@/components/ui'
import { Alert, Badge, Button, Card } from '@/design-system'
import { apiErrorMessage } from '@/lib/apiError'
import { logout } from '@/store/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { Medal, Medals, TrailMap, TrailShell } from './components'
import { CHEGADA, L, stationOf } from './labels'
import type { TrailMe, TrailRun, TrailStation } from './types'

function StationCard({ station, run, me }: { station: TrailStation; run: TrailRun; me: TrailMe }) {
  const done = me.done.includes(station.number)
  const open = station.number <= me.maxOpen
  return (
    <Card
      eyebrow={stationOf(station.number)}
      title={station.title}
      actions={<Medal number={station.number} earned={run.approved.includes(station.number)} size={36} />}
    >
      <div className="stack-sm">
        <p className="ds-small ds-muted" style={{ margin: 0 }}>
          {station.question}
        </p>
        <div>
          {done ? (
            <Badge tone="success">{L.done}</Badge>
          ) : open ? (
            <Badge tone="info">{L.inProgress}</Badge>
          ) : (
            <Badge tone="neutral" icon="lock">
              {L.locked}
            </Badge>
          )}
        </div>
        {open ? (
          <Link to={`/trilha/estacao/${station.number}`}>
            <Button variant={done ? 'secondary' : 'primary'} iconRight="chevron-right" fullWidth>
              {done ? 'Rever minha conversa' : 'Abrir estação'}
            </Button>
          </Link>
        ) : (
          <Button variant="secondary" icon="lock" disabled fullWidth>
            Conclua a anterior
          </Button>
        )}
      </div>
    </Card>
  )
}

function FinishCard({ me }: { me: TrailMe }) {
  return (
    <Card eyebrow={L.finish} title="Seu plano de 90 dias">
      <div className="stack-sm">
        <p className="ds-small ds-muted" style={{ margin: 0 }}>
          1 dor, 1 dado e 1 dono da sua área viram um plano de ação completo.
        </p>
        <div>
          {me.chegadaDone ? (
            <Badge tone="success">{L.done}</Badge>
          ) : me.chegadaOpen ? (
            <Badge tone="info">{L.inProgress}</Badge>
          ) : (
            <Badge tone="neutral" icon="lock">
              {L.locked}
            </Badge>
          )}
        </div>
        {me.chegadaOpen ? (
          <Link to={me.chegadaDone ? '/trilha/plano' : `/trilha/estacao/${CHEGADA}`}>
            <Button variant="primary" iconRight="chevron-right" fullWidth>
              {me.chegadaDone ? 'Ver meu plano' : 'Abrir a Chegada'}
            </Button>
          </Link>
        ) : (
          <Button variant="secondary" icon="lock" disabled fullWidth>
            Conclua as estações
          </Button>
        )}
      </div>
    </Card>
  )
}

/** Onde a pessoa retoma: a conversa em andamento, a escolha do piloto ou o plano. */
function resumePath(me: TrailMe) {
  if (me.chegadaDone) return '/trilha/plano'
  return me.finished ? '/trilha/piloto' : `/trilha/estacao/${me.current}`
}

export default function TrailPage({ map = false }: { map?: boolean }) {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const { data: stations } = useGetTrailStationsQuery()
  const { data: state, isLoading } = useGetTrailStateQuery(undefined, { pollingInterval: 5000 })
  const [join, { isLoading: joining, error: joinError }] = useJoinTrailMutation()

  // o participante já recebe a mesa ao entrar; aqui cobre uma falha nesse passo
  const needsRoom = !!state && !state.run
  const isParticipant = user?.role === 'MEMBER'
  useEffect(() => {
    if (needsRoom && isParticipant && !joining && !joinError) void join()
  }, [needsRoom, isParticipant, joining, joinError, join])

  if (isLoading || !stations || !state) {
    return (
      <TrailShell userName={user?.name}>
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </TrailShell>
    )
  }

  const { run, me } = state

  // quem participa cai direto na conversa; o mapa fica como atalho
  if (run && me && !map && isParticipant) {
    return <Navigate to={resumePath(me)} replace />
  }

  if (!run || !me) {
    return (
      <TrailShell userName={user?.name}>
        <div style={{ maxWidth: 560, width: '100%', margin: '0 auto' }}>
          <Card eyebrow={L.trail} title={`Entrar em uma ${L.room.toLowerCase()}`}>
            <div className="stack-sm">
              {joinError && (
                <Alert tone="danger" title="Não foi possível reservar seu lugar">
                  {apiErrorMessage(joinError, 'Tente de novo em instantes.')}
                </Alert>
              )}
              <p className="ds-muted" style={{ margin: 0 }}>
                Cada {L.room.toLowerCase()} recebe até 11 pessoas. Cada uma conversa com o Guia e todas chegam a um piloto.
              </p>
              <Button variant="primary" size="lg" loading={joining} fullWidth onClick={() => void join()}>
                {`Entrar em uma ${L.room.toLowerCase()}`}
              </Button>
            </div>
          </Card>
        </div>
      </TrailShell>
    )
  }

  return (
    <TrailShell userName={user?.name}>
      <div className="stack-sm">
        <p className="ds-overline">{run.name}</p>
        <h1 className="ds-h1">Sua trilha</h1>
        <p className="ds-lead">Conclua cada estação com o Guia. As ideias de vocês formam o piloto da mesa.</p>
      </div>

      <div className="chat-actions">
        <Link to={resumePath(me)}>
          <Button variant="primary" iconRight="chevron-right">
            {me.chegadaDone ? 'Ver meu plano' : me.largadaDone ? 'Voltar à conversa' : 'Fazer a Largada'}
          </Button>
        </Link>
        {state.pilotOpen && (
          <Link to="/trilha/piloto">
            <Button variant="secondary">Escolha do piloto</Button>
          </Link>
        )}
      </div>

      {me.finished && (
        <Alert tone="success" title={L.finishedTitle}>
          {L.finishedBody}
        </Alert>
      )}

      <div className="hidden sm:block">
        <TrailMap
          stations={stations}
          approved={me.done}
          maxOpen={me.maxOpen}
          current={me.finished ? undefined : me.current}
          finished={me.chegadaDone}
          finishOpen={me.chegadaOpen}
        />
      </div>

      <div className="stack-sm">
        <h2 className="ds-h3">{`${L.medals} da mesa`}</h2>
        <Medals approved={run.approved} />
        <p className="ds-small ds-muted" style={{ margin: 0 }}>
          A mesa ganha a medalha quando metade dela conclui a estação.
        </p>
      </div>

      <div className="stack-sm">
        <h2 className="ds-h3">
          {`Participantes da ${run.name} (${run.members.length} de ${run.capacity})`}
        </h2>
        <div className="flex flex-wrap gap-2">
          {run.members.map((name, i) => (
            <Badge key={`${name}-${i}`} tone="neutral" icon="user">
              {name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="cards-grid">
        {stations.map((s) => (
          <StationCard key={s.number} station={s} run={run} me={me} />
        ))}
        <FinishCard me={me} />
      </div>

      <div>
        <button type="button" className="link-button" onClick={() => dispatch(logout())}>
          Sair
        </button>
      </div>
    </TrailShell>
  )
}
