import { useState, useEffect, useTransition } from 'react'
import {
  FolderTree,
  Plus,
  Search as SearchIcon,
  Edit2,
  Trash2,
  Loader2,
  Video,
  Radio,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  adminSessionCategoryService,
  type SessionCategoryItem,
} from '@/services/admin-session-category'
import { getApiErrorMessage } from '@/lib/api-client'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PaginationBar } from '@/components/pagination-bar'

export function SessionCategories() {
  return <SessionCategoriesFeature />
}

export function SessionCategoriesFeature() {
  const [categories, setCategories] = useState<SessionCategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'live' | 'recorded'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [isPending, startTransition] = useTransition()

  // Selected for Bulk Delete
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Modal Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SessionCategoryItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<SessionCategoryItem | null>(null)
  const [isBulkDeletingOpen, setIsBulkDeletingOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formType, setFormType] = useState('all')
  const [formIsActive, setFormIsActive] = useState(true)

  const fetchCategories = async (
    page = currentPage,
    limit = perPage,
    searchQuery = search,
    selectedType = typeFilter
  ) => {
    try {
      setLoading(true)
      const res = await adminSessionCategoryService.getCategories({
        page,
        per_page: limit,
        search: searchQuery.trim() || undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
      })

      if (res.status && Array.isArray(res.data)) {
        setCategories(res.data)
        if (res.pagination) {
          setTotalPages(res.pagination.last_page)
          setTotalItems(res.pagination.total)
        }
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to fetch categories'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories(currentPage, perPage, search, typeFilter)
  }, [currentPage, perPage, typeFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchCategories(1, perPage, search, typeFilter)
  }

  const handleToggleStatus = async (item: SessionCategoryItem) => {
    try {
      await adminSessionCategoryService.toggleStatus(item.id)
      setCategories((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, is_active: !c.is_active } : c))
      )
      toast.success(
        `Category ${!item.is_active ? 'activated' : 'deactivated'} successfully`
      )
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update status'))
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setFormName('')
    setFormSlug('')
    setFormType(typeFilter !== 'all' ? typeFilter : 'all')
    setFormIsActive(true)
    setIsFormOpen(true)
  }

  const openEditModal = (item: SessionCategoryItem) => {
    setEditingItem(item)
    setFormName(item.name || '')
    setFormSlug(item.slug || '')
    setFormType(item.type || 'all')
    setFormIsActive(item.is_active)
    setIsFormOpen(true)
  }

  const handleNameChange = (val: string) => {
    setFormName(val)
    if (!editingItem) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
      setFormSlug(generatedSlug)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      toast.error('Category name is required')
      return
    }

    try {
      setIsSubmitting(true)
      const payload = {
        name: formName.trim(),
        slug: formSlug.trim() || undefined,
        type: formType,
        is_active: formIsActive,
      }

      if (editingItem) {
        await adminSessionCategoryService.updateCategory(editingItem.id, payload)
        toast.success('Category updated successfully')
      } else {
        await adminSessionCategoryService.createCategory(payload)
        toast.success('Category created successfully')
      }

      setIsFormOpen(false)
      fetchCategories(currentPage, perPage, search, typeFilter)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save category'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return
    try {
      setIsDeleting(true)
      await adminSessionCategoryService.deleteCategory(deleteItem.id)
      toast.success('Category deleted successfully')
      setDeleteItem(null)
      fetchCategories(currentPage, perPage, search, typeFilter)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete category'))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.length === 0) return
    try {
      setIsBulkDeleting(true)
      await adminSessionCategoryService.bulkDeleteCategories(selectedIds)
      toast.success(`${selectedIds.length} categories deleted successfully`)
      setSelectedIds([])
      setIsBulkDeletingOpen(false)
      fetchCategories(currentPage, perPage, search, typeFilter)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete categories'))
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(categories.map((c) => c.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
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
          <div>
            <div className='flex items-center gap-2'>
              <FolderTree className='h-6 w-6 text-primary' />
              <h1 className='text-2xl font-bold tracking-tight'>Session Categories</h1>
            </div>
            <p className='text-sm text-muted-foreground mt-1'>
              Manage categories for Recorded Sessions and Live &amp; Upcoming Sessions.
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
              <Plus className='h-4 w-4' /> Add Category
            </Button>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className='mb-6 space-y-4'>
          <div className='flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4'>
            {/* Type Filters */}
            <div className='flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border'>
              <Button
                type='button'
                variant={typeFilter === 'all' ? 'default' : 'ghost'}
                size='sm'
                className='h-8 text-xs'
                onClick={() => {
                  setTypeFilter('all')
                  setCurrentPage(1)
                }}
              >
                All Categories
              </Button>
              <Button
                type='button'
                variant={typeFilter === 'recorded' ? 'default' : 'ghost'}
                size='sm'
                className='h-8 text-xs gap-1.5'
                onClick={() => {
                  setTypeFilter('recorded')
                  setCurrentPage(1)
                }}
              >
                <Video className='h-3.5 w-3.5' /> Recorded Sessions
              </Button>
              <Button
                type='button'
                variant={typeFilter === 'live' ? 'default' : 'ghost'}
                size='sm'
                className='h-8 text-xs gap-1.5'
                onClick={() => {
                  setTypeFilter('live')
                  setCurrentPage(1)
                }}
              >
                <Radio className='h-3.5 w-3.5' /> Live Sessions
              </Button>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className='flex flex-1 max-w-sm items-center gap-2'>
              <div className='relative flex-1'>
                <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  placeholder='Search categories...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='pl-9 h-9 text-xs'
                />
              </div>
              <Button type='submit' size='sm' variant='secondary' className='h-9 text-xs'>
                Search
              </Button>
              {search && (
                <Button
                  type='button'
                  size='sm'
                  variant='ghost'
                  onClick={() => {
                    setSearch('')
                    fetchCategories(1, perPage, '', typeFilter)
                  }}
                  className='h-9 text-xs'
                >
                  Clear
                </Button>
              )}
            </form>
          </div>
        </div>

        {/* Categories Table */}
        <div className='rounded-lg border bg-card shadow-xs overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow className='bg-muted/40'>
                <TableHead className='w-12 text-center'>
                  <input
                    type='checkbox'
                    checked={
                      categories.length > 0 &&
                      selectedIds.length === categories.length
                    }
                    onChange={handleSelectAll}
                    className='h-4 w-4 rounded border-gray-300'
                  />
                </TableHead>
                <TableHead>Category Name</TableHead>
                <TableHead>URL Slug</TableHead>
                <TableHead className='text-center'>Applies To</TableHead>
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
                      <span className='text-xs'>Loading categories...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-48 text-center'>
                    <div className='flex flex-col items-center justify-center gap-2 text-muted-foreground'>
                      <FolderTree className='h-10 w-10 stroke-1' />
                      <p className='text-sm font-medium text-foreground'>No categories found</p>
                      <p className='text-xs text-muted-foreground'>
                        Click "Add Category" to create a new session category.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((item) => (
                  <TableRow key={item.id} className='hover:bg-muted/20'>
                    <TableCell className='text-center'>
                      <input
                        type='checkbox'
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleSelectOne(item.id)}
                        className='h-4 w-4 rounded border-gray-300'
                      />
                    </TableCell>

                    <TableCell>
                      <span className='font-semibold text-foreground text-sm'>
                        {item.name}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className='font-mono text-xs text-muted-foreground'>
                        /{item.slug}
                      </span>
                    </TableCell>

                    <TableCell className='text-center'>
                      {item.type === 'recorded' ? (
                        <Badge variant='outline' className='gap-1 text-xs text-purple-600 bg-purple-500/10 border-purple-500/20'>
                          <Video className='h-3 w-3' /> Recorded
                        </Badge>
                      ) : item.type === 'live' ? (
                        <Badge variant='outline' className='gap-1 text-xs text-blue-600 bg-blue-500/10 border-blue-500/20'>
                          <Radio className='h-3 w-3' /> Live
                        </Badge>
                      ) : (
                        <Badge variant='outline' className='text-xs text-emerald-600 bg-emerald-500/10 border-emerald-500/20'>
                          Both (Live &amp; Recorded)
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className='text-center'>
                      <div className='flex items-center justify-center gap-2'>
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggleStatus(item)}
                        />
                        <Badge
                          variant={item.is_active ? 'default' : 'secondary'}
                          className={
                            item.is_active
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]'
                              : 'text-[10px]'
                          }
                        >
                          {item.is_active ? 'Active' : 'Hidden'}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-muted-foreground hover:text-primary'
                          onClick={() => openEditModal(item)}
                          title='Edit Category'
                        >
                          <Edit2 className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-muted-foreground hover:text-destructive'
                          onClick={() => setDeleteItem(item)}
                          title='Delete Category'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='mt-4 flex justify-end'>
            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              perPage={perPage}
              onPageChange={(p) => setCurrentPage(p)}
              onPerPageChange={(newP) => {
                setPerPage(newP)
                setCurrentPage(1)
              }}
              itemName='categories'
            />
          </div>
        )}
      </Main>

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className='sm:max-w-md'>
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle className='text-lg font-bold flex items-center gap-2'>
                <FolderTree className='h-5 w-5 text-primary' />
                {editingItem ? 'Edit Category' : 'Create Session Category'}
              </DialogTitle>
              <DialogDescription className='text-xs'>
                Configure category name, slug, and session type.
              </DialogDescription>
            </DialogHeader>

            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label htmlFor='category_name' className='text-xs font-semibold'>
                  Category Name <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='category_name'
                  placeholder='e.g., Career Strategy, Tech &amp; Data...'
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='category_slug' className='text-xs font-semibold'>
                  URL Slug <span className='text-xs font-normal text-muted-foreground'>(Auto-generated)</span>
                </Label>
                <Input
                  id='category_slug'
                  placeholder='e.g., career-strategy'
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='category_type' className='text-xs font-semibold'>
                  Applies To
                </Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger id='category_type' className='h-9 text-xs'>
                    <SelectValue placeholder='Select type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='recorded'>Recorded Sessions</SelectItem>
                    <SelectItem value='live'>Live Sessions</SelectItem>
                    <SelectItem value='all'>Both (All Sessions)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='flex items-center justify-between pt-2 border-t'>
                <div className='space-y-0.5'>
                  <Label htmlFor='category_active' className='text-xs font-medium cursor-pointer'>
                    Active on Website
                  </Label>
                  <p className='text-[11px] text-muted-foreground'>
                    Make this category visible in filters and session badges.
                  </p>
                </div>
                <Switch
                  id='category_active'
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
                  'Update Category'
                ) : (
                  'Create Category'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Single Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title='Delete Category?'
        desc={`Are you sure you want to delete "${deleteItem?.name}"? Any linked sessions may be unassigned.`}
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
        title='Delete Selected Categories?'
        desc={`Are you sure you want to permanently delete ${selectedIds.length} categories?`}
        confirmText={`Delete ${selectedIds.length} Categories`}
        destructive
        isLoading={isBulkDeleting}
        handleConfirm={handleBulkDeleteConfirm}
        className='sm:max-w-sm'
      />
    </>
  )
}
