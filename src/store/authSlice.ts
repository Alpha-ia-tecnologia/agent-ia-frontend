import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthResponse, OnboardingStatus, OrgSummary, SessionUser } from '@/types'

interface AuthState {
  token: string | null
  user: SessionUser | null
  onboardingStatus: OnboardingStatus | null
  /** organizações da pessoa (seletor) */
  orgs: OrgSummary[]
}

const STORAGE_KEY = 'aao.auth'

function load(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { orgs: [], ...(JSON.parse(raw) as Partial<AuthState>) } as AuthState
  } catch {
    /* ignore */
  }
  return { token: null, user: null, onboardingStatus: null, orgs: [] }
}

function persist(state: AuthState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const authSlice = createSlice({
  name: 'auth',
  initialState: load(),
  reducers: {
    setCredentials(state, action: PayloadAction<AuthResponse>) {
      const { token, user } = action.payload
      state.token = token
      state.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: user.companyName ?? null,
      }
      if (action.payload.orgs) state.orgs = action.payload.orgs
      state.onboardingStatus = user.companyId
        ? (action.payload.onboardingStatus ?? user.onboardingStatus ?? 'PENDING')
        : null
      persist(state)
    },
    setOnboardingStatus(state, action: PayloadAction<OnboardingStatus>) {
      state.onboardingStatus = action.payload
      persist(state)
    },
    logout(state) {
      state.token = null
      state.user = null
      state.onboardingStatus = null
      state.orgs = []
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})

export const { setCredentials, setOnboardingStatus, logout } =
  authSlice.actions
export default authSlice.reducer
