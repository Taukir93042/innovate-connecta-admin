import { useState, useEffect } from 'react'
import {
  Plus,
  Search as SearchIcon,
  Trash2,
  Edit2,
  Image as ImageIcon,
  MapPin,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { adminGalleryService, type GalleryItem } from '@/services/admin-gallery'
import {
  adminGalleryCategoryService,
  type GalleryCategoryItem,
} from '@/services/admin-gallery-category'
import { getApiErrorMessage } from '@/lib/api-client'
import { getStorageUrl } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { PaginationBar } from '@/components/pagination-bar'

export function Galleries() {
  const [galleries, setGalleries] = useState<GalleryItem[]>([])
  const [categories, setCategories] = useState<GalleryCategoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [perPage, setPerPage] = useState(10)

  // Create / Edit modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form fields
  const [formTitle, setFormTitle] = useState('')
  const [formCategoryId, setFormCategoryId] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formImageFile, setFormImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Delete modal state
  const [deleteItem, setDeleteItem] = useState<GalleryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Full image view modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  // Fetch categories from API
  async function fetchCategories() {
    try {
      const res = await adminGalleryCategoryService.getCategories({ all: true })
      if (res.status && Array.isArray(res.data)) {
        setCategories(res.data)
        if (res.data.length > 0 && !formCategoryId) {
          setFormCategoryId(String(res.data[0].id))
        }
      }
    } catch (err: unknown) {
      // Fallback silently if categories fail to load
      // eslint-disable-next-line no-console
      console.error('Failed to load gallery categories', err)
    }
  }

  async function fetchGalleries(page = currentPage, currentPerPage = perPage) {
    try {
      setIsLoading(true)
      const res = await adminGalleryService.getGalleries({
        search: searchQuery || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        page,
        per_page: currentPerPage,
      })
      if (res.status && Array.isArray(res.data)) {
        setGalleries(res.data)
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
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchGalleries(currentPage, perPage)
  }, [currentPage, perPage, selectedCategory])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentPage !== 1) {
      setCurrentPage(1)
    } else {
      fetchGalleries(1, perPage)
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setFormTitle('')
    setFormCategoryId(categories.length > 0 ? String(categories[0].id) : '')
    setFormLocation('')
    setFormIsActive(true)
    setFormImageFile(null)
    setImagePreview(null)
    setIsFormOpen(true)
  }

  const openEditModal = (item: GalleryItem) => {
    setEditingItem(item)
    setFormTitle(item.title)
    const catId =
      item.gallery_category_id ||
      (typeof item.category === 'object' && item.category !== null
        ? item.category.id
        : undefined) ||
      (typeof item.category === 'string'
        ? categories.find((c) => c.name === item.category)?.id
        : undefined)
    setFormCategoryId(
      catId
        ? String(catId)
        : categories.length > 0
          ? String(categories[0].id)
          : ''
    )
    setFormLocation(item.location || '')
    setFormIsActive(item.is_active)
    setFormImageFile(null)
    setImagePreview(getStorageUrl(item.image))
    setIsFormOpen(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      toast.error('Please enter a title.')
      return
    }

    if (!formCategoryId) {
      toast.error('Please select a category.')
      return
    }

    if (!editingItem && !formImageFile) {
      toast.error('Please select an image.')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', formTitle)
      formData.append('gallery_category_id', formCategoryId)
      formData.append('category_id', formCategoryId)
      const selectedCat = categories.find((c) => String(c.id) === formCategoryId)
      if (selectedCat) {
        formData.append('category', selectedCat.name)
      }
      if (formLocation) formData.append('location', formLocation)
      formData.append('is_active', formIsActive ? '1' : '0')
      if (formImageFile) {
        formData.append('image', formImageFile)
      }

      if (editingItem) {
        await adminGalleryService.updateGallery(editingItem.id, formData)
        toast.success('Gallery item updated successfully.')
      } else {
        await adminGalleryService.createGallery(formData)
        toast.success('Gallery item created successfully.')
      }

      setIsFormOpen(false)
      fetchGalleries()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (item: GalleryItem) => {
    try {
      await adminGalleryService.toggleStatus(item.id)
      setGalleries((prev) =>
        prev.map((g) =>
          g.id === item.id ? { ...g, is_active: !g.is_active } : g
        )
      )
      toast.success(
        `Gallery ${!item.is_active ? 'activated' : 'deactivated'} successfully.`
      )
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return
    setIsDeleting(true)
    try {
      await adminGalleryService.deleteGallery(deleteItem.id)
      toast.success('Gallery item deleted successfully.')
      setGalleries((prev) => prev.filter((g) => g.id !== deleteItem.id))
      setDeleteItem(null)
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsDeleting(false)
    }
  }

  const categoryTabList = [
    'All',
    ...categories.filter((c) => c.is_active).map((c) => c.name),
  ]

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
              Gallery Management
            </h1>
            <p className='text-sm text-muted-foreground'>
              View, organize, and manage photo galleries in a structured table.
            </p>
          </div>
          <Button onClick={openCreateModal} className='gap-2'>
            <Plus className='h-4 w-4' />
            Add New Photo
          </Button>
        </div>

        {/* Dynamic Category Filters & Search Bar from Database */}
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex flex-wrap items-center gap-2'>
            {categoryTabList.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size='sm'
                onClick={() => {
                  setSelectedCategory(cat)
                  setCurrentPage(1)
                }}
              >
                {cat}
              </Button>
            ))}
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className='flex items-center gap-2 w-full sm:w-72'
          >
            <div className='relative flex-1'>
              <SearchIcon className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search photos or location...'
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
            <p>Loading gallery items...</p>
          </div>
        ) : galleries.length === 0 ? (
          <div className='flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center'>
            <ImageIcon className='h-12 w-12 text-muted-foreground/60 mb-2' />
            <h3 className='text-lg font-semibold'>No gallery items found</h3>
            <p className='text-sm text-muted-foreground max-w-sm mb-4'>
              {searchQuery
                ? 'No images match your search criteria. Try a different search.'
                : 'Get started by uploading event photos and workshop memories.'}
            </p>
            <Button onClick={openCreateModal} size='sm'>
              <Plus className='mr-1.5 h-4 w-4' /> Add Photo
            </Button>
          </div>
        ) : (
          <div className='rounded-lg border bg-card shadow-xs overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/50'>
                  <TableHead className='w-[70px]'>S.No</TableHead>
                  <TableHead className='w-[100px]'>Photo</TableHead>
                  <TableHead className='min-w-[220px]'>Title</TableHead>
                  <TableHead className='w-[160px]'>Category</TableHead>
                  <TableHead className='w-[180px]'>Location</TableHead>
                  <TableHead className='w-[130px]'>Status</TableHead>
                  <TableHead className='w-[100px] text-end'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {galleries.map((item, index) => (
                  <TableRow key={item.id} className='hover:bg-muted/40'>
                    {/* S.No */}
                    <TableCell className='py-3 font-medium text-muted-foreground'>
                      #{(currentPage - 1) * perPage + index + 1}
                    </TableCell>

                    {/* Image Thumbnail */}
                    <TableCell className='py-3'>
                      <div
                        className='relative group size-16 rounded-md overflow-hidden bg-muted border cursor-pointer'
                        onClick={() => setPreviewImageUrl(getStorageUrl(item.image))}
                        title='Click to view full image'
                      >
                        <img
                          src={getStorageUrl(item.image)}
                          alt={item.title}
                          className='h-full w-full object-cover transition-transform group-hover:scale-110'
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src =
                              'https://placehold.co/150x150?text=No+Img'
                          }}
                        />
                        <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white'>
                          <ExternalLink className='size-4' />
                        </div>
                      </div>
                    </TableCell>

                    {/* Title */}
                    <TableCell className='py-3'>
                      <div className='font-semibold text-sm line-clamp-2' title={item.title}>
                        {item.title}
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell className='py-3'>
                      <Badge variant='outline' className='font-normal text-xs'>
                        {typeof item.category === 'object' && item.category !== null
                          ? item.category.name
                          : (item.category ||
                              categories.find(
                                (c) => c.id === item.gallery_category_id
                              )?.name ||
                              'General')}
                      </Badge>
                    </TableCell>

                    {/* Location */}
                    <TableCell className='py-3 text-xs text-muted-foreground'>
                      {item.location ? (
                        <span className='flex items-center gap-1'>
                          <MapPin className='size-3.5 text-primary shrink-0' />
                          <span className='truncate'>{item.location}</span>
                        </span>
                      ) : (
                        <span className='text-muted-foreground/60'>—</span>
                      )}
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
                          {item.is_active ? 'Active' : 'Inactive'}
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
                itemName='photos'
              />
            </div>
          </div>
        )}
      </Main>

      {/* Image Preview Modal */}
      <Dialog
        open={!!previewImageUrl}
        onOpenChange={(open) => !open && setPreviewImageUrl(null)}
      >
        <DialogContent className='sm:max-w-2xl p-2 bg-background/95 backdrop-blur-md'>
          {previewImageUrl && (
            <div className='relative w-full max-h-[80vh] flex items-center justify-center overflow-hidden rounded-md'>
              <img
                src={previewImageUrl}
                alt='Full preview'
                className='max-h-[75vh] w-auto max-w-full object-contain rounded-md'
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className='sm:max-w-lg'>
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Gallery Photo' : 'Upload Gallery Photo'}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? 'Update details or replace the gallery image.'
                  : 'Add a new image to the community and event gallery.'}
              </DialogDescription>
            </DialogHeader>

            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label htmlFor='title'>Title *</Label>
                <Input
                  id='title'
                  placeholder='e.g., Annual Tech Workshop 2026'
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='grid gap-2'>
                  <Label htmlFor='category'>Category *</Label>
                  <Select
                    value={formCategoryId}
                    onValueChange={setFormCategoryId}
                  >
                    <SelectTrigger id='category'>
                      <SelectValue placeholder='Select category' />
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

                <div className='grid gap-2'>
                  <Label htmlFor='location'>Location</Label>
                  <Input
                    id='location'
                    placeholder='e.g., Innovation Hub, Hall B'
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='image'>
                  {editingItem ? 'Change Image (Optional)' : 'Select Image *'}
                </Label>
                <Input
                  id='image'
                  type='file'
                  accept='image/*'
                  onChange={handleImageChange}
                  required={!editingItem}
                />
                {imagePreview && (
                  <div className='relative mt-2 aspect-video w-full rounded-md overflow-hidden border'>
                    <img
                      src={imagePreview}
                      alt='Preview'
                      className='h-full w-full object-cover'
                    />
                  </div>
                )}
              </div>

              <div className='flex items-center gap-3 pt-2'>
                <Switch
                  id='is_active'
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                />
                <Label htmlFor='is_active' className='cursor-pointer text-sm font-normal'>
                  Published and visible on website
                </Label>
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
                  'Update Photo'
                ) : (
                  'Upload Photo'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title='Delete Gallery Item'
        desc={`Are you sure you want to permanently delete "${deleteItem?.title}"? This action cannot be undone.`}
        confirmText='Delete'
        destructive
        isLoading={isDeleting}
        handleConfirm={handleDeleteConfirm}
        className='sm:max-w-sm'
      />
    </>
  )
}
