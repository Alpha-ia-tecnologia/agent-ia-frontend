import {
  configureStore,
  createListenerMiddleware,
  isAnyOf,
} from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { api } from '@/api/api'
import authReducer, { logout, setCredentials } from './authSlice'
import streamReducer from './streamSlice'

// Ao trocar de conta (login/signup/logout) zera TODO o cache do RTK Query.
// Sem isto, dados da sessão anterior vazam para a nova conta na mesma aba —
// ex.: a chave de provider da empresa antiga aparecendo numa conta recém-criada.
const authListener = createListenerMiddleware()
authListener.startListening({
  matcher: isAnyOf(setCredentials, logout),
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(api.util.resetApiState())
  },
})

export const store = configureStore({
  reducer: {
    auth: authReducer,
    stream: streamReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefault) =>
    getDefault().prepend(authListener.middleware).concat(api.middleware),
})

// habilita refetchOnFocus/refetchOnReconnect dos endpoints RTK
setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
