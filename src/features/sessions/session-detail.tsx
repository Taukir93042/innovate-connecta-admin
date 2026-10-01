import { useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import {
  ArrowLeft,
  Edit2,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Loader2,
  Trash2,
  UserCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  adminSessionService,
  getCategoryName,
  type SessionItem,
} from '@/services/admin-sessions'
import { getApiErrorMessage } from '@/lib/api-client'
import { getStorageUrl } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ConfirmDialog } from '@/components/confirm-dialog'

export function SessionDetail() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { sessionId?: string; id?: string }
  const sessionId = params.sessionId || params.id

  const [session, setSession] = useState<SessionItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      navigate({ to: '/sessions' })
      return
    }

    async function fetchSession() {
      try {
        setIsLoading(true)
        const res = await adminSessionService.getSession(sessionId!)
        setSession(res.data)
      } catch (err) {
        toast.error(getApiErrorMessage(err))
        navigate({ to: '/sessions' })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [sessionId, navigate])

  const handleToggleStatus = async () => {
    if (!session) return
    try {
      await adminSessionService.toggleStatus(session.id)
      setSession((prev) => (prev ? { ...prev, is_active: !prev.is_active } : null))
      toast.success('Status updated successfully')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handleToggleFeatured = async () => {
    if (!session) return
    try {
      await adminSessionService.toggleFeatured(session.id)
      setSession((prev) => (prev ? { ...prev, is_featured: !prev.is_featured } : null))
      toast.success('Featured status updated successfully')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!session) return
    try {
      setIsDeleting(true)
      await adminSessionService.deleteSession(session.id)
      toast.success('Session deleted successfully')
      navigate({ to: '/sessions' })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (isLoading) {
    return (
      <div className='flex h-96 items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    )
  }

  if (!session) {
    return null
  }

  const categoryName = getCategoryName(session.category)
  const coverImage = session.image_url ? getStorageUrl(session.image_url) : null
  const infoCards = Array.isArray(session.info_cards) ? session.info_cards : []

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8'
                onClick={() => navigate({ to: '/sessions' })}
              >
                <ArrowLeft className='h-4 w-4' />
              </Button>
              <h1 className='text-2xl font-bold tracking-tight'>{session.title}</h1>
            </div>
            <div className='flex items-center gap-2 ml-10'>
              <Badge variant='outline'>{categoryName}</Badge>
              {session.is_featured && (
                <Badge variant='secondary' className='gap-1'>
                  <Sparkles className='h-3 w-3 text-amber-500' /> Featured
                </Badge>
              )}
              {session.is_active ? (
                <Badge variant='default' className='bg-green-600 hover:bg-green-700'>
                  Active
                </Badge>
              ) : (
                <Badge variant='secondary'>Inactive</Badge>
              )}
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => navigate({ to: '/sessions/create', search: { id: session.id } as any })}
              className='gap-1.5'
            >
              <Edit2 className='h-4 w-4' /> Edit
            </Button>
            <Button
              variant='destructive'
              size='sm'
              onClick={() => setShowDeleteConfirm(true)}
              className='gap-1.5'
            >
              <Trash2 className='h-4 w-4' /> Delete
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
          {/* Main Content Column (8 cols) */}
          <div className='lg:col-span-8 space-y-6'>
            {/* Section 1: Overview & Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base font-semibold'>
                  Section 1: Overview &amp; Introduction
                </CardTitle>
                <CardDescription>Comprehensive summary and description of the session.</CardDescription>
              </CardHeader>
              <CardContent>
                {/<[a-z][sS]*>/i.test(session.section_one_content) ? (
                  <div
                    className='prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_table]:w-full [&_th]:border [&_th]:p-2 [&_td]:border [&_td]:p-2 [&_a]:text-primary [&_a]:underline'
                    dangerouslySetInnerHTML={{ __html: session.section_one_content }}
                  />
                ) : (
                  <div className='text-sm text-foreground/90 whitespace-pre-line leading-relaxed'>
                    {session.section_one_content}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 2: Curriculum, Key Deliverables & Outcomes */}
            {session.section_two_content && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-base font-semibold'>
                    Section 2: Curriculum, Key Deliverables &amp; Outcomes
                  </CardTitle>
                  <CardDescription>
                    Detailed agenda breakdown, deliverables, certifications, and takeaways.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/<[a-z][sS]*>/i.test(session.section_two_content) ? (
                    <div
                      className='prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_table]:w-full [&_th]:border [&_th]:p-2 [&_td]:border [&_td]:p-2 [&_a]:text-primary [&_a]:underline'
                      dangerouslySetInnerHTML={{ __html: session.section_two_content }}
                    />
                  ) : (
                    <div className='text-sm text-foreground/90 whitespace-pre-line leading-relaxed'>
                      {session.section_two_content}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}



            {/* Highlights & Info Cards */}
            {infoCards.length > 0 && (
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-base font-semibold flex items-center gap-2'>
                    <Layers className='h-4 w-4 text-primary' /> Key Highlights &amp; Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'>
                    {infoCards.map((card: any, idx: number) => (
                      <div
                        key={idx}
                        className='rounded-lg border bg-muted/30 p-3 flex flex-col justify-center'
                      >
                        <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                          {card.title || card.key}
                        </span>
                        <span className='text-sm font-semibold text-foreground mt-1'>
                          {card.description || card.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar / Info Column (4 cols) */}
          <div className='lg:col-span-4 flex flex-col gap-6'>
            {/* Banner Cover Image */}
            <Card className='overflow-hidden'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-semibold'>Session Banner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='relative aspect-video w-full overflow-hidden rounded-lg border bg-muted flex items-center justify-center shadow-xs'>
                  {coverImage && !imageError ? (
                    <img
                      src={coverImage}
                      alt={session.title}
                      onError={() => setImageError(true)}
                      className='h-full w-full object-cover'
                    />
                  ) : (
                    <div className='flex flex-col items-center gap-2 text-muted-foreground/60'>
                      <ImageIcon className='h-8 w-8' />
                      <span className='text-xs'>No cover banner uploaded</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Assigned Instructor (Right Sidebar) */}
            {(session.instructor || session.instructor_name) && (() => {
              const instName = session.instructor?.name || session.instructor_name || ''
              const instRole = session.instructor?.designation || session.instructor_designation || ''
              const instExp = session.instructor?.experience || session.instructor_experience || ''
              const instBio = session.instructor?.bio || session.instructor_bio || ''
              const instImg = session.instructor?.image_url || session.instructor_image_url || null

              return (
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-sm font-semibold flex items-center gap-1.5'>
                      <UserCircle className='h-4 w-4 text-primary' /> Assigned Instructor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='flex items-center gap-3'>
                      <div className='size-11 rounded-full overflow-hidden border bg-muted flex items-center justify-center shrink-0 text-primary font-bold text-xs shadow-xs'>
                        {instImg ? (
                          <img
                            src={getStorageUrl(instImg)}
                            alt={instName || 'Instructor'}
                            className='size-full object-cover'
                          />
                        ) : (
                          instName
                            ? instName
                                .split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                            : 'IN'
                        )}
                      </div>
                      <div className='space-y-0.5 min-w-0'>
                        <div className='text-xs font-bold text-foreground truncate'>
                          {instName || 'Instructor'}
                        </div>
                        {instRole && (
                          <div className='text-[11px] font-medium text-primary truncate'>
                            {instRole}
                          </div>
                        )}
                        {instExp && (
                          <div className='text-[10px] text-muted-foreground truncate'>
                            {instExp}
                          </div>
                        )}
                      </div>
                    </div>
                    {instBio && (
                      <p className='text-xs text-foreground/80 line-clamp-3 leading-relaxed border-t pt-2'>
                        {instBio}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })()}

            {/* Status & Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className='text-sm font-semibold'>Visibility &amp; Settings</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between rounded-lg border p-3'>
                  <div>
                    <div className='text-sm font-medium'>Active on Website</div>
                    <div className='text-xs text-muted-foreground'>
                      Visible to learners and candidates
                    </div>
                  </div>
                  <Switch
                    checked={session.is_active}
                    onCheckedChange={handleToggleStatus}
                  />
                </div>

                <div className='flex items-center justify-between rounded-lg border p-3'>
                  <div>
                    <div className='text-sm font-medium'>Featured on Home</div>
                    <div className='text-xs text-muted-foreground'>
                      Highlight on landing page
                    </div>
                  </div>
                  <Switch
                    checked={session.is_featured}
                    onCheckedChange={handleToggleFeatured}
                  />
                </div>

                <div className='space-y-2 pt-2 border-t text-xs text-muted-foreground'>
                  <div className='flex items-center justify-between'>
                    <span>Category:</span>
                    <span className='font-semibold text-foreground'>{categoryName}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>Slug:</span>
                    <span className='font-mono text-foreground'>/{session.slug}</span>
                  </div>
                  {session.created_at && (
                    <div className='flex items-center justify-between'>
                      <span>Created At:</span>
                      <span className='text-foreground'>
                        {new Date(session.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        handleConfirm={handleDelete}
        title='Delete Session?'
        desc={`Are you sure you want to permanently delete "${session.title}"? This action cannot be undone.`}
        confirmText='Delete'
        destructive
        isLoading={isDeleting}
      />
    </>
  )
}
