import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Mudou a key (ex.: rota) → o boundary se recupera sozinho. */
  resetKey?: string
}
interface State {
  error: Error | null
}

/**
 * Barreira de erro de renderização: em vez de tela branca, mostra um aviso
 * amigável com opção de recarregar. O erro completo vai para o console.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex h-full min-h-64 items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h2 className="text-[15px] font-semibold">Algo deu errado nesta tela</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
            Ocorreu um erro inesperado ao exibir esta parte da aplicação. Suas
            conversas e dados estão intactos.
          </p>
          <p className="mt-2 rounded-lg bg-paper-3 px-3 py-1.5 font-mono text-[11px] text-ink-3">
            {this.state.error.message.slice(0, 160)}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => this.setState({ error: null })}
              className="rounded-lg border border-line px-3.5 py-1.5 text-[13px] font-medium hover:bg-paper-2"
            >
              Tentar de novo
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-ink px-3.5 py-1.5 text-[13px] font-medium text-paper"
            >
              Recarregar página
            </button>
          </div>
        </div>
      </div>
    )
  }
}
