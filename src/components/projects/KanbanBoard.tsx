import { useState } from 'react'
import type { Task, TaskStatus } from '@/types'
import type { TaskFilter } from '@/api/api'
import { useMoveTaskMutation } from '@/api/api'
import { cx } from '@/components/ui'
import { TaskCard } from './TaskCard'
import { TASK_STATUSES, TASK_STATUS_ACCENT, TASK_STATUS_LABEL } from './taskMeta'

export function KanbanBoard({
  tasks,
  filter,
  onOpenTask,
}: {
  tasks: Task[]
  filter: TaskFilter
  onOpenTask: (task: Task) => void
}) {
  const [moveTask] = useMoveTaskMutation()
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null)

  function onDrop(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault()
    setDragOver(null)
    const id = e.dataTransfer.getData('taskId')
    if (!id) return
    const task = tasks.find((t) => t.id === id)
    if (!task || task.status === status) return
    const position = tasks.filter((t) => t.status === status).length
    void moveTask({ id, status, position, filter })
  }

  return (
    <div className="scroll-thin -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4">
      {TASK_STATUSES.map((status) => {
        const column = tasks
          .filter((t) => t.status === status)
          .sort((a, b) => a.position - b.position)
        const accent = TASK_STATUS_ACCENT[status]
        const active = dragOver === status
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(status)
            }}
            onDragLeave={() => setDragOver((s) => (s === status ? null : s))}
            onDrop={(e) => onDrop(e, status)}
            className={cx(
              'flex max-h-[calc(100vh-19rem)] min-h-56 w-[78vw] shrink-0 flex-col overflow-hidden rounded-xl border bg-paper-2 transition-colors duration-150 sm:w-auto sm:shrink',
              active ? 'border-ink ring-1 ring-ink/10' : 'border-line',
            )}
          >
            {/* faixa de acento no topo */}
            <span className={cx('h-1 w-full shrink-0 rounded-t-xl', accent.bar)} />

            <div className="flex items-center gap-1.5 px-3 pb-2 pt-2.5">
              <span className={cx('size-2 shrink-0 rounded-full', accent.dot)} />
              <span className="text-[12px] font-semibold text-ink-2">
                {TASK_STATUS_LABEL[status]}
              </span>
              <span className="ml-auto grid h-[18px] min-w-[18px] place-items-center rounded-full bg-paper-3 px-1 text-[11px] font-semibold tabular-nums text-ink-3">
                {column.length}
              </span>
            </div>

            <div className="scroll-thin flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
              {column.length === 0 ? (
                <div
                  className={cx(
                    'flex flex-1 items-center justify-center rounded-lg border border-dashed py-6 text-[12px] transition-colors duration-150',
                    active ? 'border-ink/30 text-ink-2' : 'border-line text-ink-3',
                  )}
                >
                  {active ? 'Soltar aqui' : 'Vazio'}
                </div>
              ) : (
                column.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                    onClick={() => onOpenTask(task)}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
