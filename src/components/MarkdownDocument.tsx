import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { Button, Spinner, cx } from '@/components/ui'
import { PDF_BODY_STYLES, downloadNodeAsPdf, slugifyFile } from '@/lib/markdownPdf'

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0 text-ink-3" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
    </svg>
  )
}

/**
 * Documento em Markdown com prévia rolável (altura limitada) e botão para
 * baixar como PDF. Reutilizado no relatório do chat e nos requisitos do projeto.
 */
export function MarkdownDocument({
  title,
  markdown,
  fileName,
  previewClassName = 'max-h-[520px]',
  className,
}: {
  title: string
  markdown: string
  fileName?: string
  previewClassName?: string
  className?: string
}) {
  const pdfRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)

  async function download() {
    const node = pdfRef.current
    if (!node || busy) return
    setBusy(true)
    try {
      await downloadNodeAsPdf(node, slugifyFile(fileName ?? title))
    } catch {
      toast.error('Não foi possível gerar o PDF.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <figure className={cx('overflow-hidden rounded-xl border border-line bg-paper', className)}>
      <figcaption className="flex items-center justify-between gap-3 border-b border-line bg-paper-2 px-4 py-2.5">
        <span className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-ink">
          <FileIcon />
          <span className="truncate">{title}</span>
        </span>
        <Button
          variant="secondary"
          className="h-8 shrink-0 text-[12px]"
          disabled={busy}
          onClick={download}
        >
          {busy ? <Spinner /> : 'Baixar PDF'}
        </Button>
      </figcaption>
      <div className={cx('prose-chat scroll-thin overflow-auto px-4 py-3 text-sm text-ink', previewClassName)}>
        <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>
      </div>

      {/* Nó fora da tela, com estilos hex próprios, usado só para gerar o PDF. */}
      {createPortal(
        <div style={{ position: 'fixed', left: -99999, top: 0 }} aria-hidden>
          <div
            ref={pdfRef}
            style={{
              width: 720,
              padding: 24,
              background: '#ffffff',
              color: '#18181b',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            <style>{PDF_BODY_STYLES}</style>
            <h1 style={{ fontSize: 20, margin: '0 0 12px', color: '#18181b', fontWeight: 700 }}>
              {title}
            </h1>
            <div className="aao-pdf-body">
              <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </figure>
  )
}
