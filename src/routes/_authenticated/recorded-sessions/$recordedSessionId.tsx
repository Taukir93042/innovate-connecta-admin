import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  adminRecordedSessionService,
  type RecordedSessionItem,
} from '@/services/admin-recorded-sessions'
import { RecordedSessionForm } from '@/features/recorded-sessions/recorded-session-form'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute(
  '/_authenticated/recorded-sessions/$recordedSessionId'
)({
  component: EditRecordedSessionPage,
})

function EditRecordedSessionPage() {
  const { recordedSessionId } = Route.useParams()
  const [session, setSession] = useState<RecordedSessionItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await adminRecordedSessionService.getRecordedSession(
          recordedSessionId
        )
        if (res?.data) {
          setSession(res.data)
        }
      } catch (err) {
        console.error('Failed to load recorded session', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [recordedSessionId])

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    )
  }

  return <RecordedSessionForm initialData={session} isEdit={true} />
}
