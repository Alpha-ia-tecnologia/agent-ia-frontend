import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCreateOrgMutation, useSwitchOrgMutation } from '@/api/api'
import { Button, Field, Input, Spinner, Textarea } from '@/components/ui'
import { apiErrorMessage } from '@/lib/apiError'
import { useEnterSession } from '@/lib/session'
import { ROLE_LABEL } from '@/lib/roles'
import { logout } from '@/store/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { AuthLayout } from './auth/AuthLayout'

/** Sem organização ativa (ou indo para outra): entrar com código ou criar uma. */
export default function WelcomePage() {
  const { user, orgs } = useAppSelector((s) => s.auth)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const enterSession = useEnterSession()
  const [code, setCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [org, setOrg] = useState({ name: '', industry: '', businessDescription: '' })
  const [createOrg, { isLoading: savingOrg }] = useCreateOrgMutation()
  const [switchOrg] = useSwitchOrgMutation()

  function onJoin(e: FormEvent) {
    e.preventDefault()
    const clean = code.trim()
    if (clean) navigate(`/join/${encodeURIComponent(clean)}`)
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      enterSession(await createOrg(org).unwrap(), '/onboarding')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível criar a organização.'))
    }
  }

  return (
    <AuthLayout
      title={user ? `Olá, ${user.name.split(' ')[0]}` : 'Bem-vindo'}
      subtitle="Entre numa organização com o código do convite ou crie a sua."
      footer={
        <button
          className="underline underline-offset-2"
          onClick={() => {
            dispatch(logout())
            navigate('/login')
          }}
        >
          Sair da conta
        </button>
      }
    >
      <form onSubmit={onJoin} className="space-y-3">
        <Field label="Código do convite" hint="Está no QR code ou no link que você recebeu.">
          <Input
            autoFocus
            placeholder="K7P2-9QXA"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="text-center font-mono text-lg tracking-[0.2em]"
            autoCapitalize="characters"
            autoComplete="off"
          />
        </Field>
        <Button type="submit" className="w-full" disabled={!code.trim()}>
          Entrar com código
        </Button>
      </form>

      {orgs.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-medium text-ink-2">Suas organizações</p>
          <div className="divide-y divide-line rounded-lg border border-line">
            {orgs.map((o) => (
              <button
                key={o.id}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-ink/[0.03]"
                onClick={async () => {
                  try {
                    enterSession(await switchOrg(o.id).unwrap())
                  } catch (err) {
                    toast.error(apiErrorMessage(err))
                  }
                }}
              >
                <span className="truncate">{o.name}</span>
                <span className="text-[12px] text-ink-3">{ROLE_LABEL[o.role]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-line pt-5">
        {!creating ? (
          <Button variant="secondary" className="w-full" onClick={() => setCreating(true)}>
            Criar minha organização
          </Button>
        ) : (
          <form onSubmit={onCreate} className="space-y-4">
            <Field label="Nome da organização">
              <Input
                required
                autoFocus
                placeholder="Acme Ltda"
                value={org.name}
                onChange={(e) => setOrg((o) => ({ ...o, name: e.target.value }))}
              />
            </Field>
            <Field label="Área de atuação">
              <Input
                placeholder="Ex.: e-commerce de moda"
                value={org.industry}
                onChange={(e) => setOrg((o) => ({ ...o, industry: e.target.value }))}
              />
            </Field>
            <Field label="Descrição do negócio">
              <Textarea
                rows={3}
                placeholder="O que a empresa faz, para quem, e os principais desafios…"
                value={org.businessDescription}
                onChange={(e) => setOrg((o) => ({ ...o, businessDescription: e.target.value }))}
              />
            </Field>
            <Button type="submit" className="w-full" disabled={savingOrg}>
              {savingOrg ? <Spinner className="border-t-paper border-paper/40" /> : 'Criar organização'}
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}

