import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import {
  useDeleteConversationMutation,
  useGetAgentsQuery,
  useGetConversationsQuery,
  useGetProviderKeysQuery,
  useGetShareRequestsQuery,
  useGetSubscriptionStatusQuery,
  useResolveShareRequestMutation,
  useUpdateConversationMutation,
} from '@/api/api'
import type { Conversation } from '@/types'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logout } from '@/store/authSlice'
import { toast } from 'sonner'
import { apiErrorMessage } from '@/lib/apiError'
import { Logo } from '@/components/Logo'
import { OrgSwitcher } from '@/components/OrgSwitcher'
import { AgentAvatar, DropdownMenu, Skeleton, cx } from '@/components/ui'
import { WrenchIcon } from '@/pages/office/ToolsPage'

function BuildingIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 21h18M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 9h3a1 1 0 0 1 1 1v11" />
      <path d="M8 8h2M8 12h2M8 16h2" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function InboxIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.5 5.1L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z" />
    </svg>
  )
}

function VideoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="m22 8-6 4 6 4V8Z" />
    </svg>
  )
}

function TableIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M9 10v10M15 10v10" />
    </svg>
  )
}

function KanbanIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v12" />
    </svg>
  )
}

/** Ícone da visibilidade da conversa (globo = empresa, pessoas = usuários). */
function VisibilityIcon({ visibility }: { visibility?: string }) {
  if (visibility === 'COMPANY') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </svg>
    )
  }
  if (visibility === 'USERS') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden>
        <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19" />
        <circle cx="10" cy="8" r="3" />
        <path d="M20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4M15 5.1a3 3 0 0 1 0 5.8" />
      </svg>
    )
  }
  return null
}

export default function OfficeLayout() {
  const { data: agents, isLoading: loadingAgents } = useGetAgentsQuery()
  const user = useAppSelector((s) => s.auth.user)
  const isAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN'
  const [showAllConvs, setShowAllConvs] = useState(false)
  const { data: conversations, isLoading: loadingConvs } = useGetConversationsQuery(
    showAllConvs && isAdmin ? { scope: 'all' } : undefined,
  )
  const activeStreamConv = useAppSelector((s) =>
    s.stream.isStreaming
      ? s.stream.activeConversationId
      : null,
  )
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  function newConversation() {
    // A conversa só nasce quando a primeira mensagem é enviada (ChatPage);
    // aqui basta voltar para a tela inicial do escritório.
    navigate('/office')
  }

  const [scrolled, setScrolled] = useState(false)
  const [agentsCollapsed, setAgentsCollapsed] = useState(
    () => localStorage.getItem('aao.sidebar.agentsCollapsed') === '1',
  )
  const [convsCollapsed, setConvsCollapsed] = useState(
    () => localStorage.getItem('aao.sidebar.convsCollapsed') === '1',
  )

  function toggleAgents() {
    setAgentsCollapsed((c) => {
      localStorage.setItem('aao.sidebar.agentsCollapsed', c ? '0' : '1')
      return !c
    })
  }
  function toggleConvs() {
    setConvsCollapsed((c) => {
      localStorage.setItem('aao.sidebar.convsCollapsed', c ? '0' : '1')
      return !c
    })
  }

  const [collapsedPref, setCollapsedPref] = useState(
    () => localStorage.getItem('aao.sidebar.collapsed') === '1',
  )
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  )
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  // No mobile a barra vira drawer sempre expandido; o modo "trilho" é só desktop.
  const collapsed = isDesktop ? collapsedPref : false
  const routeLocation = useLocation()
  useEffect(() => {
    setMobileOpen(false)
  }, [routeLocation.pathname])

  // overflow-hidden só enquanto a largura anima; parado, o popover do launcher
  // precisa poder "vazar" para fora da aside (senão fica recortado).
  const [transitioning, setTransitioning] = useState(false)
  function toggleCollapsed() {
    setTransitioning(true)
    window.setTimeout(() => setTransitioning(false), 320)
    setCollapsedPref((c) => {
      localStorage.setItem('aao.sidebar.collapsed', c ? '0' : '1')
      return !c
    })
  }

  // Item só-ícone (modo colapsado): quadrado centralizado com estado ativo.
  const iconLinkCls = ({ isActive }: { isActive: boolean }) =>
    cx(
      'flex size-10 items-center justify-center rounded-lg transition-colors duration-150',
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink',
      isActive
        ? 'bg-ink/[0.06] text-ink'
        : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink',
    )

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    cx(
      'group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors duration-150',
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink',
      isActive
        ? 'bg-ink/[0.06] text-ink font-medium'
        : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink',
    )

  return (
    <div className="flex h-full">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cx(
          'flex shrink-0 flex-col border-r border-line bg-paper-2 ease-[var(--ease-alpha)]',
          'fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 md:relative md:z-30 md:translate-x-0 md:transition-[width]',
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0',
          collapsed ? 'md:w-[68px]' : 'md:w-64',
          transitioning && 'md:overflow-hidden',
        )}
      >
        <div
          className={cx(
            'flex h-14 shrink-0 items-center border-b transition-colors duration-200',
            collapsed ? 'justify-center px-0' : 'px-4',
            scrolled ? 'border-line shadow-[0_4px_8px_-6px_rgb(0_0_0/0.08)]' : 'border-transparent',
          )}
        >
          {collapsed ? (
            <Tooltip label="Expandir barra lateral">
              <button
                onClick={toggleCollapsed}
                aria-label="Expandir barra lateral"
                className="flex size-9 items-center justify-center rounded-lg border border-line bg-paper text-ink-2 transition-colors duration-150 hover:border-line-2 hover:bg-ink/[0.04] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <ExpandIcon />
              </button>
            </Tooltip>
          ) : (
            <>
              <NavLink
                to="/office"
                className="rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <Logo size="lg" />
              </NavLink>
              <button
                onClick={() => (isDesktop ? toggleCollapsed() : setMobileOpen(false))}
                title={isDesktop ? 'Recolher barra lateral' : 'Fechar menu'}
                aria-label={isDesktop ? 'Recolher barra lateral' : 'Fechar menu'}
                className="ml-auto flex size-7 shrink-0 items-center justify-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-ink/[0.04] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
              >
                {isDesktop ? <CollapseIcon /> : <CloseIcon />}
              </button>
            </>
          )}
        </div>

        <div
          className={cx('flex-1 overflow-y-auto pb-4 pt-3', collapsed ? 'px-2' : 'px-3')}
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 2)}
        >
          {collapsed ? (
            <Tooltip label="Nova conversa" className="mx-auto w-fit">
              <button
                onClick={newConversation}
                aria-label="Nova conversa"
                className="flex size-10 items-center justify-center rounded-lg border border-line bg-paper text-ink transition-colors duration-150 hover:border-line-2 hover:bg-ink/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <PlusIcon />
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={newConversation}
              className="flex w-full items-center gap-2 whitespace-nowrap rounded-lg border border-line bg-paper px-3 py-2 text-[13px] font-medium text-ink transition-colors duration-150 hover:border-line-2 hover:bg-ink/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <PlusIcon />
              Nova conversa
            </button>
          )}

          {collapsed && activeStreamConv && (
            <Tooltip label="Trabalhando… abrir conversa" className="mx-auto mt-2 w-fit">
              <NavLink
                to={`/office/c/${activeStreamConv}`}
                aria-label="Os agentes estão trabalhando. Abrir conversa."
                className="flex size-10 items-center justify-center rounded-lg text-ink-2 transition-colors duration-150 hover:bg-ink/[0.04] hover:text-ink"
              >
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-2.5 animate-ping rounded-full bg-ink/40" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-ink" />
                </span>
              </NavLink>
            </Tooltip>
          )}

          <div className={collapsed ? 'mt-4' : 'mt-6'}>
            {!collapsed && (
              <SectionLabel collapsed={agentsCollapsed} onToggle={toggleAgents}>
                Agentes
              </SectionLabel>
            )}
            {(collapsed || !agentsCollapsed) && (
              <nav className={cx(collapsed ? 'flex flex-col items-center gap-1' : 'mt-2 space-y-px')}>
                {loadingAgents &&
                  Array.from({ length: 4 }).map((_, i) =>
                    collapsed ? (
                      <Skeleton key={i} className="size-8 rounded-full" />
                    ) : (
                      <div key={i} className="flex items-center gap-2.5 px-2 py-2">
                        <Skeleton className="size-7 rounded-full" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3 w-28" />
                          <Skeleton className="h-2.5 w-20" />
                        </div>
                      </div>
                    ),
                  )}
                {agents?.map((agent) => {
                  const subtitle = agent.isManager ? 'Gerente' : agent.department?.name
                  return collapsed ? (
                    <Tooltip
                      key={agent.id}
                      label={subtitle ? `${agent.name} · ${subtitle}` : agent.name}
                    >
                      <NavLink
                        to={`/office/agents/${agent.id}`}
                        aria-label={agent.name}
                        className={({ isActive }) =>
                          cx(
                            'relative flex size-10 items-center justify-center rounded-lg transition-colors duration-150',
                            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink',
                            isActive ? 'bg-ink/[0.06]' : 'hover:bg-ink/[0.04]',
                          )
                        }
                      >
                        <span className="relative">
                          <AgentAvatar seed={agent.avatarSeed} size={28} />
                          {agent.isManager && (
                            <span className="absolute inset-0 rounded-full ring-1 ring-ink/25" aria-hidden />
                          )}
                        </span>
                      </NavLink>
                    </Tooltip>
                  ) : (
                    <NavLink
                      key={agent.id}
                      to={`/office/agents/${agent.id}`}
                      className={linkCls}
                      title={subtitle ? `${agent.name} · ${subtitle}` : agent.name}
                    >
                      <span className="relative shrink-0">
                        <AgentAvatar seed={agent.avatarSeed} size={28} />
                        {agent.isManager && (
                          <span className="absolute inset-0 rounded-full ring-1 ring-ink/25" aria-hidden />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 py-0.5">
                        <span className="flex items-center gap-1">
                          <span className="truncate text-[13px] font-medium leading-tight text-current">
                            {agent.name}
                          </span>
                          {agent.isManager && (
                            <span className="shrink-0 text-[10px] leading-none text-ink-3" aria-hidden>
                              ✦
                            </span>
                          )}
                        </span>
                        {subtitle && (
                          <span className="block truncate text-[11px] font-normal leading-tight text-ink-3">
                            {subtitle}
                          </span>
                        )}
                      </span>
                    </NavLink>
                  )
                })}
                {!collapsed && agents?.length === 0 && (
                  <p className="px-2 py-1.5 text-[13px] text-ink-3">Nenhum agente ainda.</p>
                )}
              </nav>
            )}
          </div>

          {!collapsed && (
            <div className="mt-6">
              <div className="flex items-center justify-between gap-2 pr-1">
                <SectionLabel collapsed={convsCollapsed} onToggle={toggleConvs}>
                  Conversas
                </SectionLabel>
                {isAdmin && !convsCollapsed && (
                  <button
                    onClick={() => setShowAllConvs((v) => !v)}
                    title={showAllConvs ? 'Ver só as minhas e compartilhadas' : 'Ver todas as conversas da empresa (admin)'}
                    className={cx(
                      'rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors duration-150',
                      showAllConvs ? 'bg-ink text-paper' : 'text-ink-3 hover:bg-ink/[0.06] hover:text-ink',
                    )}
                  >
                    Todas
                  </button>
                )}
              </div>
              {!convsCollapsed && <ShareRequestsPanel />}
              {!convsCollapsed && (
                <nav className="mt-2 space-y-px">
                  {loadingConvs &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="mx-2 my-2 h-3.5 w-40" />
                    ))}
                  {conversations?.map((conv) => (
                    <ConversationItem key={conv.id} conv={conv} meId={user?.id} />
                  ))}
                  {conversations?.length === 0 && (
                    <p className="px-2 py-1.5 text-[13px] text-ink-3">
                      {showAllConvs
                        ? 'Nenhuma conversa na empresa.'
                        : 'Suas conversas aparecerão aqui.'}
                    </p>
                  )}
                </nav>
              )}
            </div>
          )}
        </div>

        <div className={cx('shrink-0 border-t border-line pb-3 pt-2', collapsed ? 'px-2' : 'px-3')}>
          <nav className={cx(collapsed ? 'flex flex-col items-center gap-1' : 'space-y-px')}>
            <AppsLauncher collapsed={collapsed} />
            {collapsed ? (
              <Tooltip label="Configurações">
                <NavLink to="/office/settings" aria-label="Configurações" className={iconLinkCls}>
                  <span className="flex items-center justify-center text-ink-2">
                    <GearIcon />
                  </span>
                </NavLink>
              </Tooltip>
            ) : (
              <NavLink to="/office/settings" className={linkCls}>
                <span className="flex size-4 shrink-0 items-center justify-center text-ink-2">
                  <GearIcon />
                </span>
                Configurações
              </NavLink>
            )}
          </nav>
          <div className={cx('mt-2 border-t border-line pt-2', collapsed && 'flex justify-center')}>
            <OrgSwitcher collapsed={collapsed} />
          </div>
          <div
            className={cx(
              'mt-1 flex pt-1',
              collapsed ? 'flex-col items-center gap-2' : 'items-center gap-2.5 px-2',
            )}
          >
            {collapsed ? (
              <Tooltip label={user?.name ?? 'Você'}>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink/5 text-[11px] font-medium text-ink-2">
                  {initials(user?.name)}
                </span>
              </Tooltip>
            ) : (
              <>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink/5 text-[11px] font-medium text-ink-2">
                  {initials(user?.name)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink-2" title={user?.name}>
                  {user?.name}
                </span>
              </>
            )}
            {(() => {
              const logoutBtn = (
                <button
                  onClick={() => {
                    dispatch(logout())
                    navigate('/login')
                  }}
                  title={collapsed ? undefined : 'Sair'}
                  aria-label="Sair"
                  className="flex size-7 shrink-0 items-center justify-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-ink/[0.04] hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
                >
                  <LogoutIcon />
                </button>
              )
              return collapsed ? <Tooltip label="Sair">{logoutBtn}</Tooltip> : logoutBtn
            })()}
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col bg-paper">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            className="flex size-9 items-center justify-center rounded-lg text-ink-2 transition-colors duration-150 hover:bg-ink/[0.04] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <MenuIcon />
          </button>
          <NavLink to="/office" className="rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
            <Logo size="sm" />
          </NavLink>
        </div>
        <NoProviderBanner isAdmin={user?.role === 'OWNER' || user?.role === 'ADMIN'} />
        <div className="min-h-0 flex-1">
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}

/** Áreas do escritório agrupadas num launcher de "grade de apps". */
const APP_ITEMS: { to: string; label: string; Icon: ComponentType<{ size?: number }> }[] = [
  { to: '/telao', label: 'Telão da trilha', Icon: TableIcon },
  { to: '/office/org', label: 'Escritório', Icon: BuildingIcon },
  { to: '/office/projects', label: 'Projetos', Icon: KanbanIcon },
  { to: '/office/knowledge', label: 'Conhecimento', Icon: BookIcon },
  { to: '/office/inbox', label: 'Canais', Icon: InboxIcon },
  { to: '/office/meetings', label: 'Reuniões', Icon: VideoIcon },
  { to: '/office/data', label: 'Dados', Icon: TableIcon },
  { to: '/office/tools', label: 'Ferramentas', Icon: WrenchIcon },
]

function AppsLauncher({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const anyActive = APP_ITEMS.some((it) => location.pathname.startsWith(it.to))

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Fecha ao trocar de rota.
  useEffect(() => setOpen(false), [location.pathname])

  const active = open || anyActive

  const trigger = (
    <button
      onClick={() => setOpen((v) => !v)}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-label={collapsed ? 'Explorar áreas' : undefined}
      className={
        collapsed
          ? cx(
              'flex size-10 items-center justify-center rounded-lg transition-colors duration-150',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink',
              active ? 'bg-ink/[0.06] text-ink' : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink',
            )
          : cx(
              'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors duration-150',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink',
              active ? 'bg-ink/[0.06] text-ink font-medium' : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink',
            )
      }
    >
      <span className="flex size-4 shrink-0 items-center justify-center text-ink-2">
        <GridIcon />
      </span>
      {!collapsed && (
        <>
          Explorar
          <span
            className={cx('ml-auto text-ink-3 transition-transform duration-150', open && 'rotate-180')}
            aria-hidden
          >
            <ChevronIcon />
          </span>
        </>
      )}
    </button>
  )

  return (
    <div ref={ref} className="relative">
      {collapsed && !open ? <Tooltip label="Explorar áreas">{trigger}</Tooltip> : trigger}

      {open && (
        <div
          role="menu"
          className={cx(
            'absolute z-40 w-[19rem] rounded-2xl border border-line bg-paper p-2.5 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.18)] animate-fade-up',
            collapsed ? 'bottom-0 left-full ml-2' : 'bottom-full left-0 mb-2',
          )}
        >
          <div className="grid grid-cols-3 gap-2">
            {APP_ITEMS.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cx(
                    'flex flex-col items-center gap-2 rounded-xl px-2 py-4 text-center transition-colors duration-150',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink',
                    isActive ? 'bg-ink/[0.06] text-ink' : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink',
                  )
                }
              >
                <span className="flex size-6 items-center justify-center">
                  <Icon size={20} />
                </span>
                <span className="text-[11px] font-medium leading-tight">{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** Solicitações pendentes de acesso às conversas do usuário logado. */
function ShareRequestsPanel() {
  const { data: requests } = useGetShareRequestsQuery(undefined, {
    pollingInterval: 30_000,
    skipPollingIfUnfocused: true,
  })
  const [resolve, { isLoading }] = useResolveShareRequestMutation()

  if (!requests || requests.length === 0) return null

  async function act(reqId: string, action: 'approve' | 'deny') {
    try {
      await resolve({ reqId, action }).unwrap()
      toast.success(action === 'approve' ? 'Acesso concedido.' : 'Solicitação recusada.')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível responder à solicitação.'))
    }
  }

  return (
    <div className="mt-2 space-y-1.5 rounded-lg border border-line bg-paper-2 p-2">
      <p className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-3">
        Pedidos de acesso ({requests.length})
      </p>
      {requests.map((r) => (
        <div key={r.id} className="rounded-md bg-paper px-2 py-1.5">
          <p className="text-[12px] leading-snug text-ink-2">
            <span className="font-medium text-ink">{r.requester.name}</span> quer acesso a{' '}
            <span className="font-medium text-ink">{r.conversation.title}</span>
          </p>
          <div className="mt-1.5 flex gap-1.5">
            <button
              disabled={isLoading}
              onClick={() => act(r.id, 'approve')}
              className="rounded-md bg-ink px-2 py-0.5 text-[11px] font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Conceder
            </button>
            <button
              disabled={isLoading}
              onClick={() => act(r.id, 'deny')}
              className="rounded-md border border-line px-2 py-0.5 text-[11px] font-medium text-ink-2 transition-colors hover:bg-paper-2 disabled:opacity-50"
            >
              Recusar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ConversationItem({ conv, meId }: { conv: Conversation; meId?: string }) {
  const [updateConversation] = useUpdateConversationMutation()
  const [deleteConversation] = useDeleteConversationMutation()
  const navigate = useNavigate()
  const location = useLocation()

  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const savedRef = useRef(false)

  const processing = useAppSelector(
    (s) =>
      s.stream.activeConversationId === conv.id &&
      s.stream.isStreaming,
  )

  const title = conv.title || 'Conversa sem título'
  // Conversa de outra pessoa (visão compartilhada/admin): sem ações de dono.
  const notMine = conv.isOwner === false || (meId != null && conv.owner != null && conv.owner.id !== meId)

  useEffect(() => {
    if (!menuOpen) setConfirmingDelete(false)
  }, [menuOpen])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function startRename() {
    setDraft(conv.title || '')
    savedRef.current = false
    setEditing(true)
  }

  async function saveRename() {
    if (savedRef.current) return
    savedRef.current = true
    setEditing(false)
    const next = draft.trim()
    if (!next || next === conv.title) return
    try {
      await updateConversation({ id: conv.id, title: next }).unwrap()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível renomear a conversa.'))
    }
  }

  async function togglePin() {
    try {
      await updateConversation({ id: conv.id, pinned: !conv.pinned }).unwrap()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível fixar a conversa.'))
    }
  }

  async function confirmDelete() {
    setMenuOpen(false)
    try {
      await deleteConversation(conv.id).unwrap()
      if (location.pathname === `/office/c/${conv.id}`) navigate('/office')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível excluir a conversa.'))
    }
  }

  const actionBtnCls =
    'flex size-6 shrink-0 items-center justify-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-ink/[0.06] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink'

  if (editing) {
    return (
      <div className="flex items-center rounded-lg bg-ink/[0.04] px-2 py-1">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={saveRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveRename()
            if (e.key === 'Escape') {
              savedRef.current = true
              setEditing(false)
            }
          }}
          aria-label="Renomear conversa"
          className="w-full rounded-md border border-ink/30 bg-paper px-1.5 py-[3px] text-[13px] text-ink focus:border-ink focus:outline-none"
        />
      </div>
    )
  }

  return (
    <NavLink
      to={`/office/c/${conv.id}`}
      title={title}
      className={({ isActive }) =>
        cx(
          'group relative flex items-center gap-1 rounded-lg px-2 py-1.5 text-[13px] transition-colors duration-150',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink',
          isActive
            ? 'bg-ink/[0.06] text-ink font-medium'
            : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink',
        )
      }
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1">
          {conv.visibility && conv.visibility !== 'PRIVATE' && (
            <span className="text-ink-3">
              <VisibilityIcon visibility={conv.visibility} />
            </span>
          )}
          <span className="truncate">{title}</span>
        </span>
        {notMine && conv.owner && (
          <span className="block truncate text-[11px] text-ink-3">de {conv.owner.name}</span>
        )}
      </span>

      {processing && (
        <span
          className="flex shrink-0 items-center group-focus-within:hidden group-hover:hidden"
          title="Os agentes estão trabalhando nesta conversa"
          aria-label="Processando"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-2 animate-ping rounded-full bg-ink/40" />
            <span className="relative inline-flex size-2 rounded-full bg-ink" />
          </span>
        </span>
      )}

      {conv.pinned && (
        <span
          className="shrink-0 text-ink-3 group-focus-within:hidden group-hover:hidden"
          aria-label="Conversa fixada"
        >
          <PinIcon filled />
        </span>
      )}

      {!notMine && (
      <span
        className="hidden shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-150 group-focus-within:flex group-focus-within:opacity-100 group-hover:flex group-hover:opacity-100"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <button
          onClick={togglePin}
          aria-label={conv.pinned ? 'Desafixar conversa' : 'Fixar conversa'}
          title={conv.pinned ? 'Desafixar conversa' : 'Fixar conversa'}
          className={actionBtnCls}
        >
          <PinIcon filled={conv.pinned} />
        </button>
        <span className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Opções da conversa"
            title="Opções da conversa"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className={actionBtnCls}
          >
            <DotsIcon />
          </button>
          <DropdownMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            items={[
              { label: 'Renomear', onSelect: startRename },
              confirmingDelete
                ? { label: 'Confirmar exclusão?', danger: true, onSelect: confirmDelete }
                : {
                    label: 'Excluir',
                    danger: true,
                    keepOpen: true,
                    onSelect: () => setConfirmingDelete(true),
                  },
            ]}
          />
        </span>
      </span>
      )}
    </NavLink>
  )
}

function SectionLabel({
  children,
  collapsed,
  onToggle,
}: {
  children: string
  collapsed?: boolean
  onToggle?: () => void
}) {
  const label = (
    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-3">
      {children}
    </span>
  )
  if (!onToggle) return <p className="px-2">{label}</p>
  return (
    <button
      onClick={onToggle}
      aria-expanded={!collapsed}
      className="group flex w-full items-center gap-1 rounded-md px-2 py-0.5 transition-colors duration-150 hover:bg-ink/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
    >
      {label}
      <span
        className={cx(
          'ml-auto text-[10px] text-ink-3 opacity-0 transition-all duration-150 group-hover:opacity-100',
          collapsed && 'opacity-100 -rotate-90',
        )}
        aria-hidden
      >
        ▾
      </span>
    </button>
  )
}

/**
 * Tooltip estilizado que aparece à direita — usado na sidebar colapsada.
 * Renderizado em portal com posição fixa, calculada no hover, para escapar do
 * overflow das áreas roláveis (que recortariam um tooltip absoluto).
 */
function Tooltip({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null)

  const show = () => {
    const r = ref.current?.getBoundingClientRect()
    if (r) setCoords({ x: r.right + 8, y: r.top + r.height / 2 })
  }
  const hide = () => setCoords(null)

  return (
    <span
      ref={ref}
      className={cx('relative flex', className)}
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {coords &&
        createPortal(
          <span
            role="tooltip"
            style={{ position: 'fixed', left: coords.x, top: coords.y }}
            className="pointer-events-none z-[100] -translate-y-1/2 animate-fade-up whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[12px] font-medium text-paper shadow-[0_6px_20px_-6px_rgb(24_24_27/0.5)]"
          >
            {label}
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-ink" />
          </span>,
          document.body,
        )}
    </span>
  )
}

function initials(name?: string) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase() || '?'
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="shrink-0">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function PinIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M12 17v5" />
      <path d="M9 3h6l-.7 6.3 2.7 2.2a1 1 0 0 1-.63 1.77H6.63A1 1 0 0 1 6 11.5l2.7-2.2L9 3Z" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
      {[5, 12, 19].map((y) =>
        [5, 12, 19].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.7" />),
      )}
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M6 15l6-6 6 6" />
    </svg>
  )
}

function CollapseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
    </svg>
  )
}

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}

/** Aviso persistente quando a empresa ainda não conectou nenhum provedor. */
function NoProviderBanner({ isAdmin }: { isAdmin: boolean }) {
  const { data: keys } = useGetProviderKeysQuery(undefined, { skip: !isAdmin })
  const { data: sub } = useGetSubscriptionStatusQuery(undefined, { skip: !isAdmin })
  if (!isAdmin || keys === undefined) return null
  if (keys.length > 0 || sub?.active) return null
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line bg-paper-2 px-5 py-2.5">
      <p className="text-[13px] text-ink-2">
        Seus agentes ainda não têm inteligência conectada. Conecte uma
        assinatura ou uma chave de API para eles começarem a trabalhar.
      </p>
      <NavLink
        to="/office/settings"
        className="shrink-0 rounded-lg bg-ink px-3 py-1.5 text-[12px] font-medium text-paper"
      >
        Conectar agora
      </NavLink>
    </div>
  )
}
