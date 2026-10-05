import { createFileRoute } from '@tanstack/react-router'
import { SessionDetail } from '@/features/sessions/session-detail'

export const Route = createFileRoute('/_authenticated/live-sessions/$sessionId')({
  component: SessionDetail,
})
