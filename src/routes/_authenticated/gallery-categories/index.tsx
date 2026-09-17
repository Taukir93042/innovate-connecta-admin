import { createFileRoute } from '@tanstack/react-router'
import { GalleryCategories } from '@/features/gallery-categories'

export const Route = createFileRoute('/_authenticated/gallery-categories/')({
  component: GalleryCategories,
})
