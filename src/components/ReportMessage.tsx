import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { Button, Spinner } from '@/components/ui'

export interface ReportSpec {
  titulo: string
  /** corpo do relatório em Markdown */
  markdown: string
  geradoEm: string
}

/**
 * Estilos do PDF em HEX explícito (não Tailwind): o html2canvas por trás do
 * jsPDF.html() não entende as cores oklch do Tailwind v4, então o nó usado
 * para gerar o arquivo tem estilo próprio, independente do tema da página.
 */
const PDF_STYLES = `
.aao-pdf-body h1,.aao-pdf-body h2,.aao-pdf-body h3,.aao-pdf-body h4{color:#18181b;margin:16px 0 6px;line-height:1.3;font-weight:600}
.aao-pdf-body h2{font-size:16px}
.aao-pdf-body h3{font-size:14px}
.aao-pdf-body h4{font-size:13px}
.aao-pdf-body p{margin:0 0 8px}
.aao-pdf-body ul,.aao-pdf-body ol{margin:0 0 8px;padding-left:20px}
.aao-pdf-body li{margin:2px 0}
.aao-pdf-body table{border-collapse:collapse;width:100%;margin:8px 0;font-size:12px}
.aao-pdf-body th,.aao-pdf-body td{border:1px solid #d4d4d8;padding:5px 8px;text-align:left;vertical-align:top}
.aao-pdf-body th{background:#f4f4f5;font-weight:600}
.aao-pdf-body a{color:#2563eb;text-decoration:underline}
.aao-pdf-body code{background:#f4f4f5;padding:1px 4px;border-radius:3px;font-size:12px}
.aao-pdf-body blockquote{margin:0 0 8px;padding-left:12px;border-left:3px solid #d4d4d8;color:#52525b}
.aao-pdf-body hr{border:none;border-top:1px solid #e4e4e7;margin:12px 0}
`

function slugify(s: string) {
  return (
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/gu, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'relatorio'
  )
}

/** Relatório do agente exibido na conversa, com download do PDF no navegador. */
export function ReportMessage({ spec }: { spec: ReportSpec }) {
  const pdfRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)

  async function download() {
    const node = pdfRef.current
    if (!node || busy) return
    setBusy(true)
    try {
      // libs pesadas: só carregam no clique. Rasterizamos o nó com html2canvas
      // e paginamos a imagem — o renderizador de texto do jsPDF.html() sobrepõe
      // as linhas; a imagem sai idêntica à prévia.
      const { jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: '#ffffff',
        windowWidth: 720,
        logging: false,
      })

      const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
      const margin = 40
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgW = pageW - margin * 2
      const usableH = pageH - margin * 2
      // altura (em px do canvas) que cabe em uma página
      const pageCanvasH = Math.floor((usableH * canvas.width) / imgW)

      // Para não cortar texto/linhas de tabela na quebra: lê os pixels e procura
      // uma linha "em branco" perto do fim da página para quebrar ali.
      const srcCtx = canvas.getContext('2d')!
      const pixels = srcCtx.getImageData(0, 0, canvas.width, canvas.height).data
      const rowIsBlank = (y: number): boolean => {
        const base = y * canvas.width * 4
        for (let x = 0; x < canvas.width; x++) {
          const i = base + x * 4
          // ~branco: todos os canais claros (borda de tabela #d4d4d8 não passa)
          if (pixels[i] < 245 || pixels[i + 1] < 245 || pixels[i + 2] < 245) {
            return false
          }
        }
        return true
      }

      let rendered = 0
      let page = 0
      while (rendered < canvas.height) {
        let sliceH = Math.min(pageCanvasH, canvas.height - rendered)
        // se não é a última fatia, recua a quebra até achar uma faixa em branco
        if (rendered + sliceH < canvas.height) {
          const floor = rendered + Math.floor(pageCanvasH * 0.6) // não encolher demais
          let cut = rendered + sliceH
          while (cut > floor && !rowIsBlank(cut)) cut--
          if (cut > floor) sliceH = cut - rendered
        }
        const slice = document.createElement('canvas')
        slice.width = canvas.width
        slice.height = sliceH
        const ctx = slice.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, slice.width, sliceH)
        ctx.drawImage(canvas, 0, rendered, canvas.width, sliceH, 0, 0, canvas.width, sliceH)
        if (page > 0) pdf.addPage()
        pdf.addImage(
          slice.toDataURL('image/png'),
          'PNG',
          margin,
          margin,
          imgW,
          (sliceH * imgW) / canvas.width,
        )
        rendered += sliceH
        page++
      }
      pdf.save(`${slugify(spec.titulo)}.pdf`)
    } catch {
      toast.error('Não foi possível gerar o PDF.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <figure className="my-2 overflow-hidden rounded-xl border border-line bg-paper">
      <figcaption className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <span className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-ink">
          <span aria-hidden>📄</span>
          <span className="truncate">{spec.titulo}</span>
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
      <div className="prose-chat max-h-96 overflow-auto px-4 py-3 text-sm text-ink">
        <Markdown remarkPlugins={[remarkGfm]}>{spec.markdown}</Markdown>
      </div>

      {/* Nó fora da tela, com estilos hex próprios, usado só para gerar o PDF.
          Vai num portal para o <body>: dentro do balão (que tem animate-fade-up
          → transform persistente por causa do fill-mode `both`), o position:fixed
          vira absolute e a altura do relatório entrava no scroll, criando um
          espaço em branco enorme abaixo da mensagem. */}
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
            <style>{PDF_STYLES}</style>
            <h1
              style={{
                fontSize: 20,
                margin: '0 0 12px',
                color: '#18181b',
                fontWeight: 700,
              }}
            >
              {spec.titulo}
            </h1>
            <div className="aao-pdf-body">
              <Markdown remarkPlugins={[remarkGfm]}>{spec.markdown}</Markdown>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </figure>
  )
}
