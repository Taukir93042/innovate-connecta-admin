import { createFileRoute } from '@tanstack/react-router'
import { SessionForm } from '@/features/sessions/session-form'

export const Route = createFileRoute('/_authenticated/live-sessions/create')({
  component: SessionForm,
})
