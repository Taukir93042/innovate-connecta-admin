import { createFileRoute } from '@tanstack/react-router'
import { RecordedOrders } from '@/features/recorded-orders'

export const Route = createFileRoute('/_authenticated/recorded-orders/')({
  component: RecordedOrders,
})
