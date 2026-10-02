import { z } from 'zod'
import { createFileRoute, redirect } from '@tanstack/react-router'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/sign-in')({
  beforeLoad: ({ search }) => {
    throw redirect({
      to: '/login',
      search: {
        redirect: search.redirect,
      },
    })
  },
  validateSearch: searchSchema,
})
