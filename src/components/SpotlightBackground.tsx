import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * Fundo decorativo da área de autenticação.
 *
 * Camadas (de baixo p/ cima):
 *  1. base "paper" + grade de pontos sutil (textura corporativa/Notion);
 *  2. glow radial suave que segue o cursor (toque das cores da marca);
 *  3. mesma grade em versão "acesa", revelada só perto do cursor via máscara
 *     radial — dá a sensação de a textura brilhar quando o mouse passa.
 *
 * O cursor é lido via requestAnimationFrame + CSS vars (--mx/--my), sem
 * re-render do React. Em prefers-reduced-motion fica só a textura estática.
 */
export function SpotlightBackground({
  baseClassName = 'bg-paper',
  position = 'fixed',
}: {
  /** Classe de fundo base (ex.: bg-paper-2 quando os cards são brancos). */
  baseClassName?: string
  /** 'fixed' cobre a viewport; 'absolute' preenche o container relativo pai. */
  position?: 'fixed' | 'absolute'
} = {}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const el = ref.current
    if (!el) return

    let raf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        // coordenadas relativas ao próprio elemento — funciona igual para
        // 'fixed' (rect na origem da viewport) e 'absolute' (offset do pai).
        const rect = el.getBoundingClientRect()
        el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
        el.style.setProperty('--my', `${e.clientY - rect.top}px`)
        el.style.setProperty('--on', '1')
      })
    }
    const onLeave = () => el.style.setProperty('--on', '0')

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [reduced])

  // grade de pontos (a mesma geometria nas duas versões: base e "acesa")
  const dot = (color: string) =>
    `radial-gradient(circle at 1px 1px, ${color} 1px, transparent 0)`
  const DOT_SIZE = '22px 22px'

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none inset-0 overflow-hidden ${
        position === 'fixed' ? 'fixed -z-10' : 'absolute z-0'
      } ${baseClassName}`}
      style={{ ['--mx' as string]: '50%', ['--my' as string]: '50%', ['--on' as string]: '0' }}
    >
      {/* 1. textura base — pontos quase imperceptíveis */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: dot('rgb(24 24 27 / 0.045)'),
          backgroundSize: DOT_SIZE,
        }}
      />

      {/* 2. glow que segue o cursor (marca, opacidade baixíssima) */}
      <div
        className="absolute inset-0 transition-opacity duration-500 ease-out"
        style={{
          opacity: 'var(--on)',
          background:
            'radial-gradient(420px circle at var(--mx) var(--my), rgb(99 102 241 / 0.06), rgb(236 72 153 / 0.04) 38%, transparent 68%)',
        }}
      />

      {/* 3. grade "acesa" revelada perto do cursor */}
      <div
        className="absolute inset-0 transition-opacity duration-500 ease-out"
        style={{
          opacity: 'var(--on)',
          backgroundImage: dot('rgb(99 102 241 / 0.32)'),
          backgroundSize: DOT_SIZE,
          WebkitMaskImage:
            'radial-gradient(240px circle at var(--mx) var(--my), #000 0%, transparent 65%)',
          maskImage:
            'radial-gradient(240px circle at var(--mx) var(--my), #000 0%, transparent 65%)',
        }}
      />
    </div>
  )
}
