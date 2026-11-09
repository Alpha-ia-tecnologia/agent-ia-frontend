import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, TopBar } from '@/design-system'
import { CHEGADA, L } from './labels'
import type { TrailStation } from './types'
import './trail.css'

/** Mesmas cores das estações usadas nos slides do seminário. */
const STATION_COLORS: Record<number, string> = {
  1: 'var(--yellow-400)',
  2: 'var(--cyan-400)',
  3: 'var(--coral-400)',
  4: 'var(--blue-400)',
  5: 'var(--lime-400)',
}

export function TrailShell({
  children,
  subtitle,
  actions,
  nav,
  userName,
  theme = 'claro',
  flush = false,
}: {
  children: ReactNode
  /** conversa em tela cheia: sem margens e, no celular, sem a barra superior */
  flush?: boolean
  subtitle?: string
  actions?: ReactNode
  nav?: { label: ReactNode; href?: string; active?: boolean }[]
  userName?: string
  theme?: 'claro' | 'escuro'
}) {
  return (
    <div className={`trail-page ${flush ? 'trail-page--flush' : ''}`} data-theme={theme}>
      <TopBar
        title={L.trail}
        subtitle={subtitle ?? L.organization}
        logoSrc="/logo-prefeitura.png"
        logoAlt="Logo da Prefeitura de São Luís"
        homeHref="/"
        actions={actions}
        nav={nav}
        user={userName ? { name: userName } : undefined}
      />
      <main className={flush ? 'trail-main trail-main--flush' : 'trail-main'}>{children}</main>
    </div>
  )
}

export function Medal({
  number,
  earned,
  size = 40,
}: {
  number: number
  earned: boolean
  size?: number
}) {
  const label = `${L.medal} da ${L.station.toLowerCase()} ${number}: ${earned ? 'conquistada' : 'pendente'}`
  return (
    <span
      role="img"
      aria-label={label}
      className={`medal ${earned ? '' : 'medal--off'}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: earned ? STATION_COLORS[number] : undefined,
      }}
    >
      {earned ? <Icon name="check" size={Math.round(size * 0.5)} /> : number}
    </span>
  )
}

export function Medals({
  approved,
  size,
  total = 5,
}: {
  approved: number[]
  size?: number
  total?: number
}) {
  return (
    <div className="medals">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <Medal key={n} number={n} earned={approved.includes(n)} size={size} />
      ))}
    </div>
  )
}

const NODE_X = [90, 260, 430, 600, 770, 940, 1110]
const nodeY = (i: number) => (i % 2 === 0 ? 280 : 130)
const ROAD =
  'M90 280 C175 280 175 130 260 130 S345 280 430 280 S515 130 600 130 S685 280 770 280 S855 130 940 130 S1025 280 1110 280'

/** Mapa da trilha: largada, cinco estações e chegada. */
export function TrailMap({
  stations,
  approved = [],
  maxOpen = 0,
  current,
  notes,
  finished = false,
  finishOpen = false,
  finishNote,
}: {
  stations: TrailStation[]
  approved?: number[]
  maxOpen?: number
  current?: number
  /** texto extra por estação (no telão, quantos estão em cada uma) */
  notes?: Record<number, string>
  finished?: boolean
  /** a Chegada já pode ser aberta por esta pessoa */
  finishOpen?: boolean
  finishNote?: string
}) {
  const navigate = useNavigate()
  const open = (n: number) => {
    if (n <= maxOpen) navigate(`/trilha/estacao/${n}`)
  }
  const interactive = maxOpen > 0
  const openFinish = () => navigate(`/trilha/estacao/${CHEGADA}`)

  const label = (i: number, title: string, sub: string, highlight: boolean, muted: boolean) => {
    const low = i % 2 === 0
    const y = low ? 344 : 52
    return (
      <>
        <text
          x={NODE_X[i]}
          y={y}
          textAnchor="middle"
          fontSize="18"
          fontWeight="800"
          fill={highlight ? 'var(--lime-400)' : muted ? 'var(--text-on-inverse-muted)' : 'var(--white-50)'}
        >
          {title}
        </text>
        <text x={NODE_X[i]} y={y + 23} textAnchor="middle" fontSize="15" fill="var(--text-on-inverse-muted)">
          {sub}
        </text>
      </>
    )
  }

  return (
    <div className="trail-map">
      <svg
        viewBox="0 0 1200 400"
        role="group"
        aria-label="Mapa da trilha: largada, cinco estações e chegada"
        fontFamily="Inter, Arial, sans-serif"
      >
        <path d={ROAD} fill="none" stroke="var(--navy-900)" strokeWidth="30" strokeLinecap="round" />
        <path
          d={ROAD}
          fill="none"
          stroke="var(--cyan-400)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="1 14"
        />

        <circle cx={NODE_X[0]} cy={nodeY(0)} r="32" fill="var(--navy-800)" stroke="var(--lime-400)" strokeWidth="4" />
        <path d="M82 266 L104 280 L82 294 Z" fill="var(--lime-400)" />
        {label(0, L.start, L.startHint, true, false)}

        {stations.map((s) => {
          const i = s.number
          const done = approved.includes(s.number)
          const isOpen = !interactive || s.number <= maxOpen
          const isCurrent = current === s.number
          const note = notes?.[s.number]
          return (
            <g
              key={s.number}
              className={interactive ? 'trail-map__node' : undefined}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive && isOpen ? 0 : undefined}
              aria-disabled={interactive ? !isOpen : undefined}
              aria-label={`${L.station} ${s.number}, ${s.title}: ${done ? L.done : isOpen ? L.inProgress : L.locked}`}
              onClick={interactive ? () => open(s.number) : undefined}
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        open(s.number)
                      }
                    }
                  : undefined
              }
            >
              {isCurrent && (
                <circle cx={NODE_X[i]} cy={nodeY(i)} r="44" fill="none" stroke="var(--lime-400)" strokeWidth="3" />
              )}
              <circle
                cx={NODE_X[i]}
                cy={nodeY(i)}
                r="36"
                fill={isOpen ? STATION_COLORS[s.number] : 'var(--navy-700)'}
                stroke="var(--navy-800)"
                strokeWidth="6"
              />
              {done ? (
                <path
                  d={`M${NODE_X[i] - 14} ${nodeY(i)} l10 11 l19 -22`}
                  fill="none"
                  stroke="var(--navy-800)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : isOpen ? (
                <text
                  x={NODE_X[i]}
                  y={nodeY(i) + 11}
                  textAnchor="middle"
                  fontSize="32"
                  fontWeight="800"
                  fill="var(--navy-800)"
                >
                  {s.number}
                </text>
              ) : (
                <g
                  fill="none"
                  stroke="var(--text-on-inverse-muted)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x={NODE_X[i] - 12} y={nodeY(i) - 3} width="24" height="19" rx="3" />
                  <path d={`M${NODE_X[i] - 7} ${nodeY(i) - 3} v-6 a7 7 0 0 1 14 0 v6`} />
                </g>
              )}
              {label(i, s.title, note ?? s.tagline, false, !isOpen)}
            </g>
          )
        })}

        <g
          className={finishOpen ? 'trail-map__node' : undefined}
          role={finishOpen ? 'button' : undefined}
          tabIndex={finishOpen ? 0 : undefined}
          aria-label={finishOpen ? `${L.finish}: ${L.finishHint}` : undefined}
          onClick={finishOpen ? openFinish : undefined}
          onKeyDown={
            finishOpen
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openFinish()
                  }
                }
              : undefined
          }
        >
          <circle
            cx={NODE_X[6]}
            cy={nodeY(6)}
            r="32"
            fill={finished ? 'var(--lime-400)' : 'var(--navy-800)'}
            stroke="var(--lime-400)"
            strokeWidth="4"
          />
          <path
            d="M1110 258 l6.5 14 15 1.5 -11 10 3 15 -13.5 -7.5 -13.5 7.5 3 -15 -11 -10 15 -1.5 z"
            fill={finished ? 'var(--navy-800)' : 'var(--lime-400)'}
          />
          {label(6, L.finish, finishNote ?? L.finishHint, true, false)}
        </g>
      </svg>
    </div>
  )
}
