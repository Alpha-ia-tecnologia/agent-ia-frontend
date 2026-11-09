import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link, Navigate, useParams } from 'react-router-dom'
import { API_BASE, useGetTrailStationDocumentQuery } from '@/api/api'
import { Spinner } from '@/components/ui'
import { Alert, Button } from '@/design-system'
import { apiErrorMessage } from '@/lib/apiError'
import { useAppSelector } from '@/store/hooks'
import { Facts, Section, TrailShell } from './components'
import { L } from './labels'
import type { TrailStationDocument } from './types'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeZone: 'America/Fortaleza',
  }).format(new Date(iso))
}

function DocumentBody({
  data,
  pdfUrl,
  stationPath,
}: {
  data: TrailStationDocument
  pdfUrl: string
  stationPath: string
}) {
  const meta = [data.name, data.department, data.tableName, formatDate(data.completedAt)]
    .filter(Boolean)
    .join(' · ')
  const download = (
    <a href={pdfUrl} className="plan-download">
      <Button variant="primary" icon="download" fullWidth>
        Baixar em PDF
      </Button>
    </a>
  )
  return (
    <article className="plan">
      <header className="plan-head">
        <p className="ds-overline">Documento da {L.station.toLowerCase()}</p>
        <h1 className="ds-h1" style={{ margin: 0 }}>
          {L.station} {data.station} · {data.title}
        </h1>
        <p className="ds-lead" style={{ margin: 0 }}>
          {data.question}
        </p>
        <p className="plan-meta">{meta}</p>
        {download}
      </header>

      {data.material && (
        <Section title="Material analisado">
          <p className="plan-text">{data.material}</p>
        </Section>
      )}

      {data.steps.length > 0 && (
        <Section title="O que você construiu">
          <div className="plan-card">
            <Facts items={data.steps.map((step) => [step.title, step.note])} />
          </div>
        </Section>
      )}

      {data.result && (
        <Section title="Resultado com a IA">
          <div className="plan-card plan-result">
            <div className="prose-chat">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.result}</ReactMarkdown>
            </div>
          </div>
        </Section>
      )}

      {data.lessons.length > 0 && (
        <Section title="O que você leva">
          <ul className="plan-grid">
            {data.lessons.map((lesson) => (
              <li key={lesson.title} className="plan-card">
                <p className="plan-card__title">{lesson.title}</p>
                <p className="plan-text">{lesson.text}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Alert tone="warning" title="Cuidado desta estação">
        {data.care}
      </Alert>

      <div className="plan-actions-bar no-print">
        {download}
        <Link to={stationPath}>
          <Button variant="secondary" fullWidth>
            Voltar à {L.station.toLowerCase()}
          </Button>
        </Link>
      </div>
    </article>
  )
}

export default function StationDocumentPage() {
  const { n } = useParams()
  const station = Number(n)
  const valid = Number.isInteger(station)
  const userName = useAppSelector((s) => s.auth.user?.name)
  const token = useAppSelector((s) => s.auth.token)
  const { data, isLoading, error } = useGetTrailStationDocumentQuery(station, { skip: !valid })

  if (!valid) return <Navigate to="/trilha/mapa" replace />

  const stationPath = `/trilha/estacao/${station}`
  const pdfUrl = `${API_BASE}/trail/stations/${station}/document/pdf?token=${encodeURIComponent(token ?? '')}`
  let content
  if (isLoading) {
    content = (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  } else if (data) {
    content = <DocumentBody data={data} pdfUrl={pdfUrl} stationPath={stationPath} />
  } else {
    content = (
      <Alert
        tone="warning"
        title="Documento indisponível"
        action={
          <Link to={stationPath}>
            <Button variant="primary" size="sm">
              Voltar à {L.station.toLowerCase()}
            </Button>
          </Link>
        }
      >
        {apiErrorMessage(error, 'Tente de novo em instantes.')}
      </Alert>
    )
  }
  return (
    <TrailShell userName={userName} subtitle={data?.tableName}>
      {content}
    </TrailShell>
  )
}
