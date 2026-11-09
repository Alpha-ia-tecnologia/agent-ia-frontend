import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useEffect,
  useRef,
} from 'react'
import { createPortal } from 'react-dom'
import { avatarUri } from '@/lib/avatar'

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

/* ---------- Botões ---------- */

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 h-9 text-sm font-medium transition-colors duration-150 disabled:opacity-45 disabled:pointer-events-none whitespace-nowrap'
  const variants: Record<BtnVariant, string> = {
    primary: 'bg-ink text-paper hover:bg-zinc-700',
    secondary: 'border border-line bg-paper text-ink hover:bg-paper-2 hover:border-line-2',
    ghost: 'text-ink-2 hover:bg-paper-3 hover:text-ink',
    danger: 'text-danger hover:bg-red-50',
  }
  return <button className={cx(base, variants[variant], className)} {...props} />
}

/* ---------- Campos ---------- */

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        'w-full h-9 rounded-lg border border-line bg-paper px-3 text-sm text-ink transition-colors duration-150 hover:border-line-2 focus:border-ink focus:outline-none',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(
        'w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink transition-colors duration-150 hover:border-line-2 focus:border-ink focus:outline-none resize-y',
        className,
      )}
      {...props}
    />
  )
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cx(
        'w-full h-9 rounded-lg border border-line bg-paper px-2.5 text-sm text-ink transition-colors duration-150 hover:border-line-2 focus:border-ink focus:outline-none',
        className,
      )}
      {...props}
    />
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-3">{hint}</span>}
    </label>
  )
}

/* ---------- Avatar ---------- */

export function AgentAvatar({
  seed,
  size = 32,
  className,
}: {
  seed: string
  size?: number
  className?: string
}) {
  return (
    <img
      src={avatarUri(seed)}
      alt=""
      width={size}
      height={size}
      // tamanho no style: dentro de flex, só os atributos deixavam a imagem
      // esticar até a altura da mensagem (a "pílula" cinza ao lado do texto)
      style={{ width: size, height: size }}
      className={cx('rounded-full bg-paper-3 border border-line shrink-0', className)}
    />
  )
}

/* ---------- Feedback ---------- */

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-block size-4 animate-spin rounded-full border-2 border-line-2 border-t-ink align-middle',
        className,
      )}
    />
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse-soft rounded-md bg-paper-3', className)} />
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-md border border-line bg-paper-2 px-1.5 py-0.5 text-[11px] font-medium text-ink-2',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center animate-fade-up">
      {icon && <div className="mb-1 text-ink-3">{icon}</div>}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && (
        <p className="max-w-sm text-[13px] text-ink-2">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

/* ---------- Dropdown ---------- */

export interface DropdownItem {
  label: string
  onSelect: () => void
  danger?: boolean
  /** Mantém o menu aberto após selecionar (útil para confirmação em dois passos). */
  keepOpen?: boolean
}

export function DropdownMenu({
  open,
  onClose,
  items,
  align = 'right',
  className,
}: {
  open: boolean
  onClose: () => void
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.parentElement?.contains(e.target as Node)) {
        onClose()
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
    }
  }, [open])

  if (!open) return null

  const onMenuKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return
    e.preventDefault()
    e.stopPropagation()
    const els = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
    )
    if (!els.length) return
    const idx = els.indexOf(document.activeElement as HTMLButtonElement)
    let next = 0
    if (e.key === 'ArrowDown') next = (idx + 1) % els.length
    else if (e.key === 'ArrowUp') next = (idx - 1 + els.length) % els.length
    else if (e.key === 'End') next = els.length - 1
    els[next]?.focus()
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      onKeyDown={onMenuKeyDown}
      className={cx(
        'absolute z-40 mt-1 min-w-40 rounded-lg border border-line bg-paper p-1 shadow-[0_8px_24px_-8px_rgb(0_0_0/0.16)] animate-fade-up',
        align === 'right' ? 'right-0' : 'left-0',
        className,
      )}
    >
      {items.map((item, i) => (
        <button
          key={i}
          role="menuitem"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            item.onSelect()
            if (!item.keepOpen) onClose()
          }}
          className={cx(
            'flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink',
            item.danger
              ? 'text-danger hover:bg-red-50'
              : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- Modal ---------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  // Portal para o body: ancestrais com transform (ex.: animate-fade-up) viram
  // containing block de position:fixed e cortavam/deslocavam o modal.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cx(
          'w-full rounded-xl border border-line bg-paper shadow-[0_12px_40px_-12px_rgb(0_0_0/0.18)] animate-fade-up',
          wide ? 'max-w-2xl' : 'max-w-md',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md p-1 text-ink-3 transition-colors duration-150 hover:bg-paper-3 hover:text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
