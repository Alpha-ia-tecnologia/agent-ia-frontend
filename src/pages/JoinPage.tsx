import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useAcceptInviteMutation,
  useEnterWithCodeMutation,
  usePreviewInviteQuery,
} from '@/api/api'
import { Button, Field, Input, Spinner } from '@/components/ui'
import { apiErrorMessage } from '@/lib/apiError'
import { rememberPendingInvite, takePendingInvite, useEnterSession } from '@/lib/session'
import { useAppSelector } from '@/store/hooks'
import { AuthLayout } from './auth/AuthLayout'

/** /join/:code — aberto pelo link, pelo QR code ou pelo código digitado. */
export default function JoinPage() {
  const { code = '' } = useParams()
  const token = useAppSelector((s) => s.auth.token)
  const { data: invite, error, isLoading } = usePreviewInviteQuery(code)
  const [accept, { isLoading: joining }] = useAcceptInviteMutation()
  const [enter, { isLoading: entering }] = useEnterWithCodeMutation()
  const [name, setName] = useState('')
  const enterSession = useEnterSession()

  // sem login: guarda o convite e volta para ele depois do cadastro/login
  useEffect(() => {
    if (!token && code) rememberPendingInvite(code)
  }, [token, code])
  // convite inválido não pode prender a pessoa: esquece o pendente
  useEffect(() => {
    if (error && !(token && (error as { status?: number }).status === 410)) takePendingInvite()
  }, [error, token])

  async function onAccept() {
    try {
      const res = await accept(code).unwrap()
      takePendingInvite()
      enterSession(res)
      toast.success(`Você entrou em ${invite?.companyName ?? 'na organização'}.`)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível entrar com este convite.'))
    }
  }

  async function onEnter(e: FormEvent) {
    e.preventDefault()
    try {
      const res = await enter({ code, name }).unwrap()
      takePendingInvite()
      enterSession(res)
      toast.success(`Você entrou em ${invite?.companyName ?? 'no evento'}.`)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível entrar com este código.'))
    }
  }

  if (isLoading) {
    return (
      <AuthLayout title="Convite" subtitle="Conferindo o convite…" footer={null}>
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      </AuthLayout>
    )
  }

  // logado + convite que não vale mais (410): quem já é membro ainda entra
  // (o aceite resolve); para quem não é, o aceite mostra o motivo
  const gone = (error as { status?: number } | undefined)?.status === 410
  if (token && gone) {
    return (
      <AuthLayout
        title="Convite"
        subtitle={apiErrorMessage(error, 'Este convite não vale mais.')}
        footer={<Link to="/welcome">Voltar</Link>}
      >
        <p className="mb-4 text-sm text-ink-2">
          Se você já faz parte desta organização, pode entrar mesmo assim.
        </p>
        <Button className="w-full" onClick={onAccept} disabled={joining}>
          {joining ? <Spinner className="border-t-paper border-paper/40" /> : 'Entrar na organização'}
        </Button>
      </AuthLayout>
    )
  }

  if (error || !invite) {
    return (
      <AuthLayout
        title="Convite inválido"
        subtitle={apiErrorMessage(error, 'Não encontramos este convite.')}
        footer={<Link to={token ? '/welcome' : '/login'}>Voltar</Link>}
      >
        <p className="text-sm text-ink-2">
          Peça um convite novo a quem administra a organização ou confira o código digitado.
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title={invite.companyName}
      subtitle={
        token
          ? 'Você foi convidado para fazer parte desta organização.'
          : 'Digite seu nome. Vamos colocar você em uma mesa.'
      }
      footer={
        token ? (
          <Link to="/welcome" onClick={() => takePendingInvite()}>
            Agora não
          </Link>
        ) : (
          // mantém o convite pendente: depois do login a pessoa volta para ele
          <Link to="/login?modo=senha">Já tenho conta com e-mail e senha</Link>
        )
      }
    >
      <p className="mb-5 text-center font-mono text-lg tracking-[0.2em] text-ink-2">{invite.code}</p>
      {token ? (
        <Button className="w-full" onClick={onAccept} disabled={joining}>
          {joining ? <Spinner className="border-t-paper border-paper/40" /> : 'Entrar na organização'}
        </Button>
      ) : (
        <form onSubmit={onEnter} className="space-y-5">
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
            className="h-10 w-full"
            disabled={entering || name.trim().length < 2}
          >
            {entering ? <Spinner className="border-t-paper border-paper/40" /> : 'Entrar no evento'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
