import { useGetCompanyQuery } from '@/api/api'
import { useAppSelector } from '@/store/hooks'

/**
 * Nome da organização ativa. Sessões salvas antes das organizações não têm
 * companyName: cai para a lista de orgs e, por fim, para a própria empresa.
 */
export function useOrgName(): string | null {
  const { user, orgs } = useAppSelector((s) => s.auth)
  const fromSession = user?.companyName ?? orgs.find((o) => o.id === user?.companyId)?.name
  const { data: company } = useGetCompanyQuery(undefined, {
    skip: !!fromSession || !user?.companyId,
  })
  return fromSession ?? company?.name ?? null
}
