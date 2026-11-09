import {
  Area,
  AreaChart,
  ComposedChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface ChartSpec {
  tipo: 'linha' | 'barra' | 'area' | 'pizza'
  titulo: string
  eixoX: string
  categorias: string[]
  series: { nome: string; valores: (number | null)[]; tracejada?: boolean }[]
  banda?: { min: (number | null)[]; max: (number | null)[] }
  base: string
  geradoEm: string
}

// paleta ink/paper: tons neutros + um acento por série
const COLORS = ['#18181b', '#71717a', '#a1a1aa', '#3f3f46', '#d4d4d8']

function fmtNumber(v: number) {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString('pt-BR')
}

/** Gráfico interativo gerado pelo agente (dados calculados no servidor). */
export function ChartMessage({ spec }: { spec: ChartSpec }) {
  const data = spec.categorias.map((cat, i) => {
    const row: Record<string, string | number | null | (number | null)[]> = {
      x: cat,
    }
    for (const serie of spec.series) row[serie.nome] = serie.valores[i]
    if (spec.banda) {
      const min = spec.banda.min[i]
      const max = spec.banda.max[i]
      row.__banda = min != null && max != null ? [min, max] : null
    }
    return row
  })

  const axisStyle = { fontSize: 11, fill: '#a1a1aa' }
  const tooltipStyle = {
    contentStyle: {
      borderRadius: 10,
      border: '1px solid #e4e4e7',
      fontSize: 12,
      boxShadow: '0 4px 12px rgb(0 0 0 / 0.06)',
    },
    formatter: ((value: unknown) =>
      typeof value === 'number'
        ? value.toLocaleString('pt-BR')
        : String(value)) as never,
  }

  let chart: React.ReactElement
  if (spec.tipo === 'pizza') {
    const pieData = spec.categorias.map((cat, i) => ({
      name: cat,
      value: spec.series[0]?.valores[i] ?? 0,
    }))
    chart = (
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          innerRadius="45%"
          outerRadius="80%"
          paddingAngle={2}
        >
          {pieData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    )
  } else if (spec.tipo === 'linha') {
    chart = (
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
        <XAxis
          dataKey="x"
          tick={axisStyle}
          tickLine={false}
          axisLine={{ stroke: '#e4e4e7' }}
        />
        <YAxis
          tick={axisStyle}
          tickFormatter={fmtNumber}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip {...tooltipStyle} />
        {spec.series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {spec.banda && (
          <Area
            dataKey="__banda"
            stroke="none"
            fill="#a1a1aa"
            fillOpacity={0.14}
            legendType="none"
            tooltipType="none"
            connectNulls
          />
        )}
        {spec.series.map((s, i) => (
          <Line
            key={s.nome}
            type="monotone"
            dataKey={s.nome}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            strokeDasharray={s.tracejada ? '6 4' : undefined}
            dot={{ r: 2.5 }}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
        ))}
      </ComposedChart>
    )
  } else if (spec.tipo === 'area') {
    chart = (
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
        <XAxis
          dataKey="x"
          tick={axisStyle}
          tickLine={false}
          axisLine={{ stroke: '#e4e4e7' }}
        />
        <YAxis
          tick={axisStyle}
          tickFormatter={fmtNumber}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip {...tooltipStyle} />
        {spec.series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {spec.series.map((s, i) => (
          <Area
            key={s.nome}
            type="monotone"
            dataKey={s.nome}
            stroke={COLORS[i % COLORS.length]}
            fill={COLORS[i % COLORS.length]}
            fillOpacity={0.12}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    )
  } else {
    chart = (
      <BarChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f4f4f5"
          vertical={false}
        />
        <XAxis
          dataKey="x"
          tick={axisStyle}
          tickLine={false}
          axisLine={{ stroke: '#e4e4e7' }}
        />
        <YAxis
          tick={axisStyle}
          tickFormatter={fmtNumber}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
        {spec.series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {spec.series.map((s, i) => (
          <Bar
            key={s.nome}
            dataKey={s.nome}
            fill={COLORS[i % COLORS.length]}
            radius={[4, 4, 0, 0]}
            maxBarSize={42}
          />
        ))}
      </BarChart>
    )
  }

  return (
    <figure className="my-2 rounded-xl border border-line bg-paper p-4">
      <figcaption className="mb-2 text-[13px] font-medium text-ink">
        {spec.titulo}
      </figcaption>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chart}
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px] text-ink-3">
        {spec.base
          ? `Fonte: ${spec.base} · calculado pelo servidor`
          : 'Gerado pela análise do agente'}
      </p>
    </figure>
  )
}
