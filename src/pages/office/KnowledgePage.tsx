import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useAddKnowledgeTextMutation,
  useAddKnowledgeUrlMutation,
  useDeleteKnowledgeDocMutation,
  useGetAgentsQuery,
  useGetEmbeddingConfigQuery,
  useGetKnowledgeDocsQuery,
  useGetProviderKeysQuery,
  useReindexEmbeddingsMutation,
  useSetEmbeddingConfigMutation,
  useUploadKnowledgeDocMutation,
} from '@/api/api'
import { apiErrorMessage } from '@/lib/apiError'
import type { KnowledgeDocument } from '@/types'
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
  cx,
} from '@/components/ui'

const ACCEPT = '.pdf,.docx,.txt,.md'

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      <path d="M9 6h7M9 9.5h7" />
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

/* Ícones das linhas de documento (stroke, currentColor) */
function DocFileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-[18px] shrink-0 text-ink-3" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
    </svg>
  )
}
function LinkGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-[18px] shrink-0 text-ink-3" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}
function TextGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-[18px] shrink-0 text-ink-3" aria-hidden>
      <path d="M4 7V5h16v2M9 5v14M7 19h4" />
    </svg>
  )
}

export default function KnowledgePage() {
  const { data: docs, isLoading } = useGetKnowledgeDocsQuery(undefined, {
    pollingInterval: 4000, // status PROCESSING → READY sem refresh manual
    skipPollingIfUnfocused: true,
  })
  const { data: agents } = useGetAgentsQuery()
  const [upload, { isLoading: uploading }] = useUploadKnowledgeDocMutation()
  const [remove] = useDeleteKnowledgeDocMutation()
  const [addText, { isLoading: addingText }] = useAddKnowledgeTextMutation()
  const [addUrl, { isLoading: addingUrl }] = useAddKnowledgeUrlMutation()
  const [agentId, setAgentId] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [modal, setModal] = useState<'text' | 'url' | null>(null)
  const [textTitle, setTextTitle] = useState('')
  const [textContent, setTextContent] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function onPick(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    try {
      await upload({ file, agentId: agentId || undefined }).unwrap()
      toast.success(`"${file.name}" enviado. Indexando…`)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível enviar o documento.'))
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-up sm:px-6 sm:py-10">
        <header className="flex items-start gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-line bg-paper-2 text-ink">
            <BookIcon />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold leading-tight">Conhecimento</h1>
            <p className="mt-1 text-sm leading-relaxed text-ink-2">
              Documentos e textos que os agentes <strong className="font-semibold text-ink">leem</strong> para
              responder com contexto: políticas, manuais, artigos e páginas da web.
              Eles recuperam os trechos relevantes na hora de responder, não fazem cálculos.
            </p>
          </div>
        </header>

        <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2.5 rounded-xl border border-dashed border-line bg-paper-2 px-3.5 py-2.5 text-[13px] text-ink-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-[18px] shrink-0 text-ink-3" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 3v18" />
          </svg>
          <span className="min-w-0 flex-1">
            Tem uma <strong className="font-medium text-ink">planilha com números</strong> para os agentes
            filtrarem e somarem? Isso vai em Dados.
          </span>
          <CrossLink className="ml-auto shrink-0" to="/office/data">Ir para Dados</CrossLink>
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-line p-4">
          <div className="min-w-52 flex-1">
            <label className="mb-1.5 block text-[13px] font-medium text-ink-2">
              Visível para
            </label>
            <Select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
              <option value="">Todos os agentes</option>
              {agents?.map((a) => (
                <option key={a.id} value={a.id}>
                  Somente {a.name}
                </option>
              ))}
            </Select>
          </div>
          <input
            ref={fileRef}
            type="file"
            hidden
            accept={ACCEPT}
            onChange={(e) => void onPick(e.target.files)}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Spinner /> : null} Enviar arquivo
            </Button>
            <Button variant="secondary" onClick={() => setModal('text')}>
              Adicionar texto
            </Button>
            <Button variant="secondary" onClick={() => setModal('url')}>
              Adicionar link
            </Button>
          </div>
          <p className="w-full text-[12px] text-ink-3">
            Formatos aceitos: PDF, DOCX, TXT e MD. Planilhas (XLSX, CSV) vão em Dados.
          </p>
        </div>

        <Modal
          open={modal === 'text'}
          onClose={() => setModal(null)}
          title="Adicionar texto à base"
        >
          <form
            className="space-y-4"
            onSubmit={async (e: FormEvent) => {
              e.preventDefault()
              try {
                await addText({
                  title: textTitle.trim(),
                  content: textContent.trim(),
                  agentId: agentId || undefined,
                }).unwrap()
                toast.success('Texto adicionado. Indexando…')
                setModal(null)
                setTextTitle('')
                setTextContent('')
              } catch (err) {
                toast.error(apiErrorMessage(err, 'Não foi possível adicionar o texto.'))
              }
            }}
          >
            <Field label="Título">
              <Input
                required
                autoFocus
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                placeholder="Ex.: Política de reembolso"
              />
            </Field>
            <Field label="Conteúdo">
              <textarea
                required
                minLength={10}
                rows={8}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Cole aqui o conteúdo que os agentes devem conhecer…"
                className="block w-full resize-y rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-ink"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={addingText || !textTitle.trim() || textContent.trim().length < 10}>
                {addingText ? <Spinner /> : null} Adicionar
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          open={modal === 'url'}
          onClose={() => setModal(null)}
          title="Adicionar link à base"
        >
          <form
            className="space-y-4"
            onSubmit={async (e: FormEvent) => {
              e.preventDefault()
              try {
                await addUrl({ url: linkUrl.trim(), agentId: agentId || undefined }).unwrap()
                toast.success('Link adicionado. Lendo a página…')
                setModal(null)
                setLinkUrl('')
              } catch (err) {
                toast.error(apiErrorMessage(err, 'Não foi possível adicionar o link.'))
              }
            }}
          >
            <p className="text-[13px] leading-relaxed text-ink-2">
              O conteúdo da página será baixado e indexado. Funciona melhor com
              páginas de texto (documentação, artigos, políticas).
            </p>
            <Field label="URL">
              <Input
                required
                autoFocus
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://exemplo.com/politicas"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={addingUrl || !linkUrl.trim()}>
                {addingUrl ? <Spinner /> : null} Adicionar
              </Button>
            </div>
          </form>
        </Modal>

        <EmbeddingsSection />

        <div className="mt-8 space-y-2">
          {isLoading && <Skeleton className="h-24 w-full rounded-xl" />}
          {!isLoading && docs?.length === 0 && (
            <EmptyState
              title="Nenhum documento ainda"
              description="Envie o primeiro documento para dar memória institucional aos seus agentes."
            />
          )}
          {docs?.map((doc) => (
            <DocRow
              key={doc.id}
              doc={doc}
              confirming={confirmId === doc.id}
              onAskDelete={() => setConfirmId(doc.id)}
              onCancelDelete={() => setConfirmId(null)}
              onDelete={async () => {
                try {
                  await remove(doc.id).unwrap()
                  toast.success('Documento removido.')
                } catch (err) {
                  toast.error(apiErrorMessage(err, 'Não foi possível remover.'))
                } finally {
                  setConfirmId(null)
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const EMBEDDING_PROVIDERS = ['openai', 'google', 'custom']
const MODEL_PLACEHOLDER: Record<string, string> = {
  openai: 'text-embedding-3-small',
  google: 'text-embedding-004',
  custom: 'nome do modelo de embeddings',
}

function EmbeddingsSection() {
  const { data: stats } = useGetEmbeddingConfigQuery(undefined, {
    pollingInterval: 4000, // acompanha cobertura durante indexação/reindex
    skipPollingIfUnfocused: true,
  })
  const { data: keys } = useGetProviderKeysQuery()
  const [save, { isLoading: saving }] = useSetEmbeddingConfigMutation()
  const [reindex, { isLoading: reindexing }] = useReindexEmbeddingsMutation()
  const [keyId, setKeyId] = useState<string | null>(null)
  const [model, setModel] = useState<string | null>(null)

  const compatible = keys?.filter((k) => EMBEDDING_PROVIDERS.includes(k.provider)) ?? []
  const selectedKeyId = keyId ?? stats?.keyId ?? ''
  const selectedKey = compatible.find((k) => k.id === selectedKeyId)
  const selectedModel = model ?? stats?.model ?? ''
  const dirty =
    stats !== undefined &&
    (selectedKeyId !== (stats.keyId ?? '') || selectedModel !== (stats.model ?? ''))
  const pending = stats ? stats.total - stats.upToDate : 0

  async function onSave() {
    try {
      await save({
        keyId: selectedKeyId || null,
        model: selectedKeyId ? selectedModel.trim() : null,
      }).unwrap()
      setKeyId(null)
      setModel(null)
      toast.success(
        selectedKeyId
          ? 'Busca inteligente ativada. Reindexe para cobrir os documentos existentes.'
          : 'Busca inteligente desativada. A busca continua no modo por palavras.',
      )
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível salvar a configuração.'))
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-line p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Busca inteligente (embeddings)</h2>
          <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">
            Com uma chave OpenAI, Google ou compatível, os agentes encontram
            conteúdo por significado, mesmo sem as palavras exatas.
          </p>
        </div>
        {stats?.configured && !stats.reindexing && (
          <Badge>
            {stats.upToDate}/{stats.total} trechos
          </Badge>
        )}
        {stats?.reindexing && <Badge className="animate-pulse-soft">Reindexando…</Badge>}
      </div>

      {stats?.broken && (
        <p className="mt-3 rounded-lg bg-paper-3 px-3 py-2 text-[13px] text-danger">
          A chave configurada não existe mais. Selecione outra chave. Enquanto
          isso a busca segue funcionando no modo por palavras.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1">
          <label className="mb-1.5 block text-[13px] font-medium text-ink-2">Chave</label>
          <Select
            value={selectedKeyId}
            onChange={(e) => {
              setKeyId(e.target.value)
              if (model === null) setModel(stats?.model ?? '')
            }}
          >
            <option value="">Desativada (busca por palavras)</option>
            {compatible.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label} ({k.provider})
              </option>
            ))}
          </Select>
        </div>
        {selectedKeyId && (
          <div className="min-w-52 flex-1">
            <label className="mb-1.5 block text-[13px] font-medium text-ink-2">
              Modelo de embeddings
            </label>
            <Input
              value={selectedModel}
              onChange={(e) => setModel(e.target.value)}
              placeholder={MODEL_PLACEHOLDER[selectedKey?.provider ?? 'custom']}
            />
          </div>
        )}
        <div className="flex gap-2">
          {dirty && (
            <Button onClick={() => void onSave()} disabled={saving || (Boolean(selectedKeyId) && !selectedModel.trim())}>
              {saving ? <Spinner /> : null} Salvar
            </Button>
          )}
          {!dirty && stats?.configured && pending > 0 && !stats.reindexing && (
            <Button
              variant="secondary"
              disabled={reindexing}
              onClick={async () => {
                try {
                  await reindex().unwrap()
                  toast.success('Reindexação iniciada.')
                } catch (err) {
                  toast.error(apiErrorMessage(err, 'Não foi possível reindexar.'))
                }
              }}
            >
              {reindexing ? <Spinner /> : null} Reindexar {pending} trechos
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function DocRow({
  doc,
  confirming,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  doc: KnowledgeDocument
  confirming: boolean
  onAskDelete: () => void
  onCancelDelete: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 transition-colors duration-150 hover:border-line-2">
      {doc.mimeType === 'text/html' ? (
        <LinkGlyph />
      ) : doc.mimeType === 'text/plain' && !doc.title.includes('.') ? (
        <TextGlyph />
      ) : (
        <DocFileIcon />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{doc.title}</p>
        <p className="mt-0.5 text-[12px] text-ink-3">
          {doc.agent ? `Somente ${doc.agent.name}` : 'Todos os agentes'}
          {doc.status === 'READY' && ` · ${doc.chunkCount} trechos indexados`}
          {doc.status === 'ERROR' && doc.error && ` · ${doc.error}`}
        </p>
      </div>
      {doc.status === 'PROCESSING' && (
        <Badge className="animate-pulse-soft">Indexando…</Badge>
      )}
      {doc.status === 'READY' && <Badge>Pronto</Badge>}
      {doc.status === 'ERROR' && <Badge className="text-danger">Erro</Badge>}
      {confirming ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <Button variant="danger" className="h-7 px-2.5 text-[12px]" onClick={onDelete}>
            Confirmar
          </Button>
          <Button variant="secondary" className="h-7 px-2.5 text-[12px]" onClick={onCancelDelete}>
            Cancelar
          </Button>
        </div>
      ) : (
        <button
          onClick={onAskDelete}
          aria-label={`Remover ${doc.title}`}
          className="rounded-lg p-2 text-ink-3 transition-colors duration-150 hover:bg-paper-3 hover:text-danger"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
        </button>
      )}
    </div>
  )
}
