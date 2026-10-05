import { createFileRoute } from '@tanstack/react-router'
import { ResourcesFeature } from '@/features/resources'

export const Route = createFileRoute('/_authenticated/resources/')({
  component: ResourcesFeature,
})
