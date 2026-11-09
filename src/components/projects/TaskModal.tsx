import { useState } from 'react'
import { toast } from 'sonner'
import {
  useAddTaskMemberMutation,
  useDeleteTaskMutation,
  useGetAgentsQuery,
  useGetTaskListsQuery,
  useGetUsersQuery,
  useRemoveTaskMemberMutation,
  useUpdateTaskMutation,
} from '@/api/api'
import { apiErrorMessage } from '@/lib/apiError'
import type { Task, TaskPriority, TaskStatus } from '@/types'
import { AgentAvatar, Badge, Button, Field, Input, Modal, Select } from '@/components/ui'
import {
  PRIORITY_LABEL,
  TASK_STATUSES,
  TASK_STATUS_LABEL,
} from './taskMeta'

export function TaskModal({ task, onClose }: { task: Task | null; onClose: () => void }) {
  return (
    <Modal open={task !== null} onClose={onClose} title="Tarefa" wide>
      {task && <TaskEditor key={task.id} task={task} onClose={onClose} />}
    </Modal>
  )
}

function TaskEditor({ task, onClose }: { task: Task; onClose: () => void }) {
  const projectId = task.projectId ?? undefined
  const { data: lists } = useGetTaskListsQuery(projectId ?? '')
  const { data: agents } = useGetAgentsQuery()
  const { data: users } = useGetUsersQuery()
  const [updateTask, { isLoading: saving }] = useUpdateTaskMutation()
  const [deleteTask] = useDeleteTaskMutation()
  const [addMember] = useAddTaskMemberMutation()
  const [removeMember] = useRemoveTaskMemberMutation()

  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [listId, setListId] = useState(task.listId ?? '')
  const [dueDate, setDueDate] = useState(task.dueDate?.slice(0, 10) ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const memberAgentIds = new Set(task.members.map((m) => m.agent?.id).filter(Boolean))
  const memberUserIds = new Set(task.members.map((m) => m.user?.id).filter(Boolean))

  async function onSave() {
    try {
      await updateTask({
        id: task.id,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        listId: listId || null,
        dueDate: dueDate || null,
      }).unwrap()
      toast.success('Tarefa atualizada.')
      onClose()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível salvar a tarefa.'))
    }
  }

  async function onAdd(kind: 'agent' | 'user', id: string) {
    if (!id) return
    try {
      await addMember({
        taskId: task.id,
        ...(kind === 'agent' ? { agentId: id } : { userId: id }),
      }).unwrap()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível adicionar o membro.'))
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Título">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Descrição">
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="block w-full resize-y rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-ink"
          placeholder="Detalhes do que precisa ser feito…"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{TASK_STATUS_LABEL[s]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Prioridade">
          <Select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            {(Object.keys(PRIORITY_LABEL) as TaskPriority[]).map((p) => (
              <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Lista">
          <Select value={listId} onChange={(e) => setListId(e.target.value)}>
            <option value="">Sem lista</option>
            {lists?.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Prazo">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
      </div>

      <div>
        <p className="mb-1.5 text-[13px] font-medium text-ink-2">Membros (agentes e usuários)</p>
        <div className="flex flex-wrap gap-1.5">
          {task.members.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-2 py-0.5 pl-1 pr-2 text-[12px]"
            >
              {m.agent ? (
                <>
                  <AgentAvatar seed={m.agent.avatarSeed} size={18} /> {m.agent.name}
                  <Badge className="px-1 py-0 text-[10px]">agente</Badge>
                </>
              ) : (
                <>
                  <span className="flex size-[18px] items-center justify-center rounded-full bg-ink/10 text-[9px] font-medium">
                    {m.user?.name?.[0]?.toUpperCase()}
                  </span>
                  {m.user?.name}
                </>
              )}
              <button
                onClick={() => void removeMember({ taskId: task.id, memberId: m.id })}
                className="text-ink-3 hover:text-danger"
                aria-label="Remover membro"
              >
                ✕
              </button>
            </span>
          ))}
          {task.members.length === 0 && (
            <span className="text-[12px] text-ink-3">Ninguém atribuído ainda.</span>
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Select value="" onChange={(e) => void onAdd('agent', e.target.value)}>
            <option value="">+ Adicionar agente…</option>
            {agents
              ?.filter((a) => !memberAgentIds.has(a.id))
              .map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
          </Select>
          <Select value="" onChange={(e) => void onAdd('user', e.target.value)}>
            <option value="">+ Adicionar usuário…</option>
            {users
              ?.filter((u) => !memberUserIds.has(u.id))
              .map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line pt-4">
        {confirmDelete ? (
          <span className="flex items-center gap-1.5">
            <Button
              variant="danger"
              className="h-8 px-2.5 text-[13px]"
              onClick={async () => {
                try {
                  await deleteTask(task.id).unwrap()
                  toast.success('Tarefa excluída.')
                  onClose()
                } catch (err) {
                  toast.error(apiErrorMessage(err))
                }
              }}
            >
              Confirmar exclusão
            </Button>
            <Button variant="secondary" className="h-8 px-2.5 text-[13px]" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
          </span>
        ) : (
          <Button variant="ghost" className="h-8 px-2.5 text-[13px] text-ink-3 hover:text-danger" onClick={() => setConfirmDelete(true)}>
            Excluir tarefa
          </Button>
        )}
        <span className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => void onSave()} disabled={saving || !title.trim()}>
            Salvar
          </Button>
        </span>
      </div>
    </div>
  )
}
