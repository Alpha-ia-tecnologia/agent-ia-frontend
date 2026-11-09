import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  useActivateSubscriptionMutation,
  useExchangeAnthropicCodeMutation,
  useGetAnthropicAuthUrlMutation,
  useGetSubscriptionStatusQuery,
  useLazyGetSubscriptionFlowQuery,
  useStartSubscriptionFlowMutation,
} from '@/api/api'
import { apiErrorMessage } from '@/lib/apiError'
import { Button, Field, Input, Modal, Select, Spinner } from '@/components/ui'

export const SUBSCRIPTIONS: {
  key: string
  statusKey: string
  label: string
  hint: string
  models: string[]
  kind: 'device' | 'paste'
}[] = [
  { key: 'openai-codex', statusKey: 'openai-codex', label: 'ChatGPT (Plus/Pro)', hint: 'Login com sua conta ChatGPT via código', models: ['gpt-5.1-codex', 'gpt-5.1-codex-mini', 'gpt-5-codex'], kind: 'device' },
  { key: 'anthropic-oauth', statusKey: 'anthropic', label: 'Claude (Pro/Max)', hint: 'Autorize no navegador e cole o código', models: ['claude-sonnet-4-6', 'claude-opus-4-8', 'claude-haiku-4-5'], kind: 'paste' },
  { key: 'copilot', statusKey: 'copilot', label: 'GitHub Copilot', hint: 'Login com sua conta GitHub via código', models: ['gpt-5', 'gpt-4.1'], kind: 'device' },
  { key: 'nous', statusKey: 'nous', label: 'Nous Research', hint: 'Login no portal Nous via código', models: ['hermes-4.5', 'hermes-4-70b'], kind: 'device' },
  { key: 'xai-oauth', statusKey: 'xai-oauth', label: 'xAI Grok (SuperGrok)', hint: 'Login com sua conta xAI via código', models: ['grok-4', 'grok-4-fast'], kind: 'device' },
]

export function ActivateButton({
  provider,
  models,
  label = 'Usar como provider',
  currentModel,
  variant,
}: {
  provider: string
  models: string[]
  label?: string
  currentModel?: string
  variant?: 'secondary' | 'ghost'
}) {
  const [activate, { isLoading }] = useActivateSubscriptionMutation()
  const [open, setOpen] = useState(false)
  // pré-seleciona o modelo atual (quando é "trocar modelo"); se for um modelo
  // fora da lista, cai em "Outro (digitar)".
  const customInitial = !!currentModel && !models.includes(currentModel)
  const [choice, setChoice] = useState(customInitial ? '__outro__' : (currentModel ?? models[0]))
  const [custom, setCustom] = useState(customInitial ? currentModel! : '')
  const model = choice === '__outro__' ? custom : choice
  return (
    <>
      <Button variant={variant} className="h-8 text-[12px]" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={currentModel ? 'Trocar o modelo da assinatura' : 'Ativar assinatura como provider'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              disabled={isLoading || !model.trim()}
              onClick={async () => {
                try {
                  await activate({ provider, model: model.trim() }).unwrap()
                  toast.success(
                    currentModel
                      ? 'Modelo atualizado. Os agentes vão usá-lo nas próximas conversas.'
                      : 'Assinatura ativada. Os agentes vão usá-la nas próximas conversas.',
                  )
                  setOpen(false)
                } catch (err) {
                  toast.error(apiErrorMessage(err))
                }
              }}
            >
              {isLoading ? <Spinner /> : 'Ativar'}
            </Button>
          </>
        }
      >
        <Field label="Modelo" hint="Modelo que os agentes usarão nesta assinatura.">
          <Select value={choice} onChange={(e) => setChoice(e.target.value)}>
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
            <option value="__outro__">Outro (digitar)…</option>
          </Select>
        </Field>
        {choice === '__outro__' && (
          <Field label="Nome do modelo">
            <Input
              placeholder="ex.: claude-sonnet-4-6"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              autoFocus
            />
          </Field>
        )}
      </Modal>
    </>
  )
}

export function ConnectModal({
  sub,
  onClose,
}: {
  sub: (typeof SUBSCRIPTIONS)[number]
  onClose: () => void
}) {
  const [start] = useStartSubscriptionFlowMutation()
  const [pollFlow] = useLazyGetSubscriptionFlowQuery()
  const [getUrl] = useGetAnthropicAuthUrlMutation()
  const [exchange, { isLoading: exchanging }] = useExchangeAnthropicCodeMutation()
  const { refetch } = useGetSubscriptionStatusQuery()

  const [verification, setVerification] = useState<{ uri: string; code: string } | null>(null)
  const [authUrl, setAuthUrl] = useState<string | null>(null)
  const [pasted, setPasted] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        if (sub.kind === 'device') {
          const res = await start(sub.key).unwrap()
          if (cancelled) return
          setVerification(res.verification ?? null)
          timer.current = setInterval(async () => {
            try {
              const flow = await pollFlow(sub.key).unwrap()
              // o código pode chegar só no polling (o start pode retornar antes
              // do device code emitir) — aplica sempre que vier.
              if (flow.verification) setVerification(flow.verification)
              if (flow.status === 'connected') {
                setConnected(true)
                if (timer.current) clearInterval(timer.current)
                void refetch()
              } else if (flow.status === 'error' || flow.status === 'expired') {
                setError(flow.error ?? 'O login expirou. Tente novamente.')
                if (timer.current) clearInterval(timer.current)
              }
            } catch {
              /* mantém o polling */
            }
          }, 4000)
        } else {
          const res = await getUrl().unwrap()
          if (!cancelled) setAuthUrl(res.auth_url)
        }
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, 'Não foi possível iniciar o login.'))
      }
    }
    void boot()
    return () => {
      cancelled = true
      if (timer.current) clearInterval(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Modal
      open
      onClose={onClose}
      title={`Conectar ${sub.label}`}
      footer={<Button variant="ghost" onClick={onClose}>{connected ? 'Fechar' : 'Cancelar'}</Button>}
    >
      {error && <p className="text-[13px] text-danger">{error}</p>}
      {connected && (
        <p className="text-[14px]">
          ✓ Conectado! Agora clique em <strong>Usar como provider</strong> para os agentes usarem esta assinatura.
        </p>
      )}

      {!error && !connected && sub.kind === 'device' && (
        verification ? (
          <div className="space-y-3 text-center">
            <p className="text-[13px] text-ink-2">1. Abra este endereço no navegador:</p>
            <a
              href={verification.uri}
              target="_blank"
              rel="noreferrer"
              className="block truncate text-[14px] font-medium underline underline-offset-2"
            >
              {verification.uri}
            </a>
            <p className="text-[13px] text-ink-2">2. Digite o código:</p>
            <p className="select-all font-mono text-2xl font-semibold tracking-widest">
              {verification.code}
            </p>
            <p className="flex items-center justify-center gap-2 text-[12px] text-ink-3">
              <Spinner className="size-3" /> Aguardando você autorizar…
            </p>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-[13px] text-ink-2">
            <Spinner /> Iniciando o login…
          </p>
        )
      )}

      {!error && !connected && sub.kind === 'paste' && (
        authUrl ? (
          <div className="space-y-4">
            <p className="text-[13px] text-ink-2">
              1. Abra o endereço abaixo, faça login com sua conta Claude e autorize.
              Você verá um código, copie e cole aqui.
            </p>
            <a
              href={authUrl}
              target="_blank"
              rel="noreferrer"
              className="block truncate text-[13px] font-medium underline underline-offset-2"
            >
              {authUrl}
            </a>
            <Field label="Código de autorização">
              <Input
                placeholder="cole o código aqui"
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
              />
            </Field>
            <Button
              disabled={exchanging || !pasted.trim()}
              onClick={async () => {
                try {
                  await exchange(pasted.trim()).unwrap()
                  setConnected(true)
                } catch (err) {
                  setError(apiErrorMessage(err, 'Código inválido. Gere uma nova URL e tente de novo.'))
                }
              }}
            >
              {exchanging ? <Spinner /> : 'Confirmar código'}
            </Button>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-[13px] text-ink-2">
            <Spinner /> Gerando URL de autorização…
          </p>
        )
      )}
    </Modal>
  )
}
