import { createFileRoute } from '@tanstack/react-router'
import { RecordedOrderDetailPage } from '@/features/recorded-orders/recorded-order-detail-page'

export const Route = createFileRoute(
  '/_authenticated/recorded-orders/$orderId'
)({
  component: RecordedOrderDetailPage,
})
