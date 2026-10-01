import { createFileRoute } from '@tanstack/react-router'
import { InstructorsFeature } from '@/features/instructors'

export const Route = createFileRoute('/_authenticated/instructors/')({
  component: InstructorsFeature,
})
