import { useState, useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Plus,
  X,
  CheckCircle2,
  Layers,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  adminSessionService,
  getCategoryName,
  type SessionItem,
  type InfoCardItem,
} from '@/services/admin-sessions'
import {
  adminSessionCategoryService,
  type SessionCategoryItem,
} from '@/services/admin-session-category'
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
  const [editingSession, setEditingSession] = useState<SessionItem | null>(null)

  // Dynamic Categories from database
  const [categoriesList, setCategoriesList] = useState<SessionCategoryItem[]>([])

  // Form State
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('')
  const [sectionOne, setSectionOne] = useState('')
  const [sectionTwo, setSectionTwo] = useState('')
  const [infoCards, setInfoCards] = useState<InfoCardItem[]>([
    { title: 'Duration', description: '2 Hours' },
    { title: 'Mode', description: 'Online (Zoom)' },
  ])
  const [isFeatured, setIsFeatured] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Fetch categories strictly from database (session_categories table)
  async function loadCategories() {
    try {
      const res = await adminSessionCategoryService.getCategories({ all: true })
      if (res.status && Array.isArray(res.data)) {
        setCategoriesList(res.data)
        if (res.data.length > 0 && !editingId) {
          setCategory((prev) => prev || res.data[0].name)
        }
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  // Auto-generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleTitleChange = (val: string) => {
    const prevAutoSlug = generateSlug(title)
    setTitle(val)
    if (!slug || slug === prevAutoSlug) {
      setSlug(generateSlug(val))
    }
  }

  // Load session if editing
  useEffect(() => {
    if (!editingId) return

    async function loadSession() {
      try {
        setIsLoading(true)
        const res = await adminSessionService.getSession(editingId!)
        if (res.status && res.data) {
          const session = res.data
          setEditingSession(session)
          setTitle(session.title)
          setSlug(session.slug || '')
          setCategory(getCategoryName(session.category))
          setSectionOne(session.section_one_content || '')
          setSectionTwo(session.section_two_content || '')

          if (Array.isArray(session.info_cards) && session.info_cards.length > 0) {
            setInfoCards(
              session.info_cards.map((c: any) => ({
                title: c.title || c.key || '',
                description: c.description || c.value || '',
              }))
            )
          } else {
            setInfoCards([])
          }

          setIsFeatured(session.is_featured)
          setIsActive(session.is_active)

          const primaryImg =
            session.images?.find((img) => img.is_primary)?.image ||
            session.images?.[0]?.image
          if (primaryImg) {
            setImagePreview(getStorageUrl(primaryImg))
          } else if (session.image_url) {
            setImagePreview(session.image_url)
          }
        }
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err))
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [editingId])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const addInfoCardRow = () => {
    setInfoCards((prev) => [...prev, { title: '', description: '' }])
  }

  const updateInfoCardRow = (index: number, field: 'title' | 'description', value: string) => {
    setInfoCards((prev) =>
      prev.map((card, idx) => (idx === index ? { ...card, [field]: value } : card))
    )
  }

  const removeInfoCardRow = (index: number) => {
    setInfoCards((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const finalCategory = category.trim()

    if (!title.trim()) {
      toast.error('Session title is required.')
      return
    }

    if (!finalCategory) {
      toast.error('Session category is required.')
      return
    }

    if (!sectionOne.trim()) {
      toast.error('Section 1 overview content is required.')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      if (slug.trim()) formData.append('slug', slug.trim())

      // Look up matching category ID from categoriesList
      const matchedCat = categoriesList.find(
        (c) =>
          c.name.trim().toLowerCase() === finalCategory.toLowerCase() ||
          String(c.id) === finalCategory ||
          c.slug.toLowerCase() === finalCategory.toLowerCase()
      )

      if (matchedCat) {
        formData.append('session_category_id', String(matchedCat.id))
        formData.append('category_id', String(matchedCat.id))
        formData.append('category', matchedCat.name)
      } else {
        formData.append('category', finalCategory)
      }

      formData.append('section_one_content', sectionOne.trim())
      if (sectionTwo.trim()) {
        formData.append('section_two_content', sectionTwo.trim())
      }

      const validCards = infoCards.filter(
        (c) => c.title.trim() || c.description.trim()
      )
      formData.append('info_cards', JSON.stringify(validCards))

      formData.append('is_featured', isFeatured ? '1' : '0')
      formData.append('is_active', isActive ? '1' : '0')

      if (imageFile) {
        formData.append('image', imageFile)
      }

      if (editingId) {
        await adminSessionService.updateSession(editingId, formData)
        toast.success('Session updated successfully.')
      } else {
        await adminSessionService.createSession(formData)
        toast.success('Session created successfully.')
      }

      navigate({ to: '/sessions' })
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Combined options: strictly DB categories + active session's category
  const categoryOptions = Array.from(
    new Set([
      ...categoriesList.map((c) => c.name),
      category,
    ].filter(Boolean))
  )

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center gap-3'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
        <span className='text-sm text-muted-foreground'>Loading session details...</span>
      </div>
    )
  }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6 pb-12'>
        {/* Top bar with back button & save */}
        <div className='flex flex-wrap items-center justify-between gap-3 border-b pb-4'>
          <div className='flex items-center gap-3'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => navigate({ to: '/sessions' })}
              className='gap-1.5'
            >
              <ArrowLeft className='h-4 w-4' />
              Back to Sessions
            </Button>
            <div>
              <h1 className='text-xl font-bold tracking-tight md:text-2xl'>
                {editingId ? `Edit Session: ${editingSession?.title || `#${editingId}`}` : 'Add New Session'}
              </h1>
              <p className='text-xs text-muted-foreground'>
                {editingId
                  ? 'Update session overview, curriculum details, highlights, and cover banner.'
                  : 'Create a new interactive workshop, webinar, or drive listing.'}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              onClick={() => navigate({ to: '/sessions' })}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type='button'
              onClick={handleSubmit}
              disabled={isSubmitting}
              className='gap-2'
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
          </div>
        </div>

        {/* 2-Column Responsive Layout Form */}
        <form onSubmit={handleSubmit} className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
          {/* Left / Main Column (8 cols) */}
          <div className='lg:col-span-8 flex flex-col gap-6'>
            {/* Card 1: Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base font-semibold'>Session Information</CardTitle>
                <CardDescription>
                  Enter the main title, category classification, and custom URL identifier.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='session-title'>
                      Session Title <span className='text-destructive'>*</span>
                    </Label>
                    <Input
                      id='session-title'
                      placeholder='e.g., Full Stack Web Development Workshop'
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      required
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='session-slug'>Custom Slug (URL identifier)</Label>
                    <Input
                      id='session-slug'
                      placeholder='e.g., full-stack-web-workshop'
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                    <p className='text-[11px] text-muted-foreground'>
                      Leave blank to auto-generate a unique slug from title.
                    </p>
                  </div>
                </div>

                {/* Category Dropdown: strictly DB categories */}
                <div className='space-y-2'>
                  <Label htmlFor='session-category'>
                    Category <span className='text-destructive'>*</span>
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id='session-category'>
                      <SelectValue placeholder='Select category' />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.length === 0 ? (
                        <SelectItem value='none' disabled>
                          No categories found. Add categories in Session Categories.
                        </SelectItem>
                      ) : (
                        categoryOptions.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Overview Content */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base font-semibold'>Section 1: Overview & Introduction</CardTitle>
                <CardDescription>
                  Provide a clear summary, objectives, modules, and key candidate takeaways.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='section-one' className='text-sm font-medium'>
                      Section 1: Overview & Introduction <span className='text-destructive'>*</span>
                    </Label>
                    <span className='text-[11px] text-muted-foreground'>FCKeditor</span>
                  </div>
                  <FCKEditor
                    value={sectionOne}
                    onChange={(html) => setSectionOne(html)}
                    placeholder='Comprehensive overview of what the session covers, who is leading it, and prerequisites...'
                    minHeight='190px'
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Info Cards / Highlights (Between Section 1 & Section 2) */}
            <Card>
              <CardHeader className='flex flex-row items-center justify-between'>
                <div>
                  <CardTitle className='text-base font-semibold'>Key Highlights & Info Cards</CardTitle>
                  <CardDescription>
                    Feature key details like duration, mode, eligibility, certifications, etc.
                  </CardDescription>
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={addInfoCardRow}
                  className='gap-1 h-8 text-xs'
                >
                  <Plus className='h-3.5 w-3.5' /> Add Card
                </Button>
              </CardHeader>
              <CardContent className='space-y-3'>
                {infoCards.length === 0 ? (
                  <div className='rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground'>
                    <Layers className='h-8 w-8 mx-auto mb-2 opacity-50' />
                    No highlights added yet. Click "Add Card" to add duration, eligibility, or mode details.
                  </div>
                ) : (
                  infoCards.map((card, idx) => (
                    <div key={idx} className='flex items-center gap-3 p-2 rounded-lg border bg-muted/20'>
                      <div className='flex-1 space-y-1'>
                        <Label className='text-[11px] text-muted-foreground'>Label / Title</Label>
                        <Input
                          placeholder='e.g., Duration / Eligibility'
                          value={card.title}
                          onChange={(e) => updateInfoCardRow(idx, 'title', e.target.value)}
                          className='h-8 text-xs'
                        />
                      </div>
                      <div className='flex-1 space-y-1'>
                        <Label className='text-[11px] text-muted-foreground'>Value / Detail</Label>
                        <Input
                          placeholder='e.g., 2 Hours / All Students'
                          value={card.description}
                          onChange={(e) => updateInfoCardRow(idx, 'description', e.target.value)}
                          className='h-8 text-xs'
                        />
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='size-8 mt-5 text-destructive hover:bg-destructive/10'
                        onClick={() => removeInfoCardRow(idx)}
                        title='Remove card'
                      >
                        <X className='size-4' />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Card 4: Curriculum & Deliverables */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base font-semibold'>
                  Section 2: Curriculum, Key Deliverables & Outcomes
                </CardTitle>
                <CardDescription>
                  Breakdown of agenda modules, project work, certifications, interview opportunities...
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='section-two' className='text-sm font-medium'>
                      Section 2: Curriculum, Key Deliverables & Outcomes
                    </Label>
                    <span className='text-[11px] text-muted-foreground'>FCKeditor</span>
                  </div>
                  <FCKEditor
                    value={sectionTwo}
                    onChange={(html) => setSectionTwo(html)}
                    placeholder='Breakdown of agenda modules, project work, certifications, interview opportunities...'
                    minHeight='190px'
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right / Sidebar Column (4 cols) */}
          <div className='lg:col-span-4 flex flex-col gap-6'>
            {/* Card 1: Visibility & Publishing */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base font-semibold'>Visibility & Settings</CardTitle>
                <CardDescription>Control publication and home page features.</CardDescription>
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

                <div className='flex items-center justify-between p-3 rounded-lg border bg-muted/20'>
                  <div className='space-y-0.5'>
                    <Label
                      htmlFor='is-featured-switch'
                      className='text-sm font-medium cursor-pointer flex items-center gap-1.5'
                    >
                      <Sparkles className='h-3.5 w-3.5 text-amber-500' />
                      Featured on Home
                    </Label>
                    <p className='text-xs text-muted-foreground'>
                      Showcase prominently on landing page banner.
                    </p>
                  </div>
                  <Switch
                    id='is-featured-switch'
                    checked={isFeatured}
                    onCheckedChange={setIsFeatured}
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
                    onClick={() => navigate({ to: '/sessions' })}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Cover / Banner Image */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base font-semibold'>Session Banner Image</CardTitle>
                <CardDescription>
                  Upload high resolution banner (JPEG, PNG, WebP up to 5MB).
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {imagePreview ? (
                  <div className='relative rounded-lg overflow-hidden border bg-muted group h-48 w-full flex items-center justify-center'>
                    <img
                      src={imagePreview}
                      alt='Banner preview'
                      className='h-full w-full object-cover'
                    />
                    <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                      <Label
                        htmlFor='image-upload-input'
                        className='bg-white text-black text-xs font-semibold py-1.5 px-3 rounded-md cursor-pointer hover:bg-white/90 shadow'
                      >
                        Change Image
                      </Label>
                      {imageFile && (
                        <Button
                          type='button'
                          variant='destructive'
                          size='sm'
                          className='h-8 text-xs'
                          onClick={() => {
                            setImageFile(null)
                            setImagePreview(null)
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <Label
                    htmlFor='image-upload-input'
                    className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center cursor-pointer hover:border-primary hover:bg-muted/30 transition-colors'
                  >
                    <Upload className='h-8 w-8 text-muted-foreground mb-2' />
                    <span className='text-sm font-medium'>Click to upload banner</span>
                    <span className='text-xs text-muted-foreground mt-1'>
                      Recommended ratio 16:9 (e.g., 1280x720)
                    </span>
                  </Label>
                )}

                <Input
                  id='image-upload-input'
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={handleImageChange}
                />
              </CardContent>
            </Card>
          </div>
        </form>
      </Main>
    </>
  )
}
