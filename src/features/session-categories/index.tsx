import { useState, useEffect } from 'react'
import {
  Plus,
  Search as SearchIcon,
  Trash2,
  Edit2,
  FolderTree,
  Loader2,
  Presentation,
  CheckSquare,
  X,
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
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
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
import { PaginationBar } from '@/components/pagination-bar'

export function SessionCategories() {
  const [categories, setCategories] = useState<SessionCategoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [perPage, setPerPage] = useState(10)

  // Create / Edit modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SessionCategoryItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form fields
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)

  // Delete modal state
  const [deleteItem, setDeleteItem] = useState<SessionCategoryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Bulk delete modal state
  const [isBulkDeletingOpen, setIsBulkDeletingOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  async function fetchCategories(page = currentPage, currentPerPage = perPage) {
    try {
      setIsLoading(true)
      const res = await adminSessionCategoryService.getCategories({
        search: searchQuery || undefined,
        page,
        per_page: currentPerPage,
      })
      if (res.status && Array.isArray(res.data)) {
        setCategories(res.data)
        // Clean up selectedIds that are no longer in list
        setSelectedIds((prev) =>
          prev.filter((id) => res.data.some((item) => item.id === id))
        )
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
    fetchCategories(currentPage, perPage)
  }, [currentPage, perPage])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentPage !== 1) {
      setCurrentPage(1)
    } else {
      fetchCategories(1, perPage)
    }
  }

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedIds(categories.map((c) => c.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleSelect = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (val: string) => {
    const prevAutoSlug = generateSlug(formName)
    setFormName(val)
    if (!formSlug || formSlug === prevAutoSlug) {
      setFormSlug(generateSlug(val))
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setFormName('')
    setFormSlug('')
    setFormIsActive(true)
    setIsFormOpen(true)
  }

  const openEditModal = (item: SessionCategoryItem) => {
    setEditingItem(item)
    setFormName(item.name)
    setFormSlug(item.slug || '')
    setFormIsActive(item.is_active)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      toast.error('Please enter a category name.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingItem) {
        await adminSessionCategoryService.updateCategory(editingItem.id, {
          name: formName.trim(),
          slug: formSlug.trim() || undefined,
          is_active: formIsActive,
        })
        toast.success('Session category updated successfully.')
      } else {
        await adminSessionCategoryService.createCategory({
          name: formName.trim(),
          slug: formSlug.trim() || undefined,
          is_active: formIsActive,
        })
        toast.success('Session category created successfully.')
      }

      setIsFormOpen(false)
      fetchCategories()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (item: SessionCategoryItem) => {
    try {
      await adminSessionCategoryService.toggleStatus(item.id)
      setCategories((prev) =>
        prev.map((c) =>
          c.id === item.id ? { ...c, is_active: !c.is_active } : c
        )
      )
      toast.success(
        `Category ${!item.is_active ? 'activated' : 'deactivated'} successfully.`
      )
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return
    setIsDeleting(true)
    try {
      await adminSessionCategoryService.deleteCategory(deleteItem.id)
      toast.success('Session category deleted successfully.')
      setCategories((prev) => prev.filter((c) => c.id !== deleteItem.id))
      setSelectedIds((prev) => prev.filter((id) => id !== deleteItem.id))
      setDeleteItem(null)
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.length === 0) return
    setIsBulkDeleting(true)
    try {
      const res = await adminSessionCategoryService.bulkDeleteCategories(selectedIds)
      toast.success(
        res.message || `Successfully deleted ${selectedIds.length} category item(s).`
      )
      setCategories((prev) => prev.filter((c) => !selectedIds.includes(c.id)))
      setSelectedIds([])
      setIsBulkDeletingOpen(false)
      fetchCategories()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const isAllSelected =
    categories.length > 0 && selectedIds.length === categories.length
  const isSomeSelected =
    selectedIds.length > 0 && selectedIds.length < categories.length

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
              Session Categories
            </h1>
            <p className='text-sm text-muted-foreground'>
              Manage categories and tracks for organizing workshops, webinars, and live drives.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            {selectedIds.length > 0 && (
              <Badge variant='secondary' className='px-3 py-1 text-sm font-medium bg-primary/10 text-primary border-primary/20'>
                <CheckSquare className='mr-1.5 size-3.5' /> {selectedIds.length} Selected
              </Badge>
            )}
            <Button onClick={openCreateModal} className='gap-2'>
              <Plus className='h-4 w-4' />
              Add Category
            </Button>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex flex-wrap items-center gap-2'>
            {selectedIds.length > 0 && (
              <div className='flex items-center gap-2 animate-in fade-in-50 duration-200'>
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={() => setIsBulkDeletingOpen(true)}
                  className='shadow-xs'
                >
                  <Trash2 className='mr-1.5 size-4' /> Delete Selected ({selectedIds.length})
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setSelectedIds([])}
                  className='text-muted-foreground hover:text-foreground'
                >
                  <X className='mr-1 size-3.5' /> Deselect
                </Button>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className='flex items-center gap-2 w-full sm:w-80'
          >
            <div className='relative flex-1'>
              <SearchIcon className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search categories or slugs...'
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
            <p>Loading session categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className='flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center'>
            <FolderTree className='h-12 w-12 text-muted-foreground/60 mb-2' />
            <h3 className='text-lg font-semibold'>No categories found</h3>
            <p className='text-sm text-muted-foreground max-w-sm mb-4'>
              {searchQuery
                ? 'No categories match your search query. Try another search.'
                : 'Create categories like Workshops, Masterclasses, and Drives to group your sessions.'}
            </p>
            <Button onClick={openCreateModal} size='sm'>
              <Plus className='mr-1.5 h-4 w-4' /> Add Category
            </Button>
          </div>
        ) : (
          <div className='rounded-lg border bg-card shadow-xs overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/50'>
                  {/* Checkbox Header */}
                  <TableHead className='w-[44px] px-3 text-center'>
                    <Checkbox
                      checked={
                        isAllSelected ? true : isSomeSelected ? 'indeterminate' : false
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label='Select all categories'
                      className='translate-y-0.5'
                    />
                  </TableHead>
                  <TableHead className='w-[60px]'>S.No</TableHead>
                  <TableHead className='min-w-[200px]'>Category Name</TableHead>
                  <TableHead className='w-[200px]'>Slug</TableHead>
                  <TableHead className='w-[140px]'>Sessions Count</TableHead>
                  <TableHead className='w-[140px]'>Status</TableHead>
                  <TableHead className='w-[100px] text-end'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((item, index) => {
                  const isSelected = selectedIds.includes(item.id)
                  return (
                    <TableRow
                      key={item.id}
                      data-state={isSelected ? 'selected' : undefined}
                      className={`hover:bg-muted/40 transition-colors ${
                        isSelected ? 'bg-primary/10 hover:bg-primary/15' : ''
                      }`}
                    >
                      {/* Checkbox Cell */}
                      <TableCell className='px-3 text-center'>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleToggleSelect(item.id, !!checked)
                          }
                          aria-label={`Select category ${item.name}`}
                          className='translate-y-0.5'
                        />
                      </TableCell>

                      {/* S.No */}
                      <TableCell className='py-3 font-mono text-xs text-muted-foreground'>
                        {(currentPage - 1) * perPage + index + 1}
                      </TableCell>

                      {/* Category Name */}
                      <TableCell className='py-3 font-semibold text-sm'>
                        {item.name}
                      </TableCell>

                      {/* Slug */}
                      <TableCell className='py-3'>
                        <Badge variant='outline' className='font-mono text-xs font-normal'>
                          {item.slug}
                        </Badge>
                      </TableCell>

                      {/* Sessions Count */}
                      <TableCell className='py-3'>
                        <span className='inline-flex items-center gap-1.5 text-xs text-muted-foreground'>
                          <Presentation className='size-3.5 text-muted-foreground' />
                          {item.sessions_count ?? 0} sessions
                        </span>
                      </TableCell>

                      {/* Status & Switch */}
                      <TableCell className='py-3'>
                        <div className='flex items-center gap-2'>
                          <Switch
                            checked={item.is_active}
                            onCheckedChange={() => handleToggleStatus(item)}
                            aria-label='Toggle status'
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
                  )
                })}
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
                itemName='categories'
              />
            </div>
          </div>
        )}
      </Main>

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className='sm:max-w-md'>
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Category' : 'Create Session Category'}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? 'Update category name, URL slug or status.'
                  : 'Add a new category for grouping live and upcoming sessions.'}
              </DialogDescription>
            </DialogHeader>

            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label htmlFor='name'>Category Name *</Label>
                <Input
                  id='name'
                  placeholder='e.g., Campus Drives'
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='slug'>
                  Slug <span className='text-xs text-muted-foreground'>(Optional - auto-generated)</span>
                </Label>
                <Input
                  id='slug'
                  placeholder='e.g., campus-drives'
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                />
              </div>

              <div className='flex items-center gap-3 pt-2'>
                <Switch
                  id='is_active'
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                />
                <Label htmlFor='is_active' className='cursor-pointer text-sm font-normal'>
                  Active and visible in session categories
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
                  'Update Category'
                ) : (
                  'Create Category'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title='Delete Category'
        desc={`Are you sure you want to delete category "${deleteItem?.name}"?`}
        confirmText='Delete'
        destructive
        isLoading={isDeleting}
        handleConfirm={handleDeleteConfirm}
        className='sm:max-w-sm'
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isBulkDeletingOpen}
        onOpenChange={setIsBulkDeletingOpen}
        title='Delete Selected Categories'
        desc={`Are you sure you want to permanently delete the ${selectedIds.length} selected categories? Any linked sessions may be affected.`}
        confirmText={`Delete ${selectedIds.length} Categories`}
        destructive
        isLoading={isBulkDeleting}
        handleConfirm={handleBulkDeleteConfirm}
        className='sm:max-w-sm'
      />
    </>
  )
}

