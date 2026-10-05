import { createFileRoute } from '@tanstack/react-router'
import { Sessions } from '@/features/sessions'

export const Route = createFileRoute('/_authenticated/live-sessions/')({
  component: Sessions,
})
