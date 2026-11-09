import { useGetTrailPilotsQuery } from '@/api/api'
import { Spinner } from '@/components/ui'
import { Alert, Button } from '@/design-system'
import { useAppSelector } from '@/store/hooks'
import { TrailShell } from './components'
import { L } from './labels'

/** Fichas de todas as mesas, para a SEMISPE reunir ao fim do laboratório. */
export default function FichasPage() {
  const userName = useAppSelector((s) => s.auth.user?.name)
  const { data, isLoading } = useGetTrailPilotsQuery(undefined, { pollingInterval: 8000 })
  const nav = [
    { label: 'Telão', href: '/telao' },
    { label: 'Fichas', href: '/telao/fichas', active: true },
    { label: 'Configurações', href: '/office/settings' },
  ]

  return (
    <TrailShell userName={userName} subtitle={L.organizerPanel} nav={nav}>
      <div className="stack-sm">
        <p className="ds-overline">{L.trail}</p>
        <h1 className="ds-h1">Fichas do Piloto</h1>
      </div>
      {isLoading || !data ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : data.length === 0 ? (
        <Alert tone="info" title="Nenhuma ficha pronta">
          As fichas aparecem aqui quando cada mesa fechar a escolha do piloto.
        </Alert>
      ) : (
        <>
          <div className="no-print">
            <Button variant="secondary" icon="download" onClick={() => window.print()}>
              Imprimir todas
            </Button>
          </div>
          {data.map((entry) => (
            <section key={entry.runId} className="sheet-page">
              <p className="ds-overline">{entry.name}</p>
              <h2 className="ds-h2">{entry.title}</h2>
              <ol className="sheet">
                {entry.sheet.map((f) => (
                  <li key={f.key} className="sheet-field">
                    <p className="sheet-field__label">{f.label}</p>
                    <p className="sheet-field__hint">{f.hint}</p>
                    <p className="sheet-field__value">{f.value || 'A definir pela mesa'}</p>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </>
      )}
    </TrailShell>
  )
}
