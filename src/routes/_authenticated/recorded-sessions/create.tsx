import { createFileRoute } from '@tanstack/react-router'
import { RecordedSessionForm } from '@/features/recorded-sessions/recorded-session-form'

export const Route = createFileRoute('/_authenticated/recorded-sessions/create')({
  component: () => <RecordedSessionForm isEdit={false} />,
})
