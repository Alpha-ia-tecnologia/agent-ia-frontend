import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useGetMyOrgsQuery, useSwitchOrgMutation } from '@/api/api'
import { DropdownMenu, cx, type DropdownItem } from '@/components/ui'
import { apiErrorMessage } from '@/lib/apiError'
import { useEnterSession } from '@/lib/session'
import { useOrgName } from '@/lib/useOrgName'
import { useAppSelector } from '@/store/hooks'

const initials = (name?: string | null) =>
  (name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

/** Organização ativa + troca entre as organizações da pessoa (como no GitHub). */
export function OrgSwitcher({ collapsed }: { collapsed: boolean }) {
  const { user, orgs: sessionOrgs } = useAppSelector((s) => s.auth)
  const [open, setOpen] = useState(false)
  // ao abrir, busca de novo: a pessoa pode ter entrado em outra org em outra aba
  const { data: freshOrgs } = useGetMyOrgsQuery(undefined, { skip: !open })
  const [switchOrg] = useSwitchOrgMutation()
  const enterSession = useEnterSession()
  const navigate = useNavigate()
  const orgs = freshOrgs ?? sessionOrgs
  const orgName = useOrgName()

  const items: DropdownItem[] = [
    ...orgs
      .filter((o) => o.id !== user?.companyId)
      .map((o) => ({
        label: `Trocar para ${o.name}`,
        onSelect: async () => {
          try {
            enterSession(await switchOrg(o.id).unwrap())
          } catch (err) {
            toast.error(apiErrorMessage(err, 'Não foi possível trocar de organização.'))
          }
        },
      })),
    { label: 'Entrar com código de convite', onSelect: () => navigate('/welcome') },
    { label: 'Criar organização', onSelect: () => navigate('/welcome') },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={collapsed ? (orgName ?? 'Organização') : undefined}
        className={cx(
          'flex items-center gap-2 rounded-md text-left transition-colors duration-150 hover:bg-ink/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink',
          collapsed ? 'size-8 justify-center' : 'w-full px-2 py-1.5',
        )}
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-ink text-[10px] font-semibold text-paper">
          {initials(orgName)}
        </span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">
                {orgName ?? 'Organização'}
              </span>
              <span className="block text-[11px] text-ink-3">
                {orgs.length > 1 ? `${orgs.length} organizações` : 'Trocar ou entrar em outra'}
              </span>
            </span>
            <span aria-hidden className="text-ink-3">
              ⇅
            </span>
          </>
        )}
      </button>
      <DropdownMenu
        open={open}
        onClose={() => setOpen(false)}
        items={items}
        align="left"
        className="bottom-full mb-1 mt-0 w-64"
      />
    </div>
  )
}
