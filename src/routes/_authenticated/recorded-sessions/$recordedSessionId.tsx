import { createFileRoute } from '@tanstack/react-router'
import { RecordedSessionDetailPage } from '@/features/recorded-sessions/recorded-session-detail-page'

export const Route = createFileRoute(
  '/_authenticated/recorded-sessions/$recordedSessionId'
)({
  component: RecordedSessionDetailPage,
})
