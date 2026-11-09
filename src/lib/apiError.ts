export function apiErrorMessage(err: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (typeof err === 'object' && err !== null) {
    const e = err as { data?: { message?: string | string[] }; error?: string }
    const msg = e.data?.message
    if (Array.isArray(msg)) return msg.join(', ')
    if (typeof msg === 'string') return msg
    if (e.error === 'TypeError: Failed to fetch' || e.error?.includes('fetch'))
      return 'Não foi possível conectar ao servidor.'
  }
  return fallback
}
