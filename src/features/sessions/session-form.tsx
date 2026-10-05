import { useState, useEffect } from 'react'
import { useNavigate, useSearch, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Loader2,
  Plus,
  X,
  CheckCircle2,
  ExternalLink,
  FileText,
  Download,
  IndianRupee,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  adminSessionService,
  getCategoryName,
  type InfoCardItem,
} from '@/services/admin-sessions'
import {
  adminSessionCategoryService,
  type SessionCategoryItem,
} from '@/services/admin-session-category'
import {
  adminInstructorService,
  type InstructorItem,
} from '@/services/admin-instructors'
import { getApiErrorMessage } from '@/lib/api-client'
import { getStorageUrl } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FCKEditor } from '@/components/fck-editor'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function SessionForm() {
  const navigate = useNavigate()
  const search: any = useSearch({ strict: false })
  const editingId = search?.id ? Number(search.id) : null

  const [isLoading, setIsLoading] = useState(Boolean(editingId))
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dynamic Categories and Instructors from database
  const [categoriesList, setCategoriesList] = useState<SessionCategoryItem[]>([])
  const [instructorsList, setInstructorsList] = useState<InstructorItem[]>([])

  // Form State
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('')
  const [instructorId, setInstructorId] = useState<string>('none')
  const [sectionOne, setSectionOne] = useState('')
  const [sectionTwo, setSectionTwo] = useState('')
  const [price, setPrice] = useState('49')
  const [originalPrice, setOriginalPrice] = useState('99')
  const [infoCards, setInfoCards] = useState<InfoCardItem[]>([
    { title: 'Duration', description: '2 Hours' },
    { title: 'Mode', description: 'Online (Zoom)' },
  ])
  const [isActive, setIsActive] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // PDF Resource state
  const [resourceFile, setResourceFile] = useState<File | null>(null)
  const [existingResource, setExistingResource] = useState<any>(null)
  const [removeResource, setRemoveResource] = useState(false)

  // Fetch categories & instructors from database
  async function loadData() {
    try {
      const [catRes, instRes] = await Promise.all([
        adminSessionCategoryService.getCategories({ all: true }),
        adminInstructorService.getInstructors({ all: true }),
      ])
      if (catRes.status && Array.isArray(catRes.data)) {
        setCategoriesList(catRes.data)
        if (catRes.data.length > 0 && !editingId) {
          setCategory((prev) => prev || catRes.data[0].name)
        }
      }
      if (instRes.status && Array.isArray(instRes.data)) {
        setInstructorsList(instRes.data)
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!editingId) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
      setSlug(generatedSlug)
    }
  }

  // Load existing session details if in editing mode
  useEffect(() => {
    if (!editingId) return

    async function fetchSession() {
      try {
        setIsLoading(true)
        const res = await adminSessionService.getSession(editingId!)
        const session = res.data
        setTitle(session.title || '')
        setSlug(session.slug || '')

        const catName = getCategoryName(session.category)
        setCategory(catName)

        if (session.instructor_id) {
          setInstructorId(String(session.instructor_id))
        } else if (session.instructor?.id) {
          setInstructorId(String(session.instructor.id))
        } else {
          setInstructorId('none')
        }

        setSectionOne(session.section_one_content || '')
        setSectionTwo(session.section_two_content || '')
        setIsActive(Boolean(session.is_active))

        if (session.image_url) {
          setImagePreview(getStorageUrl(session.image_url))
        }

        if (session.info_cards && Array.isArray(session.info_cards)) {
          const feeCard = session.info_cards.find((c: any) =>
            /fee|price|cost|participation|offer/i.test(c.label || c.title || c.key || '')
          )
          if (feeCard) {
            setPrice(((feeCard as any).price || (feeCard as any).value || feeCard.description || '').replace(/^₹/, ''))
            setOriginalPrice((feeCard.original_price || '').replace(/^₹/, ''))
          }
          const badges = session.info_cards.filter((c: any) =>
            !/fee|price|cost|participation|offer/i.test(c.label || c.title || c.key || '')
          )
          if (badges.length > 0) {
            setInfoCards(badges)
          }
        }

        if (session.resource) {
          setExistingResource(session.resource)
        }
      } catch (err) {
        toast.error(getApiErrorMessage(err))
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [editingId])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleResourceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        toast.error('Only PDF files (.pdf) are allowed.')
        e.target.value = ''
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error('PDF file size must not exceed 20 MB.')
        e.target.value = ''
        return
      }
      setResourceFile(file)
      setRemoveResource(false)
    }
  }

  const handleAddCard = () => {
    setInfoCards((prev) => [
      ...prev,
      { title: 'New Highlight', description: 'Highlight Detail' },
    ])
  }

  const handleRemoveCard = (index: number) => {
    setInfoCards((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleCardChange = (
    index: number,
    field: keyof InfoCardItem,
    value: string
  ) => {
    setInfoCards((prev) =>
      prev.map((card, idx) =>
        idx === index ? { ...card, [field]: value } : card
      )
    )
  }

  const selectedInstructor = instructorsList.find(
    (ins) => String(ins.id) === instructorId
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Session title is required')
      return
    }

    if (!sectionOne.trim()) {
      toast.error('Section 1 Content (Overview) is required')
      return
    }

    try {
      setIsSubmitting(true)
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('slug', slug.trim())

      // Find matched category ID from database list
      const matchedCategory = categoriesList.find(
        (c) => c.name.toLowerCase() === category.toLowerCase()
      )
      if (matchedCategory) {
        formData.append('session_category_id', String(matchedCategory.id))
        formData.append('category', matchedCategory.name)
      } else {
        formData.append('category', category.trim())
      }

      // Append instructor_id (or null if none)
      if (instructorId && instructorId !== 'none') {
        formData.append('instructor_id', instructorId)
        if (selectedInstructor) {
          formData.append('instructor_name', selectedInstructor.name)
          if (selectedInstructor.designation) {
            formData.append('instructor_designation', selectedInstructor.designation)
          }
          if (selectedInstructor.experience) {
            formData.append('instructor_experience', selectedInstructor.experience)
          }
          if (selectedInstructor.bio) {
            formData.append('instructor_bio', selectedInstructor.bio)
          }
        }
      } else {
        formData.append('instructor_id', '')
      }

      formData.append('section_one_content', sectionOne)
      formData.append('section_two_content', sectionTwo)
      formData.append('is_featured', '0')
      formData.append('is_active', isActive ? '1' : '0')

      if (imageFile) {
        formData.append('image', imageFile)
      }

      // PDF Resource notes
      if (resourceFile) {
        formData.append('resource_file', resourceFile)
      }
      if (removeResource) {
        formData.append('remove_resource', '1')
      }

      // Build combined info cards array with separated Pricing & Badges
      const validInfoCards: InfoCardItem[] = []
      if (price.trim()) {
        const cleanPrice = price.trim().startsWith('₹') ? price.trim() : `₹${price.trim()}`
        const cleanOrig = originalPrice.trim()
          ? (originalPrice.trim().startsWith('₹') ? originalPrice.trim() : `₹${originalPrice.trim()}`)
          : undefined
        validInfoCards.push({
          title: 'Participation Fee',
          description: cleanPrice,
          price: cleanPrice,
          original_price: cleanOrig,
        })
      }

      infoCards.forEach((c) => {
        if (c.title.trim() || c.description.trim()) {
          validInfoCards.push({
            title: c.title.trim(),
            description: c.description.trim(),
          })
        }
      })

      formData.append('info_cards', JSON.stringify(validInfoCards))

      if (editingId) {
        await adminSessionService.updateSession(editingId, formData)
        toast.success('Live session updated successfully!')
      } else {
        await adminSessionService.createSession(formData)
        toast.success('Live session created successfully!')
      }

      navigate({ to: '/live-sessions' })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className='flex h-96 items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    )
  }

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
        {/* Top Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Button
              variant='outline'
              size='icon'
              className='size-9'
              onClick={() => navigate({ to: '/live-sessions' })}
              title='Back to Sessions'
            >
              <ArrowLeft className='size-4' />
            </Button>
            <div>
              <h1 className='text-2xl font-bold tracking-tight text-foreground'>
                {editingId ? 'Edit Live Session' : 'Create New Live Session'}
              </h1>
              <p className='text-xs text-muted-foreground mt-0.5'>
                {editingId
                  ? 'Update curriculum, resources & instructors.'
                  : 'Create and publish a comprehensive interactive session.'}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              onClick={() => navigate({ to: '/live-sessions' })}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className='gap-2 shadow-xs'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className='h-4 w-4' />
                  {editingId ? 'Update Session' : 'Publish Session'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 2-Column Responsive Grid Form */}
        <form onSubmit={handleSubmit} className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
          {/* Main 8-Column Area: Content & Details */}
          <div className='lg:col-span-8 flex flex-col gap-6'>
            {/* Card 1: Core Session Info */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base font-semibold'>Session Details</CardTitle>
                <CardDescription>Title, URL slug, and category classification.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='title' className='text-sm font-medium'>
                    Session Title <span className='text-destructive'>*</span>
                  </Label>
                  <Input
                    id='title'
                    placeholder='e.g., Masterclass on Cloud Computing &amp; DevOps'
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='category' className='text-sm font-medium'>
                      Category <span className='text-destructive'>*</span>
                    </Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id='category' className='w-full'>
                        <SelectValue placeholder='Select category' />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesList.length > 0 ? (
                          categoriesList.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value='Tech &amp; Data'>Tech &amp; Data</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='slug' className='text-sm font-medium'>
                      Slug / URL Identifier
                    </Label>
                    <Input
                      id='slug'
                      placeholder='e.g., cloud-computing-masterclass'
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Section 1 Content */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base font-semibold'>
                  Section 1: Overview &amp; Introduction <span className='text-destructive'>*</span>
                </CardTitle>
                <CardDescription>
                  High-level introductory pitch and comprehensive session description.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FCKEditor
                  value={sectionOne}
                  onChange={setSectionOne}
                  placeholder='Describe the overview, key objectives, prerequisites, and goals...'
                />
              </CardContent>
            </Card>

            {/* Card 3: Section 2 Content */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base font-semibold'>
                  Section 2: Detailed Curriculum / Key Highlights
                </CardTitle>
                <CardDescription>
                  In-depth roadmap, modules, agenda topics, and outcomes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FCKEditor
                  value={sectionTwo}
                  onChange={setSectionTwo}
                  placeholder='List the weekly timeline, bulleted takeaways, hands-on projects, certification details...'
                />
              </CardContent>
            </Card>

            {/* Card 4: Dedicated Pricing & Fee Section */}
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base font-semibold flex items-center gap-2'>
                  <IndianRupee className='h-4 w-4 text-emerald-500' /> Pricing &amp; Participation Fee
                </CardTitle>
                <CardDescription>
                  Set the participation fee and optional strikethrough original price.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <Label htmlFor='live_session_price' className='text-xs uppercase font-semibold text-muted-foreground'>
                      Participation Fee / Offer Price (₹) *
                    </Label>
                    <Input
                      id='live_session_price'
                      placeholder='e.g., 49 or 1499'
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <Label htmlFor='live_session_original_price' className='text-xs uppercase font-semibold text-muted-foreground'>
                      Original Price (₹) (Optional strikethrough)
                    </Label>
                    <Input
                      id='live_session_original_price'
                      placeholder='e.g., 99 or 2999'
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 5: Feature Highlights & Badges */}
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-3'>
                <div>
                  <CardTitle className='text-base font-semibold flex items-center gap-2'>
                    <Sparkles className='h-4 w-4 text-primary' /> Session Feature Highlights &amp; Badges
                  </CardTitle>
                  <CardDescription>
                    Key feature badges displayed on the session hero banner (e.g., Duration, Mode, Schedule).
                  </CardDescription>
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleAddCard}
                  className='gap-1.5'
                >
                  <Plus className='size-3.5' /> Add Badge
                </Button>
              </CardHeader>
              <CardContent className='space-y-3'>
                {infoCards.map((card, idx) => (
                  <div
                    key={idx}
                    className='grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-lg border bg-muted/20 items-end'
                  >
                    <div className='md:col-span-5 space-y-1'>
                      <Label className='text-xs font-semibold text-muted-foreground'>Badge Title / Label</Label>
                      <Input
                        placeholder='e.g., Duration, Mode, Target Audience'
                        value={card.title}
                        onChange={(e) => handleCardChange(idx, 'title', e.target.value)}
                        className='h-8 text-xs'
                      />
                    </div>

                    <div className='md:col-span-6 space-y-1'>
                      <Label className='text-xs font-semibold text-muted-foreground'>Badge Value / Detail</Label>
                      <Input
                        placeholder='e.g., 2 Hours, Online (Zoom), College Students'
                        value={card.description}
                        onChange={(e) => handleCardChange(idx, 'description', e.target.value)}
                        className='h-8 text-xs'
                      />
                    </div>

                    <div className='md:col-span-1 flex justify-end'>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => handleRemoveCard(idx)}
                        className='size-8 text-muted-foreground hover:text-destructive'
                        title='Remove badge'
                      >
                        <X className='size-4' />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right / Sidebar Column (4 cols) */}
          <div className='lg:col-span-4 flex flex-col gap-6'>
            {/* Card 1: Visibility & Publishing */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base font-semibold'>Visibility &amp; Settings</CardTitle>
                <CardDescription>Control publication on the live website.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between p-3 rounded-lg border bg-muted/20'>
                  <div className='space-y-0.5'>
                    <Label htmlFor='is-active-switch' className='text-sm font-medium cursor-pointer'>
                      Active on Website
                    </Label>
                    <p className='text-xs text-muted-foreground'>
                      Make session visible to students and visitors.
                    </p>
                  </div>
                  <Switch
                    id='is-active-switch'
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>

                <div className='pt-2 border-t flex flex-col gap-2'>
                  <Button
                    type='submit'
                    disabled={isSubmitting}
                    className='w-full gap-2'
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className='h-4 w-4 animate-spin' />
                        Saving Session...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className='h-4 w-4' />
                        {editingId ? 'Update Session' : 'Publish Session'}
                      </>
                    )}
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    className='w-full'
                    onClick={() => navigate({ to: '/live-sessions' })}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Attached PDF Study Resource (Notes) */}
            <Card className='border-red-500/20 shadow-xs'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base font-semibold flex items-center gap-2'>
                  <FileText className='h-4 w-4 text-red-500' /> Session PDF Resource
                </CardTitle>
                <CardDescription className='text-xs'>
                  Attach 1 PDF notes file (max 20 MB) for enrolled students.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {existingResource && !removeResource ? (
                  <div className='p-3 rounded-lg border bg-muted/40 space-y-2.5'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex items-center gap-2.5 min-w-0'>
                        <div className='p-2 rounded bg-red-500/10 text-red-500 flex-shrink-0'>
                          <FileText className='h-4 w-4' />
                        </div>
                        <div className='min-w-0'>
                          <p className='text-xs font-semibold truncate text-foreground'>
                            {existingResource.file_name}
                          </p>
                          <p className='text-[11px] text-muted-foreground uppercase font-mono mt-0.5'>
                            PDF {existingResource.file_size ? `• ${existingResource.file_size}` : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        type='button'
                        onClick={() => {
                          setRemoveResource(true)
                          setResourceFile(null)
                        }}
                        className='text-muted-foreground hover:text-destructive p-1 rounded transition'
                        title='Remove attached PDF'
                      >
                        <X className='h-4 w-4' />
                      </button>
                    </div>

                    {existingResource.file_url && (
                      <a
                        href={existingResource.file_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1 font-medium'
                      >
                        <Download className='h-3.5 w-3.5' /> Preview / Download Current PDF
                      </a>
                    )}

                    <div className='pt-2 border-t space-y-1.5'>
                      <Label htmlFor='replace-live-pdf-input' className='text-xs text-muted-foreground'>
                        Upload Replacement PDF:
                      </Label>
                      <Input
                        id='replace-live-pdf-input'
                        type='file'
                        accept='.pdf,application/pdf'
                        onChange={handleResourceFileChange}
                      />
                    </div>
                  </div>
                ) : (
                  <div className='space-y-2'>
                    <Label htmlFor='resource-live-pdf-input' className='text-xs font-semibold'>
                      Upload PDF Notes File
                    </Label>
                    <Input
                      id='resource-live-pdf-input'
                      type='file'
                      accept='.pdf,application/pdf'
                      onChange={handleResourceFileChange}
                    />
                    <p className='text-[11px] text-muted-foreground'>
                      Single PDF file up to 20 MB. Auto-unlocked for students who register.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 3: Assigned Instructor */}
            <Card>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base font-semibold'>Instructor</CardTitle>
                  <Link
                    to='/instructors'
                    className='text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium'
                  >
                    Manage <ExternalLink className='size-3' />
                  </Link>
                </div>
                <CardDescription>Assign instructor from Instructors module.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='instructor' className='text-xs font-semibold'>
                    Select Instructor
                  </Label>
                  <Select value={instructorId} onValueChange={setInstructorId}>
                    <SelectTrigger id='instructor' className='w-full'>
                      <SelectValue placeholder='Select an instructor' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>None (No Instructor)</SelectItem>
                      {instructorsList.map((ins) => (
                        <SelectItem key={ins.id} value={String(ins.id)}>
                          {ins.name} {ins.designation ? `(${ins.designation})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedInstructor && (
                  <div className='p-3.5 rounded-xl border bg-muted/30 space-y-2'>
                    <div className='flex items-center gap-3'>
                      <Avatar className='size-10 border shadow-xs'>
                        <AvatarImage src={getStorageUrl(selectedInstructor.image_url)} />
                        <AvatarFallback className='text-xs font-bold'>
                          {selectedInstructor.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className='min-w-0'>
                        <div className='text-sm font-semibold text-foreground truncate'>
                          {selectedInstructor.name}
                        </div>
                        <div className='text-xs text-primary font-medium truncate'>
                          {selectedInstructor.designation || 'Instructor'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 4: Cover Image */}
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base font-semibold'>Cover Banner Image</CardTitle>
                <CardDescription>Session hero background / card banner image.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='image' className='text-xs font-semibold'>
                    Upload Banner
                  </Label>
                  <Input
                    id='image'
                    type='file'
                    accept='image/*'
                    onChange={handleImageChange}
                  />
                </div>

                {imagePreview && (
                  <div className='relative aspect-video w-full rounded-lg overflow-hidden border bg-muted shadow-xs'>
                    <img
                      src={imagePreview}
                      alt='Session preview'
                      className='h-full w-full object-cover'
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </Main>
    </>
  )
}
