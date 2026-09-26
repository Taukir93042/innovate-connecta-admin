import { createFileRoute } from '@tanstack/react-router'
import { SessionBookings } from '@/features/session-bookings'

export const Route = createFileRoute('/_authenticated/session-bookings/')({
  component: SessionBookings,
})
