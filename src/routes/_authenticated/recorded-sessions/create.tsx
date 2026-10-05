import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { RecordedSessionForm } from '@/features/recorded-sessions/recorded-session-form'
import {
  adminRecordedSessionService,
  type RecordedSessionItem,
} from '@/services/admin-recorded-sessions'
import { Loader2 } from 'lucide-react'

type SearchParams = {
  id?: string
}

export const Route = createFileRoute('/_authenticated/recorded-sessions/create')({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      id: search.id ? String(search.id) : undefined,
    }
  },
  component: RecordedSessionCreateOrEditPage,
})

function RecordedSessionCreateOrEditPage() {
  const { id } = Route.useSearch()
  const [session, setSession] = useState<RecordedSessionItem | null>(null)
  const [loading, setLoading] = useState(Boolean(id))

  useEffect(() => {
    if (!id) {
      setSession(null)
      setLoading(false)
      return
    }

    let isMounted = true
    async function load() {
      try {
        setLoading(true)
        const res = await adminRecordedSessionService.getRecordedSession(id!)
        if (isMounted && res?.data) {
          setSession(res.data)
        }
      } catch (err) {
        console.error('Failed to load recorded session for edit', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()

    return () => {
      isMounted = false
    }
  }, [id])

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    )
  }

  return <RecordedSessionForm key={id || 'new'} initialData={session} isEdit={Boolean(id)} />
}
