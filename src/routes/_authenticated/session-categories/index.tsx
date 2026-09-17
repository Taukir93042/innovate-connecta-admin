import { createFileRoute } from '@tanstack/react-router'
import { SessionCategories } from '@/features/session-categories'

export const Route = createFileRoute('/_authenticated/session-categories/')({
  component: SessionCategories,
})
