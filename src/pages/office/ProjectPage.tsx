import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useAnalyzeProjectMutation,
  useCreateConversationMutation,
  useCreateTaskListMutation,
  useCreateTaskMutation,
  useDeleteProjectMutation,
  useGetConversationsQuery,
  useGetProjectQuery,
  useGetTaskListsQuery,
  useGetTasksQuery,
  useUpdateProjectStatusMutation,
  useUploadProjectDocumentMutation,
} from '@/api/api'
import { apiErrorMessage } from '@/lib/apiError'
import type { ProjectStatus, Task } from '@/types'
import {
  Badge,
  Button,
  DropdownMenu,
  EmptyState,
  Input,
  Skeleton,
  Spinner,
  cx,
} from '@/components/ui'
import { MarkdownDocument } from '@/components/MarkdownDocument'
import { KanbanBoard } from '@/components/projects/KanbanBoard'
import { TaskCard } from '@/components/projects/TaskCard'
import { TaskModal } from '@/components/projects/TaskModal'
import {
  PROJECT_STATUS_CLASS,
  PROJECT_STATUS_LABEL,
} from '@/components/projects/taskMeta'

type Tab = 'overview' | 'kanban' | 'lists' | 'chats'

const tabIcon = 'h-4 w-4 shrink-0'
function OverviewIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className ?? tabIcon}>
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <rect x="3" y="12" width="11" height="8" rx="1" />
      <path d="M18 12h3M18 16h3M18 20h3" />
    </svg>
  )
}
function KanbanIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className ?? tabIcon}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M9 9h-.01M15 13h-.01" />
    </svg>
  )
}
function ListIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className ?? tabIcon}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  )
}
function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className ?? tabIcon}>
      <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z" />
    </svg>
  )
}

const NEXT_STATUS: Record<ProjectStatus, { status: ProjectStatus; label: string }[]> = {
  AGUARDANDO_INICIO: [{ status: 'EM_ANDAMENTO', label: 'Iniciar projeto' }],
  EM_ANDAMENTO: [{ status: 'FINALIZADO', label: 'Finalizar projeto' }],
  FINALIZADO: [{ status: 'EM_ANDAMENTO', label: 'Reabrir projeto' }],
}

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const tab = (params.get('tab') as Tab) || 'overview'

  const { data: project, isLoading } = useGetProjectQuery(projectId!, {
    pollingInterval: undefined,
  })
  // enquanto a análise roda, poll para o requirements aparecer sozinho
  useGetProjectQuery(projectId!, {
    pollingInterval: 3000,
    skipPollingIfUnfocused: true,
    skip: project?.analysisStatus !== 'RUNNING',
  })
  const [updateStatus] = useUpdateProjectStatusMutation()
  const [deleteProject] = useDeleteProjectMutation()
  const [statusMenu, setStatusMenu] = useState(false)

  if (isLoading || !project) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="mx-auto max-w-5xl px-4 py-8 animate-fade-up sm:px-6 sm:py-10">
        <Link to="/office/projects" className="text-[13px] text-ink-3 hover:text-ink">
          ← Projetos
        </Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">{project.name}</h1>
            <p className="mt-1 text-[13px] text-ink-3">
              {project.allDepartments
                ? 'Todos os setores'
                : project.departments.map((d) => d.department.name).join(', ')}
            </p>
          </div>
          <div className="relative shrink-0">
            <button
              onClick={() => setStatusMenu((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 hover:border-line-2"
            >
              <span className={cx('size-2 rounded-full', project.status === 'EM_ANDAMENTO' ? 'bg-ok' : 'bg-line-2')} />
              <span className={PROJECT_STATUS_CLASS[project.status]}>
                {PROJECT_STATUS_LABEL[project.status]}
              </span>
              <span className="text-ink-3">▾</span>
            </button>
            <DropdownMenu
              open={statusMenu}
              onClose={() => setStatusMenu(false)}
              items={[
                ...NEXT_STATUS[project.status].map((opt) => ({
                  label: opt.label,
                  onSelect: () => {
                    void updateStatus({ id: project.id, status: opt.status })
                      .unwrap()
                      .catch((err) => toast.error(apiErrorMessage(err)))
                  },
                })),
                {
                  label: 'Excluir projeto',
                  danger: true,
                  onSelect: () => {
                    void deleteProject(project.id)
                      .unwrap()
                      .then(() => navigate('/office/projects'))
                      .catch((err) => toast.error(apiErrorMessage(err)))
                  },
                },
              ]}
            />
          </div>
        </div>

        <div className="mt-6 -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          <div className="flex min-w-max gap-0.5 border-b border-line">
            {(
              [
                ['overview', 'Visão geral', OverviewIcon],
                ['kanban', 'Kanban', KanbanIcon],
                ['lists', 'Listas', ListIcon],
                ['chats', 'Conversas', ChatIcon],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setParams({ tab: key })}
                className={cx(
                  'relative flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition-colors duration-150',
                  tab === key ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
                )}
              >
                <Icon className={cx('h-4 w-4 shrink-0 transition-colors', tab === key ? 'text-ink' : 'text-ink-3')} />
                {label}
                {tab === key && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ink" />}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6">
          {tab === 'overview' && <OverviewTab projectId={project.id} />}
          {tab === 'kanban' && <KanbanTab projectId={project.id} />}
          {tab === 'lists' && <ListsTab projectId={project.id} />}
          {tab === 'chats' && <ChatsTab projectId={project.id} />}
        </div>
      </div>
    </div>
  )
}

/* ---------- Visão geral ---------- */

function OverviewTab({ projectId }: { projectId: string }) {
  // sem polling próprio: a ProjectPage já faz polling deste mesmo projeto
  // enquanto a análise roda (cache compartilhado); fora disso não muda sozinho
  const { data: project } = useGetProjectQuery(projectId)
  const [analyze, { isLoading: starting }] = useAnalyzeProjectMutation()
  const [uploadDoc, { isLoading: uploading }] = useUploadProjectDocumentMutation()
  const fileRef = useRef<HTMLInputElement>(null)

  if (!project) return null
  const analyzing = project.analysisStatus === 'RUNNING'

  return (
    <div className="space-y-8">
      {project.description && (
        <section>
          <h2 className="text-sm font-semibold">Descrição</h2>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">
            {project.description}
          </p>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Documentos do projeto</h2>
          <input
            ref={fileRef}
            type="file"
            hidden
            accept=".pdf,.docx,.txt,.md,.csv"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                await uploadDoc({ projectId, file }).unwrap()
                toast.success(`"${file.name}" enviado. Indexando…`)
              } catch (err) {
                toast.error(apiErrorMessage(err, 'Não foi possível enviar.'))
              } finally {
                if (fileRef.current) fileRef.current.value = ''
              }
            }}
          />
          <Button variant="secondary" className="h-8 px-3 text-[13px]" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Spinner /> : null} Enviar documento
          </Button>
        </div>
        <div className="mt-2 space-y-1.5">
          {project.documents?.length === 0 && (
            <p className="text-[13px] text-ink-3">
              Nenhum documento. Envie um arquivo descrevendo o projeto para a equipe analisar.
            </p>
          )}
          {project.documents?.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-[13px]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0 text-ink-3" aria-hidden>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path d="M14 2v6h6" />
              </svg>
              <span className="min-w-0 flex-1 truncate">{doc.title}</span>
              {doc.status === 'PROCESSING' && <Badge className="animate-pulse-soft">Indexando…</Badge>}
              {doc.status === 'READY' && <Badge>Pronto</Badge>}
              {doc.status === 'ERROR' && <Badge className="text-danger">Erro</Badge>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Requisitos do projeto</h2>
            <p className="mt-0.5 text-[13px] text-ink-2">
              A equipe de agentes analisa a descrição e os documentos, levanta os
              requisitos e sugere as primeiras tarefas no backlog.
            </p>
          </div>
          <Button
            className="w-full shrink-0 sm:w-auto"
            onClick={async () => {
              try {
                await analyze(projectId).unwrap()
              } catch (err) {
                toast.error(apiErrorMessage(err, 'Não foi possível iniciar a análise.'))
              }
            }}
            disabled={analyzing || starting}
          >
            {analyzing || starting ? <Spinner className="border-t-paper border-paper/40" /> : null}
            {analyzing ? 'Analisando…' : project.requirements ? 'Analisar novamente' : 'Analisar com a equipe'}
          </Button>
        </div>
        {project.analysisStatus === 'ERROR' && (
          <p className="mt-2 rounded-lg bg-paper-3 px-3 py-2 text-[13px] text-danger">
            A análise falhou: {project.analysisError}
          </p>
        )}
        {project.requirements && (
          <MarkdownDocument
            className="mt-3"
            title={`Requisitos · ${project.name}`}
            fileName={`requisitos-${project.name}`}
            markdown={project.requirements}
          />
        )}
      </section>
    </div>
  )
}

/* ---------- Kanban ---------- */

function KanbanTab({ projectId }: { projectId: string }) {
  const filter = { projectId }
  const { data: tasks, isLoading } = useGetTasksQuery(filter, {
    refetchOnFocus: true,
    pollingInterval: 10_000, // agentes criam/movem tasks pelo chat
    skipPollingIfUnfocused: true,
  })
  const [createTask] = useCreateTaskMutation()
  const [openTask, setOpenTask] = useState<Task | null>(null)
  const [title, setTitle] = useState('')

  if (isLoading) return <Skeleton className="h-52 w-full rounded-xl" />
  return (
    <div className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={async (e: FormEvent) => {
          e.preventDefault()
          if (!title.trim()) return
          try {
            await createTask({ title: title.trim(), projectId }).unwrap()
            setTitle('')
          } catch (err) {
            toast.error(apiErrorMessage(err, 'Não foi possível criar a tarefa.'))
          }
        }}
      >
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nova tarefa…" />
        <Button type="submit" disabled={!title.trim()}>Adicionar</Button>
      </form>
      <KanbanBoard tasks={tasks ?? []} filter={filter} onOpenTask={setOpenTask} />
      <TaskModal task={openTask} onClose={() => setOpenTask(null)} />
    </div>
  )
}

/* ---------- Listas ---------- */

function ListsTab({ projectId }: { projectId: string }) {
  const { data: lists } = useGetTaskListsQuery(projectId)
  const { data: tasks } = useGetTasksQuery({ projectId }, { refetchOnFocus: true })
  const [createList] = useCreateTaskListMutation()
  const [createTask] = useCreateTaskMutation()
  const [openTask, setOpenTask] = useState<Task | null>(null)
  const [listName, setListName] = useState('')

  const noList = tasks?.filter((t) => !t.listId) ?? []

  return (
    <div className="space-y-6">
      <form
        className="flex gap-2"
        onSubmit={async (e: FormEvent) => {
          e.preventDefault()
          if (!listName.trim()) return
          try {
            await createList({ name: listName.trim(), projectId }).unwrap()
            setListName('')
          } catch (err) {
            toast.error(apiErrorMessage(err, 'Não foi possível criar a lista.'))
          }
        }}
      >
        <Input value={listName} onChange={(e) => setListName(e.target.value)} placeholder="Nova lista (ex.: Sprint 1, Backlog)…" />
        <Button type="submit" disabled={!listName.trim()}>Criar lista</Button>
      </form>

      {lists?.map((list) => {
        const listTasks = tasks?.filter((t) => t.listId === list.id) ?? []
        return (
          <section key={list.id}>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              {list.name}
              <span className="text-[12px] font-normal text-ink-3">{listTasks.length}</span>
            </h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {listTasks.map((t) => (
                <TaskCard key={t.id} task={t} onClick={() => setOpenTask(t)} />
              ))}
              <QuickAddTask onAdd={(title) => void createTask({ title, projectId, listId: list.id })} />
            </div>
          </section>
        )
      })}

      {noList.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold">Sem lista</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {noList.map((t) => (
              <TaskCard key={t.id} task={t} onClick={() => setOpenTask(t)} />
            ))}
          </div>
        </section>
      )}

      {lists?.length === 0 && noList.length === 0 && (
        <EmptyState title="Nenhuma lista ainda" description="Crie listas para organizar as tarefas do projeto, como colunas de um backlog." />
      )}
      <TaskModal task={openTask} onClose={() => setOpenTask(null)} />
    </div>
  )
}

function QuickAddTask({ onAdd }: { onAdd: (title: string) => void }) {
  const [title, setTitle] = useState('')
  return (
    <form
      className="flex items-center gap-2 rounded-lg border border-dashed border-line px-3 py-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        onAdd(title.trim())
        setTitle('')
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="+ Adicionar tarefa"
        className="w-full bg-transparent text-[13px] outline-none placeholder:text-ink-3"
      />
    </form>
  )
}

/* ---------- Conversas ---------- */

function ChatsTab({ projectId }: { projectId: string }) {
  const navigate = useNavigate()
  const { data: conversations } = useGetConversationsQuery()
  const [createConversation, { isLoading: creating }] = useCreateConversationMutation()

  const projectConvs = conversations?.filter((c) => c.projectId === projectId)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] leading-relaxed text-ink-2">
          Conversas no contexto deste projeto: os agentes conhecem a descrição,
          os requisitos e podem criar e mover tarefas do quadro.
        </p>
        <Button
          className="w-full shrink-0 sm:w-auto"
          disabled={creating}
          onClick={async () => {
            try {
              const conv = await createConversation({ projectId }).unwrap()
              navigate(`/office/c/${conv.id}`)
            } catch (err) {
              toast.error(apiErrorMessage(err, 'Não foi possível criar a conversa.'))
            }
          }}
        >
          {creating ? <Spinner className="border-t-paper border-paper/40" /> : null} Nova conversa
        </Button>
      </div>
      <div className="space-y-1.5">
        {projectConvs?.length === 0 && (
          <EmptyState title="Nenhuma conversa ainda" description="Abra uma conversa para trabalhar neste projeto com os agentes." />
        )}
        {projectConvs?.map((c) => (
          <Link
            key={c.id}
            to={`/office/c/${c.id}`}
            className="block truncate rounded-lg border border-line px-3 py-2.5 text-sm transition-colors duration-150 hover:border-line-2 hover:bg-paper-2"
          >
            {c.title}
          </Link>
        ))}
      </div>
    </div>
  )
}
