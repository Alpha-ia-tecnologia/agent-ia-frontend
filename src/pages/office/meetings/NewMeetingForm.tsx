import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useCreateMeetingMutation } from '@/api/api'
import { apiErrorMessage } from '@/lib/apiError'
import { Button, Field, Input, Spinner } from '@/components/ui'

export function NewMeetingForm({ disabled }: { disabled: boolean }) {
  const [createMeeting, { isLoading }] = useCreateMeetingMutation()
  const [joinUrl, setJoinUrl] = useState('')
  const [subject, setSubject] = useState('')
  const [schedule, setSchedule] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!joinUrl.trim()) return
    try {
      await createMeeting({
        joinUrl: joinUrl.trim(),
        subject: subject.trim() || undefined,
        scheduledAt: schedule && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      }).unwrap()
      toast.success(schedule ? 'Reunião agendada.' : 'Bot a caminho da reunião.')
      setJoinUrl('')
      setSubject('')
      setScheduledAt('')
      setSchedule(false)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Não foi possível iniciar a reunião.'))
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-line bg-paper-2 p-3">
      <span className="block text-[12px] font-medium text-ink-2">Nova reunião</span>
      {disabled && (
        <p className="text-[12px] text-ink-3">
          Configure o agente responsável e as entregas em "Configurar bot" antes de enviar uma reunião.
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="min-w-0 flex-1">
          <Field label="Link da reunião">
            <Input
              placeholder="https://teams.microsoft.com/l/meetup-join/... ou https://meet.google.com/..."
              value={joinUrl}
              onChange={(e) => setJoinUrl(e.target.value)}
              disabled={disabled}
            />
          </Field>
        </div>
        <div className="w-full sm:w-48">
          <Field label="Assunto (opcional)">
            <Input
              placeholder="Ex.: Weekly de produto"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={disabled}
            />
          </Field>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex items-center gap-2 text-[12px] text-ink-2">
          <input
            type="checkbox"
            checked={schedule}
            onChange={(e) => setSchedule(e.target.checked)}
            disabled={disabled}
          />
          Agendar para depois
        </label>
        {schedule && (
          <div className="w-full sm:w-56">
            <Field label="Data e hora">
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                disabled={disabled}
              />
            </Field>
          </div>
        )}
        <Button type="submit" className="ml-auto" disabled={disabled || isLoading || !joinUrl.trim()}>
          {isLoading ? (
            <Spinner className="border-t-paper border-paper/40" />
          ) : schedule ? (
            'Agendar reunião'
          ) : (
            'Entrar agora'
          )}
        </Button>
      </div>
    </form>
  )
}
