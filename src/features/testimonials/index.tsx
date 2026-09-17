import { useState, useEffect } from 'react'
import {
  Plus,
  Search as SearchIcon,
  Trash2,
  Edit2,
  Eye,
  Star,
  Quote,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  adminTestimonialService,
  type TestimonialItem,
} from '@/services/admin-testimonials'
import { getApiErrorMessage } from '@/lib/api-client'
import { getStorageUrl, getDisplayNameInitials } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { PaginationBar } from '@/components/pagination-bar'

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFeaturedOnly, setFilterFeaturedOnly] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [perPage, setPerPage] = useState(10)

  // View modal state
  const [viewItem, setViewItem] = useState<TestimonialItem | null>(null)

  // Create / Edit modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TestimonialItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form fields
  const [formName, setFormName] = useState('')
  const [formDesignation, setFormDesignation] = useState('')
  const [formReview, setFormReview] = useState('')
  const [formRating, setFormRating] = useState('5')
  const [formIsFeatured, setFormIsFeatured] = useState(false)
  const [formIsActive, setFormIsActive] = useState(true)
  const [formAvatarFile, setFormAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Delete modal state
  const [deleteItem, setDeleteItem] = useState<TestimonialItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function fetchTestimonials(page = currentPage, currentPerPage = perPage) {
    try {
      setIsLoading(true)
      const res = await adminTestimonialService.getTestimonials({
        search: searchQuery || undefined,
        is_featured: filterFeaturedOnly ? true : undefined,
        page,
        per_page: currentPerPage,
      })
      if (res.status && Array.isArray(res.data)) {
        setTestimonials(res.data)
        if (res.pagination) {
          setCurrentPage(res.pagination.current_page)
          setTotalPages(res.pagination.last_page)
          setTotalItems(res.pagination.total)
        } else {
          setTotalItems(res.data.length)
          setTotalPages(1)
        }
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTestimonials(currentPage, perPage)
  }, [currentPage, perPage, filterFeaturedOnly])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentPage !== 1) {
      setCurrentPage(1)
    } else {
      fetchTestimonials(1, perPage)
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setFormName('')
    setFormDesignation('')
    setFormReview('')
    setFormRating('5')
    setFormIsFeatured(false)
    setFormIsActive(true)
    setFormAvatarFile(null)
    setAvatarPreview(null)
    setIsFormOpen(true)
  }

  const openEditModal = (item: TestimonialItem) => {
    setEditingItem(item)
    setFormName(item.name)
    setFormDesignation(item.designation || '')
    setFormReview(item.review)
    setFormRating(String(item.rating || 5))
    setFormIsFeatured(item.is_featured)
    setFormIsActive(item.is_active)
    setFormAvatarFile(null)
    setAvatarPreview(item.avatar ? getStorageUrl(item.avatar) : null)
    setIsFormOpen(true)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formReview.trim()) {
      toast.error('Please enter reviewer name and feedback review.')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('name', formName)
      if (formDesignation) formData.append('designation', formDesignation)
      formData.append('review', formReview)
      formData.append('rating', formRating)
      formData.append('is_featured', formIsFeatured ? '1' : '0')
      formData.append('is_active', formIsActive ? '1' : '0')
      if (formAvatarFile) {
        formData.append('avatar', formAvatarFile)
      }

      if (editingItem) {
        await adminTestimonialService.updateTestimonial(editingItem.id, formData)
        toast.success('Testimonial updated successfully.')
      } else {
        await adminTestimonialService.createTestimonial(formData)
        toast.success('Testimonial created successfully.')
      }

      setIsFormOpen(false)
      fetchTestimonials()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (item: TestimonialItem) => {
    try {
      await adminTestimonialService.toggleStatus(item.id)
      setTestimonials((prev) =>
        prev.map((t) =>
          t.id === item.id ? { ...t, is_active: !t.is_active } : t
        )
      )
      toast.success(
        `Testimonial ${!item.is_active ? 'activated' : 'deactivated'} successfully.`
      )
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handleToggleFeatured = async (item: TestimonialItem) => {
    try {
      await adminTestimonialService.toggleFeatured(item.id)
      setTestimonials((prev) =>
        prev.map((t) =>
          t.id === item.id ? { ...t, is_featured: !t.is_featured } : t
        )
      )
      toast.success(
        `Testimonial ${!item.is_featured ? 'marked as featured' : 'unmarked from featured'}.`
      )
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return
    setIsDeleting(true)
    try {
      await adminTestimonialService.deleteTestimonial(deleteItem.id)
      toast.success('Testimonial deleted successfully.')
      setTestimonials((prev) => prev.filter((t) => t.id !== deleteItem.id))
      setDeleteItem(null)
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
              Testimonials Management
            </h1>
            <p className='text-sm text-muted-foreground'>
              Manage student reviews, mentor recommendations, and featured partner testimonials.
            </p>
          </div>
          <Button onClick={openCreateModal} className='gap-2'>
            <Plus className='h-4 w-4' />
            Add Testimonial
          </Button>
        </div>

        {/* Filters & Search Bar */}
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <Button
              variant={!filterFeaturedOnly ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilterFeaturedOnly(false)}
            >
              All Testimonials
            </Button>
            <Button
              variant={filterFeaturedOnly ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilterFeaturedOnly(true)}
              className='gap-1.5'
            >
              <Sparkles className='h-3.5 w-3.5 text-amber-500' />
              Featured Only
            </Button>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className='flex items-center gap-2 w-full sm:w-72'
          >
            <div className='relative flex-1'>
              <SearchIcon className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search reviewer or review...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-8'
              />
            </div>
            <Button type='submit' variant='secondary' size='sm'>
              Filter
            </Button>
          </form>
        </div>

        {/* Table Content Area */}
        {isLoading ? (
          <div className='flex min-h-[300px] flex-col items-center justify-center gap-2 text-muted-foreground'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
            <p>Loading testimonials from API...</p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className='flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center'>
            <Quote className='h-12 w-12 text-muted-foreground/60 mb-2' />
            <h3 className='text-lg font-semibold'>No testimonials found</h3>
            <p className='text-sm text-muted-foreground max-w-sm mb-4'>
              {searchQuery
                ? 'No testimonials matched your search term.'
                : 'Start showcasing feedback from candidates, mentors and partner institutions.'}
            </p>
            <Button onClick={openCreateModal} size='sm'>
              <Plus className='mr-1.5 h-4 w-4' /> Add Testimonial
            </Button>
          </div>
        ) : (
          <div className='rounded-lg border bg-card shadow-xs overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/50'>
                  <TableHead className='w-[70px]'>S.No</TableHead>
                  <TableHead className='w-[220px]'>Reviewer</TableHead>
                  <TableHead className='min-w-[280px]'>Review / Feedback</TableHead>
                  <TableHead className='w-[130px]'>Rating</TableHead>
                  <TableHead className='w-[120px]'>Featured</TableHead>
                  <TableHead className='w-[130px]'>Status</TableHead>
                  <TableHead className='w-[120px] text-end'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testimonials.map((item, index) => (
                  <TableRow key={item.id} className='hover:bg-muted/40'>
                    {/* S.No */}
                    <TableCell className='py-3 font-medium text-muted-foreground'>
                      #{(currentPage - 1) * perPage + index + 1}
                    </TableCell>

                    {/* Reviewer (Avatar + Name + Role) */}
                    <TableCell className='py-3'>
                      <div className='flex items-center gap-3'>
                        <Avatar className='h-10 w-10 border shrink-0'>
                          {item.avatar && (
                            <AvatarImage
                              src={getStorageUrl(item.avatar)}
                              alt={item.name}
                            />
                          )}
                          <AvatarFallback className='bg-primary/10 text-primary font-semibold text-xs'>
                            {getDisplayNameInitials(item.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className='min-w-0 flex-1'>
                          <div className='font-semibold text-sm truncate' title={item.name}>
                            {item.name}
                          </div>
                          <div
                            className='text-xs text-muted-foreground truncate'
                            title={item.designation || ''}
                          >
                            {item.designation || 'Participant'}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Review Text (Sliced for concise preview) */}
                    <TableCell className='py-3'>
                      <div
                        className='text-xs text-foreground/90 italic cursor-pointer hover:text-foreground transition-colors'
                        title={item.review}
                        onClick={() => setViewItem(item)}
                      >
                        "{item.review && item.review.length > 55
                          ? `${item.review.slice(0, 55)}...`
                          : item.review}"
                      </div>
                    </TableCell>

                    {/* Rating */}
                    <TableCell className='py-3'>
                      <div className='flex items-center gap-0.5'>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < (item.rating || 5)
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                    </TableCell>

                    {/* Featured Toggle & Badge */}
                    <TableCell className='py-3'>
                      <Button
                        variant={item.is_featured ? 'secondary' : 'ghost'}
                        size='sm'
                        className={`h-7 text-xs px-2 gap-1 rounded-full ${
                          item.is_featured
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={() => handleToggleFeatured(item)}
                        title='Toggle featured on home page'
                      >
                        <Sparkles
                          className={`h-3 w-3 ${
                            item.is_featured ? 'text-amber-500 fill-amber-500' : ''
                          }`}
                        />
                        {item.is_featured ? 'Featured' : 'Regular'}
                      </Button>
                    </TableCell>

                    {/* Status & Switch */}
                    <TableCell className='py-3'>
                      <div className='flex items-center gap-2'>
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggleStatus(item)}
                          aria-label='Toggle visibility'
                        />
                        <Badge
                          variant={item.is_active ? 'default' : 'secondary'}
                          className={
                            item.is_active
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px]'
                              : 'text-muted-foreground text-[11px]'
                          }
                        >
                          {item.is_active ? 'Active' : 'Hidden'}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className='py-3 text-end'>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-8'
                          onClick={() => setViewItem(item)}
                          title='View Testimonial'
                        >
                          <Eye className='size-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-8'
                          onClick={() => openEditModal(item)}
                          title='Edit'
                        >
                          <Edit2 className='size-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-8 text-destructive hover:text-destructive hover:bg-destructive/10'
                          onClick={() => setDeleteItem(item)}
                          title='Delete'
                        >
                          <Trash2 className='size-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div className='border-t px-4'>
              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                perPage={perPage}
                onPageChange={(page) => setCurrentPage(page)}
                onPerPageChange={(newPerPage) => {
                  setPerPage(newPerPage)
                  setCurrentPage(1)
                }}
                itemName='testimonials'
              />
            </div>
          </div>
        )}
      </Main>

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className='sm:max-w-lg'>
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Testimonial' : 'Add Testimonial'}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? 'Update testimonial information and review rating.'
                  : 'Add a new verified testimonial for the landing page.'}
              </DialogDescription>
            </DialogHeader>

            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-2 gap-3'>
                <div className='grid gap-2'>
                  <Label htmlFor='name'>Reviewer Name *</Label>
                  <Input
                    id='name'
                    placeholder='e.g., Jane Doe'
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='designation'>Designation / Role</Label>
                  <Input
                    id='designation'
                    placeholder='e.g., Software Intern at TechCorp'
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                  />
                </div>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='rating'>Star Rating</Label>
                <Select value={formRating} onValueChange={setFormRating}>
                  <SelectTrigger id='rating'>
                    <SelectValue placeholder='Select rating' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='5'>⭐⭐⭐⭐⭐ 5 Stars</SelectItem>
                    <SelectItem value='4'>⭐⭐⭐⭐ 4 Stars</SelectItem>
                    <SelectItem value='3'>⭐⭐⭐ 3 Stars</SelectItem>
                    <SelectItem value='2'>⭐⭐ 2 Stars</SelectItem>
                    <SelectItem value='1'>⭐ 1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='review'>Review / Feedback *</Label>
                <Textarea
                  id='review'
                  placeholder='Write what the student or partner shared about InnovateConnect...'
                  value={formReview}
                  onChange={(e) => setFormReview(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='avatar'>Avatar Image</Label>
                <Input
                  id='avatar'
                  type='file'
                  accept='image/*'
                  onChange={handleAvatarChange}
                />
                {avatarPreview && (
                  <div className='flex items-center gap-3 mt-1'>
                    <Avatar className='h-12 w-12 border'>
                      <AvatarImage src={avatarPreview} />
                      <AvatarFallback>Preview</AvatarFallback>
                    </Avatar>
                    <span className='text-xs text-muted-foreground'>Avatar image selected</span>
                  </div>
                )}
              </div>

              <div className='flex items-center justify-between gap-4 pt-2 border-t'>
                <div className='flex items-center gap-2'>
                  <Switch
                    id='is_active'
                    checked={formIsActive}
                    onCheckedChange={setFormIsActive}
                  />
                  <Label htmlFor='is_active' className='cursor-pointer text-xs font-normal'>
                    Active on website
                  </Label>
                </div>

                <div className='flex items-center gap-2'>
                  <Switch
                    id='is_featured'
                    checked={formIsFeatured}
                    onCheckedChange={setFormIsFeatured}
                  />
                  <Label htmlFor='is_featured' className='cursor-pointer text-xs font-normal flex items-center gap-1'>
                    <Sparkles className='h-3 w-3 text-amber-500' />
                    Featured on Home
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Saving...
                  </>
                ) : editingItem ? (
                  'Update Testimonial'
                ) : (
                  'Create Testimonial'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className='sm:max-w-lg'>
          {viewItem && (
            <>
              <DialogHeader>
                <div className='flex items-center justify-between gap-2 mb-2'>
                  <div className='flex items-center gap-2'>
                    {viewItem.is_featured && (
                      <Badge className='bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-xs'>
                        <Sparkles className='h-3 w-3 text-amber-500 fill-amber-500' /> Featured
                      </Badge>
                    )}
                    <Badge
                      variant={viewItem.is_active ? 'default' : 'secondary'}
                      className={
                        viewItem.is_active
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs'
                          : 'text-xs'
                      }
                    >
                      {viewItem.is_active ? 'Active' : 'Hidden'}
                    </Badge>
                  </div>
                  <div className='flex items-center gap-0.5'>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < (viewItem.rating || 5)
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className='flex items-center gap-3 pt-1'>
                  <Avatar className='h-12 w-12 border'>
                    {viewItem.avatar && (
                      <AvatarImage
                        src={getStorageUrl(viewItem.avatar)}
                        alt={viewItem.name}
                      />
                    )}
                    <AvatarFallback className='bg-primary/10 text-primary font-semibold text-sm'>
                      {getDisplayNameInitials(viewItem.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className='text-base font-bold'>{viewItem.name}</DialogTitle>
                    <DialogDescription className='text-xs'>
                      {viewItem.designation || 'Participant'}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Full Review Content */}
              <div className='my-3 rounded-lg border bg-muted/30 p-4 relative'>
                <Quote className='h-6 w-6 text-muted-foreground/20 absolute top-3 left-3 -scale-x-100' />
                <p className='text-sm text-foreground/90 italic leading-relaxed pt-2 pl-4'>
                  "{viewItem.review}"
                </p>
              </div>

              <DialogFooter className='pt-2'>
                <Button variant='outline' onClick={() => setViewItem(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const itemToEdit = viewItem
                    setViewItem(null)
                    openEditModal(itemToEdit)
                  }}
                  className='gap-1.5'
                >
                  <Edit2 className='h-4 w-4' /> Edit Testimonial
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title='Delete Testimonial'
        desc={`Are you sure you want to permanently delete the testimonial from "${deleteItem?.name}"?`}
        confirmText='Delete'
        destructive
        isLoading={isDeleting}
        handleConfirm={handleDeleteConfirm}
        className='sm:max-w-sm'
      />
    </>
  )
}
