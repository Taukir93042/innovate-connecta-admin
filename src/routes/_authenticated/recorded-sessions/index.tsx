import { createFileRoute } from '@tanstack/react-router'
import { RecordedSessions } from '@/features/recorded-sessions'

export const Route = createFileRoute('/_authenticated/recorded-sessions/')({
  component: RecordedSessions,
})
