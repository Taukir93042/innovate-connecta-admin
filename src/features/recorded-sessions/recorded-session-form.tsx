'use client'

import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Loader2,
  Save,
  UploadCloud,
  X,
  Sparkles,
  Video,
  Clock,
  BookOpen,
  IndianRupee,
  GraduationCap,
  FolderTree,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FCKEditor } from '@/components/fck-editor'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  adminRecordedSessionService,
  type RecordedSessionItem,
} from '@/services/admin-recorded-sessions'
import {
  adminSessionCategoryService,
  type SessionCategoryItem,
} from '@/services/admin-session-category'
import {
  adminInstructorService,
  type InstructorItem,
} from '@/services/admin-instructors'

interface RecordedSessionFormProps {
  initialData?: RecordedSessionItem | null
  isEdit?: boolean
}

export function RecordedSessionForm({
  initialData,
  isEdit = false,
}: RecordedSessionFormProps) {
  const navigate = useNavigate()

  // Form States
  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [heading, setHeading] = useState(initialData?.heading || '')
  const [categoryId, setCategoryId] = useState<string>(
    initialData?.session_category_id ? String(initialData.session_category_id) : ''
  )
  const [instructorId, setInstructorId] = useState<string>(
    initialData?.instructor_id ? String(initialData.instructor_id) : ''
  )
  const [duration, setDuration] = useState(initialData?.duration || '')
  const [lessons, setLessons] = useState(initialData?.lessons || '')
  const [originalPrice, setOriginalPrice] = useState(initialData?.original_price || '')
  const [discountPrice, setDiscountPrice] = useState(initialData?.discount_price || '')
  const [previewVideoUrl, setPreviewVideoUrl] = useState(initialData?.preview_video_url || '')
  
  // 2 Rich Text Editors
  const [courseOverview, setCourseOverview] = useState(initialData?.course_overview || '')
  const [whatYouWillLearn, setWhatYouWillLearn] = useState(initialData?.what_you_will_learn || '')

  const [isActive, setIsActive] = useState<boolean>(
    initialData?.is_active !== undefined ? initialData.is_active : true
  )
  const [isFeatured, setIsFeatured] = useState<boolean>(
    initialData?.is_featured !== undefined ? initialData.is_featured : false
  )

  // Thumbnail file state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialData?.thumbnail_url || null
  )

  // Remote data lists
  const [categories, setCategories] = useState<SessionCategoryItem[]>([])
  const [instructors, setInstructors] = useState<InstructorItem[]>([])

  // Submission & UI States
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update states when initialData changes
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setSlug(initialData.slug || '')
      setHeading(initialData.heading || '')
      setCategoryId(initialData.session_category_id ? String(initialData.session_category_id) : '')
      setInstructorId(initialData.instructor_id ? String(initialData.instructor_id) : '')
      setDuration(initialData.duration || '')
      setLessons(initialData.lessons || '')
      setOriginalPrice(initialData.original_price || '')
      setDiscountPrice(initialData.discount_price || '')
      setPreviewVideoUrl(initialData.preview_video_url || '')
      setCourseOverview(initialData.course_overview || '')
      setWhatYouWillLearn(initialData.what_you_will_learn || '')
      setIsActive(initialData.is_active !== undefined ? initialData.is_active : true)
      setIsFeatured(initialData.is_featured !== undefined ? initialData.is_featured : false)
      setThumbnailPreview(initialData.thumbnail_url || null)
    }
  }, [initialData])

  useEffect(() => {
    let isMounted = true
    const loadDependencies = async () => {
      try {
        const [catsRes, instsRes] = await Promise.allSettled([
          adminSessionCategoryService.getCategories({ all: true }),
          adminInstructorService.getInstructors({ all: true }),
        ])

        if (isMounted) {
          if (catsRes.status === 'fulfilled' && catsRes.value?.data) {
            setCategories(Array.isArray(catsRes.value.data) ? catsRes.value.data : [])
          }
          if (instsRes.status === 'fulfilled' && instsRes.value?.data) {
            setInstructors(Array.isArray(instsRes.value.data) ? instsRes.value.data : [])
          }
        }
      } catch (err) {
        console.error('Failed to load dependencies', err)
      }
    }
    loadDependencies()
    return () => {
      isMounted = false
    }
  }, [])

  // Auto-generate slug continuously from title
  const handleTitleChange = (val: string) => {
    setTitle(val)
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
    setSlug(generatedSlug)
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      setThumbnailPreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveThumbnail = () => {
    setThumbnailFile(null)
    setThumbnailPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!title.trim()) {
      setErrors((prev) => ({ ...prev, title: 'Title is required' }))
      return
    }

    try {
      setIsSubmitting(true)

      const formData = new FormData()
      formData.append('title', title.trim())
      if (slug.trim()) formData.append('slug', slug.trim())
      if (heading.trim()) formData.append('heading', heading.trim())
      if (categoryId) formData.append('session_category_id', categoryId)
      if (instructorId) formData.append('instructor_id', instructorId)
      if (duration.trim()) formData.append('duration', duration.trim())
      if (lessons.trim()) formData.append('lessons', lessons.trim())
      if (originalPrice.trim()) formData.append('original_price', originalPrice.trim())
      if (discountPrice.trim()) formData.append('discount_price', discountPrice.trim())
      if (previewVideoUrl.trim()) formData.append('preview_video_url', previewVideoUrl.trim())
      
      // Editor 1: Course Overview
      formData.append('course_overview', courseOverview || '')
      // Editor 2: What You'll Learn
      formData.append('what_you_will_learn', whatYouWillLearn || '')

      formData.append('is_active', isActive ? '1' : '0')
      formData.append('is_featured', isFeatured ? '1' : '0')

      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile)
      } else if (!thumbnailPreview && isEdit) {
        formData.append('thumbnail', '')
      }

      if (isEdit && initialData?.id) {
        await adminRecordedSessionService.updateRecordedSession(
          initialData.id,
          formData
        )
      } else {
        await adminRecordedSessionService.createRecordedSession(formData)
      }

      navigate({ to: '/recorded-sessions' })
    } catch (err: any) {
      console.error('Failed to save recorded session:', err)
      if (err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {}
        Object.entries(err.response.data.errors).forEach(([k, v]: any) => {
          apiErrors[k] = Array.isArray(v) ? v[0] : String(v)
        })
        setErrors(apiErrors)
      } else if (err.response?.data?.message) {
        setErrors({ form: err.response.data.message })
      } else {
        setErrors({ form: 'An unexpected error occurred while saving.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6 max-w-6xl mx-auto pb-16'>
      {/* Top Header Bar */}
      <div className='flex flex-wrap items-center justify-between gap-4 border-b pb-4'>
        <div className='flex items-center gap-3'>
          <Button
            type='button'
            variant='outline'
            size='icon'
            onClick={() => navigate({ to: '/recorded-sessions' })}
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-xl font-bold tracking-tight'>
              {isEdit ? 'Edit Recorded Session' : 'Create New Recorded Session'}
            </h1>
            <p className='text-xs text-muted-foreground'>
              Manage course details, pricing, 2 rich text overview/highlights sections & instructor assignment.
            </p>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <Button
            type='button'
            variant='ghost'
            onClick={() => navigate({ to: '/recorded-sessions' })}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={isSubmitting} className='gap-2 shadow-sm'>
            {isSubmitting ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              <>
                <Save className='h-4 w-4' />
                {isEdit ? 'Update Session' : 'Save Session'}
              </>
            )}
          </Button>
        </div>
      </div>

      {errors.form && (
        <div className='p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium'>
          {errors.form}
        </div>
      )}

      {/* Main Grid Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left 2 Columns: Main Details & 2 Rich Text Editors */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Card 1: Core Course Info */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base flex items-center gap-2'>
                <Video className='h-4 w-4 text-primary' /> Basic Information
              </CardTitle>
              <CardDescription>
                Title, subtitle/heading, and category mapping.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Title */}
              <div className='space-y-1.5'>
                <Label htmlFor='title' className='text-sm font-medium'>
                  Course Title <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='title'
                  placeholder='e.g. Complete Tech Interview & Resume Masterclass'
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && (
                  <p className='text-xs text-destructive'>{errors.title}</p>
                )}
              </div>

              {/* Heading / Subtitle */}
              <div className='space-y-1.5'>
                <Label htmlFor='heading' className='text-sm font-medium'>
                  Heading / Subtitle Tagline
                </Label>
                <Input
                  id='heading'
                  placeholder='e.g. Step-by-step breakdown of STAR behavioral responses & ATS optimization.'
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                />
                <p className='text-[11px] text-muted-foreground'>
                  A one-line punchy subtitle shown right under the course title.
                </p>
              </div>

              {/* Slug (Auto-filled from Title) */}
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='slug' className='text-sm font-medium'>
                    URL Slug
                  </Label>
                  <span className='text-[11px] text-muted-foreground font-mono'>
                    (Auto-filled from title)
                  </span>
                </div>
                <Input
                  id='slug'
                  placeholder='complete-tech-interview-resume-masterclass'
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className={errors.slug ? 'border-destructive font-mono text-xs' : 'font-mono text-xs'}
                />
                {errors.slug && (
                  <p className='text-xs text-destructive'>{errors.slug}</p>
                )}
              </div>

              {/* Category & Instructor Row */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2'>
                {/* Category Select */}
                <div className='space-y-1.5'>
                  <Label className='text-sm font-medium flex items-center gap-1.5'>
                    <FolderTree className='h-3.5 w-3.5 text-muted-foreground' /> Category
                  </Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select Course Category' />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Instructor Select */}
                <div className='space-y-1.5'>
                  <Label className='text-sm font-medium flex items-center gap-1.5'>
                    <GraduationCap className='h-3.5 w-3.5 text-muted-foreground' /> Assigned Instructor
                  </Label>
                  <Select value={instructorId} onValueChange={setInstructorId}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select Instructor' />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors.map((inst) => (
                        <SelectItem key={inst.id} value={String(inst.id)}>
                          {inst.name} {inst.designation ? `(${inst.designation})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Pricing, Duration & Lessons */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base flex items-center gap-2'>
                <IndianRupee className='h-4 w-4 text-emerald-500' /> Pricing, Duration & Content Structure
              </CardTitle>
              <CardDescription>
                Set the pricing structure and course volume meta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
                {/* Original Price */}
                <div className='space-y-1.5'>
                  <Label htmlFor='original-price' className='text-xs font-semibold text-muted-foreground uppercase'>
                    Original Price (₹)
                  </Label>
                  <Input
                    id='original-price'
                    placeholder='1499'
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                  />
                  <span className='text-[10px] text-muted-foreground'>Strikethrough price</span>
                </div>

                {/* Discount Price */}
                <div className='space-y-1.5'>
                  <Label htmlFor='discount-price' className='text-xs font-semibold text-emerald-600 uppercase'>
                    Offer Price (₹)
                  </Label>
                  <Input
                    id='discount-price'
                    placeholder='499'
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    className='border-emerald-500/40 focus-visible:ring-emerald-500'
                  />
                  <span className='text-[10px] text-emerald-600 font-medium'>Active selling price</span>
                </div>

                {/* Duration */}
                <div className='space-y-1.5'>
                  <Label htmlFor='duration' className='text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1'>
                    <Clock className='h-3 w-3' /> Duration
                  </Label>
                  <Input
                    id='duration'
                    placeholder='3.5 Hours'
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                  <span className='text-[10px] text-muted-foreground'>e.g. 3.5 Hours</span>
                </div>

                {/* Lessons */}
                <div className='space-y-1.5'>
                  <Label htmlFor='lessons' className='text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1'>
                    <BookOpen className='h-3 w-3' /> Lessons Count
                  </Label>
                  <Input
                    id='lessons'
                    placeholder='12 Lessons'
                    value={lessons}
                    onChange={(e) => setLessons(e.target.value)}
                  />
                  <span className='text-[10px] text-muted-foreground'>e.g. 12 Lessons</span>
                </div>
              </div>

              {/* Preview Video URL */}
              <div className='mt-4 pt-4 border-t space-y-1.5'>
                <Label htmlFor='preview_video' className='text-sm font-medium flex items-center gap-1.5'>
                  <Video className='h-3.5 w-3.5 text-primary' /> Free Preview Video Embed / YouTube URL
                </Label>
                <Input
                  id='preview_video'
                  placeholder='https://www.youtube.com/embed/dQw4w9WgXcQ'
                  value={previewVideoUrl}
                  onChange={(e) => setPreviewVideoUrl(e.target.value)}
                />
                <p className='text-[11px] text-muted-foreground'>
                  Allows users on the website to watch a free video preview directly in the popup modal.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: 2 Rich Text Editors */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base flex items-center gap-2'>
                <Sparkles className='h-4 w-4 text-amber-500' /> Course Content & Rich Text Sections (2 Editors)
              </CardTitle>
              <CardDescription>
                Format rich HTML descriptions for Course Overview & Key Highlights.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Text Editor 1: Course Overview */}
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='course-overview' className='text-sm font-semibold flex items-center gap-1.5 text-primary'>
                    <span>Editor 1:</span> Course Overview (About This Masterclass)
                  </Label>
                  <span className='text-[11px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded'>Rich HTML Editor</span>
                </div>
                <FCKEditor
                  value={courseOverview}
                  onChange={(html) => setCourseOverview(html)}
                  placeholder='Write an in-depth summary about this masterclass, why students should take it, target audience, and curriculum structure...'
                  minHeight='220px'
                />
                <p className='text-[11px] text-muted-foreground'>
                  Displayed under the primary "Course Overview" tab on the course details page.
                </p>
              </div>

              {/* Text Editor 2: What You'll Learn / Key Highlights */}
              <div className='space-y-2 pt-4 border-t'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='what-you-will-learn' className='text-sm font-semibold flex items-center gap-1.5 text-emerald-600'>
                    <span>Editor 2:</span> What You'll Learn / Key Highlights
                  </Label>
                  <span className='text-[11px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded'>Rich HTML Editor</span>
                </div>
                <FCKEditor
                  value={whatYouWillLearn}
                  onChange={(html) => setWhatYouWillLearn(html)}
                  placeholder='List key takeaways, bullet points, skills acquired, and practical project achievements...'
                  minHeight='220px'
                />
                <p className='text-[11px] text-muted-foreground'>
                  Displayed in the right-side highlight card & key takeaways breakdown.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Thumbnail & Publishing Status */}
        <div className='space-y-6'>
          {/* Card: Thumbnail Image */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base flex items-center gap-2'>
                <UploadCloud className='h-4 w-4 text-primary' /> Course Thumbnail
              </CardTitle>
              <CardDescription>
                Upload a cover banner for cards & hero banner.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {thumbnailPreview ? (
                <div className='relative rounded-lg overflow-hidden border border-border aspect-video bg-muted flex items-center justify-center group'>
                  <img
                    src={thumbnailPreview}
                    alt='Course Thumbnail'
                    className='w-full h-full object-cover'
                  />
                  <button
                    type='button'
                    onClick={handleRemoveThumbnail}
                    className='absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-full opacity-90 transition'
                  >
                    <X className='h-4 w-4' />
                  </button>
                </div>
              ) : (
                <label className='flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 hover:border-primary rounded-lg aspect-video p-4 cursor-pointer transition bg-muted/20 hover:bg-muted/40'>
                  <UploadCloud className='h-8 w-8 text-muted-foreground mb-2' />
                  <span className='text-xs font-semibold text-foreground'>Upload Course Thumbnail</span>
                  <span className='text-[11px] text-muted-foreground mt-1'>PNG, JPG, WEBP up to 5MB</span>
                  <input
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={handleThumbnailChange}
                  />
                </label>
              )}

              {thumbnailPreview && (
                <label className='block text-center'>
                  <span className='text-xs text-primary hover:underline cursor-pointer'>
                    Change Image
                  </span>
                  <input
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={handleThumbnailChange}
                  />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Card: Status & Visibility */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>Visibility & Status</CardTitle>
              <CardDescription>Publishing settings for this course.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Active Toggle */}
              <div className='flex items-center justify-between p-3 rounded-lg border bg-card'>
                <div className='space-y-0.5'>
                  <Label htmlFor='is_active' className='text-sm font-medium cursor-pointer'>
                    Active / Published
                  </Label>
                  <p className='text-xs text-muted-foreground'>
                    Make this course visible on the public website.
                  </p>
                </div>
                <Switch
                  id='is_active'
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>


            </CardContent>
          </Card>

          {/* Card: Instructor Quick Preview */}
          {instructorId && (
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-xs uppercase text-muted-foreground font-semibold'>
                  Assigned Instructor Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const inst = instructors.find((i) => String(i.id) === instructorId)
                  if (!inst) return null
                  return (
                    <div className='flex items-center gap-3'>
                      <Avatar className='h-10 w-10 border'>
                        <AvatarImage src={inst.image_url || undefined} alt={inst.name} />
                        <AvatarFallback className='bg-primary/10 text-primary font-bold text-xs'>
                          {inst.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className='text-sm font-bold leading-none'>{inst.name}</p>
                        <p className='text-xs text-muted-foreground mt-1'>
                          {inst.designation || 'Instructor'}
                        </p>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  )
}
