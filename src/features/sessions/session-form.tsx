import { useState, useEffect } from 'react'
import { useNavigate, useSearch, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Plus,
  X,
  CheckCircle2,
  Layers,
  Upload,
  IndianRupee,
  UserCircle,
  GraduationCap,
  ExternalLink,
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
  const [infoCards, setInfoCards] = useState<InfoCardItem[]>([
    { title: 'Participation Fee', description: '₹49', original_price: '₹99' },
    { title: 'Duration', description: '2 Hours' },
    { title: 'Mode', description: 'Online (Zoom)' },
  ])
  const [isFeatured, setIsFeatured] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

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
        setIsFeatured(Boolean(session.is_featured))
        setIsActive(Boolean(session.is_active))

        if (session.image_url) {
          setImagePreview(getStorageUrl(session.image_url))
        }

        if (session.info_cards && Array.isArray(session.info_cards)) {
          setInfoCards(session.info_cards)
        }
      } catch (err) {
        toast.error(getApiErrorMessage(err))
        navigate({ to: '/sessions' })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [editingId, navigate])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Info Cards / Highlights Handlers
  const addInfoCardRow = () => {
    setInfoCards((prev) => [...prev, { title: '', description: '' }])
  }

  const updateInfoCard = (index: number, field: keyof InfoCardItem, value: string) => {
    setInfoCards((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const removeInfoCardRow = (index: number) => {
    setInfoCards((prev) => prev.filter((_, i) => i !== index))
  }

  const isFeeRow = (titleStr: string) => {
    const t = (titleStr || '').toLowerCase()
    return (
      t.includes('fee') ||
      t.includes('price') ||
      t.includes('cost') ||
      t.includes('participation') ||
      t.includes('offer')
    )
  }

  const selectedInstructor = instructorsList.find(
    (i) => String(i.id) === instructorId
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Session title is required.')
      return
    }

    if (!category.trim()) {
      toast.error('Please select a valid session category.')
      return
    }

    if (!sectionOne.trim()) {
      toast.error('Section 1 (Introduction & Overview) is required.')
      return
    }

    try {
      setIsSubmitting(true)
      const formData = new FormData()

      formData.append('title', title.trim())
      if (slug.trim()) formData.append('slug', slug.trim())

      const matchedCat = categoriesList.find(
        (c) => c.name.toLowerCase() === category.toLowerCase()
      )
      if (matchedCat) {
        formData.append('session_category_id', String(matchedCat.id))
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
      formData.append('is_featured', isFeatured ? '1' : '0')
      formData.append('is_active', isActive ? '1' : '0')

      if (imageFile) {
        formData.append('image', imageFile)
      }

      // Filter valid info cards
      const validInfoCards = infoCards.filter((c) => c.title.trim() || c.description.trim())
      formData.append('info_cards', JSON.stringify(validInfoCards))

      if (editingId) {
        await adminSessionService.updateSession(editingId, formData)
        toast.success('Session updated successfully!')
      } else {
        await adminSessionService.createSession(formData)
        toast.success('Session created successfully!')
      }

      navigate({ to: '/sessions' })
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
              <h1 className='text-2xl font-bold tracking-tight'>
                {editingId ? 'Edit Session' : 'Create New Session'}
              </h1>
            </div>
            <p className='text-sm text-muted-foreground ml-10'>
              {editingId
                ? 'Update session details, assigned instructor, info cards, and banner image.'
                : 'Create and publish a comprehensive interactive session.'}
            </p>
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
              onClick={handleSubmit}
              disabled={isSubmitting}
              className='gap-2'
            >
              {isSubmitting && <Loader2 className='h-4 w-4 animate-spin' />}
              <CheckCircle2 className='h-4 w-4' />
              {editingId ? 'Save Changes' : 'Publish Session'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
          {/* Main Content Column (8 cols) */}
          <div className='lg:col-span-8 space-y-6'>
            {/* Card 1: Core Details */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base font-semibold'>Session Details</CardTitle>
                <CardDescription>
                  Title, URL slug, and category classification.
                </CardDescription>
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
                    <Select value={category} onValueChange={(val) => setCategory(val)}>
                      <SelectTrigger id='category'>
                        <SelectValue placeholder='Select category' />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesList.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
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

            {/* Card 2: Overview & Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base font-semibold'>
                  Section 1: Overview &amp; Introduction <span className='text-destructive'>*</span>
                </CardTitle>
                <CardDescription>
                  High-level introductory pitch and comprehensive session description.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='section-one' className='text-sm font-medium'>
                      Section 1: Overview &amp; Introduction
                    </Label>
                    <span className='text-[11px] text-muted-foreground'>FCKeditor</span>
                  </div>
                  <FCKEditor
                    value={sectionOne}
                    onChange={(html) => setSectionOne(html)}
                    placeholder='Describe the overview, key objectives, prerequisites, and goals...'
                    minHeight='220px'
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Key Highlights & Info Cards */}
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-3'>
                <div>
                  <CardTitle className='text-base font-semibold flex items-center gap-2'>
                    <Layers className='h-4 w-4 text-primary' />
                    Key Highlights &amp; Session Info Cards
                  </CardTitle>
                  <CardDescription>
                    Provide key metadata like Participation Fee (with Discount &amp; Original price), Duration, Schedule, and Mode.
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
              <CardContent className='space-y-4'>
                {infoCards.length === 0 ? (
                  <div className='text-center py-6 border border-dashed rounded-lg text-muted-foreground text-sm'>
                    No info cards added. Click "Add Card" to add highlights like Fee, Date, Mode.
                  </div>
                ) : (
                  infoCards.map((card, idx) => {
                    const isFee = isFeeRow(card.title)
                    return (
                      <div
                        key={idx}
                        className='p-3.5 rounded-lg border bg-muted/20 relative space-y-3'
                      >
                        <div className='flex items-start gap-3'>
                          <div className='grid grid-cols-1 md:grid-cols-2 gap-3 flex-1'>
                            <div className='space-y-1.5'>
                              <Label className='text-xs font-medium text-muted-foreground'>
                                Label / Title
                              </Label>
                              <Input
                                placeholder='e.g., Participation Fee, Date, Mode'
                                value={card.title}
                                onChange={(e) => updateInfoCard(idx, 'title', e.target.value)}
                                className='h-9 text-sm'
                              />
                            </div>

                            <div className='space-y-1.5'>
                              <Label className='text-xs font-medium text-muted-foreground'>
                                {isFee ? 'Discounted / Offer Price' : 'Value / Details'}
                              </Label>
                              <Input
                                placeholder={isFee ? 'e.g., ₹49 or Free' : 'e.g., 2 Hours'}
                                value={card.description}
                                onChange={(e) => updateInfoCard(idx, 'description', e.target.value)}
                                className='h-9 text-sm'
                              />
                            </div>

                            {isFee ? (
                              <div className='space-y-1.5 md:col-span-2 bg-background/50 p-2.5 rounded-md border'>
                                <Label className='text-xs font-medium text-muted-foreground flex items-center gap-1'>
                                  <IndianRupee className='h-3.5 w-3.5 text-amber-500' />
                                  Original Strikethrough Price (Optional)
                                </Label>
                                <Input
                                  placeholder='e.g., ₹99'
                                  value={card.original_price || ''}
                                  onChange={(e) =>
                                    updateInfoCard(idx, 'original_price', e.target.value)
                                  }
                                  className='h-8 text-xs'
                                />
                              </div>
                            ) : null}
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
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            {/* Card 4: Curriculum & Deliverables */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base font-semibold'>
                  Section 2: Curriculum, Key Deliverables &amp; Outcomes
                </CardTitle>
                <CardDescription>
                  Breakdown of agenda modules, project work, certifications, interview opportunities...
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='section-two' className='text-sm font-medium'>
                      Section 2: Curriculum, Key Deliverables &amp; Outcomes
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
                <CardTitle className='text-base font-semibold'>Visibility &amp; Settings</CardTitle>
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

            {/* Card: Assigned Instructor (Right Sidebar) */}
            <Card>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-base font-semibold flex items-center gap-2'>
                    <GraduationCap className='h-4 w-4 text-primary' />
                    Instructor
                  </CardTitle>
                  <Link
                    to='/instructors'
                    className='text-xs font-semibold text-primary hover:underline flex items-center gap-1'
                  >
                    Manage <ExternalLink className='h-3 w-3' />
                  </Link>
                </div>
                <CardDescription className='text-xs'>
                  Assign instructor from Instructors module.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='space-y-1.5'>
                  <Label htmlFor='instructor-select' className='text-xs font-medium'>
                    Select Instructor
                  </Label>
                  <Select value={instructorId} onValueChange={setInstructorId}>
                    <SelectTrigger id='instructor-select' className='h-9 text-xs bg-background'>
                      <SelectValue placeholder='Choose an instructor...' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>None (No instructor)</SelectItem>
                      {instructorsList.map((inst) => (
                        <SelectItem key={inst.id} value={String(inst.id)}>
                          {inst.name} {inst.designation ? `• ${inst.designation}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Instructor Profile Card Preview */}
                {selectedInstructor && (
                  <div className='p-3 rounded-lg border bg-muted/20 flex items-start gap-3 mt-2'>
                    <Avatar className='h-10 w-10 border shadow-xs shrink-0'>
                      {selectedInstructor.image_url && (
                        <AvatarImage
                          src={getStorageUrl(selectedInstructor.image_url)}
                          alt={selectedInstructor.name}
                        />
                      )}
                      <AvatarFallback className='bg-primary/10 text-primary font-bold text-xs'>
                        {selectedInstructor.name
                          .split(' ')
                          .map((w) => w[0])
                          .filter(Boolean)
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='space-y-0.5 flex-1 min-w-0'>
                      <div className='font-bold text-xs text-foreground truncate'>
                        {selectedInstructor.name}
                      </div>
                      {selectedInstructor.designation && (
                        <div className='text-[11px] font-medium text-primary truncate'>
                          {selectedInstructor.designation}
                        </div>
                      )}
                      {selectedInstructor.experience && (
                        <div className='text-[10px] text-muted-foreground truncate'>
                          {selectedInstructor.experience}
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
