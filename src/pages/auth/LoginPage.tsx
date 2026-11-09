import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useEnterEventMutation, useLoginMutation } from '@/api/api'
import { useEnterSession } from '@/lib/session'
import { apiErrorMessage } from '@/lib/apiError'
import { Button, Field, Input, Spinner } from '@/components/ui'
import { AuthLayout } from './AuthLayout'

const linkClass = 'font-medium text-ink underline underline-offset-2'
const spinner = <Spinner className="border-t-paper border-paper/40" />

/** Participantes entram só com o nome; e-mail e senha são do organizador. */
export default function LoginPage() {
  const [params] = useSearchParams()
  const [withPassword, setWithPassword] = useState(params.get('modo') === 'senha')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [login, { isLoading }] = useLoginMutation()
  const [enterEvent, { isLoading: entering }] = useEnterEventMutation()
  const enterSession = useEnterSession()

  async function onName(e: FormEvent) {
    e.preventDefault()
    try {
      enterSession(await enterEvent({ name }).unwrap())
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível entrar. Tente de novo.'))
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      enterSession(await login({ email, password }).unwrap())
    } catch (err) {
      toast.error(apiErrorMessage(err, 'E-mail ou senha inválidos.'))
    }
  }

  if (!withPassword) {
    return (
      <AuthLayout
        title="Entrar no laboratório"
        subtitle="Digite seu nome. Vamos colocar você em uma mesa."
        footer={
          <>
            Organiza o evento?{' '}
            <button type="button" className={linkClass} onClick={() => setWithPassword(true)}>
              Entrar com e-mail e senha
            </button>
          </>
        }
      >
        <form onSubmit={onName} className="space-y-5">
          <Field label="Seu nome">
            <Input
              required
              autoFocus
              minLength={2}
              maxLength={80}
              autoComplete="name"
              placeholder="Ex.: Ana Souza"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Button
            type="submit"
            className="mt-1 h-10 w-full"
            disabled={entering || name.trim().length < 2}
          >
            {entering ? spinner : 'Entrar'}
          </Button>
        </form>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesso de quem organiza o evento."
      footer={
        <>
          <button type="button" className={linkClass} onClick={() => setWithPassword(false)}>
            Entrar só com o nome
          </button>
          {' · '}
          <Link to="/signup" className={linkClass}>
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="E-mail">
          <Input
            type="email"
            required
            autoFocus
            placeholder="voce@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Senha">
          <Input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" className="mt-1 h-10 w-full" disabled={isLoading}>
          {isLoading ? spinner : 'Entrar'}
        </Button>
      </form>
    </AuthLayout>
  )
}
