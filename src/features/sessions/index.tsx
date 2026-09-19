import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Plus,
  Search as SearchIcon,
  Trash2,
  Edit2,
  Loader2,
  Calendar,
  Eye,
  Image as ImageIcon,
  CheckSquare,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  adminSessionService,
  getCategoryName,
  type SessionItem,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PaginationBar } from '@/components/pagination-bar'

export function Sessions() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [categories, setCategories] = useState<SessionCategoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [perPage, setPerPage] = useState(10)

  // Single delete modal state
  const [deleteItem, setDeleteItem] = useState<SessionItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Bulk delete modal state
  const [isBulkDeletingOpen, setIsBulkDeletingOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  async function fetchCategories() {
    try {
      const res = await adminSessionCategoryService.getCategories({ all: true })
      if (res.status && Array.isArray(res.data)) {
        setCategories(res.data)
      }
    } catch {
      // ignore
    }
  }

  async function fetchSessions(page = currentPage, currentPerPage = perPage) {
    try {
      setIsLoading(true)
      const res = await adminSessionService.getSessions({
        search: searchQuery || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        page,
        per_page: currentPerPage,
      })
      if (res.status && Array.isArray(res.data)) {
        setSessions(res.data)
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
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchSessions(currentPage, perPage)
  }, [currentPage, perPage, selectedCategory])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentPage !== 1) {
      setCurrentPage(1)
    } else {
      fetchSessions(1, perPage)
    }
  }

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedIds(sessions.map((s) => s.id))
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

  const handleToggleStatus = async (item: SessionItem) => {
    try {
      await adminSessionService.toggleStatus(item.id)
      setSessions((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, is_active: !s.is_active } : s))
      )
      toast.success(`Session ${!item.is_active ? 'activated' : 'deactivated'} successfully.`)
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return
    setIsDeleting(true)
    try {
      await adminSessionService.deleteSession(deleteItem.id)
      toast.success('Session deleted successfully.')
      setSessions((prev) => prev.filter((s) => s.id !== deleteItem.id))
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
      const res = await adminSessionService.bulkDeleteSessions(selectedIds)
      toast.success(
        res.message || `Successfully deleted ${selectedIds.length} session(s).`
      )
      setSessions((prev) => prev.filter((s) => !selectedIds.includes(s.id)))
      setSelectedIds([])
      setIsBulkDeletingOpen(false)
      fetchSessions()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const isAllSelected =
    sessions.length > 0 && selectedIds.length === sessions.length
  const isSomeSelected =
    selectedIds.length > 0 && selectedIds.length < sessions.length

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        {/* Top Header */}
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
              Sessions Management
            </h1>
            <p className='text-sm text-muted-foreground'>
              Manage interactive workshops, campus drives, corporate trainings, and live sessions.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            {selectedIds.length > 0 && (
              <Badge variant='secondary' className='px-3 py-1 text-sm font-medium bg-primary/10 text-primary border-primary/20'>
                <CheckSquare className='mr-1.5 size-3.5' /> {selectedIds.length} Selected
              </Badge>
            )}
            <Button
              onClick={() => navigate({ to: '/sessions/create' })}
              className='gap-2'
            >
              <Plus className='h-4 w-4' />
              Add Session
            </Button>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size='sm'
              onClick={() => {
                setSelectedCategory('all')
                setCurrentPage(1)
              }}
            >
              All Sessions
            </Button>

            <Select
              value={selectedCategory}
              onValueChange={(val) => {
                setSelectedCategory(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className='h-8 w-40 text-xs'>
                <SelectValue placeholder='Category' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedIds.length > 0 && (
              <div className='flex items-center gap-2 ml-2 animate-in fade-in-50 duration-200'>
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
            className='flex items-center gap-2 w-full sm:w-72'
          >
            <div className='relative flex-1'>
              <SearchIcon className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search title or content...'
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

        {/* Table Content */}
        {isLoading ? (
          <div className='flex min-h-[300px] flex-col items-center justify-center gap-2 text-muted-foreground'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
            <p>Loading sessions from database...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className='flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center'>
            <Calendar className='h-12 w-12 text-muted-foreground/60 mb-2' />
            <h3 className='text-lg font-semibold'>No sessions found</h3>
            <p className='text-sm text-muted-foreground max-w-sm mb-4'>
              {searchQuery
                ? 'No sessions matched your search criteria.'
                : 'Create your first live or upcoming session to display on the platform.'}
            </p>
            <Button
              onClick={() => navigate({ to: '/sessions/create' })}
              size='sm'
            >
              <Plus className='mr-1.5 h-4 w-4' /> Add Session
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
                      aria-label='Select all sessions'
                      className='translate-y-0.5'
                    />
                  </TableHead>
                  <TableHead className='w-[60px]'>S.No</TableHead>
                  <TableHead className='min-w-[240px]'>Session Title</TableHead>
                  <TableHead className='w-[140px]'>Category</TableHead>
                  <TableHead className='w-[130px]'>Status</TableHead>
                  <TableHead className='w-[120px] text-end'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((item, index) => {
                  const isSelected = selectedIds.includes(item.id)
                  const coverImage =
                    item.images?.find((img) => img.is_primary)?.image_url ||
                    (item.images?.[0]?.image ? getStorageUrl(item.images[0].image) : null) ||
                    item.image_url

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
                          aria-label={`Select session ${item.title}`}
                          className='translate-y-0.5'
                        />
                      </TableCell>

                      {/* S.No */}
                      <TableCell className='py-3 font-medium text-muted-foreground'>
                        {(currentPage - 1) * perPage + index + 1}
                      </TableCell>

                      {/* Session Title & Cover */}
                      <TableCell className='py-3'>
                        <div className='flex items-center gap-3'>
                          <div className='relative h-11 w-16 shrink-0 overflow-hidden rounded-md border bg-muted flex items-center justify-center'>
                            {coverImage ? (
                              <img
                                src={coverImage}
                                alt={item.title}
                                className='h-full w-full object-cover'
                              />
                            ) : (
                              <ImageIcon className='h-5 w-5 text-muted-foreground/50' />
                            )}
                          </div>
                          <div className='min-w-0 flex-1'>
                            <div className='font-semibold text-sm line-clamp-1' title={item.title}>
                              {item.title}
                            </div>
                            <div className='text-xs text-muted-foreground flex items-center gap-1.5 font-mono truncate'>
                              <span>/{item.slug}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell className='py-3'>
                        <Badge variant='outline' className='font-normal text-xs'>
                          {getCategoryName(item.category)}
                        </Badge>
                      </TableCell>

                      {/* Status */}
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
                            onClick={() =>
                              navigate({
                                to: '/sessions/$sessionId',
                                params: { sessionId: String(item.id) },
                              })
                            }
                            title='View Details Page'
                          >
                            <Eye className='size-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='size-8'
                            onClick={() =>
                              navigate({
                                to: '/sessions/create',
                                search: { id: item.id } as any,
                              })
                            }
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
                itemName='sessions'
              />
            </div>
          </div>
        )}
      </Main>

      {/* Single Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title='Delete Session'
        desc={`Are you sure you want to permanently delete the session "${deleteItem?.title}" and its associated media?`}
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
        title='Delete Selected Sessions'
        desc={`Are you sure you want to permanently delete the ${selectedIds.length} selected sessions and their associated media? This action cannot be undone.`}
        confirmText={`Delete ${selectedIds.length} Sessions`}
        destructive
        isLoading={isBulkDeleting}
        handleConfirm={handleBulkDeleteConfirm}
        className='sm:max-w-sm'
      />
    </>
  )
}

