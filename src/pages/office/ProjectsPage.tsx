import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useCreateProjectMutation,
  useCreateTaskMutation,
  useGetDepartmentsQuery,
  useGetProjectsQuery,
  useGetTasksQuery,
  useUploadProjectDocumentMutation,
} from '@/api/api'
import { apiErrorMessage } from '@/lib/apiError'
import type { Task } from '@/types'
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Skeleton,
  Spinner,
  cx,
} from '@/components/ui'
import { KanbanBoard } from '@/components/projects/KanbanBoard'
import { TaskModal } from '@/components/projects/TaskModal'
import {
  PROJECT_STATUS_CLASS,
  PROJECT_STATUS_LABEL,
} from '@/components/projects/taskMeta'

function KanbanGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M9 9h-.01M15 13h-.01" />
    </svg>
  )
}

export default function ProjectsPage() {
  const { data: projects, isLoading } = useGetProjectsQuery()
  const [modalOpen, setModalOpen] = useState(false)
  const [showIsolated, setShowIsolated] = useState(false)

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-up sm:px-6 sm:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <header className="flex items-start gap-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-line bg-paper-2 text-ink">
              <KanbanGlyph />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold leading-tight">Projetos</h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-2">
                Organize o trabalho do escritório em projetos com tarefas,
                quadros kanban e conversas no contexto, para você e para os agentes.
              </p>
            </div>
          </header>
          <Button className="w-full shrink-0 sm:w-auto" onClick={() => setModalOpen(true)}>+ Novo projeto</Button>
        </div>

        <div className="mt-7 space-y-2.5">
          {isLoading && <Skeleton className="h-24 w-full rounded-xl" />}
          {projects?.length === 0 && (
            <EmptyState
              title="Nenhum projeto ainda"
              description="Crie o primeiro projeto e deixe a equipe de agentes ajudar a tirá-lo do papel."
              action={<Button onClick={() => setModalOpen(true)}>Criar projeto</Button>}
            />
          )}
          {projects?.map((p) => {
            const analyzing = p.analysisStatus === 'RUNNING'
            const done = p.taskCounts?.CONCLUIDA ?? 0
            const pending = Math.max(0, p._count.tasks - done)
            return (
              <Link
                key={p.id}
                to={`/office/projects/${p.id}`}
                className="group flex flex-col rounded-xl border border-line p-4 transition-all duration-150 hover:-translate-y-px hover:border-line-2 hover:bg-paper-2 hover:shadow-[0_2px_10px_rgba(24,24,27,0.05)]"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={cx(
                      'mt-1 size-2.5 shrink-0 rounded-full',
                      p.status === 'EM_ANDAMENTO'
                        ? 'bg-ok'
                        : p.status === 'FINALIZADO'
                          ? 'bg-emerald-500'
                          : 'bg-line-2',
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.name}</span>
                    {p.description && (
                      <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-ink-3">
                        {p.description}
                      </span>
                    )}
                  </span>
                  <Badge className={cx('shrink-0', PROJECT_STATUS_CLASS[p.status])}>
                    {PROJECT_STATUS_LABEL[p.status]}
                  </Badge>
                </div>

                <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-3">
                  <span className="min-w-0 max-w-full truncate">
                    {p.allDepartments
                      ? 'Todos os setores'
                      : p.departments.map((d) => d.department.name).join(', ') || 'Sem setores'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span className="font-medium text-ink-2 tabular-nums">{done}</span> feitas
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-ink-3/50" />
                    <span className="font-medium text-ink-2 tabular-nums">{pending}</span> pendentes
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="font-medium text-ink-2 tabular-nums">{p._count.conversations}</span>
                    {p._count.conversations === 1 ? 'conversa' : 'conversas'}
                  </span>
                  {analyzing && (
                    <Badge className="ml-auto animate-pulse-soft">Analisando…</Badge>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-10">
          <button
            onClick={() => setShowIsolated((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold transition-colors duration-150 hover:text-ink"
          >
            Tarefas avulsas
            <span className={cx('text-ink-3 transition-transform duration-150', showIsolated && 'rotate-180')}>▾</span>
          </button>
          <p className="mt-0.5 text-[13px] text-ink-2">
            Quadro das tarefas que não pertencem a nenhum projeto.
          </p>
          {showIsolated && <IsolatedTasksBoard />}
        </div>

        <CreateProjectModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </div>
  )
}

function IsolatedTasksBoard() {
  const filter = { isolated: true as const }
  const { data: tasks, isLoading } = useGetTasksQuery(filter, {
    refetchOnFocus: true,
    pollingInterval: 10_000,
    skipPollingIfUnfocused: true,
  })
  const [createTask] = useCreateTaskMutation()
  const [openTask, setOpenTask] = useState<Task | null>(null)
  const [title, setTitle] = useState('')

  if (isLoading) return <Skeleton className="mt-4 h-40 w-full rounded-xl" />
  return (
    <div className="mt-4 space-y-3">
      <form
        className="flex gap-2"
        onSubmit={async (e: FormEvent) => {
          e.preventDefault()
          if (!title.trim()) return
          try {
            await createTask({ title: title.trim() }).unwrap()
            setTitle('')
          } catch (err) {
            toast.error(apiErrorMessage(err, 'Não foi possível criar a tarefa.'))
          }
        }}
      >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nova tarefa avulsa…"
        />
        <Button type="submit" disabled={!title.trim()}>Adicionar</Button>
      </form>
      <KanbanBoard tasks={tasks ?? []} filter={filter} onOpenTask={setOpenTask} />
      <TaskModal task={openTask} onClose={() => setOpenTask(null)} />
    </div>
  )
}

function CreateProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: departments } = useGetDepartmentsQuery()
  const [createProject, { isLoading: creating }] = useCreateProjectMutation()
  const [uploadDoc] = useUploadProjectDocumentMutation()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [allDepartments, setAllDepartments] = useState(true)
  const [departmentIds, setDepartmentIds] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      const project = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        allDepartments,
        departmentIds: allDepartments ? [] : departmentIds,
      }).unwrap()
      if (file) {
        await uploadDoc({ projectId: project.id, file }).unwrap()
      }
      toast.success('Projeto criado.')
      onClose()
      setName('')
      setDescription('')
      setAllDepartments(true)
      setDepartmentIds([])
      setFile(null)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível criar o projeto.'))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo projeto" wide>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Nome do projeto">
          <Input
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Novo site institucional"
          />
        </Field>
        <Field label="Descrição">
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o projeto: objetivo, escopo, prazos… A equipe de agentes pode analisar isso e levantar requisitos."
            className="block w-full resize-y rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-ink"
          />
        </Field>

        <div>
          <p className="mb-1.5 text-[13px] font-medium text-ink-2">Setores envolvidos</p>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-black"
              checked={allDepartments}
              onChange={(e) => setAllDepartments(e.target.checked)}
            />
            Todos os setores da empresa
          </label>
          {!allDepartments && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {departments?.map((d) => {
                const selected = departmentIds.includes(d.id)
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() =>
                      setDepartmentIds((ids) =>
                        selected ? ids.filter((i) => i !== d.id) : [...ids, d.id],
                      )
                    }
                    className={cx(
                      'rounded-full border px-3 py-1 text-[13px] transition-colors duration-150',
                      selected
                        ? 'border-ink bg-ink text-paper'
                        : 'border-line text-ink-2 hover:border-line-2',
                    )}
                  >
                    {d.name}
                  </button>
                )
              })}
              {departments?.length === 0 && (
                <span className="text-[13px] text-ink-3">Nenhum setor cadastrado.</span>
              )}
            </div>
          )}
        </div>

        <Field label="Documento do projeto (opcional: PDF, DOCX, TXT, MD)">
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md,.csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-[13px] text-ink-2 file:mr-3 file:rounded-lg file:border file:border-line file:bg-paper file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-ink hover:file:bg-paper-2"
          />
        </Field>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={creating || !name.trim() || (!allDepartments && departmentIds.length === 0)}>
            {creating ? <Spinner /> : null} Criar projeto
          </Button>
        </div>
      </form>
    </Modal>
  )
}
