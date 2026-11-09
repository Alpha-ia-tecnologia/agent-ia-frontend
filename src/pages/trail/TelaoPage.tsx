import { useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import {
  useGetTrailActivityQuery,
  useGetTrailAgentsQuery,
  useGetTrailBoardQuery,
  useGetTrailStationsQuery,
  useReleaseTrailRoomMutation,
  useReleaseTrailRunMutation,
  useSetTrailChegadaOpenMutation,
  useSetTrailPilotOpenMutation,
  useSetTrailVoteOpenMutation,
} from '@/api/api'
import { Spinner } from '@/components/ui'
import { Alert, Badge, Button, Card, Modal, Select, Stat, Table } from '@/design-system'
import { apiErrorMessage } from '@/lib/apiError'
import { useAppSelector } from '@/store/hooks'
import { AgentOffice } from './AgentOffice'
import { Medals, TrailMap, TrailShell } from './components'
import { L } from './labels'
import type { TrailBoard } from './types'

type BoardRun = TrailBoard['runs'][number]

const PILOT_STATUS: Record<BoardRun['pilotStatus'], string> = {
  none: 'Ainda não abriu',
  generating: 'Reunindo ideias',
  voting: 'Em escolha',
  drafting: 'Montando a ficha',
  ready: 'Pronto',
}

function EntryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} title="Entrada de participantes" onClose={onClose} size="md">
      <div className="telao-qr">
        <div className="telao-qr__box">
          <QRCodeSVG
            value={`${window.location.origin}/login`}
            size={260}
            level="M"
            style={{ display: 'block', width: '100%', maxWidth: 260, height: 'auto' }}
          />
        </div>
        <p className="ds-h3" style={{ margin: 0 }}>
          Leia o QR code ou acesse {window.location.host}
        </p>
        <p className="ds-small ds-muted" style={{ margin: 0 }}>
          A pessoa digita o nome e entra automaticamente em uma mesa.
        </p>
      </div>
    </Modal>
  )
}

function RunRow({ run }: { run: BoardRun }) {
  const [release, { isLoading }] = useReleaseTrailRunMutation()
  const target = Math.min(5, run.maxOpen + 1)

  async function onRelease() {
    try {
      await release({ runId: run.id, upTo: target }).unwrap()
      toast.success(`${L.station} ${target} liberada para ${run.name}.`)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível liberar. Tente de novo.'))
    }
  }

  if (run.finished || run.maxOpen >= 5) return null
  return (
    <Button variant="secondary" size="sm" loading={isLoading} onClick={onRelease}>
      {`Liberar ${L.station.toLowerCase()} ${target}`}
    </Button>
  )
}

export default function TelaoPage() {
  const userName = useAppSelector((s) => s.auth.user?.name)
  const { data: stations } = useGetTrailStationsQuery()
  const { data: board, isLoading } = useGetTrailBoardQuery(undefined, { pollingInterval: 4000 })
  const { data: agents = [] } = useGetTrailAgentsQuery()
  const { data: activities = [] } = useGetTrailActivityQuery(undefined, { pollingInterval: 1500 })
  const [releaseRoom, { isLoading: releasing }] = useReleaseTrailRoomMutation()
  const [upTo, setUpTo] = useState('')
  const [showEntry, setShowEntry] = useState(false)
  const [setPilotOpen, { isLoading: pilotBusy }] = useSetTrailPilotOpenMutation()
  const [setVoteOpen, { isLoading: voteBusy }] = useSetTrailVoteOpenMutation()
  const [setChegadaOpen, { isLoading: chegadaBusy }] = useSetTrailChegadaOpenMutation()

  const nav = [
    { label: 'Telão', href: '/telao', active: true },
    { label: 'Fichas', href: '/telao/fichas' },
    { label: 'Configurações', href: '/office/settings' },
  ]
  const shell = {
    theme: 'escuro' as const,
    subtitle: L.organizerPanel,
    nav,
    userName,
    actions: (
      <Button variant="accent" size="sm" icon="users" onClick={() => setShowEntry(true)}>
        Entrada de participantes
      </Button>
    ),
  }

  if (isLoading || !board || !stations) {
    return (
      <TrailShell {...shell}>
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </TrailShell>
    )
  }

  const people = board.runs.reduce((sum, r) => sum + r.members.length, 0)
  const notes: Record<number, string> = {}
  for (const s of stations) {
    const here = board.runs.flatMap((r) => r.peopleAt).filter((n) => n === s.number).length
    notes[s.number] = here === 1 ? '1 pessoa aqui' : `${here} pessoas aqui`
  }

  const arrived = board.runs.reduce((sum, r) => sum + r.chegadaDone, 0)

  async function toggleFlag(mutate: (open: boolean) => { unwrap: () => Promise<unknown> }, open: boolean) {
    try {
      await mutate(open).unwrap()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível alterar. Tente de novo.'))
    }
  }

  async function onReleaseRoom() {
    try {
      await releaseRoom({ upTo: Number(upTo) }).unwrap()
      toast.success(
        Number(upTo) === 0 ? 'Liberação removida.' : `Mesas liberadas até a ${L.station.toLowerCase()} ${upTo}.`,
      )
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível liberar. Tente de novo.'))
    }
  }

  return (
    <TrailShell {...shell}>
      {!board.aiReady && (
        <Alert tone="warning" title="A IA ainda não está conectada">
          Confira a variável ANTHROPIC_API_KEY no servidor para o Guia atender as mesas.
        </Alert>
      )}

      <div className="hidden sm:block">
        <TrailMap
          stations={stations}
          notes={notes}
          finished={board.runs.length > 0 && board.runs.every((r) => r.finished)}
          finishNote={arrived === 1 ? '1 pessoa chegou' : `${arrived} pessoas chegaram`}
        />
      </div>

      {agents.length > 0 && <AgentOffice agents={agents} activities={activities} showRoom />}

      <div className="telao-stats">
        <Stat label="Pessoas na trilha" value={people} />
        <Stat label={L.rooms} value={board.runs.length} />
        <Stat label="Mesas com todas as medalhas" value={board.runs.filter((r) => r.finished).length} />
        <Stat label="Pilotos prontos" value={board.runs.filter((r) => r.pilotStatus === 'ready').length} />
        <Stat label="Planos de 90 dias" value={board.plansReady} />
      </div>

      <Card eyebrow="Controle do tempo" title="Liberar estações para todas as mesas">
        <div className="telao-controls">
          <div style={{ minWidth: 260 }}>
            <Select
              label="Abrir até"
              value={upTo}
              placeholder="Escolha a estação"
              onChange={(e) => setUpTo(e.target.value)}
              options={[
                ...stations.map((s) => ({
                  value: String(s.number),
                  label: `${L.station} ${s.number}: ${s.title}`,
                })),
                { value: '0', label: 'Remover liberação' },
              ]}
            />
          </div>
          <Button variant="primary" loading={releasing} disabled={upTo === ''} onClick={onReleaseRoom}>
            Aplicar para todas as mesas
          </Button>
          <p className="ds-small ds-muted" style={{ margin: 0 }}>
            {board.releasedUpTo > 0
              ? `Mesas liberadas até a ${L.station.toLowerCase()} ${board.releasedUpTo}.`
              : 'Nenhuma liberação ativa.'}
          </p>
        </div>
      </Card>

      <Card eyebrow="Fim da trilha" title="Piloto, votação e Chegada">
        <div className="telao-controls">
          <Button
            variant={board.pilotOpen ? 'secondary' : 'primary'}
            loading={pilotBusy}
            onClick={() => void toggleFlag(setPilotOpen, !board.pilotOpen)}
          >
            {board.pilotOpen ? 'Fechar a escolha do piloto' : 'Abrir a escolha do piloto'}
          </Button>
          <Button
            variant={board.voteOpen ? 'secondary' : 'primary'}
            loading={voteBusy}
            onClick={() => void toggleFlag(setVoteOpen, !board.voteOpen)}
          >
            {board.voteOpen ? 'Encerrar a votação final' : 'Abrir a votação final'}
          </Button>
          <Button
            variant={board.chegadaOpen ? 'secondary' : 'primary'}
            loading={chegadaBusy}
            onClick={() => void toggleFlag(setChegadaOpen, !board.chegadaOpen)}
          >
            {board.chegadaOpen ? 'Fechar a Chegada para todos' : 'Abrir a Chegada para todos'}
          </Button>
          <Link to="/telao/fichas">
            <Button variant="secondary" icon="file">
              Ver as fichas
            </Button>
          </Link>
        </div>
      </Card>

      {board.highlights.length > 0 && (
        <Card eyebrow="Mural das mesas" title="Ideias recentes">
          <ul className="mural-notes">
            {board.highlights.map((h) => (
              <li key={h.id} className="note note--idea">
                <p className="note__who">
                  {h.runName} · {h.authorName}
                  {h.department ? ` · ${h.department}` : ''}
                </p>
                <p className="note__label">
                  {L.station} {h.station}
                </p>
                <p className="note__text">{h.text}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Table
        caption="Andamento das mesas"
        emptyText="Ninguém entrou na trilha ainda."
        rows={board.runs}
        columns={[
          { key: 'name', header: L.room },
          {
            key: 'members',
            header: 'Participantes',
            render: (r) => (
              <Badge tone="neutral" icon="users">
                {`${r.members.length} de ${r.capacity}`}
              </Badge>
            ),
          },
          { key: 'medals', header: L.medals, render: (r) => <Medals approved={r.approved} size={32} /> },
          {
            key: 'pilotTitle',
            header: L.pilot,
            render: (r) => r.pilotTitle ?? PILOT_STATUS[r.pilotStatus],
          },
          ...(board.voteOpen || board.runs.some((r) => r.publicVotes > 0)
            ? [{ key: 'publicVotes', header: 'Votos' }]
            : []),
          { key: 'actions', header: 'Ação', render: (r) => <RunRow run={r} /> },
        ]}
      />

      <EntryModal open={showEntry} onClose={() => setShowEntry(false)} />
    </TrailShell>
  )
}
