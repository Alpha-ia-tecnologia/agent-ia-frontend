import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  useGetTrailAgentsQuery,
  useGetTrailPlanQuery,
  useStartTrailPlanMutation,
} from '@/api/api'
import { Spinner } from '@/components/ui'
import { Alert, Badge, Button, ProgressBar } from '@/design-system'
import { apiErrorMessage } from '@/lib/apiError'
import { useAppSelector } from '@/store/hooks'
import { AgentCorner } from './AgentOffice'
import { Facts, Section, TrailShell } from './components'
import { CHEGADA, L } from './labels'
import type { TrailActivity, TrailPlan, TrailPlanContent } from './types'

/** O que o Guia está fazendo, em ritmo próximo ao tempo real da geração. */
const PROGRESS = [
  'Lendo o que você construiu nas estações',
  'Definindo objetivo e indicadores',
  'Organizando as ações dos 90 dias',
  'Mapeando riscos e cuidados',
  'Revisando o plano',
]
const PROGRESS_STEP_MS = 7000
const PROGRESS_LIMIT = 94

function Generating() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), PROGRESS_STEP_MS)
    return () => clearInterval(timer)
  }, [])
  const text = PROGRESS[Math.min(tick, PROGRESS.length - 1)]
  const value = Math.min(PROGRESS_LIMIT, 12 + tick * 18)
  return (
    <div className="pilot-waiting plan-waiting" role="status">
      <Spinner />
      <div className="stack-sm">
        <h1 className="ds-h2" style={{ margin: 0 }}>
          O Guia está montando o seu plano
        </h1>
        <p className="ds-small ds-muted" style={{ margin: 0 }}>
          Leva de um a três minutos. Se você sair desta tela, o plano continua sendo montado.
        </p>
      </div>
      <div className="plan-progress">
        <ProgressBar label={text} value={value} valueText="" />
      </div>
    </div>
  )
}

function PlanDocument({ data, plan }: { data: TrailPlan; plan: TrailPlanContent }) {
  const author = [data.name, data.department, data.tableName].filter(Boolean).join(' · ')
  return (
    <article className="plan">
      <header className="plan-head">
        <p className="ds-overline">{L.plan} · 90 dias</p>
        <h1 className="ds-h1" style={{ margin: 0 }}>
          {plan.titulo}
        </h1>
        <p className="ds-lead" style={{ margin: 0 }}>
          {plan.objetivo}
        </p>
        <p className="plan-meta">{author}</p>
      </header>

      <Section title="Ponto de partida">
        <ul className="plan-grid">
          <li className="plan-card">
            <p className="ds-overline">1 dor</p>
            <p className="plan-card__title">{plan.dor.descricao}</p>
            <Facts
              items={[
                ['Quem é afetado', plan.dor.afetados],
                ['Se nada mudar', plan.dor.consequencia],
              ]}
            />
          </li>
          <li className="plan-card">
            <p className="ds-overline">1 dado</p>
            <p className="plan-card__title">{plan.dado.fonte}</p>
            <Facts
              items={[
                ['O que já mostra', plan.dado.mostra],
                ['O que falta', plan.dado.lacunas],
                ['Quem cuida', plan.dado.responsavel],
              ]}
            />
          </li>
          <li className="plan-card">
            <p className="ds-overline">1 dono</p>
            <p className="plan-card__title">{plan.dono.responsavel}</p>
            <Facts
              items={[
                ['Quem apoia', plan.dono.apoio],
                ['Quem decide', plan.dono.decisao],
              ]}
            />
          </li>
        </ul>
      </Section>

      <Section title="Solução com IA">
        <div className="plan-card">
          <div>
            <Badge tone="ia">{plan.solucao.capacidade}</Badge>
          </div>
          <p className="plan-text">{plan.solucao.descricao}</p>
          <Facts
            items={[
              ['O que a IA faz', plan.solucao.papelIa],
              ['O que o servidor faz', plan.solucao.papelServidor],
              ['Fora deste ciclo', plan.solucao.foraDoEscopo],
            ]}
          />
        </div>
      </Section>

      <Section title="Indicadores">
        <ul className="plan-grid">
          {plan.indicadores.map((item) => (
            <li key={item.nome} className="plan-card">
              <p className="plan-card__title">{item.nome}</p>
              <Facts
                items={[
                  ['Como medir', item.comoMedir],
                  ['Ponto de partida', item.pontoDePartida],
                  ['Meta em 90 dias', item.meta],
                ]}
              />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Cronograma">
        <ol className="plan-phases">
          {plan.fases.map((phase) => (
            <li key={phase.periodo} className="plan-phase">
              <p className="ds-overline">{phase.periodo}</p>
              <p className="plan-card__title">{phase.nome}</p>
              <p className="plan-text">{phase.foco}</p>
              <ul className="plan-actions">
                {phase.acoes.map((action) => (
                  <li key={action.acao} className="plan-action">
                    <span className="plan-action__what">{action.acao}</span>
                    <span className="plan-action__who">
                      {action.responsavel} · Entrega: {action.entrega}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Na primeira semana">
        <ol className="plan-steps">
          {plan.primeiraSemana.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Section>

      <Section title="Riscos e como evitar">
        <ul className="plan-grid">
          {plan.riscos.map((item) => (
            <li key={item.risco} className="plan-card">
              <p className="plan-card__title">{item.risco}</p>
              <p className="plan-text">{item.prevencao}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Cuidados">
        <div className="plan-card">
          <Facts
            items={[
              ['Dados', plan.cuidados.dados],
              ['Revisão humana', plan.cuidados.revisaoHumana],
              ['Transparência com o cidadão', plan.cuidados.transparencia],
            ]}
          />
        </div>
      </Section>

      <Section title="Recursos">
        <ul className="plan-grid">
          <li className="plan-card">
            <p className="plan-card__title">O que já existe</p>
            <ul className="plan-steps">
              {plan.recursos.jaTemos.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </li>
          <li className="plan-card">
            <p className="plan-card__title">O que falta</p>
            <ul className="plan-steps">
              {plan.recursos.precisamos.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </li>
        </ul>
      </Section>

      <Section title="Decisão no dia 90">
        <div className="plan-card">
          <Facts
            items={[
              ['Continuar se', plan.decisaoDia90.continuar],
              ['Ajustar se', plan.decisaoDia90.ajustar],
              ['Parar se', plan.decisaoDia90.parar],
            ]}
          />
        </div>
      </Section>

      {plan.trilha.length > 0 && (
        <Section title="O que você leva da trilha">
          <div className="plan-card">
            <Facts items={plan.trilha.map((item) => [item.estacao, item.aproveitamento])} />
          </div>
        </Section>
      )}

      {plan.conexaoPiloto && (
        <Section title="Ligação com o piloto da mesa">
          <p className="plan-text">{plan.conexaoPiloto}</p>
        </Section>
      )}

      <Alert tone="warning" title="Confira na fonte antes de começar">
        <ul className="plan-steps">
          {plan.aConferir.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Alert>

      <div className="plan-actions-bar no-print">
        <Button variant="primary" icon="download" onClick={() => window.print()}>
          Salvar em PDF ou imprimir
        </Button>
        <Link to="/trilha/mapa">
          <Button variant="secondary" fullWidth>
            Ver a trilha
          </Button>
        </Link>
      </div>
      <p className="ds-small ds-muted no-print" style={{ margin: 0 }}>
        <Badge tone="ia">IA</Badge> A IA sugere; você decide e assina.
      </p>
    </article>
  )
}

export default function PlanPage() {
  const userName = useAppSelector((s) => s.auth.user?.name)
  const [polling, setPolling] = useState(true)
  const { data, isLoading } = useGetTrailPlanQuery(undefined, {
    pollingInterval: polling ? 6000 : 0,
  })
  const [start, { isLoading: starting, error: startError, reset }] = useStartTrailPlanMutation()
  const { data: agents = [] } = useGetTrailAgentsQuery()
  const generating = data?.status === 'generating' || (data?.status === 'none' && starting)

  const status = data?.status
  const needsStart = !!data?.chegadaDone && status === 'none'
  useEffect(() => {
    if (needsStart && !starting && !startError) void start()
  }, [needsStart, starting, startError, start])

  // pronto, a tela não precisa mais perguntar ao servidor
  useEffect(() => {
    setPolling(status !== 'ready')
  }, [status])

  if (isLoading || !data) {
    return (
      <TrailShell userName={userName}>
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </TrailShell>
    )
  }

  if (!data.chegadaDone) return <Navigate to={`/trilha/estacao/${CHEGADA}`} replace />

  let content
  if (status === 'ready' && data.plan) {
    content = <PlanDocument data={data} plan={data.plan} />
  } else if (status === 'failed' || startError) {
    content = (
      <Alert
        tone="danger"
        title="O Guia não conseguiu montar o plano"
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              reset()
              void start()
            }}
          >
            Tentar de novo
          </Button>
        }
      >
        {startError ? apiErrorMessage(startError, 'Tente de novo em instantes.') : 'Tente de novo em instantes.'}
      </Alert>
    )
  } else {
    content = <Generating />
  }

  // o Guia aparece trabalhando sem consultar o servidor a cada segundo
  const working: TrailActivity[] = generating
    ? [
        {
          id: 'plan',
          runName: data.tableName,
          station: CHEGADA,
          action: 'plan',
          agentSlug: 'orquestrador',
          agentName: '',
          phase: 'working',
          mine: true,
        },
      ]
    : []
  return (
    <TrailShell userName={userName} subtitle={data.tableName}>
      {content}
      <AgentCorner agents={agents} activities={working} />
    </TrailShell>
  )
}
