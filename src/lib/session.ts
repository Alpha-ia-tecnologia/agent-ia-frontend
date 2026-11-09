import { useNavigate } from 'react-router-dom'
import { api } from '@/api/api'
import { setCredentials } from '@/store/authSlice'
import { useAppDispatch } from '@/store/hooks'
import type { AuthResponse } from '@/types'

/** Convite aberto antes do login/cadastro: volta para ele depois. */
const PENDING_INVITE = 'aao.pendingInvite'

export function rememberPendingInvite(code: string) {
  try {
    sessionStorage.setItem(PENDING_INVITE, code)
  } catch {
    /* navegação privada: segue sem lembrar */
  }
}

export function takePendingInvite(): string | null {
  try {
    const code = sessionStorage.getItem(PENDING_INVITE)
    sessionStorage.removeItem(PENDING_INVITE)
    return code
  } catch {
    return null
  }
}

export function peekPendingInvite(): string | null {
  try {
    return sessionStorage.getItem(PENDING_INVITE)
  } catch {
    return null
  }
}

/** Para onde vai quem acabou de entrar/trocar de organização. */
export function homeFor(res: Pick<AuthResponse, 'user' | 'onboardingStatus'>): string {
  const pending = peekPendingInvite()
  if (pending) return `/join/${pending}`
  if (!res.user.companyId) return '/welcome'
  if (res.user.role === 'MEMBER') return '/trilha'
  const status = res.onboardingStatus ?? res.user.onboardingStatus
  return status === 'COMPLETED' ? '/telao' : '/onboarding'
}

/**
 * Aplica uma sessão nova (login, cadastro, troca de org, convite aceito):
 * limpa o cache da org anterior antes — senão telas mostrariam dados dela.
 */
export function useEnterSession() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  return (res: AuthResponse, to?: string) => {
    dispatch(api.util.resetApiState())
    dispatch(setCredentials(res))
    const target = to ?? homeFor(res)
    // consumido aqui: se a pessoa recusar o convite, não volta para ele em
    // toda troca de org ou login seguinte
    takePendingInvite()
    navigate(target, { replace: true })
  }
}
