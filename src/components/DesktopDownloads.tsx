import { useEffect, useState } from 'react'

interface ReleaseEntry {
  file: string
  url: string
  bytes: number
}
interface Manifest {
  version: string
  publishedAt: string
  platforms: {
    linux?: ReleaseEntry
    linuxDeb?: ReleaseEntry
    linuxRpm?: ReleaseEntry
    windows?: ReleaseEntry
    mac?: ReleaseEntry
  }
}

const MANIFEST_URL =
  (import.meta.env.VITE_RELEASES_MANIFEST_URL as string | undefined) ?? ''

function detectPlatform(): 'windows' | 'mac' | 'linux' {
  const ua = navigator.userAgent
  if (/Windows/i.test(ua)) return 'windows'
  if (/Mac/i.test(ua)) return 'mac'
  return 'linux'
}

function fmtSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`
}

/* Ícones dos sistemas operacionais (monocromáticos, usam currentColor). */
function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 448 512" className={className} fill="currentColor" aria-hidden>
      <path d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 480V268.4H203.8v177.9zm0-380.6v180.1H448V32L203.8 65.7z" />
    </svg>
  )
}
function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" className={className} fill="currentColor" aria-hidden>
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  )
}
function LinuxIcon({ className }: { className?: string }) {
  // Pinguim (Tux) estilizado, silhueta em cor única com olhos/bico vazados.
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 1.5c-3 0-5.2 2.4-5.2 5.6 0 1.6-.5 2.8-1.5 4.1-1.3 1.7-2.2 3.5-2.2 5.4 0 1 .5 1.8 1.5 2.1.5.2 1 .3 1.4.6-.4.4-.7 1-.7 1.6 0 .5.4.9.9.9.6 0 1.1-.3 1.5-.7.5.5 1.1.8 1.8 1 .6.1 1.9.1 2.5 0 .7-.2 1.3-.5 1.8-1 .4.4.9.7 1.5.7.5 0 .9-.4.9-.9 0-.6-.3-1.2-.7-1.6.4-.3.9-.4 1.4-.6 1-.3 1.5-1.1 1.5-2.1 0-1.9-.9-3.7-2.2-5.4-1-1.3-1.5-2.5-1.5-4.1C17.2 3.9 15 1.5 12 1.5zM10.2 6.1a1 1 0 100 2 1 1 0 000-2zm3.6 0a1 1 0 100 2 1 1 0 000-2zM12 8.7l1.5 1.3c0 .6-.8 1-1.5 1s-1.5-.4-1.5-1L12 8.7z"
      />
    </svg>
  )
}

const OS_ICON = {
  windows: WindowsIcon,
  mac: AppleIcon,
  linux: LinuxIcon,
} as const

/** Botões de download do AAO Desktop, alimentados pelo latest.json do bucket. */
export function DesktopDownloads() {
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!MANIFEST_URL) {
      setFailed(true)
      return
    }
    fetch(MANIFEST_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setManifest)
      .catch(() => setFailed(true))
  }, [])

  if (failed || (!manifest && !MANIFEST_URL)) {
    return (
      <p className="text-[12px] text-ink-3">
        Downloads do AAO Desktop em breve. Enquanto isso, use o conector via
        terminal.
      </p>
    )
  }
  if (!manifest) return null

  const current = detectPlatform()
  const buttons: { key: 'windows' | 'mac' | 'linux'; label: string; entry?: ReleaseEntry }[] = [
    { key: 'windows', label: 'Windows', entry: manifest.platforms.windows },
    { key: 'mac', label: 'macOS', entry: manifest.platforms.mac },
    { key: 'linux', label: 'Linux', entry: manifest.platforms.linux ?? manifest.platforms.linuxDeb },
  ]

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {buttons.map(({ key, label, entry }) => {
          if (!entry) return null
          const Icon = OS_ICON[key]
          return (
            <a
              key={key}
              href={entry.url}
              className={
                key === current
                  ? 'inline-flex items-center gap-2 rounded-lg bg-ink px-3.5 py-2 text-[13px] font-medium text-paper'
                  : 'inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-paper-2'
              }
            >
              <Icon className="size-4 shrink-0" />
              Baixar para {label} · {fmtSize(entry.bytes)}
            </a>
          )
        })}
      </div>
      <p className="mt-1.5 text-[11px] text-ink-3">
        Versão {manifest.version} ·{' '}
        {new Date(manifest.publishedAt).toLocaleDateString()}
        {manifest.platforms.linux && (manifest.platforms.linuxDeb || manifest.platforms.linuxRpm) && (
          <>
            {' '}· Linux também em{' '}
            {manifest.platforms.linuxDeb && (
              <a className="underline underline-offset-2" href={manifest.platforms.linuxDeb.url}>.deb</a>
            )}
            {manifest.platforms.linuxDeb && manifest.platforms.linuxRpm && ' / '}
            {manifest.platforms.linuxRpm && (
              <a className="underline underline-offset-2" href={manifest.platforms.linuxRpm.url}>.rpm</a>
            )}
          </>
        )}
      </p>
    </div>
  )
}
