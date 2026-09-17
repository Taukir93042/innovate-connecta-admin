import { createFileRoute } from '@tanstack/react-router'
import { Galleries } from '@/features/galleries'

export const Route = createFileRoute('/_authenticated/galleries/')({
  component: Galleries,
})
