import { useState, useEffect, useTransition } from 'react'
import {
  Plus,
  Search as SearchIcon,
  Edit2,
  Trash2,
  Loader2,
  Check,
  Eye,
  GraduationCap,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { PaginationBar } from '@/components/pagination-bar'

export function Instructors() {
  return <InstructorsFeature />
}

export function InstructorsFeature() {
  const [instructors, setInstructors] = useState<InstructorItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isPending, startTransition] = useTransition()

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InstructorItem | null>(null)
  const [viewItem, setViewItem] = useState<InstructorItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<InstructorItem | null>(null)
  const [isBulkDeletingOpen, setIsBulkDeletingOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form inputs state
  const [formName, setFormName] = useState('')
  const [formDesignation, setFormDesignation] = useState('')
  const [formExperience, setFormExperience] = useState('')
  const [formBio, setFormBio] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const fetchInstructors = async (currentPage = page, searchQuery = search) => {
    try {
      setLoading(true)
      const res = await adminInstructorService.getInstructors({
        page: currentPage,
        per_page: 10,
        search: searchQuery.trim() || undefined,
      })

      if (res.status && Array.isArray(res.data)) {
        setInstructors(res.data)
        if (res.pagination) {
          setTotalPages(res.pagination.last_page)
          setTotalCount(res.pagination.total)
        }
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to fetch instructors'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstructors(page, search)
  }, [page])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchInstructors(1, search)
  }

  const handleToggleStatus = async (item: InstructorItem) => {
    try {
      await adminInstructorService.toggleStatus(item.id)
      setInstructors((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, is_active: !it.is_active } : it
        )
      )
      toast.success(
        `Instructor status updated to ${!item.is_active ? 'Active' : 'Inactive'}`
      )
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update status'))
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setFormName('')
    setFormDesignation('')
    setFormExperience('')
    setFormBio('')
    setFormIsActive(true)
    setAvatarFile(null)
    setAvatarPreview(null)
    setIsFormOpen(true)
  }

  const openEditModal = (item: InstructorItem) => {
    setEditingItem(item)
    setFormName(item.name || '')
    setFormDesignation(item.designation || '')
    setFormExperience(item.experience || '')
    setFormBio(item.bio || '')
    setFormIsActive(item.is_active)
    setAvatarFile(null)
    setAvatarPreview(item.image_url ? getStorageUrl(item.image_url) : null)
    setIsFormOpen(true)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      toast.error('Instructor name is required')
      return
    }

    try {
      setIsSubmitting(true)
      const formData = new FormData()
      formData.append('name', formName.trim())
      formData.append('designation', formDesignation.trim())
      formData.append('experience', formExperience.trim())
      formData.append('bio', formBio.trim())
      formData.append('is_active', formIsActive ? '1' : '0')

      if (avatarFile) {
        formData.append('image', avatarFile)
      }

      if (editingItem) {
        await adminInstructorService.updateInstructor(editingItem.id, formData)
        toast.success('Instructor updated successfully')
      } else {
        await adminInstructorService.createInstructor(formData)
        toast.success('Instructor added successfully')
      }

      setIsFormOpen(false)
      fetchInstructors(page, search)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save instructor'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return
    try {
      setIsDeleting(true)
      await adminInstructorService.deleteInstructor(deleteItem.id)
      toast.success('Instructor deleted successfully')
      setDeleteItem(null)
      fetchInstructors(page, search)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete instructor'))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.length === 0) return
    try {
      setIsBulkDeleting(true)
      await adminInstructorService.bulkDeleteInstructors(selectedIds)
      toast.success(`${selectedIds.length} instructors deleted successfully`)
      setSelectedIds([])
      setIsBulkDeletingOpen(false)
      fetchInstructors(page, search)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete selected instructors'))
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(instructors.map((i) => i.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'IN'
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
          <div>
            <div className='flex items-center gap-2'>
              <GraduationCap className='h-6 w-6 text-primary' />
              <h1 className='text-2xl font-bold tracking-tight'>Instructors</h1>
            </div>
            <p className='text-sm text-muted-foreground mt-1'>
              Manage masterclass instructors, industry experts, designation, experience, and bios.
            </p>
          </div>

          <div className='flex items-center gap-2'>
            {selectedIds.length > 0 && (
              <Button
                variant='destructive'
                size='sm'
                onClick={() => setIsBulkDeletingOpen(true)}
                className='gap-1.5'
              >
                <Trash2 className='h-4 w-4' />
                Delete Selected ({selectedIds.length})
              </Button>
            )}

            <Button onClick={openCreateModal} className='gap-2 shadow-sm'>
              <Plus className='h-4 w-4' /> Add Instructor
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4'>
          <form onSubmit={handleSearchSubmit} className='flex flex-1 items-center gap-2'>
            <div className='relative flex-1 max-w-sm'>
              <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search instructors by name, role, bio...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-9 h-9'
              />
            </div>
            <Button type='submit' size='sm' variant='secondary' className='h-9'>
              Search
            </Button>
            {search && (
              <Button
                type='button'
                size='sm'
                variant='ghost'
                onClick={() => {
                  setSearch('')
                  fetchInstructors(1, '')
                }}
                className='h-9 text-xs'
              >
                Clear
              </Button>
            )}
          </form>

          <div className='text-xs text-muted-foreground font-medium'>
            Total Instructors: <span className='font-bold text-foreground'>{totalCount}</span>
          </div>
        </div>

        {/* Instructors Table */}
        <div className='rounded-lg border bg-card shadow-xs overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow className='bg-muted/40'>
                <TableHead className='w-12 text-center'>
                  <input
                    type='checkbox'
                    checked={
                      instructors.length > 0 &&
                      selectedIds.length === instructors.length
                    }
                    onChange={handleSelectAll}
                    className='h-4 w-4 rounded border-gray-300'
                  />
                </TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Designation &amp; Role</TableHead>
                <TableHead className='hidden md:table-cell'>Experience Highlight</TableHead>
                <TableHead className='text-center'>Status</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-48 text-center'>
                    <div className='flex flex-col items-center justify-center gap-2 text-muted-foreground'>
                      <Loader2 className='h-6 w-6 animate-spin text-primary' />
                      <span className='text-xs'>Loading instructors...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : instructors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-48 text-center'>
                    <div className='flex flex-col items-center justify-center gap-2 text-muted-foreground'>
                      <GraduationCap className='h-10 w-10 stroke-1' />
                      <p className='text-sm font-medium text-foreground'>No instructors found</p>
                      <p className='text-xs text-muted-foreground'>
                        Click "Add Instructor" to configure expert educators.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                instructors.map((instructor) => {
                  const avatarSrc = instructor.image_url
                    ? getStorageUrl(instructor.image_url)
                    : null
                  return (
                    <TableRow key={instructor.id} className='hover:bg-muted/20'>
                      <TableCell className='text-center'>
                        <input
                          type='checkbox'
                          checked={selectedIds.includes(instructor.id)}
                          onChange={() => handleSelectOne(instructor.id)}
                          className='h-4 w-4 rounded border-gray-300'
                        />
                      </TableCell>

                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-10 w-10 border shadow-xs'>
                            {avatarSrc && <AvatarImage src={avatarSrc} alt={instructor.name} />}
                            <AvatarFallback className='bg-primary/10 text-primary font-bold text-xs'>
                              {getInitials(instructor.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className='space-y-0.5'>
                            <div className='font-semibold text-foreground text-sm flex items-center gap-1.5'>
                              {instructor.name}
                            </div>
                            <div className='text-xs text-muted-foreground line-clamp-1 max-w-[200px]'>
                              {instructor.bio || 'No bio provided'}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className='text-sm font-medium text-foreground'>
                          {instructor.designation || 'Instructor'}
                        </span>
                      </TableCell>

                      <TableCell className='hidden md:table-cell'>
                        <span className='text-xs text-muted-foreground line-clamp-1 max-w-xs'>
                          {instructor.experience || '—'}
                        </span>
                      </TableCell>

                      <TableCell className='text-center'>
                        <div className='flex items-center justify-center gap-2'>
                          <Switch
                            checked={instructor.is_active}
                            onCheckedChange={() => handleToggleStatus(instructor)}
                          />
                          <Badge
                            variant={instructor.is_active ? 'default' : 'secondary'}
                            className={
                              instructor.is_active
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]'
                                : 'text-[10px]'
                            }
                          >
                            {instructor.is_active ? 'Active' : 'Hidden'}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 text-muted-foreground hover:text-foreground'
                            onClick={() => setViewItem(instructor)}
                            title='View Details'
                          >
                            <Eye className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 text-muted-foreground hover:text-primary'
                            onClick={() => openEditModal(instructor)}
                            title='Edit Instructor'
                          >
                            <Edit2 className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 text-muted-foreground hover:text-destructive'
                            onClick={() => setDeleteItem(instructor)}
                            title='Delete Instructor'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='mt-4 flex justify-end'>
            <PaginationBar
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </Main>

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle className='text-lg font-bold flex items-center gap-2'>
                <GraduationCap className='h-5 w-5 text-primary' />
                {editingItem ? 'Edit Instructor Profile' : 'Add New Instructor'}
              </DialogTitle>
              <DialogDescription className='text-xs'>
                Fill in the instructor name, designation, industry experience, and bio.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4 py-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='instructor_form_name' className='text-xs font-semibold'>
                    Full Name <span className='text-destructive'>*</span>
                  </Label>
                  <Input
                    id='instructor_form_name'
                    placeholder='e.g., John Smith'
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='instructor_form_role' className='text-xs font-semibold'>
                    Designation / Role
                  </Label>
                  <Input
                    id='instructor_form_role'
                    placeholder='e.g., Course Instructor &amp; Data Lead'
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='instructor_form_exp' className='text-xs font-semibold'>
                  Experience / Subtitle Highlight
                </Label>
                <Input
                  id='instructor_form_exp'
                  placeholder='e.g., 8+ Years Industry Experience in Business Intelligence &amp; Analytics'
                  value={formExperience}
                  onChange={(e) => setFormExperience(e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='instructor_form_bio' className='text-xs font-semibold'>
                  About Instructor / Biography
                </Label>
                <Textarea
                  id='instructor_form_bio'
                  placeholder='Describe teaching background, mentorship experience, certifications, and technical mastery...'
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  rows={4}
                />
              </div>

              <div className='space-y-2 pt-2 border-t'>
                <Label className='text-xs font-semibold'>Avatar / Photo</Label>
                <div className='flex items-center gap-4'>
                  <Avatar className='h-14 w-14 border shadow-xs'>
                    {avatarPreview ? (
                      <AvatarImage src={avatarPreview} alt='Preview' />
                    ) : (
                      <AvatarFallback className='bg-primary/10 text-primary font-bold'>
                        {formName ? getInitials(formName) : 'IN'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className='space-y-1.5'>
                    <Input
                      id='instructor_avatar_file'
                      type='file'
                      accept='image/*'
                      onChange={handleAvatarChange}
                      className='text-xs h-9'
                    />
                    <span className='text-[11px] text-muted-foreground block'>
                      Square photo recommended (JPG, PNG, WebP up to 2MB).
                    </span>
                  </div>
                </div>
              </div>

              <div className='flex items-center justify-between pt-2 border-t'>
                <div className='space-y-0.5'>
                  <Label htmlFor='form_is_active' className='text-xs font-medium cursor-pointer'>
                    Active on Website
                  </Label>
                  <p className='text-[11px] text-muted-foreground'>
                    Display instructor across course sessions.
                  </p>
                </div>
                <Switch
                  id='form_is_active'
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                />
              </div>
            </div>

            <DialogFooter className='gap-2 pt-2 border-t'>
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
                  'Update Instructor'
                ) : (
                  'Add Instructor'
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
                <div className='flex items-center justify-between mb-2'>
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
                <div className='flex items-start gap-4 pt-1'>
                  <Avatar className='h-16 w-16 border shadow-sm'>
                    {viewItem.image_url && (
                      <AvatarImage
                        src={getStorageUrl(viewItem.image_url)}
                        alt={viewItem.name}
                      />
                    )}
                    <AvatarFallback className='bg-primary/10 text-primary font-bold text-lg'>
                      {getInitials(viewItem.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className='space-y-1 flex-1'>
                    <DialogTitle className='text-lg font-bold'>{viewItem.name}</DialogTitle>
                    <div className='text-xs font-semibold text-primary'>
                      {viewItem.designation || 'Course Instructor'}
                    </div>
                    {viewItem.experience && (
                      <div className='text-xs text-muted-foreground font-medium'>
                        {viewItem.experience}
                      </div>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {viewItem.bio && (
                <div className='my-3 rounded-lg border bg-muted/20 p-4'>
                  <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5'>
                    Biography
                  </span>
                  <p className='text-sm text-foreground/90 leading-relaxed whitespace-pre-line'>
                    {viewItem.bio}
                  </p>
                </div>
              )}

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
                  <Edit2 className='h-4 w-4' /> Edit Instructor
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Single Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title='Delete Instructor?'
        desc={`Are you sure you want to permanently delete "${deleteItem?.name}"? This action cannot be undone.`}
        confirmText='Delete'
        destructive
        isLoading={isDeleting}
        handleConfirm={handleDeleteConfirm}
        className='sm:max-w-sm'
      />

      {/* Delete Bulk Confirmation Dialog */}
      <ConfirmDialog
        open={isBulkDeletingOpen}
        onOpenChange={setIsBulkDeletingOpen}
        title='Delete Selected Instructors?'
        desc={`Are you sure you want to permanently delete ${selectedIds.length} instructors? This action cannot be undone.`}
        confirmText={`Delete ${selectedIds.length} Instructors`}
        destructive
        isLoading={isBulkDeleting}
        handleConfirm={handleBulkDeleteConfirm}
        className='sm:max-w-sm'
      />
    </>
  )
}
