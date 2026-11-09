import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import {
  useCreateToolMutation,
  useDeleteToolMutation,
  useGetToolsQuery,
  useTestToolMutation,
  useUpdateToolMutation,
} from '@/api/api'
import { apiErrorMessage } from '@/lib/apiError'
import type { CustomTool, HttpMethod, ToolParamsSchema, ToolTestResult } from '@/types'
import {
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

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const METHOD_STYLES: Record<HttpMethod, string> = {
  GET: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  POST: 'bg-blue-50 text-blue-700 border-blue-200',
  PUT: 'bg-amber-50 text-amber-700 border-amber-200',
  PATCH: 'bg-violet-50 text-violet-700 border-violet-200',
  DELETE: 'bg-red-50 text-red-700 border-red-200',
}

const SLUG_RE = /^[a-z][a-z0-9_]*$/

function isValidUrl(value: string) {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/* ---------- Formulário (builder low-code) ---------- */

type ParamRow = {
  key: string
  name: string
  type: 'string' | 'number' | 'boolean'
  description: string
  required: boolean
}

type HeaderRow = { key: string; name: string; value: string; existing: boolean }

let rowSeq = 0
const nextKey = () => `row-${++rowSeq}`

function emptyParam(): ParamRow {
  return { key: nextKey(), name: '', type: 'string', description: '', required: false }
}

function schemaToRows(schema: ToolParamsSchema | undefined): ParamRow[] {
  if (!schema?.properties) return []
  const required = new Set(schema.required ?? [])
  return Object.entries(schema.properties).map(([name, prop]) => ({
    key: nextKey(),
    name,
    type: (['string', 'number', 'boolean'].includes(prop.type) ? prop.type : 'string') as ParamRow['type'],
    description: prop.description ?? '',
    required: required.has(name),
  }))
}

function rowsToSchema(rows: ParamRow[]): ToolParamsSchema {
  const properties: ToolParamsSchema['properties'] = {}
  const required: string[] = []
  for (const row of rows) {
    const name = row.name.trim()
    if (!name) continue
    properties[name] = {
      type: row.type,
      ...(row.description.trim() ? { description: row.description.trim() } : {}),
    }
    if (row.required) required.push(name)
  }
  return { type: 'object', properties, ...(required.length ? { required } : {}) }
}

/* ---------- Página ---------- */

export default function ToolsPage() {
  const { data: tools, isLoading } = useGetToolsQuery()
  const [updateTool] = useUpdateToolMutation()
  const [deleteTool] = useDeleteToolMutation()

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<CustomTool | null>(null)
  const [testing, setTesting] = useState<CustomTool | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<CustomTool | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openCreate() {
    setEditing(null)
    setEditorOpen(true)
  }

  function openEdit(tool: CustomTool) {
    setEditing(tool)
    setEditorOpen(true)
  }

  async function onToggleActive(tool: CustomTool) {
    try {
      await updateTool({ id: tool.id, isActive: !tool.isActive }).unwrap()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível atualizar a ferramenta.'))
    }
  }

  async function onDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await deleteTool(confirmDelete.id).unwrap()
      toast.success('Ferramenta excluída.')
      setConfirmDelete(null)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível excluir a ferramenta.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-up sm:px-6 sm:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <header className="flex items-start gap-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-line bg-paper-2 text-ink">
              <WrenchIcon size={20} />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold leading-tight">Ferramentas</h1>
              <p className="mt-1 max-w-lg text-sm leading-relaxed text-ink-2">
                Ações HTTP que seus agentes podem executar nos sistemas da empresa:
                você descreve o endpoint e os parâmetros, e a IA decide quando chamar.
              </p>
            </div>
          </header>
          <Button className="w-full shrink-0 sm:w-auto" onClick={openCreate}>+ Nova ferramenta</Button>
        </div>

        <div className="mt-7">
          {isLoading && <Skeleton className="h-40 w-full rounded-xl" />}

          {tools?.length === 0 && (
            <div className="rounded-xl border border-dashed border-line-2">
              <EmptyState
                icon={<WrenchIcon size={28} />}
                title="Nenhuma ferramenta cadastrada"
                description="Crie a primeira ação HTTP para os agentes: por exemplo, cadastrar um cliente no seu ERP ou consultar um pedido. Você testa antes de ativar."
                action={<Button onClick={openCreate}>Criar primeira ferramenta</Button>}
              />
            </div>
          )}

          {tools && tools.length > 0 && (
            <div className="divide-y divide-line rounded-xl border border-line">
              {tools.map((tool) => (
                <ToolRow
                  key={tool.id}
                  tool={tool}
                  onEdit={() => openEdit(tool)}
                  onTest={() => setTesting(tool)}
                  onDelete={() => setConfirmDelete(tool)}
                  onToggle={() => onToggleActive(tool)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {editorOpen && (
        <ToolEditorModal tool={editing} onClose={() => setEditorOpen(false)} />
      )}
      {testing && <ToolTestModal tool={testing} onClose={() => setTesting(null)} />}

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Excluir ferramenta"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="danger" className="border border-red-200" onClick={onDelete} disabled={deleting}>
              {deleting ? <Spinner /> : 'Excluir'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-2">
          Excluir <span className="font-medium text-ink">{confirmDelete?.displayName}</span>?
          Os agentes deixarão de conseguir chamá-la. Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </div>
  )
}

function ToolRow({
  tool,
  onEdit,
  onTest,
  onDelete,
  onToggle,
}: {
  tool: CustomTool
  onEdit: () => void
  onTest: () => void
  onDelete: () => void
  onToggle: () => void
}) {
  const paramCount = Object.keys(tool.paramsSchema?.properties ?? {}).length
  return (
    <div
      className={cx(
        'group flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 transition-colors duration-150 hover:bg-paper-2',
        !tool.isActive && 'opacity-60',
      )}
    >
      <MethodBadge method={tool.method} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{tool.displayName}</span>
          <span className="shrink-0 rounded bg-paper-3 px-1.5 py-0.5 font-mono text-[11px] text-ink-3">{tool.name}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-3">
          <span className="min-w-0 max-w-[320px] truncate font-mono">{tool.url}</span>
          <span aria-hidden>·</span>
          <span className="shrink-0">
            {paramCount === 0 ? 'sem parâmetros' : paramCount === 1 ? '1 parâmetro' : `${paramCount} parâmetros`}
          </span>
        </span>
      </span>
      <Toggle checked={tool.isActive} onChange={onToggle} label={tool.isActive ? 'Desativar' : 'Ativar'} />
      <span className="flex basis-full items-center justify-end gap-0.5 sm:basis-auto">
        <Button variant="ghost" className="h-8 px-2.5 text-[13px]" onClick={onEdit}>Editar</Button>
        <Button variant="ghost" className="h-8 px-2.5 text-[13px]" onClick={onTest}>Testar</Button>
        <button
          onClick={onDelete}
          aria-label={`Excluir ${tool.displayName}`}
          title="Excluir"
          className="rounded-lg p-2 text-ink-3 transition-colors duration-150 hover:bg-red-50 hover:text-danger"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
        </button>
      </span>
    </div>
  )
}

function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span
      className={cx(
        'inline-flex w-14 shrink-0 items-center justify-center rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-semibold',
        METHOD_STYLES[method],
      )}
    >
      {method}
    </span>
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={onChange}
      className={cx(
        'relative h-5.5 w-10 shrink-0 rounded-full transition-colors duration-150',
        checked ? 'bg-ink' : 'bg-line-2',
      )}
    >
      <span
        className={cx(
          'absolute top-0.5 size-4.5 rounded-full bg-paper transition-all duration-150',
          checked ? 'left-5' : 'left-0.5',
        )}
      />
    </button>
  )
}

/* ---------- Editor (criar / editar) ---------- */

function ToolEditorModal({ tool, onClose }: { tool: CustomTool | null; onClose: () => void }) {
  const [createTool, { isLoading: creating }] = useCreateToolMutation()
  const [updateTool, { isLoading: updating }] = useUpdateToolMutation()
  const saving = creating || updating

  const [name, setName] = useState(tool?.name ?? '')
  const [displayName, setDisplayName] = useState(tool?.displayName ?? '')
  const [description, setDescription] = useState(tool?.description ?? '')
  const [method, setMethod] = useState<HttpMethod>(tool?.method ?? 'POST')
  const [url, setUrl] = useState(tool?.url ?? '')
  const [timeoutMs, setTimeoutMs] = useState(tool?.timeoutMs ?? 10000)
  const [headers, setHeaders] = useState<HeaderRow[]>(() =>
    (tool?.headerKeys ?? []).map((k) => ({ key: nextKey(), name: k, value: '', existing: true })),
  )
  const [params, setParams] = useState<ParamRow[]>(() =>
    tool ? schemaToRows(tool.paramsSchema) : [emptyParam()],
  )
  const [touched, setTouched] = useState(false)

  const slugError =
    name && !SLUG_RE.test(name)
      ? 'Use apenas letras minúsculas, números e _ (começando com letra).'
      : null
  const urlError = url && !isValidUrl(url) ? 'Informe uma URL válida (http:// ou https://).' : null

  const paramNames = params.map((p) => p.name.trim()).filter(Boolean)
  const duplicateParam = paramNames.length !== new Set(paramNames).size
  const invalidParamName = params.some((p) => p.name.trim() && !SLUG_RE.test(p.name.trim()))

  const canSubmit =
    !!name.trim() && !!displayName.trim() && !!description.trim() && !!url.trim() &&
    !slugError && !urlError && !duplicateParam && !invalidParamName

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!canSubmit) return

    // Envia todas as linhas nomeadas: valor vazio numa linha existente significa
    // "manter o valor salvo" (o backend faz o merge); linha removida apaga o header.
    const namedHeaders = headers.filter((h) => h.name.trim())
    const headersPayload = tool
      ? Object.fromEntries(namedHeaders.map((h) => [h.name.trim(), h.value]))
      : namedHeaders.length > 0
        ? Object.fromEntries(namedHeaders.filter((h) => h.value).map((h) => [h.name.trim(), h.value]))
        : undefined

    const payload = {
      name: name.trim(),
      displayName: displayName.trim(),
      description: description.trim(),
      method,
      url: url.trim(),
      ...(headersPayload !== undefined ? { headers: headersPayload } : {}),
      paramsSchema: rowsToSchema(params),
      timeoutMs,
    }

    try {
      if (tool) {
        await updateTool({ id: tool.id, ...payload }).unwrap()
        toast.success('Ferramenta atualizada.')
      } else {
        await createTool(payload).unwrap()
        toast.success('Ferramenta criada.')
      }
      onClose()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível salvar a ferramenta.'))
    }
  }

  function updateParam(key: string, patch: Partial<ParamRow>) {
    setParams((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function updateHeader(key: string, patch: Partial<HeaderRow>) {
    setHeaders((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={tool ? 'Editar ferramenta' : 'Nova ferramenta'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="tool-form" disabled={saving || (touched && !canSubmit)}>
            {saving ? (
              <><Spinner className="border-t-paper border-paper/40" /> Salvando…</>
            ) : tool ? 'Salvar alterações' : 'Criar ferramenta'}
          </Button>
        </>
      }
    >
      <form id="tool-form" onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome técnico" hint="É assim que a IA chama a ferramenta. Ex.: cadastrar_cliente">
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              placeholder="cadastrar_cliente"
              className={cx('font-mono', slugError && 'border-danger')}
            />
            {slugError && <span className="mt-1 block text-xs text-danger">{slugError}</span>}
          </Field>
          <Field label="Nome de exibição">
            <Input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Cadastrar cliente"
            />
          </Field>
        </div>

        <Field label="Descrição" hint="Explique para a IA quando usar esta ferramenta.">
          <Textarea
            required
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Use quando o usuário pedir para cadastrar um novo cliente no sistema X."
          />
        </Field>

        <div className="grid grid-cols-[110px_1fr] gap-4">
          <Field label="Método">
            <Select value={method} onChange={(e) => setMethod(e.target.value as HttpMethod)}>
              {METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          </Field>
          <Field label="URL do endpoint">
            <Input
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.suaempresa.com/clientes"
              className={cx('font-mono', urlError && 'border-danger')}
            />
            {urlError && <span className="mt-1 block text-xs text-danger">{urlError}</span>}
          </Field>
        </div>

        {/* Headers */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[13px] font-medium text-ink">Cabeçalhos (headers)</span>
            <button
              type="button"
              onClick={() => setHeaders((h) => [...h, { key: nextKey(), name: '', value: '', existing: false }])}
              className="text-[12px] font-medium text-ink-2 transition-colors duration-150 hover:text-ink"
            >
              + Adicionar header
            </button>
          </div>
          {headers.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-3 py-2.5 text-[12px] text-ink-3">
              Nenhum header. Adicione, por exemplo, um token de autenticação.
            </p>
          ) : (
            <div className="space-y-2">
              {headers.map((h) => (
                <div key={h.key} className="flex items-center gap-2">
                  <Input
                    value={h.name}
                    onChange={(e) => updateHeader(h.key, { name: e.target.value })}
                    placeholder="Authorization"
                    className="h-8 font-mono text-[13px]"
                  />
                  <Input
                    type="password"
                    value={h.value}
                    onChange={(e) => updateHeader(h.key, { value: e.target.value })}
                    placeholder={h.existing ? '••••••••  (deixe vazio para manter)' : 'Valor'}
                    className="h-8 text-[13px]"
                    autoComplete="new-password"
                  />
                  <RemoveButton onClick={() => setHeaders((rows) => rows.filter((r) => r.key !== h.key))} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Parâmetros */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[13px] font-medium text-ink">Parâmetros</span>
            <button
              type="button"
              onClick={() => setParams((p) => [...p, emptyParam()])}
              className="text-[12px] font-medium text-ink-2 transition-colors duration-150 hover:text-ink"
            >
              + Adicionar parâmetro
            </button>
          </div>
          <p className="mb-2 text-[12px] text-ink-3">
            Informações que a IA envia ao chamar a ferramenta. A descrição ajuda a IA a preencher corretamente.
          </p>
          {params.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-3 py-2.5 text-[12px] text-ink-3">
              Sem parâmetros: a ferramenta será chamada sem argumentos.
            </p>
          ) : (
            <div className="space-y-2">
              {params.map((p) => (
                <div key={p.key} className="rounded-lg border border-line px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={p.name}
                      onChange={(e) =>
                        updateParam(p.key, { name: e.target.value.toLowerCase().replace(/\s+/g, '_') })
                      }
                      placeholder="nome_do_parametro"
                      className={cx(
                        'h-8 basis-full font-mono text-[13px] sm:flex-1 sm:basis-auto',
                        p.name.trim() && !SLUG_RE.test(p.name.trim()) && 'border-danger',
                      )}
                    />
                    <Select
                      value={p.type}
                      onChange={(e) => updateParam(p.key, { type: e.target.value as ParamRow['type'] })}
                      className="h-8 w-32 text-[13px]"
                    >
                      <option value="string">Texto</option>
                      <option value="number">Número</option>
                      <option value="boolean">Sim/Não</option>
                    </Select>
                    <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[12px] text-ink-2">
                      <input
                        type="checkbox"
                        checked={p.required}
                        onChange={(e) => updateParam(p.key, { required: e.target.checked })}
                        className="size-3.5 accent-ink"
                      />
                      Obrigatório
                    </label>
                    <RemoveButton onClick={() => setParams((rows) => rows.filter((r) => r.key !== p.key))} />
                  </div>
                  <Input
                    value={p.description}
                    onChange={(e) => updateParam(p.key, { description: e.target.value })}
                    placeholder="Descrição para a IA. Ex.: Nome completo do cliente"
                    className="mt-2 h-8 text-[13px]"
                  />
                </div>
              ))}
            </div>
          )}
          {duplicateParam && (
            <p className="mt-1.5 text-xs text-danger">Há parâmetros com nomes repetidos.</p>
          )}
          {invalidParamName && (
            <p className="mt-1.5 text-xs text-danger">
              Nomes de parâmetro devem usar apenas letras minúsculas, números e _.
            </p>
          )}
        </div>

        <Field label="Timeout (ms)" hint="Tempo máximo de espera pela resposta do seu sistema.">
          <Input
            type="number"
            min={1000}
            max={120000}
            step={1000}
            value={timeoutMs}
            onChange={(e) => setTimeoutMs(Number(e.target.value) || 10000)}
            className="w-36"
          />
        </Field>
      </form>
    </Modal>
  )
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remover"
      className="shrink-0 rounded-md p-1.5 text-ink-3 transition-colors duration-150 hover:bg-red-50 hover:text-danger"
    >
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  )
}

/* ---------- Testar ferramenta ---------- */

export function ToolTestModal({ tool, onClose }: { tool: CustomTool; onClose: () => void }) {
  const [testTool, { isLoading }] = useTestToolMutation()
  const [values, setValues] = useState<Record<string, string | boolean>>({})
  const [result, setResult] = useState<ToolTestResult | null>(null)

  const properties = useMemo(
    () => Object.entries(tool.paramsSchema?.properties ?? {}),
    [tool],
  )
  const required = new Set(tool.paramsSchema?.required ?? [])

  useEffect(() => {
    setValues({})
    setResult(null)
  }, [tool])

  async function onRun(e: FormEvent) {
    e.preventDefault()
    const args: Record<string, unknown> = {}
    for (const [name, prop] of properties) {
      const raw = values[name]
      if (prop.type === 'boolean') {
        args[name] = raw === true
      } else if (raw !== undefined && raw !== '') {
        args[name] = prop.type === 'number' ? Number(raw) : raw
      }
    }
    setResult(null)
    try {
      const res = await testTool({ id: tool.id, args }).unwrap()
      setResult(res)
    } catch (err) {
      setResult({ ok: false, error: apiErrorMessage(err, 'Falha ao executar o teste.') })
    }
  }

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={`Testar: ${tool.displayName}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
          <Button type="submit" form="tool-test-form" disabled={isLoading}>
            {isLoading ? (
              <><Spinner className="border-t-paper border-paper/40" /> Executando…</>
            ) : 'Executar teste'}
          </Button>
        </>
      }
    >
      <form id="tool-test-form" onSubmit={onRun} className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-line bg-paper-2 px-3 py-2">
          <MethodBadge method={tool.method} />
          <span className="truncate font-mono text-[12px] text-ink-2">{tool.url}</span>
        </div>

        {properties.length === 0 ? (
          <p className="text-[13px] text-ink-3">Esta ferramenta não tem parâmetros.</p>
        ) : (
          properties.map(([name, prop]) =>
            prop.type === 'boolean' ? (
              <label key={name} className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={values[name] === true}
                  onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.checked }))}
                  className="size-4 accent-ink"
                />
                <span className="font-mono text-[13px]">{name}</span>
                {prop.description && <span className="text-[12px] text-ink-3">{prop.description}</span>}
              </label>
            ) : (
              <Field
                key={name}
                label={required.has(name) ? `${name} *` : name}
                hint={prop.description}
              >
                <Input
                  required={required.has(name)}
                  type={prop.type === 'number' ? 'number' : 'text'}
                  step={prop.type === 'number' ? 'any' : undefined}
                  value={typeof values[name] === 'string' ? (values[name] as string) : ''}
                  onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
                />
              </Field>
            ),
          )
        )}

        {result && (
          <div className="animate-fade-up">
            {result.ok ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2.5">
                <p className="text-[13px] font-medium text-emerald-700">
                  Sucesso{result.status ? ` · HTTP ${result.status}` : ''}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50/60 px-3 py-2.5">
                <p className="text-[13px] font-medium text-danger">
                  Falhou{result.status ? ` · HTTP ${result.status}` : ''}
                </p>
                {result.error && <p className="mt-1 text-[12px] text-danger/90">{result.error}</p>}
              </div>
            )}
            {result.body !== undefined && result.body !== null && (
              <pre className="mt-2 max-h-56 overflow-auto rounded-lg border border-line bg-paper-2 px-3 py-2.5 font-mono text-[12px] leading-relaxed text-ink-2">
                {typeof result.body === 'string'
                  ? result.body
                  : JSON.stringify(result.body, null, 2)}
              </pre>
            )}
          </div>
        )}
      </form>
    </Modal>
  )
}

/* ---------- Ícone ---------- */

export function WrenchIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}
