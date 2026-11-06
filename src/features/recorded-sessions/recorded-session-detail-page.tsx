import { useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import {
  ArrowLeft,
  Edit2,
  Image as ImageIcon,
  Loader2,
  Trash2,
  UserCircle,
  Video,
  Clock,
  BookOpen,
  FolderOpen,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  Plus,
  Play,
  Lock,
  Unlock,
  Layers,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  UploadCloud,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  adminRecordedSessionService,
  type RecordedSessionItem,
} from '@/services/admin-recorded-sessions'
import {
  adminCurriculumService,
  type CourseModuleItem,
  type CourseLessonItem,
} from '@/services/admin-curriculum'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

  // Curriculum State
  const [modules, setModules] = useState<CourseModuleItem[]>([])
  const [loadingCurriculum, setLoadingCurriculum] = useState(false)
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({})

  // Module Modal State
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<CourseModuleItem | null>(null)
  const [moduleTitle, setModuleTitle] = useState('')
  const [moduleDescription, setModuleDescription] = useState('')
  const [moduleOrder, setModuleOrder] = useState<number>(0)
  const [isSubmittingModule, setIsSubmittingModule] = useState(false)

  // Lesson Modal State
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false)
  const [targetModuleId, setTargetModuleId] = useState<number | null>(null)
  const [editingLesson, setEditingLesson] = useState<CourseLessonItem | null>(null)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonVideoUrl, setLessonVideoUrl] = useState('')
  const [lessonDuration, setLessonDuration] = useState('')
  const [lessonDescription, setLessonDescription] = useState('')
  const [lessonIsFreePreview, setLessonIsFreePreview] = useState(false)
  const [lessonThumbnailFile, setLessonThumbnailFile] = useState<File | null>(null)
  const [lessonThumbnailUrl, setLessonThumbnailUrl] = useState('')
  const [lessonThumbnailPreview, setLessonThumbnailPreview] = useState('')
  const [lessonOrder, setLessonOrder] = useState<number>(0)
  const [isSubmittingLesson, setIsSubmittingLesson] = useState(false)

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'module' | 'lesson'
    id: number
    title: string
  } | null>(null)
  const [isDeletingItem, setIsDeletingItem] = useState(false)

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

  const fetchCurriculum = async (sessId: number | string) => {
    try {
      setLoadingCurriculum(true)
      const data = await adminCurriculumService.getCurriculum(sessId)
      setModules(data)
      // Auto expand all modules
      const expanded: Record<number, boolean> = {}
      data.forEach((m) => {
        expanded[m.id] = true
      })
      setExpandedModules(expanded)
    } catch (err) {
      console.error('Failed to fetch curriculum:', err)
    } finally {
      setLoadingCurriculum(false)
    }
  }

  useEffect(() => {
    if (recordedSessionId) {
      fetchSession()
      fetchCurriculum(recordedSessionId)
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

  const toggleModuleAccordion = (modId: number) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }))
  }

  // --- Module Handlers ---
  const handleOpenAddModule = () => {
    setEditingModule(null)
    setModuleTitle('')
    setModuleDescription('')
    setModuleOrder(modules.length)
    setIsModuleModalOpen(true)
  }

  const handleOpenEditModule = (mod: CourseModuleItem) => {
    setEditingModule(mod)
    setModuleTitle(mod.title)
    setModuleDescription(mod.description || '')
    setModuleOrder(mod.order_column || 0)
    setIsModuleModalOpen(true)
  }

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !moduleTitle.trim()) {
      toast.error('Please enter a module title.')
      return
    }

    try {
      setIsSubmittingModule(true)
      if (editingModule) {
        await adminCurriculumService.updateModule(editingModule.id, {
          title: moduleTitle.trim(),
          description: moduleDescription.trim() || undefined,
          order_column: moduleOrder,
        })
        toast.success('Module updated successfully.')
      } else {
        await adminCurriculumService.createModule({
          recorded_session_id: session.id,
          title: moduleTitle.trim(),
          description: moduleDescription.trim() || undefined,
          order_column: moduleOrder,
        })
        toast.success('Module created successfully.')
      }

      setIsModuleModalOpen(false)
      fetchCurriculum(session.id)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save module'))
    } finally {
      setIsSubmittingModule(false)
    }
  }

  // --- Lesson Handlers ---
  const handleOpenAddLesson = (modId: number) => {
    setTargetModuleId(modId)
    setEditingLesson(null)
    setLessonTitle('')
    setLessonVideoUrl('')
    setLessonDuration('')
    setLessonDescription('')
    setLessonIsFreePreview(false)
    setLessonThumbnailFile(null)
    setLessonThumbnailUrl('')
    setLessonThumbnailPreview('')
    const targetMod = modules.find((m) => m.id === modId)
    setLessonOrder(targetMod?.lessons?.length || 0)
    setIsLessonModalOpen(true)
  }

  const handleOpenEditLesson = (lesson: CourseLessonItem) => {
    setTargetModuleId(lesson.course_module_id)
    setEditingLesson(lesson)
    setLessonTitle(lesson.title)
    setLessonVideoUrl(lesson.video_url || '')
    setLessonDuration(lesson.duration || '')
    setLessonDescription(lesson.description || '')
    setLessonIsFreePreview(Boolean(lesson.is_free_preview))
    setLessonThumbnailFile(null)
    setLessonThumbnailUrl('')
    setLessonThumbnailPreview(
      lesson.thumbnail_url || (lesson.thumbnail ? getStorageUrl(lesson.thumbnail) : '')
    )
    setLessonOrder(lesson.order_column || 0)
    setIsLessonModalOpen(true)
  }

  const handleLessonThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLessonThumbnailFile(file)
      setLessonThumbnailPreview(URL.createObjectURL(file))
      setLessonThumbnailUrl('')
    }
  }

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetModuleId || !lessonTitle.trim() || !lessonVideoUrl.trim()) {
      toast.error('Please enter a lesson title and video URL.')
      return
    }

    try {
      setIsSubmittingLesson(true)
      const formData = new FormData()
      formData.append('course_module_id', String(targetModuleId))
      formData.append('title', lessonTitle.trim())
      formData.append('video_url', lessonVideoUrl.trim())
      formData.append('duration', lessonDuration.trim())
      formData.append('description', lessonDescription.trim())
      formData.append('is_free_preview', lessonIsFreePreview ? '1' : '0')
      formData.append('order_column', String(lessonOrder))

      if (lessonThumbnailFile) {
        formData.append('thumbnail', lessonThumbnailFile)
      } else if (lessonThumbnailUrl.trim()) {
        formData.append('thumbnail', lessonThumbnailUrl.trim())
      }

      if (editingLesson) {
        await adminCurriculumService.updateLesson(editingLesson.id, formData)
        toast.success('Video lesson updated successfully.')
      } else {
        await adminCurriculumService.createLesson(formData)
        toast.success('Video lesson created successfully.')
      }

      setIsLessonModalOpen(false)
      if (session) {
        fetchCurriculum(session.id)
        fetchSession() // refresh lesson count
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save lesson'))
    } finally {
      setIsSubmittingLesson(false)
    }
  }

  // --- Delete confirmation execution ---
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeletingItem(true)
      if (deleteTarget.type === 'module') {
        await adminCurriculumService.deleteModule(deleteTarget.id)
        toast.success('Module deleted successfully.')
      } else {
        await adminCurriculumService.deleteLesson(deleteTarget.id)
        toast.success('Lesson deleted successfully.')
      }

      setDeleteTarget(null)
      if (session) {
        fetchCurriculum(session.id)
        fetchSession()
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, `Failed to delete ${deleteTarget.type}`))
    } finally {
      setIsDeletingItem(false)
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
  const totalLessonsCalculated = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)

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
              </div>
              <p className='text-xs text-muted-foreground mt-0.5'>
                Recorded Course Details, Video Curriculum &amp; Resources Manager
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
                  <Badge variant='secondary' className='gap-1'>
                    <BookOpen className='size-3' />{' '}
                    {totalLessonsCalculated > 0 ? `${totalLessonsCalculated} Lessons` : session.lessons || '0 Lessons'}
                  </Badge>
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
                      <Layers className='size-4 text-primary' /> {modules.length} Modules ({totalLessonsCalculated} Videos)
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

            {/* --- COURSE CURRICULUM & VIDEO LESSONS MANAGER --- */}
            <Card className='border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 via-card to-card shadow-sm'>
              <CardHeader className='pb-3'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                  <div>
                    <CardTitle className='text-lg font-bold flex items-center gap-2 text-foreground'>
                      <Video className='size-5 text-indigo-500' />
                      Course Curriculum &amp; Video Lessons
                    </CardTitle>
                    <CardDescription className='text-xs mt-0.5'>
                      Add course modules (e.g. Introduction to System Design), upload video lessons, assign thumbnails, and toggle free previews.
                    </CardDescription>
                  </div>
                  <Button
                    type='button'
                    size='sm'
                    onClick={handleOpenAddModule}
                    className='gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0'
                  >
                    <Plus className='size-4' /> Add Module
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='space-y-4 pt-1'>
                {loadingCurriculum ? (
                  <div className='py-8 text-center'>
                    <Loader2 className='size-6 animate-spin text-indigo-500 mx-auto mb-2' />
                    <p className='text-xs text-muted-foreground'>Loading curriculum modules...</p>
                  </div>
                ) : modules.length === 0 ? (
                  <div className='p-8 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/5 text-center'>
                    <Video className='size-10 text-indigo-400 mx-auto mb-3 opacity-60' />
                    <h4 className='text-sm font-bold text-foreground'>No Curriculum Modules Created Yet</h4>
                    <p className='text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4'>
                      Organize this course into structured chapters (e.g. &quot;Module 1: Introduction to System Design&quot;) and attach video lessons with custom thumbnails.
                    </p>
                    <Button
                      type='button'
                      size='sm'
                      onClick={handleOpenAddModule}
                      className='gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white'
                    >
                      <Plus className='size-4' /> Create Module 1
                    </Button>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {modules.map((module, mIdx) => {
                      const isExpanded = expandedModules[module.id] !== false
                      const moduleLessons = module.lessons || []

                      return (
                        <div
                          key={module.id}
                          className='rounded-xl border border-border bg-card overflow-hidden shadow-xs'
                        >
                          {/* Module Header */}
                          <div className='p-3.5 bg-muted/40 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                            <button
                              type='button'
                              onClick={() => toggleModuleAccordion(module.id)}
                              className='flex items-center gap-2.5 text-left font-semibold text-sm hover:text-indigo-500 transition-colors flex-1'
                            >
                              {isExpanded ? (
                                <ChevronDown className='size-4 text-muted-foreground shrink-0' />
                              ) : (
                                <ChevronRight className='size-4 text-muted-foreground shrink-0' />
                              )}
                              <Badge variant='outline' className='bg-indigo-500/10 text-indigo-500 border-indigo-500/30 text-xs shrink-0 font-bold'>
                                Module {mIdx + 1}
                              </Badge>
                              <span className='font-bold text-foreground line-clamp-1'>
                                {module.title}
                              </span>
                              <span className='text-xs text-muted-foreground font-normal shrink-0'>
                                ({moduleLessons.length} {moduleLessons.length === 1 ? 'Lesson' : 'Lessons'})
                              </span>
                            </button>

                            <div className='flex items-center gap-1.5 shrink-0 self-end sm:self-auto'>
                              <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                className='h-8 text-xs gap-1 border-indigo-500/30 text-indigo-600 hover:bg-indigo-500/10 dark:text-indigo-400'
                                onClick={() => handleOpenAddLesson(module.id)}
                              >
                                <Plus className='size-3.5' /> Add Lesson
                              </Button>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                className='size-8 text-muted-foreground hover:text-foreground'
                                onClick={() => handleOpenEditModule(module)}
                                title='Edit Module Title'
                              >
                                <Edit2 className='size-3.5' />
                              </Button>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                className='size-8 text-muted-foreground hover:text-destructive'
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'module',
                                    id: module.id,
                                    title: module.title,
                                  })
                                }
                                title='Delete Module'
                              >
                                <Trash2 className='size-3.5' />
                              </Button>
                            </div>
                          </div>

                          {/* Module Description if any */}
                          {module.description && isExpanded && (
                            <div className='px-4 py-2 bg-muted/10 border-b text-xs text-muted-foreground italic'>
                              {module.description}
                            </div>
                          )}

                          {/* Lessons List Accordion Content */}
                          {isExpanded && (
                            <div className='p-3 space-y-2.5 bg-background/50'>
                              {moduleLessons.length === 0 ? (
                                <div className='py-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg bg-muted/10'>
                                  <Video className='size-6 text-muted-foreground/40 mx-auto mb-1' />
                                  <p>No video lessons added to this module yet.</p>
                                  <Button
                                    type='button'
                                    variant='link'
                                    size='sm'
                                    className='text-xs text-indigo-500 mt-1 h-auto p-0'
                                    onClick={() => handleOpenAddLesson(module.id)}
                                  >
                                    + Add first video lesson
                                  </Button>
                                </div>
                              ) : (
                                moduleLessons.map((lesson, lIdx) => {
                                  const lessonThumb =
                                    lesson.thumbnail_url ||
                                    (lesson.thumbnail ? getStorageUrl(lesson.thumbnail) : null)

                                  return (
                                    <div
                                      key={lesson.id}
                                      className='p-3 rounded-lg border bg-card/80 hover:bg-muted/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3'
                                    >
                                      {/* Left: Thumbnail + Title + Metadata */}
                                      <div className='flex items-center gap-3 min-w-0'>
                                        <div className='relative size-14 rounded-md overflow-hidden bg-muted border shrink-0 flex items-center justify-center shadow-xs'>
                                          {lessonThumb ? (
                                            <img
                                              src={lessonThumb}
                                              alt={lesson.title}
                                              className='size-full object-cover'
                                            />
                                          ) : (
                                            <div className='size-full bg-gradient-to-br from-indigo-950 to-slate-900 flex items-center justify-center text-indigo-400'>
                                              <Play className='size-5 fill-indigo-400/30' />
                                            </div>
                                          )}
                                          <div className='absolute bottom-0.5 right-0.5 bg-black/80 text-[9px] text-white font-mono px-1 rounded'>
                                            L{lIdx + 1}
                                          </div>
                                        </div>

                                        <div className='min-w-0 space-y-1'>
                                          <div className='flex items-center gap-2 flex-wrap'>
                                            <p className='text-sm font-semibold text-foreground truncate'>
                                              {lesson.title}
                                            </p>
                                            {lesson.is_free_preview ? (
                                              <Badge className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-1.5 h-4 gap-1'>
                                                <Unlock className='size-2.5' /> Free Preview
                                              </Badge>
                                            ) : (
                                              <Badge variant='outline' className='text-muted-foreground text-[10px] py-0 px-1.5 h-4 gap-1'>
                                                <Lock className='size-2.5' /> Enrolled Only
                                              </Badge>
                                            )}
                                          </div>

                                          <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                                            {lesson.duration && (
                                              <span className='flex items-center gap-1 font-mono'>
                                                <Clock className='size-3 text-indigo-400' />
                                                {lesson.duration}
                                              </span>
                                            )}
                                            {lesson.video_url && (
                                              <a
                                                href={lesson.video_url}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                className='text-xs text-indigo-500 hover:underline flex items-center gap-1 truncate max-w-[200px] font-mono'
                                                title={lesson.video_url}
                                              >
                                                <ExternalLink className='size-3 shrink-0' />
                                                <span className='truncate'>{lesson.video_url}</span>
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Right: Actions */}
                                      <div className='flex items-center gap-1.5 shrink-0 self-end sm:self-auto'>
                                        <Button
                                          type='button'
                                          variant='outline'
                                          size='icon'
                                          className='size-8'
                                          onClick={() => handleOpenEditLesson(lesson)}
                                          title='Edit Lesson'
                                        >
                                          <Edit2 className='size-3.5' />
                                        </Button>
                                        <Button
                                          type='button'
                                          variant='ghost'
                                          size='icon'
                                          className='size-8 text-muted-foreground hover:text-destructive'
                                          onClick={() =>
                                            setDeleteTarget({
                                              type: 'lesson',
                                              id: lesson.id,
                                              title: lesson.title,
                                            })
                                          }
                                          title='Delete Lesson'
                                        >
                                          <Trash2 className='size-3.5' />
                                        </Button>
                                      </div>
                                    </div>
                                  )
                                })
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* --- COURSE RESOURCES (PDF STUDY MATERIALS ONLY) --- */}
            <Card className='border-emerald-500/20 bg-emerald-500/5 shadow-xs'>
              <CardHeader className='pb-2'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base font-semibold flex items-center gap-2'>
                    <FolderOpen className='size-5 text-emerald-500' />
                    Course Study Resources &amp; PDF Materials
                  </CardTitle>
                </div>
                <CardDescription className='text-xs'>
                  Upload downloadable PDF study notes, cheatsheets, and project files for enrolled students.
                </CardDescription>
              </CardHeader>
              <CardContent className='pt-2'>
                <div className='p-4 rounded-xl border bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                  <div>
                    <p className='text-sm font-semibold text-foreground'>Manage Course Downloadable PDFs</p>
                    <p className='text-xs text-muted-foreground mt-0.5'>
                      Create document categories and upload lecture notes, interview cheatsheets, and PDF references.
                    </p>
                  </div>
                  <Button
                    variant='default'
                    size='sm'
                    className='gap-2 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white'
                    onClick={() => navigate({ to: '/resources', search: { session_id: String(session.id) } })}
                  >
                    <FolderOpen className='size-4' /> Manage Course PDFs
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Single Attached Study Notes / PDF Resource Card */}
            <Card className='border-red-500/20 shadow-xs'>
              <CardHeader className='pb-2'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base font-semibold flex items-center gap-2'>
                    <FileText className='size-5 text-red-500' />
                    Primary Attached PDF Notes
                  </CardTitle>
                  {session.resource && (
                    <Badge variant='outline' className='text-xs text-emerald-500 border-emerald-500/30 bg-emerald-500/10'>
                      <CheckCircle2 className='size-3 mr-1' /> Attached
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
                    <p className='text-sm font-medium text-foreground'>No primary PDF notes attached to this session</p>
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

      {/* --- ADD / EDIT MODULE MODAL --- */}
      <Dialog open={isModuleModalOpen} onOpenChange={setIsModuleModalOpen}>
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>
              {editingModule ? 'Edit Course Module' : 'Create Course Module'}
            </DialogTitle>
            <DialogDescription>
              A module represents a chapter or topic grouping (e.g. &quot;Module 1: Introduction to System Design&quot;).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveModule} className='space-y-4 py-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='module_title'>
                Module Title <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='module_title'
                placeholder='e.g. Module 1: Introduction to System Design'
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                required
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='module_desc'>Description (Optional)</Label>
              <Textarea
                id='module_desc'
                placeholder='Brief description of what is covered in this module...'
                value={moduleDescription}
                onChange={(e) => setModuleDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='module_order'>Sort Order</Label>
              <Input
                id='module_order'
                type='number'
                min='0'
                value={moduleOrder}
                onChange={(e) => setModuleOrder(Number(e.target.value))}
              />
            </div>

            <DialogFooter className='pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsModuleModalOpen(false)}
                disabled={isSubmittingModule}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className='bg-indigo-600 hover:bg-indigo-700 text-white'
                disabled={isSubmittingModule}
              >
                {isSubmittingModule && <Loader2 className='size-4 animate-spin mr-2' />}
                {editingModule ? 'Update Module' : 'Create Module'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- ADD / EDIT LESSON MODAL --- */}
      <Dialog open={isLessonModalOpen} onOpenChange={setIsLessonModalOpen}>
        <DialogContent className='sm:max-w-[560px] max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? 'Edit Video Lesson' : 'Add New Video Lesson'}
            </DialogTitle>
            <DialogDescription>
              Provide the lesson title, video stream or YouTube embed URL, duration, thumbnail and access setting.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveLesson} className='space-y-4 py-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='lesson_title'>
                Lesson Title <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='lesson_title'
                placeholder='e.g. What is System Design? or HLD vs LLD'
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                required
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='lesson_video_url'>
                Video URL (YouTube, Vimeo, Cloudflare Stream, MP4) <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='lesson_video_url'
                placeholder='https://www.youtube.com/watch?v=... or https://vimeo.com/...'
                value={lessonVideoUrl}
                onChange={(e) => setLessonVideoUrl(e.target.value)}
                required
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label htmlFor='lesson_duration'>Duration</Label>
                <Input
                  id='lesson_duration'
                  placeholder='e.g. 15 Mins or 22:45'
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(e.target.value)}
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='lesson_order'>Lesson Order</Label>
                <Input
                  id='lesson_order'
                  type='number'
                  min='0'
                  value={lessonOrder}
                  onChange={(e) => setLessonOrder(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Thumbnail Upload or URL */}
            <div className='space-y-2 border rounded-lg p-3 bg-muted/20'>
              <Label className='text-xs font-semibold uppercase text-muted-foreground'>
                Lesson Thumbnail Image
              </Label>
              {lessonThumbnailPreview ? (
                <div className='relative aspect-video w-full max-w-[200px] rounded-md overflow-hidden border bg-muted'>
                  <img
                    src={lessonThumbnailPreview}
                    alt='Thumbnail preview'
                    className='size-full object-cover'
                  />
                  <Button
                    type='button'
                    variant='destructive'
                    size='icon'
                    className='absolute top-1 right-1 size-6'
                    onClick={() => {
                      setLessonThumbnailFile(null)
                      setLessonThumbnailPreview('')
                      setLessonThumbnailUrl('')
                    }}
                  >
                    <Trash2 className='size-3' />
                  </Button>
                </div>
              ) : (
                <div className='flex flex-col gap-2'>
                  <label className='flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-indigo-500 bg-background/50 text-xs text-muted-foreground'>
                    <UploadCloud className='size-4 text-indigo-500' />
                    <span>Upload thumbnail file (JPG, PNG, WebP)</span>
                    <input
                      type='file'
                      accept='image/*'
                      className='hidden'
                      onChange={handleLessonThumbnailChange}
                    />
                  </label>
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <div className='h-px flex-1 bg-border' />
                    <span>OR</span>
                    <div className='h-px flex-1 bg-border' />
                  </div>
                  <Input
                    placeholder='Or paste image URL (https://...)'
                    value={lessonThumbnailUrl}
                    onChange={(e) => {
                      setLessonThumbnailUrl(e.target.value)
                      setLessonThumbnailPreview(e.target.value)
                    }}
                    className='text-xs'
                  />
                </div>
              )}
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='lesson_desc'>Description / Summary (Optional)</Label>
              <Textarea
                id='lesson_desc'
                placeholder='Summary or topics covered in this lesson...'
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Free Preview Toggle */}
            <div className='flex items-center justify-between rounded-lg border p-3 bg-muted/20'>
              <div className='space-y-0.5'>
                <Label htmlFor='lesson_free_preview' className='cursor-pointer text-sm font-medium'>
                  Free Preview Available
                </Label>
                <p className='text-xs text-muted-foreground'>
                  Allow students to watch this video lesson for free before purchasing.
                </p>
              </div>
              <Switch
                id='lesson_free_preview'
                checked={lessonIsFreePreview}
                onCheckedChange={setLessonIsFreePreview}
              />
            </div>

            <DialogFooter className='pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsLessonModalOpen(false)}
                disabled={isSubmittingLesson}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className='bg-indigo-600 hover:bg-indigo-700 text-white'
                disabled={isSubmittingLesson}
              >
                {isSubmittingLesson && <Loader2 className='size-4 animate-spin mr-2' />}
                {editingLesson ? 'Save Changes' : 'Add Lesson'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- CONFIRM DELETE (MODULE OR LESSON) --- */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        handleConfirm={handleConfirmDelete}
        title={`Delete ${deleteTarget?.type === 'module' ? 'Module' : 'Video Lesson'}?`}
        desc={`Are you sure you want to permanently delete "${deleteTarget?.title}"? ${
          deleteTarget?.type === 'module' ? 'All lessons inside this module will also be deleted.' : ''
        }`}
        confirmText='Delete'
        destructive
        isLoading={isDeletingItem}
      />

      {/* Confirm Delete Course Dialog */}
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
