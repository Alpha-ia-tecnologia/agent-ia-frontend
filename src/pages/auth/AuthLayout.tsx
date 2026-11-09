import type { ReactNode } from 'react'
import { Logo } from '@/components/Logo'

/**
 * Entrada em duas colunas: à esquerda a capa do evento (oculta abaixo de lg),
 * à direita o formulário estreito. Em telas pequenas, logo acima do formulário.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      <aside
        className="relative hidden overflow-hidden lg:flex lg:w-1/2"
        style={{ background: 'var(--navy-800)' }}
      >
        <img
          src="/fundo-pontilhado.svg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="relative z-10 flex flex-col justify-center gap-4 py-16 pr-32 pl-16">
          <img src="/logo-prefeitura.png" alt="Prefeitura de São Luís" width={88} height={88} />
          <p
            className="m-0 text-xs font-extrabold uppercase"
            style={{ letterSpacing: '1.5px', color: 'var(--cyan-400)' }}
          >
            Seminário Governo do Futuro
          </p>
          <h1
            className="m-0 text-5xl font-bold"
            style={{ letterSpacing: '-1px', lineHeight: '56px', color: 'var(--white-50)' }}
          >
            Trilha da <span style={{ color: 'var(--lime-400)' }}>Inovação</span>
          </h1>
          <p className="m-0 text-lg" style={{ color: 'var(--text-on-inverse-muted)' }}>
            Laboratório de Inovação Aplicada à IA na Gestão Pública
          </p>
        </div>
        <div
          aria-hidden
          className="absolute top-0 right-0 bottom-0"
          style={{
            width: 96,
            backgroundImage: 'url(/azulejo.svg)',
            backgroundSize: '96px 96px',
          }}
        />
      </aside>

      <div className="flex w-full flex-1 flex-col lg:w-1/2">
        <main className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px] animate-fade-up">
            <Logo size="lg" className="mb-8 lg:hidden" />

            <div className="rounded-lg border border-line bg-paper p-8 sm:p-10">
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="mt-2 mb-8 text-sm leading-relaxed text-ink-2">{subtitle}</p>

              {children}
            </div>

            <p className="mt-4 text-center text-sm text-ink-2 [&_a]:inline-block [&_a]:py-3 [&_button]:inline-block [&_button]:py-3">
              {footer}
            </p>
          </div>
        </main>

        <footer className="pb-6 text-center text-xs text-ink-3">
          Prefeitura de São Luís · SEMISPE
        </footer>
      </div>
    </div>
  )
}
