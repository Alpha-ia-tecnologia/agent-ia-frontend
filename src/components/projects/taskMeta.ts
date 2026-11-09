import type { ProjectStatus, TaskPriority, TaskStatus } from '@/types'

export const TASK_STATUSES: TaskStatus[] = [
  'A_FAZER',
  'EM_ANDAMENTO',
  'EM_REVISAO',
  'CONCLUIDA',
]

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  A_FAZER: 'A fazer',
  EM_ANDAMENTO: 'Em andamento',
  EM_REVISAO: 'Em revisão',
  CONCLUIDA: 'Concluída',
}

/** Cor de acento por coluna (ponto do cabeçalho + faixa superior da coluna). */
export const TASK_STATUS_ACCENT: Record<
  TaskStatus,
  { dot: string; bar: string }
> = {
  A_FAZER: { dot: 'bg-ink-3', bar: 'bg-ink-3/40' },
  EM_ANDAMENTO: { dot: 'bg-indigo-500', bar: 'bg-indigo-500/60' },
  EM_REVISAO: { dot: 'bg-amber-500', bar: 'bg-amber-500/60' },
  CONCLUIDA: { dot: 'bg-emerald-500', bar: 'bg-emerald-500/60' },
}

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
}

export const PRIORITY_CLASS: Record<TaskPriority, string> = {
  BAIXA: 'text-ink-3',
  MEDIA: 'text-ink-2',
  ALTA: 'text-amber-600',
  URGENTE: 'text-danger',
}

/** Cor do ponto de prioridade no card. */
export const PRIORITY_DOT: Record<TaskPriority, string> = {
  BAIXA: 'bg-ink-3/50',
  MEDIA: 'bg-ink-3',
  ALTA: 'bg-amber-500',
  URGENTE: 'bg-danger',
}

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  AGUARDANDO_INICIO: 'Aguardando início',
  EM_ANDAMENTO: 'Em andamento',
  FINALIZADO: 'Finalizado',
}

export const PROJECT_STATUS_CLASS: Record<ProjectStatus, string> = {
  AGUARDANDO_INICIO: 'text-ink-3',
  EM_ANDAMENTO: 'text-ok',
  FINALIZADO: 'text-ink-2',
}
