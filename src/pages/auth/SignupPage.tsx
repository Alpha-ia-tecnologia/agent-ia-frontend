import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useSignupMutation } from '@/api/api'
import { peekPendingInvite, useEnterSession } from '@/lib/session'
import { apiErrorMessage } from '@/lib/apiError'
import { Button, Field, Input, Textarea, Spinner } from '@/components/ui'
import { AuthLayout } from './AuthLayout'

export default function SignupPage() {
  // veio de um convite (/join): só a conta; a org é a do convite
  const [mode, setMode] = useState<'org' | 'join'>(() => (peekPendingInvite() ? 'join' : 'org'))
  const [step, setStep] = useState<1 | 2>(() => (peekPendingInvite() ? 2 : 1))
  const [form, setForm] = useState({
    companyName: '',
    industry: '',
    businessDescription: '',
    name: '',
    email: '',
    password: '',
  })
  const [signup, { isLoading }] = useSignupMutation()
  const enterSession = useEnterSession()

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  function onSubmitStep1(e: FormEvent) {
    e.preventDefault()
    setStep(2)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      const { companyName, industry, businessDescription, ...account } = form
      const res = await signup(
        mode === 'org' ? { ...account, companyName, industry, businessDescription } : account,
      ).unwrap()
      enterSession(res)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível criar a conta.'))
    }
  }

  return (
    <AuthLayout
      title="Criar conta"
      subtitle={
        mode === 'join'
          ? 'Crie sua conta para entrar na organização que te convidou.'
          : step === 1
            ? 'Conte sobre sua empresa e montaremos seu escritório de agentes.'
            : 'Agora, os seus dados de acesso.'
      }
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-ink underline underline-offset-2">
            Entrar
          </Link>
        </>
      }
    >
      {mode === 'org' && <p className="mb-4 text-xs text-ink-2">Etapa {step} de 2</p>}
      {step === 1 ? (
        <form onSubmit={onSubmitStep1} className="space-y-4">
          <button
            type="button"
            className="w-full rounded-lg border border-dashed border-line px-3 py-2 text-left text-[13px] text-ink-2 hover:border-ink-3"
            onClick={() => {
              setMode('join')
              setStep(2)
            }}
          >
            Vou entrar numa organização que já existe (tenho um convite ou código) →
          </button>
          <Field label="Nome da empresa">
            <Input required autoFocus placeholder="Acme Ltda" value={form.companyName} onChange={set('companyName')} />
          </Field>
          <Field label="Área de atuação">
            <Input required placeholder="Ex.: e-commerce de moda" value={form.industry} onChange={set('industry')} />
          </Field>
          <Field label="Descrição do negócio">
            <Textarea
              required
              rows={3}
              placeholder="O que a empresa faz, para quem, e os principais desafios…"
              value={form.businessDescription}
              onChange={set('businessDescription')}
            />
          </Field>
          <Button type="submit" className="w-full">
            Continuar
          </Button>
        </form>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Seu nome">
            <Input required autoFocus placeholder="Maria Silva" value={form.name} onChange={set('name')} />
          </Field>
          <Field label="E-mail">
            <Input type="email" required placeholder="voce@empresa.com" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Senha" hint="Mínimo de 8 caracteres.">
            <Input type="password" required minLength={8} placeholder="••••••••" value={form.password} onChange={set('password')} />
          </Field>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setMode('org')
                setStep(1)
              }}
            >
              {mode === 'join' ? 'Criar uma organização' : 'Voltar'}
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? <Spinner className="border-t-paper border-paper/40" /> : 'Criar conta'}
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
