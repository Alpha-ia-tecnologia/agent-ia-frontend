import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useCastTrailVoteMutation,
  useCloseTrailPilotMutation,
  useEditTrailSheetMutation,
  useGetTrailPilotQuery,
  useGetTrailStateQuery,
  useGetTrailVoteQuery,
  useStartTrailPilotMutation,
  useVoteTrailPilotMutation,
} from '@/api/api'
import { Spinner } from '@/components/ui'
import { Alert, Badge, Button, Card, ProgressBar } from '@/design-system'
import { apiErrorMessage } from '@/lib/apiError'
import { useAppSelector } from '@/store/hooks'
import { TrailShell } from './components'
import { CHEGADA, L } from './labels'
import type { SheetField, TrailPilot } from './types'

const CRITERIA = [
  { title: 'Impacto', text: 'Quantas pessoas ganham, e quanto' },
  { title: '90 dias', text: 'Dá para começar com o que já existe' },
  { title: 'Dados', text: 'O dado existe e tem um responsável' },
  { title: 'Cuidados', text: 'Riscos baixos e revisão humana' },
]

function Waiting({ text }: { text: string }) {
  return (
    <div className="pilot-waiting" role="status">
      <Spinner />
      <p className="ds-lead" style={{ margin: 0 }}>
        {text}
      </p>
    </div>
  )
}

function Voting({ pilot }: { pilot: TrailPilot }) {
  const [vote, { isLoading: voting }] = useVoteTrailPilotMutation()
  const [close, { isLoading: closing }] = useCloseTrailPilotMutation()
  const canClose = pilot.voters >= pilot.voteQuorum

  async function onVote(station: number) {
    try {
      await vote(station).unwrap()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível votar. Tente de novo.'))
    }
  }

  async function onClose() {
    try {
      await close().unwrap()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível fechar a escolha. Tente de novo.'))
    }
  }

  return (
    <>
      <div className="stack-sm">
        <p className="ds-overline">Escolha do piloto · {pilot.table.name}</p>
        <h1 className="ds-h1">Das ideias da mesa, qual vira o piloto?</h1>
        <p className="ds-lead">Conversem na mesa e cada pessoa escolhe uma.</p>
      </div>

      <ul className="criteria-grid">
        {CRITERIA.map((c) => (
          <li key={c.title}>
            <strong>{c.title}</strong>
            <span>{c.text}</span>
          </li>
        ))}
      </ul>

      <ul className="idea-list">
        {pilot.candidates.map((c) => {
          const mine = pilot.myVote === c.station
          return (
            <li key={c.station} className={mine ? 'idea idea--mine' : 'idea'}>
              <p className="ds-overline">
                {L.station} {c.station} · {c.stationTitle}
              </p>
              <h2 className="ds-h3">{c.title}</h2>
              <p className="idea__summary">{c.summary}</p>
              <div className="idea__foot">
                <span className="ds-small ds-muted">
                  {c.votes === 1 ? '1 voto' : `${c.votes} votos`}
                </span>
                <Button
                  variant={mine ? 'secondary' : 'primary'}
                  size="sm"
                  icon={mine ? 'check' : undefined}
                  disabled={voting || mine}
                  onClick={() => void onVote(c.station)}
                >
                  {mine ? 'Seu voto' : 'Votar nesta ideia'}
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="stack-sm">
        <ProgressBar
          label="Votos da mesa"
          value={Math.min(100, Math.round((pilot.voters / pilot.voteQuorum) * 100))}
          valueText={`${pilot.voters} de ${pilot.voteQuorum} para fechar`}
        />
        <Button variant="primary" size="lg" fullWidth loading={closing} disabled={!canClose} onClick={() => void onClose()}>
          Fechar a escolha e montar a ficha
        </Button>
      </div>
    </>
  )
}

function FieldRow({ field }: { field: SheetField }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(field.value)
  const [save, { isLoading }] = useEditTrailSheetMutation()

  async function onSave() {
    try {
      await save({ field: field.key, value }).unwrap()
      setEditing(false)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível salvar. Tente de novo.'))
    }
  }

  function open() {
    setValue(field.value)
    setEditing(true)
  }

  return (
    <li className="sheet-field">
      <p className="sheet-field__label">{field.label}</p>
      <p className="sheet-field__hint">{field.hint}</p>
      {editing ? (
        <div className="stack-sm">
          <textarea
            className="composer-input"
            rows={3}
            maxLength={1000}
            value={value}
            aria-label={field.label}
            onChange={(e) => setValue(e.target.value)}
          />
          <div className="chat-actions">
            <Button variant="primary" size="sm" loading={isLoading} onClick={() => void onSave()}>
              Salvar
            </Button>
            <Button variant="secondary" size="sm" disabled={isLoading} onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="sheet-field__value">{field.value || 'A definir pela mesa'}</p>
          <button type="button" className="link-button no-print" onClick={open}>
            Editar
          </button>
        </>
      )}
    </li>
  )
}

function Sheet({ pilot }: { pilot: TrailPilot }) {
  return (
    <>
      <div className="stack-sm">
        <p className="ds-overline">
          {L.sheet} · {pilot.table.name}
        </p>
        <h1 className="ds-h1">{pilot.chosen?.title}</h1>
        <p className="ds-lead">{pilot.chosen?.summary}</p>
      </div>
      <Alert tone="info" title="Revisem antes de apresentar" className="no-print">
        O Guia montou a ficha com o que a mesa anotou. Confiram números e normas na fonte: a decisão é de vocês.
      </Alert>
      <ol className="sheet">
        {pilot.sheet.map((f) => (
          <FieldRow key={f.key} field={f} />
        ))}
      </ol>
      <div className="no-print">
        <Button variant="secondary" icon="download" onClick={() => window.print()}>
          Imprimir a ficha
        </Button>
      </div>
    </>
  )
}

function PublicVote() {
  const { data } = useGetTrailVoteQuery(undefined, { pollingInterval: 6000 })
  const [cast, { isLoading }] = useCastTrailVoteMutation()

  if (!data?.open || data.options.length === 0) return null

  async function onVote(runId: string) {
    try {
      await cast(runId).unwrap()
      toast.success('Voto registrado.')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível votar. Tente de novo.'))
    }
  }

  return (
    <Card eyebrow="Votação" title="Qual piloto São Luís deveria começar na segunda-feira?" className="no-print">
      <div className="stack-sm">
        <p className="ds-small ds-muted" style={{ margin: 0 }}>
          Vote em um piloto de outra mesa.
        </p>
        <ul className="idea-list">
          {data.options.map((o) => {
            const mine = data.myVote === o.runId
            return (
              <li key={o.runId} className={mine ? 'idea idea--mine' : 'idea'}>
                <p className="ds-overline">{o.name}</p>
                <h3 className="ds-h3">{o.title}</h3>
                <p className="idea__summary">{o.summary}</p>
                <div className="idea__foot">
                  <Button
                    variant={mine ? 'secondary' : 'primary'}
                    size="sm"
                    icon={mine ? 'check' : undefined}
                    disabled={isLoading || mine}
                    onClick={() => void onVote(o.runId)}
                  >
                    {mine ? 'Seu voto' : 'Votar neste piloto'}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </Card>
  )
}

export default function PilotPage() {
  const userName = useAppSelector((s) => s.auth.user?.name)
  const { data: pilot, isLoading } = useGetTrailPilotQuery(undefined, { pollingInterval: 4000 })
  const { data: state } = useGetTrailStateQuery(undefined, { pollingInterval: 10000 })
  const [start, { isLoading: starting, error: startError, reset }] = useStartTrailPilotMutation()

  const needsStart = !!pilot?.open && pilot.status === 'none'
  useEffect(() => {
    if (needsStart && !starting && !startError) void start()
  }, [needsStart, starting, startError, start])

  if (isLoading || !pilot) {
    return (
      <TrailShell userName={userName}>
        <Waiting text="Abrindo a escolha do piloto" />
      </TrailShell>
    )
  }

  let content
  if (!pilot.open) {
    const { doneCount, quorum, name } = pilot.table
    content = (
      <div className="stack">
        <div className="stack-sm">
          <p className="ds-overline">Escolha do piloto · {name}</p>
          <h1 className="ds-h1">Falta pouco para a mesa escolher</h1>
          <p className="ds-lead">A escolha abre quando metade da mesa concluir a {L.station} 5.</p>
        </div>
        <ProgressBar
          label={name}
          value={Math.min(100, Math.round((doneCount / quorum) * 100))}
          valueText={`${doneCount} de ${quorum} pessoas`}
        />
        <Link to="/trilha/mapa">
          <Button variant="secondary" fullWidth>
            Ver a trilha
          </Button>
        </Link>
      </div>
    )
  } else if (startError) {
    content = (
      <Alert
        tone="danger"
        title="O Guia não conseguiu reunir as ideias"
        action={
          <Button variant="primary" size="sm" onClick={() => reset()}>
            Tentar de novo
          </Button>
        }
      >
        {apiErrorMessage(startError, 'Tente de novo em instantes.')}
      </Alert>
    )
  } else if (pilot.status === 'voting') {
    content = <Voting pilot={pilot} />
  } else if (pilot.status === 'ready') {
    content = (
      <>
        <Sheet pilot={pilot} />
        <PublicVote />
      </>
    )
  } else {
    content = (
      <Waiting
        text={pilot.status === 'drafting' ? 'O Guia está montando a Ficha do Piloto' : 'O Guia está reunindo as ideias da mesa'}
      />
    )
  }

  const me = state?.me
  return (
    <TrailShell userName={userName} subtitle={pilot.table.name}>
      {content}
      {me?.chegadaOpen && (
        <div className="no-print">
          <Link to={me.chegadaDone ? '/trilha/plano' : `/trilha/estacao/${CHEGADA}`}>
            <Button
              variant={pilot.status === 'ready' ? 'primary' : 'secondary'}
              size="lg"
              iconRight="chevron-right"
              fullWidth
            >
              {me.chegadaDone ? 'Ver meu plano de 90 dias' : 'Montar meu plano de 90 dias'}
            </Button>
          </Link>
        </div>
      )}
      <div className="no-print">
        <Badge tone="ia">IA</Badge>{' '}
        <span className="ds-small ds-muted">A IA sugere; a mesa decide e assina.</span>
      </div>
    </TrailShell>
  )
}
