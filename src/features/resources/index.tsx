import { useState, useEffect } from 'react'
import {
  Plus,
  Search as SearchIcon,
  Edit2,
  Trash2,
  Loader2,
  Eye,
  FolderOpen,
  FileText,
  FileCode,
  FileSpreadsheet,
  Download,
  Video,
  File,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  adminResourceService,
  type ResourceItem,
} from '@/services/admin-resources'
import {
  adminRecordedSessionService,
  type RecordedSessionItem,
} from '@/services/admin-recorded-sessions'
import { getApiErrorMessage } from '@/lib/api-client'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

const CATEGORY_OPTIONS = [
  'Study Notes',
  'PDF Guide',
  'E-Book',
  'Resource Pack',
  'Presentation Slides',
  'Cheat Sheet',
  'Source Code',
]

export function Resources() {
  return <ResourcesFeature />
}

export function ResourcesFeature() {
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [recordedSessions, setRecordedSessions] = useState<RecordedSessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null)
  const [viewItem, setViewItem] = useState<ResourceItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<ResourceItem | null>(null)
  const [isBulkDeletingOpen, setIsBulkDeletingOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form inputs state
  const [formTitle, setFormTitle] = useState('')
  const [formRecordedSessionId, setFormRecordedSessionId] = useState<string>('')
  const [formCategory, setFormCategory] = useState('Study Notes')
  const [formDescription, setFormDescription] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [resourceFile, setResourceFile] = useState<File | null>(null)

  const fetchRecordedSessions = async () => {
    try {
      const res = await adminRecordedSessionService.getRecordedSessions({ per_page: 100 })
      if (res?.data) {
        setRecordedSessions(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch recorded sessions for dropdown', err)
    }
  }

  const fetchResources = async (
    currentPage = page,
    searchQuery = search,
    cat = selectedCategory,
    recSessionId = selectedSessionId
  ) => {
    try {
      setLoading(true)
      const res = await adminResourceService.getResources({
        page: currentPage,
        per_page: 10,
        search: searchQuery.trim() || undefined,
        category: cat !== 'all' ? cat : undefined,
        recorded_session_id: recSessionId !== 'all' ? recSessionId : undefined,
      })

      if (res.status && Array.isArray(res.data)) {
        setResources(res.data)
        if (res.pagination) {
          setTotalPages(res.pagination.last_page)
          setTotalCount(res.pagination.total)
        }
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to fetch resources'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecordedSessions()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchResources(1, search, selectedCategory, selectedSessionId)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, selectedCategory, selectedSessionId])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchResources(newPage, search, selectedCategory, selectedSessionId)
  }

  const handleOpenCreateModal = () => {
    setEditingItem(null)
    setFormTitle('')
    setFormRecordedSessionId('')
    setFormCategory('Study Notes')
    setFormDescription('')
    setFormIsActive(true)
    setResourceFile(null)
    setIsFormOpen(true)
  }

  const handleOpenEditModal = (item: ResourceItem) => {
    setEditingItem(item)
    setFormTitle(item.title)
    setFormRecordedSessionId(item.recorded_session_id ? String(item.recorded_session_id) : '')
    setFormCategory(item.category || 'Study Notes')
    setFormDescription(item.description || '')
    setFormIsActive(item.is_active)
    setResourceFile(null)
    setIsFormOpen(true)
  }

  const handleToggleStatus = async (item: ResourceItem) => {
    try {
      const res = await adminResourceService.toggleResourceStatus(item.id)
      if (res.status) {
        setResources((prev) =>
          prev.map((r) => (r.id === item.id ? { ...r, is_active: !r.is_active } : r))
        )
        toast.success(res.message || 'Status updated successfully')
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update status'))
    }
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      toast.error('Resource title is required')
      return
    }

    if (!editingItem && !resourceFile) {
      toast.error('Please select a file to upload')
      return
    }

    try {
      setIsSubmitting(true)
      const formData = new FormData()
      formData.append('title', formTitle.trim())
      if (formRecordedSessionId) {
        formData.append('recorded_session_id', formRecordedSessionId)
      }
      formData.append('category', formCategory)
      if (formDescription.trim()) {
        formData.append('description', formDescription.trim())
      }
      formData.append('is_active', formIsActive ? '1' : '0')

      if (resourceFile) {
        formData.append('file', resourceFile)
      }

      if (editingItem) {
        const res = await adminResourceService.updateResource(editingItem.id, formData)
        if (res.status) {
          toast.success('Resource updated successfully')
          setIsFormOpen(false)
          fetchResources(page, search, selectedCategory, selectedSessionId)
        }
      } else {
        const res = await adminResourceService.createResource(formData)
        if (res.status) {
          toast.success('Resource created and uploaded successfully')
          setIsFormOpen(false)
          fetchResources(1, search, selectedCategory, selectedSessionId)
        }
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save resource'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return
    try {
      setIsDeleting(true)
      const res = await adminResourceService.deleteResource(deleteItem.id)
      if (res.status) {
        toast.success(res.message || 'Resource deleted successfully')
        setDeleteItem(null)
        fetchResources(page, search, selectedCategory, selectedSessionId)
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete resource'))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDeleteConfirm = async () => {
    if (!selectedIds.length) return
    try {
      setIsBulkDeleting(true)
      const res = await adminResourceService.bulkDeleteResources(selectedIds)
      if (res.status) {
        toast.success(res.message || 'Selected resources deleted successfully')
        setSelectedIds([])
        setIsBulkDeletingOpen(false)
        fetchResources(1, search, selectedCategory, selectedSessionId)
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete selected resources'))
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(resources.map((r) => r.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const getFileIcon = (ext?: string | null) => {
    const e = (ext || '').toLowerCase()
    if (e === 'pdf') return <FileText className='h-4 w-4 text-rose-500' />
    if (['zip', 'rar', '7z'].includes(e)) return <FolderOpen className='h-4 w-4 text-amber-500' />
    if (['doc', 'docx'].includes(e)) return <FileText className='h-4 w-4 text-blue-500' />
    if (['xls', 'xlsx', 'csv'].includes(e)) return <FileSpreadsheet className='h-4 w-4 text-emerald-500' />
    if (['js', 'ts', 'py', 'json', 'html', 'css'].includes(e)) return <FileCode className='h-4 w-4 text-cyan-500' />
    return <File className='h-4 w-4 text-muted-foreground' />
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

      <Main className='flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8'>
        {/* Page Title & Action Bar */}
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
              <FolderOpen className='h-6 w-6 text-primary' /> Resources Library Management
            </h1>
            <p className='text-sm text-muted-foreground'>
              Upload and manage course notes, cheat sheets, guides, and downloadable files linked to masterclasses.
            </p>
          </div>

          <div className='flex items-center gap-2'>
            {selectedIds.length > 0 && (
              <Button
                variant='destructive'
                size='sm'
                onClick={() => setIsBulkDeletingOpen(true)}
                className='gap-1.5 shadow-sm'
              >
                <Trash2 className='h-4 w-4' />
                Delete Selected ({selectedIds.length})
              </Button>
            )}

            <Button onClick={handleOpenCreateModal} className='gap-2 shadow-sm'>
              <Plus className='h-4 w-4' />
              Upload Resource
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className='flex flex-wrap items-center gap-3 bg-card p-3.5 rounded-xl border shadow-sm'>
          <div className='relative flex-1 min-w-[240px]'>
            <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search by title, file name, course...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9'
            />
          </div>

          <div className='w-[190px]'>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder='Filter Category' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Categories</SelectItem>
                {CATEGORY_OPTIONS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='w-[220px]'>
            <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
              <SelectTrigger>
                <SelectValue placeholder='Filter Masterclass' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Masterclasses</SelectItem>
                {recordedSessions.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              setSearch('')
              setSelectedCategory('all')
              setSelectedSessionId('all')
            }}
            className='text-xs'
          >
            Reset
          </Button>
        </div>

        {/* Table Card */}
        <div className='border rounded-xl bg-card overflow-hidden shadow-sm'>
          <Table>
            <TableHeader>
              <TableRow className='bg-muted/40'>
                <TableHead className='w-[40px]'>
                  <input
                    type='checkbox'
                    className='rounded border-gray-300'
                    checked={
                      resources.length > 0 && selectedIds.length === resources.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead className='min-w-[240px]'>Resource Title & File</TableHead>
                <TableHead>Linked Masterclass</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type & Size</TableHead>
                <TableHead className='text-center'>Downloads</TableHead>
                <TableHead className='text-center'>Status</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className='h-36 text-center'>
                    <div className='flex flex-col items-center justify-center gap-2 text-muted-foreground'>
                      <Loader2 className='h-6 w-6 animate-spin text-primary' />
                      <span>Loading resources...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : resources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className='h-36 text-center text-muted-foreground'>
                    No resources found. Click &quot;Upload Resource&quot; to add course files.
                  </TableCell>
                </TableRow>
              ) : (
                resources.map((res) => {
                  const sessionTitle = res.recorded_session?.title || res.session?.title || 'General / Unlinked'

                  return (
                    <TableRow key={res.id} className='hover:bg-muted/30 transition'>
                      <TableCell>
                        <input
                          type='checkbox'
                          className='rounded border-gray-300'
                          checked={selectedIds.includes(res.id)}
                          onChange={() => handleSelectRow(res.id)}
                        />
                      </TableCell>

                      {/* Title & File Name */}
                      <TableCell>
                        <div className='flex items-start gap-2.5'>
                          <div className='mt-1 p-2 rounded-lg bg-muted flex items-center justify-center border'>
                            {getFileIcon(res.file_type)}
                          </div>
                          <div>
                            <div className='font-semibold text-sm leading-tight text-foreground'>
                              {res.title}
                            </div>
                            <div className='text-xs text-muted-foreground font-mono mt-0.5'>
                              {res.file_name}
                            </div>
                            {res.description && (
                              <p className='text-xs text-muted-foreground line-clamp-1 mt-0.5'>
                                {res.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Linked Masterclass */}
                      <TableCell>
                        <Badge variant='outline' className='text-[11px] font-normal gap-1 max-w-[200px] truncate'>
                          <Video className='h-3 w-3 text-primary shrink-0' />
                          <span className='truncate'>{sessionTitle}</span>
                        </Badge>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <Badge className='text-[11px] font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20'>
                          {res.category}
                        </Badge>
                      </TableCell>

                      {/* Type & Size */}
                      <TableCell>
                        <div className='text-xs font-mono text-muted-foreground'>
                          <span className='uppercase font-semibold text-foreground'>{res.file_type || 'file'}</span>
                          {res.file_size && <span> • {res.file_size}</span>}
                        </div>
                      </TableCell>

                      {/* Downloads */}
                      <TableCell className='text-center'>
                        <span className='inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground'>
                          <Download className='h-3 w-3' />
                          {res.download_count}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className='text-center'>
                        <Switch
                          checked={res.is_active}
                          onCheckedChange={() => handleToggleStatus(res)}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-1'>
                          {res.file_url && (
                            <a
                              href={res.file_url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition'
                              title='Download / Preview File'
                            >
                              <Download className='h-4 w-4' />
                            </a>
                          )}
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => setViewItem(res)}
                            title='View Details'
                          >
                            <Eye className='h-4 w-4 text-muted-foreground' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => handleOpenEditModal(res)}
                            title='Edit Resource'
                          >
                            <Edit2 className='h-4 w-4 text-primary' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => setDeleteItem(res)}
                            className='text-destructive hover:text-destructive'
                            title='Delete Resource'
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='p-4 border-t'>
              <PaginationBar
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalCount}
                perPage={10}
              />
            </div>
          )}
        </div>

        {/* Create / Edit Resource Modal */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className='sm:max-w-[560px]'>
            <form onSubmit={handleSubmitForm}>
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Resource' : 'Upload New Resource'}</DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? 'Update resource metadata, assign masterclass, or replace uploaded file.'
                    : 'Upload a study file, cheat sheet, or guide for enrolled masterclass students.'}
                </DialogDescription>
              </DialogHeader>

              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='title'>Resource Title *</Label>
                  <Input
                    id='title'
                    placeholder='e.g. Python Basics & Loops Cheat Sheet'
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='session'>Assigned Masterclass</Label>
                    <Select value={formRecordedSessionId} onValueChange={setFormRecordedSessionId}>
                      <SelectTrigger id='session'>
                        <SelectValue placeholder='Select Course' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=''>General / No Specific Course</SelectItem>
                        {recordedSessions.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='grid gap-2'>
                    <Label htmlFor='category'>Category *</Label>
                    <Select value={formCategory} onValueChange={setFormCategory}>
                      <SelectTrigger id='category'>
                        <SelectValue placeholder='Select Category' />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='file'>
                    {editingItem ? 'Replace File (Optional)' : 'Select File (PDF, DOCX, ZIP, PPTX, etc.) *'}
                  </Label>
                  <Input
                    id='file'
                    type='file'
                    onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
                    required={!editingItem}
                    className='cursor-pointer file:cursor-pointer'
                  />
                  {editingItem && !resourceFile && (
                    <span className='text-xs text-muted-foreground'>
                      Current file: <span className='font-mono font-medium'>{editingItem.file_name}</span> ({editingItem.file_size})
                    </span>
                  )}
                  {resourceFile && (
                    <span className='text-xs text-primary font-medium'>
                      Selected: {resourceFile.name} ({(resourceFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  )}
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='description'>Description (Optional)</Label>
                  <Textarea
                    id='description'
                    placeholder='Brief overview of what this resource contains...'
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className='flex items-center justify-between p-3 rounded-lg border bg-muted/30'>
                  <div>
                    <Label htmlFor='is_active' className='font-medium'>Active / Published</Label>
                    <p className='text-xs text-muted-foreground'>
                      Visible and downloadable by enrolled students
                    </p>
                  </div>
                  <Switch
                    id='is_active'
                    checked={formIsActive}
                    onCheckedChange={setFormIsActive}
                  />
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
                <Button type='submit' disabled={isSubmitting} className='gap-2'>
                  {isSubmitting && <Loader2 className='h-4 w-4 animate-spin' />}
                  {editingItem ? 'Save Changes' : 'Upload Resource'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={viewItem !== null} onOpenChange={(open) => !open && setViewItem(null)}>
          <DialogContent className='sm:max-w-[480px]'>
            {viewItem && (
              <>
                <DialogHeader>
                  <DialogTitle className='flex items-center gap-2'>
                    {getFileIcon(viewItem.file_type)} {viewItem.title}
                  </DialogTitle>
                  <DialogDescription>
                    Resource details and download link
                  </DialogDescription>
                </DialogHeader>

                <div className='space-y-3 py-2 text-sm'>
                  <div className='flex justify-between py-1 border-b'>
                    <span className='text-muted-foreground'>File Name:</span>
                    <span className='font-mono font-medium'>{viewItem.file_name}</span>
                  </div>
                  <div className='flex justify-between py-1 border-b'>
                    <span className='text-muted-foreground'>Category:</span>
                    <Badge variant='outline'>{viewItem.category}</Badge>
                  </div>
                  <div className='flex justify-between py-1 border-b'>
                    <span className='text-muted-foreground'>File Size:</span>
                    <span className='font-mono'>{viewItem.file_size || '—'}</span>
                  </div>
                  <div className='flex justify-between py-1 border-b'>
                    <span className='text-muted-foreground'>Assigned Course:</span>
                    <span className='font-medium'>{viewItem.recorded_session?.title || 'General'}</span>
                  </div>
                  <div className='flex justify-between py-1 border-b'>
                    <span className='text-muted-foreground'>Downloads:</span>
                    <span className='font-semibold'>{viewItem.download_count}</span>
                  </div>
                  <div className='flex justify-between py-1 border-b'>
                    <span className='text-muted-foreground'>Status:</span>
                    <Badge variant={viewItem.is_active ? 'default' : 'secondary'}>
                      {viewItem.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {viewItem.description && (
                    <div className='pt-2'>
                      <span className='text-muted-foreground block mb-1'>Description:</span>
                      <p className='p-2.5 rounded-md bg-muted/40 text-xs'>{viewItem.description}</p>
                    </div>
                  )}
                </div>

                <DialogFooter className='gap-2 sm:gap-0'>
                  {viewItem.file_url && (
                    <a
                      href={viewItem.file_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 gap-1.5'
                    >
                      <Download className='h-4 w-4' /> Download File
                    </a>
                  )}
                  <Button variant='outline' onClick={() => setViewItem(null)}>
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteItem !== null}
          onOpenChange={(open) => !open && setDeleteItem(null)}
          handleConfirm={handleDeleteConfirm}
          isLoading={isDeleting}
          title='Delete Resource?'
          desc={
            deleteItem
              ? `Are you sure you want to delete "${deleteItem.title}"? This will permanently remove the uploaded file from the server.`
              : ''
          }
          confirmText='Delete'
          destructive
        />

        {/* Bulk Delete Confirmation */}
        <ConfirmDialog
          open={isBulkDeletingOpen}
          onOpenChange={setIsBulkDeletingOpen}
          handleConfirm={handleBulkDeleteConfirm}
          isLoading={isBulkDeleting}
          title='Delete Selected Resources?'
          desc={`Are you sure you want to delete ${selectedIds.length} selected resources? This action cannot be undone.`}
          confirmText='Delete All'
          destructive
        />
      </Main>
    </>
  )
}
