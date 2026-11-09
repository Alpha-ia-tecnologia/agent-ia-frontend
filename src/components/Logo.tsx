const SIZES = {
  sm: { img: 24, text: 'text-sm' },
  md: { img: 32, text: 'text-base' },
  lg: { img: 40, text: 'text-xl' },
  xl: { img: 64, text: 'text-3xl' },
} as const

/** Logo oficial da Prefeitura ao lado do nome do seminário. */
export function Logo({
  size = 'md',
  className = '',
}: {
  size?: keyof typeof SIZES
  className?: string
}) {
  const { img, text } = SIZES[size]
  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap font-bold tracking-tight text-ink ${text} ${className}`}
    >
      <img src="/logo-prefeitura.png" alt="Prefeitura de São Luís" width={img} height={img} />
      Governo do Futuro
    </span>
  )
}

export const AnimatedLogo = Logo
