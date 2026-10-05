import { useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import {
  ArrowLeft,
  Edit2,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Trash2,
  UserCircle,
  ExternalLink,
  Video,
  Clock,
  BookOpen,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  adminRecordedSessionService,
  type RecordedSessionItem,
} from '@/services/admin-recorded-sessions'
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

export function RecordedSessionDetailPage() {
  const { recordedSessionId } = useParams({
    from: '/_authenticated/recorded-sessions/$recordedSessionId',
  })
  const navigate = useNavigate()

  const [session, setSession] = useState<RecordedSessionItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchSession = async () => {
    try {
      setLoading(true)
      const res = await adminRecordedSessionService.getRecordedSession(recordedSessionId)
      if (res?.data) {
        setSession(res.data)
      } else {
        toast.error('Recorded session not found')
        navigate({ to: '/recorded-sessions' })
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to fetch recorded session'))
      navigate({ to: '/recorded-sessions' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (recordedSessionId) {
      fetchSession()
    }
  }, [recordedSessionId])

  const handleToggleStatus = async () => {
    if (!session) return
    try {
      const res = await adminRecordedSessionService.toggleRecordedSessionStatus(session.id)
      if (res.data) {
        setSession((prev) => (prev ? { ...prev, is_active: res.data!.is_active } : null))
        toast.success(res.message || 'Status updated successfully')
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to toggle status'))
    }
  }

  const handleToggleFeatured = async () => {
    if (!session) return
    try {
      const res = await adminRecordedSessionService.toggleRecordedSessionFeatured(session.id)
      if (res.data) {
        setSession((prev) => (prev ? { ...prev, is_featured: res.data!.is_featured } : null))
        toast.success(res.message || 'Featured status updated successfully')
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to toggle featured status'))
    }
  }

  const handleDelete = async () => {
    if (!session) return
    try {
      setIsDeleting(true)
      await adminRecordedSessionService.deleteRecordedSession(session.id)
      toast.success('Recorded session deleted successfully')
      navigate({ to: '/recorded-sessions' })
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete recorded session'))
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
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
          <div className='flex h-[60vh] items-center justify-center'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
          </div>
        </Main>
      </>
    )
  }

  if (!session) return null

  const categoryName = session.category?.name || 'General'
  const coverImage = session.thumbnail_url || (session.thumbnail ? getStorageUrl(session.thumbnail) : null)
  const publicWebUrl = session.slug
    ? `http://localhost:3000/recorded-sessions/${session.slug}`
    : `http://localhost:3000/recorded-sessions/${session.id}`

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='space-y-6 pb-12'>
        {/* Top Navigation & Action Bar */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-3'>
            <Button
              variant='outline'
              size='icon'
              className='size-9 shrink-0'
              onClick={() => navigate({ to: '/recorded-sessions' })}
              title='Back to Recorded Sessions'
            >
              <ArrowLeft className='size-4' />
            </Button>
            <div>
              <div className='flex items-center gap-2'>
                <h1 className='text-xl font-bold tracking-tight text-foreground sm:text-2xl line-clamp-1'>
                  {session.title}
                </h1>
                {session.is_featured && (
                  <Badge variant='secondary' className='gap-1 border-amber-500/30 bg-amber-500/10 text-amber-500'>
                    <Sparkles className='size-3' /> Featured
                  </Badge>
                )}
                <Badge
                  variant='outline'
                  className={
                    session.is_active
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                      : 'border-muted text-muted-foreground'
                  }
                >
                  {session.is_active ? 'Active' : 'Draft / Inactive'}
                </Badge>
              </div>
              <p className='text-xs text-muted-foreground mt-0.5'>
                Recorded Course Details &amp; Student Curriculum Overview
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2 flex-wrap'>
           
            <Button
              variant='default'
              size='sm'
              className='gap-1.5'
              onClick={() =>
                navigate({
                  to: '/recorded-sessions/create',
                  search: { id: String(session.id) },
                })
              }
            >
              <Edit2 className='size-4' /> Edit Course
            </Button>
            <Button
              variant='destructive'
              size='sm'
              className='gap-1.5'
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className='size-4' /> Delete
            </Button>
          </div>
        </div>

        {/* 2-Column Grid Layout */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
          {/* Main Details Column (8 cols) */}
          <div className='lg:col-span-8 flex flex-col gap-6'>
            {/* Hero Header Card */}
            <Card className='border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-xs'>
              <CardHeader className='pb-3'>
                <div className='flex items-center gap-2 flex-wrap mb-1'>
                  <Badge variant='outline' className='font-semibold text-primary border-primary/30'>
                    {categoryName}
                  </Badge>
                  {session.lessons && (
                    <Badge variant='secondary' className='gap-1'>
                      <BookOpen className='size-3' /> {session.lessons} Lessons
                    </Badge>
                  )}
                  {session.duration && (
                    <Badge variant='secondary' className='gap-1'>
                      <Clock className='size-3' /> {session.duration}
                    </Badge>
                  )}
                </div>
                <CardTitle className='text-2xl font-bold leading-snug'>{session.title}</CardTitle>
                {session.heading && (
                  <CardDescription className='text-sm text-foreground/80 font-medium mt-1 leading-relaxed'>
                    {session.heading}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t'>
                  <div className='p-3 rounded-lg bg-muted/40 border flex flex-col'>
                    <span className='text-xs text-muted-foreground font-medium uppercase'>Price</span>
                    <span className='text-lg font-bold text-emerald-500 mt-0.5'>
                      {session.formatted_discount_price || `₹${session.discount_price || 0}`}
                    </span>
                    {session.original_price && Number(session.original_price) > Number(session.discount_price) && (
                      <span className='text-xs text-muted-foreground line-through'>
                        {session.formatted_original_price || `₹${session.original_price}`}
                      </span>
                    )}
                  </div>
                  <div className='p-3 rounded-lg bg-muted/40 border flex flex-col'>
                    <span className='text-xs text-muted-foreground font-medium uppercase'>Duration</span>
                    <span className='text-base font-semibold text-foreground mt-0.5 flex items-center gap-1.5'>
                      <Clock className='size-4 text-primary' /> {session.duration || 'Flexible'}
                    </span>
                  </div>
                  <div className='p-3 rounded-lg bg-muted/40 border flex flex-col'>
                    <span className='text-xs text-muted-foreground font-medium uppercase'>Curriculum</span>
                    <span className='text-base font-semibold text-foreground mt-0.5 flex items-center gap-1.5'>
                      <BookOpen className='size-4 text-primary' /> {session.lessons ? `${session.lessons} Lessons` : 'Full Course'}
                    </span>
                  </div>
                  <div className='p-3 rounded-lg bg-muted/40 border flex flex-col'>
                    <span className='text-xs text-muted-foreground font-medium uppercase'>Instructor</span>
                    <span className='text-base font-semibold text-foreground mt-0.5 truncate flex items-center gap-1.5'>
                      <UserCircle className='size-4 text-primary shrink-0' />
                      <span className='truncate'>{session.instructor?.name || 'Assigned Expert'}</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attached Study Notes / PDF Resource Card */}
            <Card className='border-red-500/20 shadow-xs'>
              <CardHeader className='pb-2'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base font-semibold flex items-center gap-2'>
                    <FileText className='size-5 text-red-500' />
                    Attached PDF Study Resource
                  </CardTitle>
                  {session.resource && (
                    <Badge variant='outline' className='text-xs text-emerald-500 border-emerald-500/30 bg-emerald-500/10'>
                      <CheckCircle2 className='size-3 mr-1' /> 1 PDF Attached
                    </Badge>
                  )}
                </div>
                <CardDescription className='text-xs'>
                  Single PDF study material automatically unlocked for students who purchase this course.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {session.resource ? (
                  <div className='p-4 rounded-xl border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                    <div className='flex items-center gap-3.5 min-w-0'>
                      <div className='size-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-500'>
                        <FileText className='size-6' />
                      </div>
                      <div className='min-w-0'>
                        <p className='font-semibold text-sm text-foreground truncate'>
                          {session.resource.title || session.resource.file_name}
                        </p>
                        <p className='text-xs text-muted-foreground font-mono mt-0.5'>
                          {session.resource.file_name} {session.resource.file_size ? `• ${session.resource.file_size}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-2 shrink-0'>
                      {session.resource.file_url && (
                        <>
                          <Button asChild variant='default' size='sm' className='gap-1.5'>
                            <a href={session.resource.file_url} target='_blank' rel='noopener noreferrer'>
                              <Eye className='size-4' /> View PDF
                            </a>
                          </Button>
                          <Button asChild variant='outline' size='sm' className='gap-1.5'>
                            <a href={session.resource.file_url} download={session.resource.file_name || 'notes.pdf'} target='_blank' rel='noopener noreferrer'>
                              <Download className='size-4' /> Download
                            </a>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className='p-4 rounded-xl border border-dashed bg-muted/10 text-center py-6'>
                    <AlertCircle className='size-8 text-muted-foreground/60 mx-auto mb-2' />
                    <p className='text-sm font-medium text-foreground'>No PDF notes attached to this session</p>
                    <p className='text-xs text-muted-foreground max-w-sm mx-auto mt-1'>
                      You can attach a PDF notes file by editing this session or uploading directly from the Resources menu.
                    </p>
                    <Button
                      variant='outline'
                      size='sm'
                      className='mt-3 gap-1.5'
                      onClick={() =>
                        navigate({
                          to: '/recorded-sessions/create',
                          search: { id: String(session.id) },
                        })
                      }
                    >
                      <FileText className='size-3.5 text-red-500' /> Attach PDF Notes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Video Preview Card */}
            {session.preview_video_url && (
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-base font-semibold flex items-center gap-2'>
                    <Video className='size-5 text-primary' />
                    Preview Video Trailer
                  </CardTitle>
                  <CardDescription className='text-xs font-mono truncate'>
                    {session.preview_video_url}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='relative aspect-video w-full rounded-lg overflow-hidden border bg-black shadow-inner flex items-center justify-center'>
                    {session.preview_video_url.includes('youtube.com') || session.preview_video_url.includes('youtu.be') ? (
                      <iframe
                        src={
                          session.preview_video_url.includes('embed')
                            ? session.preview_video_url
                            : session.preview_video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
                        }
                        title={session.title}
                        className='w-full h-full border-0'
                        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={session.preview_video_url}
                        controls
                        className='w-full h-full object-contain'
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Overview (Rich HTML) */}
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-base font-semibold'>Course Overview (About This Masterclass)</CardTitle>
              </CardHeader>
              <CardContent>
                {session.course_overview ? (
                  <div
                    className='prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-foreground/90 space-y-2'
                    dangerouslySetInnerHTML={{ __html: session.course_overview }}
                  />
                ) : (
                  <p className='text-xs text-muted-foreground italic'>No course overview provided.</p>
                )}
              </CardContent>
            </Card>

            {/* What You'll Learn (Rich HTML) */}
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-base font-semibold'>What You&apos;ll Learn / Key Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                {session.what_you_will_learn ? (
                  <div
                    className='prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-foreground/90 space-y-2'
                    dangerouslySetInnerHTML={{ __html: session.what_you_will_learn }}
                  />
                ) : (
                  <p className='text-xs text-muted-foreground italic'>No learning highlights provided.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column (4 cols) */}
          <div className='lg:col-span-4 flex flex-col gap-6'>
            {/* Thumbnail Card */}
            <Card className='overflow-hidden'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-semibold'>Course Thumbnail</CardTitle>
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
                      <ImageIcon className='size-8' />
                      <span className='text-xs'>No thumbnail uploaded</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Assigned Instructor Card */}
            {session.instructor && (
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-semibold flex items-center gap-1.5'>
                    <UserCircle className='size-4 text-primary' /> Assigned Instructor
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex items-center gap-3'>
                    <div className='size-12 rounded-full overflow-hidden border bg-muted flex items-center justify-center shrink-0 text-primary font-bold text-xs shadow-xs'>
                      {session.instructor.image_url ? (
                        <img
                          src={getStorageUrl(session.instructor.image_url)}
                          alt={session.instructor.name || 'Instructor'}
                          className='size-full object-cover'
                        />
                      ) : (
                        session.instructor.name
                          ? session.instructor.name
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)
                          : 'IN'
                      )}
                    </div>
                    <div className='space-y-0.5 min-w-0'>
                      <div className='text-sm font-bold text-foreground truncate'>
                        {session.instructor.name}
                      </div>
                      {session.instructor.designation && (
                        <div className='text-xs font-medium text-primary truncate'>
                          {session.instructor.designation}
                        </div>
                      )}
                      {session.instructor.experience && (
                        <div className='text-[11px] text-muted-foreground truncate'>
                          {session.instructor.experience}
                        </div>
                      )}
                    </div>
                  </div>
                  {session.instructor.bio && (
                    <p className='text-xs text-foreground/80 line-clamp-3 leading-relaxed border-t pt-2'>
                      {session.instructor.bio}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Visibility & Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className='text-sm font-semibold'>Visibility &amp; Settings</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between rounded-lg border p-3'>
                  <div>
                    <div className='text-sm font-medium'>Active on Website</div>
                    <div className='text-xs text-muted-foreground'>
                      Available for purchase &amp; viewing
                    </div>
                  </div>
                  <Switch
                    checked={session.is_active}
                    onCheckedChange={handleToggleStatus}
                  />
                </div>

                <div className='flex items-center justify-between rounded-lg border p-3'>
                  <div>
                    <div className='text-sm font-medium'>Featured Course</div>
                    <div className='text-xs text-muted-foreground'>
                      Highlight on home &amp; explore
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
        title='Delete Recorded Session?'
        desc={`Are you sure you want to permanently delete "${session.title}"? This action cannot be undone.`}
        confirmText='Delete'
        destructive
        isLoading={isDeleting}
      />
    </>
  )
}
