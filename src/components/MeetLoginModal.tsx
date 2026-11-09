import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  useCancelConnectSessionMutation,
  useFinishConnectSessionMutation,
  useStartConnectSessionMutation,
  type MeetingBotProvider,
} from '@/api/api'
import { apiErrorMessage } from '@/lib/apiError'
import { Button, Spinner } from '@/components/ui'

const W = 1440
const H = 900

/**
 * Login hospedado: abre um browser ao vivo (streamado via CDP) dentro do painel
 * para o admin logar na conta do escritório e capturar a sessão sem terminal.
 * Os frames chegam por WebSocket (JPEG base64) e desenhamos no canvas; mouse e
 * teclado são reenviados ao browser hospedado.
 */
export function MeetLoginModal({
  open,
  provider,
  onClose,
  onConnected,
}: {
  open: boolean
  provider: MeetingBotProvider
  onClose: () => void
  onConnected: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const sessionRef = useRef<{ sessionId: string; token: string } | null>(null)
  const [start] = useStartConnectSessionMutation()
  const [finish, { isLoading: finishing }] = useFinishConnectSessionMutation()
  const [cancel] = useCancelConnectSessionMutation()
  const [email, setEmail] = useState('')
  const [live, setLive] = useState(false)

  useEffect(() => {
    if (!open) return
    let disposed = false

    void (async () => {
      try {
        const s = await start({ provider }).unwrap()
        if (disposed) return
        sessionRef.current = { sessionId: s.sessionId, token: s.token }
        const ws = new WebSocket(s.wsUrl)
        wsRef.current = ws
        ws.onmessage = (ev) => {
          let msg: { t: string; data?: string }
          try {
            msg = JSON.parse(ev.data as string)
          } catch {
            return
          }
          if (msg.t === 'ready') setLive(true)
          if (msg.t === 'frame' && msg.data) drawFrame(msg.data)
        }
        ws.onclose = () => setLive(false)
      } catch (err) {
        toast.error(apiErrorMessage(err, 'Não foi possível abrir a sessão de login.'))
        onClose()
      }
    })()

    return () => {
      disposed = true
      wsRef.current?.close()
      wsRef.current = null
      const sess = sessionRef.current
      if (sess) void cancel({ sessionId: sess.sessionId })
      sessionRef.current = null
      setLive(false)
      setEmail('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, provider])

  function drawFrame(b64: string) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.onload = () => ctx.drawImage(img, 0, 0, W, H)
    img.src = `data:image/jpeg;base64,${b64}`
  }

  function send(msg: Record<string, unknown>) {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
  }

  function toPage(e: React.MouseEvent) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const r = canvas.getBoundingClientRect()
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height }
  }

  function onMouse(type: string, button: 'left' | 'none' = 'none') {
    return (e: React.MouseEvent) => {
      const { x, y } = toPage(e)
      send({ t: 'mouse', type, x, y, button, clickCount: button === 'left' ? 1 : 0 })
    }
  }

  function onKey(e: React.KeyboardEvent) {
    e.preventDefault()
    if (e.type === 'keydown') {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        send({ t: 'key', type: 'char', text: e.key })
      } else {
        send({ t: 'key', type: 'keyDown', key: e.key, code: e.code, keyCode: e.keyCode })
      }
    } else if (e.key.length !== 1) {
      send({ t: 'key', type: 'keyUp', key: e.key, code: e.code, keyCode: e.keyCode })
    }
  }

  async function onFinish() {
    const sess = sessionRef.current
    if (!sess) return
    try {
      await finish({
        sessionId: sess.sessionId,
        token: sess.token,
        provider,
        email: email.trim() || undefined,
      }).unwrap()
      toast.success('Conta conectada.')
      sessionRef.current = null // já derrubada pelo backend
      onConnected()
      onClose()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível concluir. Refaça o login.'))
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[95vh] w-full max-w-[min(1400px,96vw)] flex-col overflow-hidden rounded-xl bg-paper shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <div className="text-[13px] font-semibold">
              Conectar conta {provider === 'GOOGLE' ? 'Google' : 'Microsoft'}
            </div>
            <div className="text-[11px] text-ink-3">
              Faça login na conta do escritório na janela abaixo. Quando estiver logado, clique em Concluí o login.
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>

        <div className="relative flex-1 overflow-auto bg-paper-3">
          {!live ? (
            <div className="flex h-64 items-center justify-center gap-2 text-[12px] text-ink-3">
              <Spinner /> Abrindo navegador seguro…
            </div>
          ) : null}
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            tabIndex={0}
            className={`mx-auto block h-auto w-full outline-none ${live ? '' : 'hidden'}`}
            onMouseMove={onMouse('mouseMoved')}
            onMouseDown={onMouse('mousePressed', 'left')}
            onMouseUp={onMouse('mouseReleased', 'left')}
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={onKey}
            onKeyUp={onKey}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
          <input
            type="email"
            placeholder="e-mail da conta (opcional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-9 w-64 rounded-lg border border-line px-3 text-sm"
          />
          <Button onClick={onFinish} disabled={!live || finishing}>
            {finishing ? <Spinner className="mr-1" /> : null} Concluí o login
          </Button>
        </div>
      </div>
    </div>
  )
}
