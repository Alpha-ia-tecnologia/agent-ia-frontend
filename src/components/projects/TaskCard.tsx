import type { Task } from '@/types'
import { AgentAvatar, cx } from '@/components/ui'
import { PRIORITY_CLASS, PRIORITY_DOT, PRIORITY_LABEL } from './taskMeta'

export function MemberAvatars({ task, size = 22 }: { task: Task; size?: number }) {
  const members = task.members.slice(0, 4)
  const extra = task.members.length - members.length
  return (
    <span className="flex -space-x-1.5">
      {members.map((m) =>
        m.agent ? (
          <span key={m.id} title={`${m.agent.name} (agente)`} className="rounded-full ring-2 ring-paper">
            <AgentAvatar seed={m.agent.avatarSeed} size={size} />
          </span>
        ) : (
          <span
            key={m.id}
            title={`${m.user?.name} (usuário)`}
            style={{ width: size, height: size }}
            className="flex items-center justify-center rounded-full bg-ink/10 text-[10px] font-medium text-ink-2 ring-2 ring-paper"
          >
            {m.user?.name
              ?.split(' ')
              .slice(0, 2)
              .map((p) => p[0])
              .join('')
              .toUpperCase()}
          </span>
        ),
      )}
      {extra > 0 && (
        <span
          style={{ width: size, height: size }}
          className="flex items-center justify-center rounded-full bg-paper-3 text-[10px] text-ink-3 ring-2 ring-paper"
        >
          +{extra}
        </span>
      )}
    </span>
  )
}

export function TaskCard({
  task,
  onClick,
  draggable,
  onDragStart,
}: {
  task: Task
  onClick: () => void
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
}) {
  const overdue =
    task.dueDate && task.status !== 'CONCLUIDA' && new Date(task.dueDate) < new Date()
  return (
    <button
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className={cx(
        'group block w-full rounded-lg border border-line bg-paper p-3 text-left transition-all duration-150',
        'hover:-translate-y-px hover:border-line-2 hover:shadow-[0_2px_8px_rgba(24,24,27,0.06)]',
        draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
      )}
    >
      <p className="text-[13px] font-medium leading-snug text-ink">{task.title}</p>
      <div className="mt-2 flex items-center gap-1.5 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className={cx('size-1.5 shrink-0 rounded-full', PRIORITY_DOT[task.priority])} />
          <span className={cx('font-medium', PRIORITY_CLASS[task.priority])}>
            {PRIORITY_LABEL[task.priority]}
          </span>
        </span>
        {task.list && <span className="truncate text-ink-3">· {task.list.name}</span>}
        {task.dueDate && (
          <span className={cx('text-ink-3', overdue && 'font-medium text-danger')}>
            · {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        {task.members.length > 0 && (
          <span className="ml-auto">
            <MemberAvatars task={task} />
          </span>
        )}
      </div>
    </button>
  )
}
