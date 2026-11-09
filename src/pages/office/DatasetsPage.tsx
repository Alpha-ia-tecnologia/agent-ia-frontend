import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useDeleteDatasetMutation,
  useGetDatasetRowsQuery,
  useGetDatasetsQuery,
  useUpdateDatasetColumnMutation,
  useUploadDatasetMutation,
  type Dataset,
} from '@/api/api'
import { useAppSelector } from '@/store/hooks'
import { apiErrorMessage } from '@/lib/apiError'
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Skeleton,
  Spinner,
  Textarea,
  cx,
} from '@/components/ui'

const TYPE_LABEL: Record<string, string> = {
  TEXT: 'Texto',
  NUMBER: 'Número',
  DATE: 'Data',
  BOOLEAN: 'Sim/Não',
  CURRENCY: 'Moeda',
}

function TableIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  )
}

function CrossLink({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      to={to}
      className={cx(
        'group inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-paper px-3 py-1.5 text-[12px] font-medium text-ink-2 transition-colors duration-150 hover:border-line-2 hover:text-ink',
        className,
      )}
    >
      {children}
      <span className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
    </Link>
  )
}

export default function DatasetsPage() {
  const user = useAppSelector((s) => s.auth.user)
  const isAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN'
  const { data: datasets, isLoading } = useGetDatasetsQuery()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)

  const selected = datasets?.find((d) => d.id === selectedId) ?? null

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-up sm:px-6 sm:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <header className="flex items-start gap-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-line bg-paper-2 text-ink">
              <TableIcon />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold leading-tight">Dados</h1>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">
                Planilhas que os agentes <strong className="font-semibold text-ink">calculam</strong>: viram
                tabelas com colunas tipadas e os agentes filtram, agrupam e somam
                de verdade sobre as linhas, sem inventar números.
              </p>
            </div>
          </header>
          {isAdmin && (
            <Button className="w-full shrink-0 sm:w-auto" onClick={() => setUploadOpen(true)}>Importar planilha</Button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2.5 rounded-xl border border-dashed border-line bg-paper-2 px-3.5 py-2.5 text-[13px] text-ink-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-[18px] shrink-0 text-ink-3" aria-hidden>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
          </svg>
          <span className="min-w-0 flex-1">
            É um <strong className="font-medium text-ink">documento ou texto</strong> para os agentes lerem
            (política, manual, contrato)? Isso vai em Conhecimento.
          </span>
          <CrossLink className="ml-auto shrink-0" to="/office/knowledge">Ir para Conhecimento</CrossLink>
        </div>

        <div className="mt-8">
          {isLoading && <Skeleton className="h-32 w-full rounded-xl" />}
          {!isLoading && !datasets?.length && (
            <EmptyState
              title="Nenhuma base de dados"
              description="Importe uma planilha (.xlsx ou .csv) e os agentes poderão consultar os dados com cálculos reais."
            />
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {datasets?.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedId((id) => (id === d.id ? null : d.id))}
                className={cx(
                  'rounded-xl border p-4 text-left transition-all duration-150',
                  selectedId === d.id
                    ? 'border-ink ring-1 ring-ink/10'
                    : 'border-line hover:-translate-y-px hover:border-line-2 hover:shadow-[0_2px_10px_rgba(24,24,27,0.05)]',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-paper-2 text-ink-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M9 3v18" />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{d.name}</span>
                  <Badge className={cx('shrink-0', d.quality === 'WITH_ISSUES' && 'text-danger')}>
                    {d.quality === 'OK' ? 'ok' : 'com ressalvas'}
                  </Badge>
                </div>
                <p className="mt-2 text-[12px] text-ink-3">
                  {d.rowCount.toLocaleString()} linhas · {d.columns.length} colunas ·{' '}
                  {new Date(d.updatedAt).toLocaleDateString()}
                </p>
                {d.description && (
                  <p className="mt-1.5 line-clamp-2 text-[13px] text-ink-2">{d.description}</p>
                )}
              </button>
            ))}
          </div>

          {selected && <DatasetDetail key={selected.id} dataset={selected} isAdmin={isAdmin} />}
        </div>
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  )
}

function DatasetDetail({ dataset, isAdmin }: { dataset: Dataset; isAdmin: boolean }) {
  const [page, setPage] = useState(1)
  const { data: rowsData, isFetching } = useGetDatasetRowsQuery({ id: dataset.id, page })
  const [updateColumn] = useUpdateDatasetColumnMutation()
  const [deleteDataset, { isLoading: deleting }] = useDeleteDatasetMutation()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const totalPages = rowsData ? Math.max(1, Math.ceil(rowsData.total / rowsData.pageSize)) : 1

  async function onTypeChange(columnId: string, type: string) {
    try {
      await updateColumn({ datasetId: dataset.id, columnId, type }).unwrap()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível alterar o tipo.'))
    }
  }

  async function onDescriptionBlur(columnId: string, description: string) {
    try {
      await updateColumn({ datasetId: dataset.id, columnId, description }).unwrap()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível salvar a descrição.'))
    }
  }

  return (
    <div className="mt-6 space-y-5 rounded-xl border border-line p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold">{dataset.name}</h2>
          {dataset.fileName && (
            <p className="truncate text-[12px] text-ink-3">Origem: {dataset.fileName}</p>
          )}
        </div>
        {isAdmin && (
          <Button
            variant="danger"
            className="h-8 shrink-0 text-[12px]"
            disabled={deleting}
            onClick={() => setConfirmDelete(true)}
          >
            Excluir base
          </Button>
        )}
      </div>

      {dataset.qualityNotes.length > 0 && (
        <div className="rounded-lg border border-line bg-paper-2 px-3.5 py-2.5">
          <p className="text-[12px] font-medium text-ink-2">Ressalvas da importação</p>
          <ul className="mt-1 list-disc pl-4 text-[12px] text-ink-2">
            {dataset.qualityNotes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-[13px] font-semibold">Colunas</h3>
        <p className="mb-2 text-[12px] text-ink-3">
          A descrição ajuda os agentes a entender o que cada coluna significa.
        </p>
        <div className="divide-y divide-line rounded-lg border border-line">
          {dataset.columns.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3.5 py-2">
              <span className="w-32 shrink-0 truncate text-[13px] font-medium sm:w-40">{c.name}</span>
              {isAdmin ? (
                <div className="w-28 shrink-0">
                  <Select
                    className="h-7 text-[12px]"
                    value={c.type}
                    onChange={(e) => onTypeChange(c.id, e.target.value)}
                  >
                    {Object.entries(TYPE_LABEL).map(([t, label]) => (
                      <option key={t} value={t}>{label}</option>
                    ))}
                  </Select>
                </div>
              ) : (
                <Badge>{TYPE_LABEL[c.type]}</Badge>
              )}
              {isAdmin ? (
                <Input
                  className="h-7 basis-full text-[12px] sm:flex-1 sm:basis-auto"
                  placeholder="Descrição (ex.: centro de custo responsável)"
                  defaultValue={c.description}
                  onBlur={(e) => {
                    if (e.target.value !== c.description) {
                      void onDescriptionBlur(c.id, e.target.value)
                    }
                  }}
                />
              ) : (
                <span className="min-w-0 flex-1 truncate text-[12px] text-ink-3">{c.description}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold">
            Linhas {isFetching && <Spinner className="ml-1 inline-block size-3" />}
          </h3>
          <div className="flex items-center gap-2 text-[12px] text-ink-3">
            <Button
              variant="ghost"
              className="h-7 px-2 text-[12px]"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ←
            </Button>
            {page} / {totalPages}
            <Button
              variant="ghost"
              className="h-7 px-2 text-[12px]"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              →
            </Button>
          </div>
        </div>
        <div className="scroll-thin max-h-[60vh] overflow-auto rounded-lg border border-line">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left">
                {dataset.columns.map((c) => (
                  <th key={c.id} className="sticky top-0 z-10 whitespace-nowrap border-b border-line bg-paper-2 px-3 py-2 font-medium">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rowsData?.rows.map((r) => (
                <tr key={r.rowIndex}>
                  {dataset.columns.map((c) => {
                    const v = r.data[c.name]
                    return (
                      <td
                        key={c.id}
                        className={cx(
                          'whitespace-nowrap px-3 py-1.5',
                          (c.type === 'NUMBER' || c.type === 'CURRENCY') && 'text-right tabular-nums',
                          v === null && 'text-ink-3',
                        )}
                      >
                        {v === null || v === undefined
                          ? '·'
                          : c.type === 'CURRENCY' && typeof v === 'number'
                            ? v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                            : String(v)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Excluir base de dados"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
            <Button
              variant="danger"
              disabled={deleting}
              onClick={async () => {
                try {
                  await deleteDataset(dataset.id).unwrap()
                  toast.success('Base excluída.')
                } catch (err) {
                  toast.error(apiErrorMessage(err, 'Não foi possível excluir.'))
                }
              }}
            >
              {deleting ? <Spinner /> : 'Excluir'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-2">
          Excluir <strong>{dataset.name}</strong> ({dataset.rowCount.toLocaleString()} linhas)?
          Os agentes deixarão de enxergar esta base. Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </div>
  )
}

function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [fileName, setFileName] = useState('')
  const [upload, { isLoading }] = useUploadDatasetMutation()

  async function onSubmit() {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      toast.error('Selecione um arquivo .xlsx ou .csv')
      return
    }
    const form = new FormData()
    form.append('file', file)
    if (name.trim()) form.append('name', name.trim())
    if (description.trim()) form.append('description', description.trim())
    try {
      const ds = await upload(form).unwrap()
      toast.success(
        ds.quality === 'OK'
          ? `Base "${ds.name}" importada: ${ds.rowCount.toLocaleString()} linhas.`
          : `Base "${ds.name}" importada com ressalvas. Revise os tipos das colunas.`,
      )
      setName('')
      setDescription('')
      setFileName('')
      if (fileRef.current) fileRef.current.value = ''
      onClose()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Falha ao importar a planilha.'))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Importar planilha"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? <Spinner /> : 'Importar'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Arquivo (.xlsx, .xls ou .csv)">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
            className="block w-full text-[13px] file:mr-3 file:rounded-lg file:border file:border-line file:bg-paper file:px-3 file:py-1.5 file:text-[12px] file:font-medium hover:file:bg-paper-2"
          />
        </Field>
        <Field label="Nome da base" hint="Se vazio, usa o nome do arquivo.">
          <Input
            placeholder={fileName.replace(/\.[a-z0-9]+$/i, '') || 'Ex.: Orçamento 2026'}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Descrição" hint="Ajuda os agentes a saber quando usar esta base.">
          <Textarea
            rows={2}
            placeholder="Ex.: orçamento anual aprovado por setor e mês"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <p className="text-[12px] text-ink-3">
          A primeira linha vira o cabeçalho; os tipos das colunas são detectados
          automaticamente e podem ser ajustados depois.
        </p>
      </div>
    </Modal>
  )
}
