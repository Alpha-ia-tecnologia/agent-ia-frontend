/**
 * Gera um PDF paginado a partir de um nó DOM já renderizado (estilos hex
 * próprios, pois o html2canvas não entende as cores oklch do Tailwind v4).
 * Rasteriza o nó e fatia a imagem por página, recuando a quebra até uma faixa
 * "em branco" para não cortar texto/linhas de tabela.
 */
export async function downloadNodeAsPdf(node: HTMLElement, fileName: string) {
  // libs pesadas: só carregam no clique.
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
  const pageCanvasH = Math.floor((usableH * canvas.width) / imgW)

  const srcCtx = canvas.getContext('2d')!
  const pixels = srcCtx.getImageData(0, 0, canvas.width, canvas.height).data
  const rowIsBlank = (y: number): boolean => {
    const base = y * canvas.width * 4
    for (let x = 0; x < canvas.width; x++) {
      const i = base + x * 4
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
    if (rendered + sliceH < canvas.height) {
      const floor = rendered + Math.floor(pageCanvasH * 0.6)
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
  pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`)
}

/** Estilos hex do corpo do PDF (independentes do tema da página). */
export const PDF_BODY_STYLES = `
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

export function slugifyFile(s: string) {
  return (
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/gu, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'documento'
  )
}
