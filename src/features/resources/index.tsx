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
  Download,
  AlertCircle,
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

const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

export function Resources() {
  return <ResourcesFeature />
}

export function ResourcesFeature() {
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [recordedSessions, setRecordedSessions] = useState<RecordedSessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
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
  const [formRecordedSessionId, setFormRecordedSessionId] = useState<string>('')
  const [formTitle, setFormTitle] = useState('')
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
    recSessionId = selectedSessionId
  ) => {
    try {
      setLoading(true)
      const res = await adminResourceService.getResources({
        page: currentPage,
        per_page: 10,
        search: searchQuery.trim() || undefined,
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
      fetchResources(1, search, selectedSessionId)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, selectedSessionId])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchResources(newPage, search, selectedSessionId)
  }

  const handleOpenCreateModal = () => {
    setEditingItem(null)
    setFormRecordedSessionId('')
    setFormTitle('')
    setFormIsActive(true)
    setResourceFile(null)
    setIsFormOpen(true)
  }

  const handleOpenEditModal = (item: ResourceItem) => {
    setEditingItem(item)
    setFormRecordedSessionId(item.recorded_session_id ? String(item.recorded_session_id) : '')
    setFormTitle(item.title)
    setFormIsActive(item.is_active)
    setResourceFile(null)
    setIsFormOpen(true)
  }

  // When session is selected, auto-fill title with hyphen
  const handleSessionSelect = (sessionId: string) => {
    setFormRecordedSessionId(sessionId)
    if (sessionId) {
      const selectedSession = recordedSessions.find((s) => String(s.id) === sessionId)
      if (selectedSession && (!formTitle || formTitle.trim() === '')) {
        setFormTitle(`${selectedSession.title} - Session PDF Notes`)
      }
    }
  }

  // Find if currently selected session already has a resource attached
  const existingResourceForSession = formRecordedSessionId
    ? resources.find(
        (r) =>
          String(r.recorded_session_id) === formRecordedSessionId &&
          (!editingItem || editingItem.id !== r.id)
      )
    : null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Check if file is PDF
      const isPdf =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      if (!isPdf) {
        toast.error('Only PDF files (.pdf) are allowed.')
        e.target.value = ''
        setResourceFile(null)
        return
      }

      // Check max 20 MB size limit
      if (file.size > MAX_PDF_SIZE_BYTES) {
        toast.error('PDF file size exceeds 20 MB limit. Please select a smaller PDF.')
        e.target.value = ''
        setResourceFile(null)
        return
      }

      setResourceFile(file)
    }
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
    if (!formRecordedSessionId) {
      toast.error('Please select a Recorded Session / Masterclass')
      return
    }

    if (!formTitle.trim()) {
      toast.error('Resource title is required')
      return
    }

    if (!editingItem && !resourceFile) {
      toast.error('Please select a PDF file to upload')
      return
    }

    if (resourceFile && resourceFile.size > MAX_PDF_SIZE_BYTES) {
      toast.error('PDF file size must not exceed 20 MB.')
      return
    }

    try {
      setIsSubmitting(true)
      const formData = new FormData()
      formData.append('recorded_session_id', formRecordedSessionId)
      formData.append('title', formTitle.trim())
      formData.append('category', 'PDF Notes')
      formData.append('is_active', formIsActive ? '1' : '0')

      if (resourceFile) {
        formData.append('file', resourceFile)
      }

      if (editingItem) {
        formData.append('_method', 'PUT')
        const res = await adminResourceService.updateResource(editingItem.id, formData)
        if (res.status) {
          toast.success(res.message || 'Session PDF updated successfully')
          setIsFormOpen(false)
          fetchResources()
        }
      } else {
        const res = await adminResourceService.createResource(formData)
        if (res.status) {
          toast.success(res.message || 'Session PDF uploaded successfully')
          setIsFormOpen(false)
          fetchResources()
        }
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save PDF'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      setIsDeleting(true)
      const res = await adminResourceService.deleteResource(deleteItem.id)
      if (res.status) {
        toast.success('PDF deleted successfully')
        setDeleteItem(null)
        fetchResources()
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete PDF'))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    try {
      setIsBulkDeleting(true)
      const res = await adminResourceService.bulkDeleteResources(selectedIds)
      if (res.status) {
        toast.success(res.message || 'Selected PDFs deleted')
        setSelectedIds([])
        setIsBulkDeletingOpen(false)
        fetchResources()
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to bulk delete'))
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

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id))
    }
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
              <FolderOpen className='h-6 w-6 text-primary' /> Session PDF Management
            </h1>
            <p className='text-sm text-muted-foreground'>
              Upload 1 PDF notes file (max 20 MB) per recorded session. Only enrolled students can view &amp; download it.
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
              Upload Session PDF
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className='flex flex-wrap items-center gap-3 bg-card p-3.5 rounded-xl border shadow-sm'>
          <div className='relative flex-1 min-w-[240px]'>
            <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search by title, file name, session...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9'
            />
          </div>

          <div className='w-[280px]'>
            <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
              <SelectTrigger>
                <SelectValue placeholder='Filter By Session' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Recorded Sessions</SelectItem>
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
                <TableHead className='min-w-[260px]'>Resource Title &amp; PDF File</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className='text-center'>Status</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className='h-36 text-center'>
                    <div className='flex flex-col items-center justify-center gap-2 text-muted-foreground'>
                      <Loader2 className='h-6 w-6 animate-spin text-primary' />
                      <span>Loading PDF resources...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : resources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='h-40 text-center'>
                    <div className='flex flex-col items-center justify-center gap-2 text-muted-foreground'>
                      <FolderOpen className='h-8 w-8 text-muted-foreground/50' />
                      <p className='font-medium text-foreground'>No session PDFs found</p>
                      <p className='text-xs text-muted-foreground'>
                        Upload your first session PDF notes to make it available for enrolled students.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                resources.map((res) => {
                  const isSelected = selectedIds.includes(res.id)

                  return (
                    <TableRow
                      key={res.id}
                      className={isSelected ? 'bg-primary/5 hover:bg-primary/10' : undefined}
                    >
                      {/* Checkbox */}
                      <TableCell>
                        <input
                          type='checkbox'
                          className='rounded border-gray-300'
                          checked={isSelected}
                          onChange={(e) => handleSelectOne(res.id, e.target.checked)}
                        />
                      </TableCell>

                      {/* Title & PDF File Name */}
                      <TableCell>
                        <div className='flex items-start gap-3'>
                          <div className='p-2 rounded-lg bg-red-500/10 text-red-500 mt-0.5'>
                            <FileText className='h-5 w-5' />
                          </div>
                          <div>
                            <p className='font-semibold text-foreground text-sm line-clamp-1'>
                              {res.title}
                            </p>
                            
                          </div>
                        </div>
                      </TableCell>

                      {/* File Size */}
                      <TableCell>
                        <Badge variant='outline' className='text-xs font-mono py-0 text-muted-foreground'>
                          {res.file_size || 'PDF'}
                        </Badge>
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
                              download={res.file_name || 'resource.pdf'}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition'
                              title='Download PDF'
                            >
                              <Download className='h-4 w-4' />
                            </a>
                          )}
                          {res.file_url ? (
                            <a
                              href={res.file_url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition'
                              title='View PDF'
                            >
                              <Eye className='h-4 w-4' />
                            </a>
                          ) : (
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8'
                              onClick={() => setViewItem(res)}
                              title='View Details'
                            >
                              <Eye className='h-4 w-4 text-muted-foreground' />
                            </Button>
                          )}
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => handleOpenEditModal(res)}
                            title='Edit PDF'
                          >
                            <Edit2 className='h-4 w-4 text-primary' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => setDeleteItem(res)}
                            className='text-destructive hover:text-destructive'
                            title='Delete PDF'
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
          <DialogContent className='sm:max-w-[540px]'>
            <form onSubmit={handleSubmitForm}>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Session PDF' : 'Upload Session PDF'}
                </DialogTitle>
                <DialogDescription>
                  Upload or replace the PDF notes for a recorded session (1 session = 1 PDF, max 20 MB).
                </DialogDescription>
              </DialogHeader>

              <div className='grid gap-4 py-4'>
                {/* 1. Select Recorded Session (Required) */}
                <div className='grid gap-2'>
                  <Label htmlFor='session' className='font-semibold'>
                    Recorded Session / Masterclass <span className='text-destructive'>*</span>
                  </Label>
                  <Select
                    value={formRecordedSessionId}
                    onValueChange={handleSessionSelect}
                    required
                  >
                    <SelectTrigger id='session'>
                      <SelectValue placeholder='Select Recorded Session' />
                    </SelectTrigger>
                    <SelectContent>
                      {recordedSessions.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {existingResourceForSession && (
                    <div className='flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500'>
                      <AlertCircle className='h-4 w-4 flex-shrink-0' />
                      <span>
                        This session already has a PDF attached (<strong>{existingResourceForSession.file_name}</strong>). Uploading will replace it.
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Resource Title */}
                <div className='grid gap-2'>
                  <Label htmlFor='title' className='font-semibold'>
                    Resource Title <span className='text-destructive'>*</span>
                  </Label>
                  <Input
                    id='title'
                    placeholder='e.g. LinkedIn Growth &amp; Personal Branding Playbook - Session PDF Notes'
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                  <p className='text-[11px] text-muted-foreground'>
                    Auto-formatted with hyphen (-) for clear separation.
                  </p>
                </div>

                {/* 3. File Upload (PDF only, Max 20MB) */}
                <div className='grid gap-2'>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='file' className='font-semibold'>
                      PDF File {editingItem ? '(Leave blank to keep current)' : <span className='text-destructive'>*</span>}
                    </Label>
                    <span className='text-xs text-muted-foreground font-medium'>
                      PDF only, Max 20 MB
                    </span>
                  </div>
                  <Input
                    id='file'
                    type='file'
                    accept='.pdf,application/pdf'
                    onChange={handleFileChange}
                    required={!editingItem}
                  />
                  {editingItem && editingItem.file_name && !resourceFile && (
                    <p className='text-xs text-muted-foreground font-mono'>
                      Current PDF: {editingItem.file_name} ({editingItem.file_size})
                    </p>
                  )}
                </div>

                {/* 4. Active Switch */}
                <div className='flex items-center justify-between p-3 rounded-lg border bg-muted/20'>
                  <div>
                    <Label className='text-xs font-semibold'>Visible to Enrolled Students</Label>
                    <p className='text-[11px] text-muted-foreground'>
                      {formIsActive ? 'Active & Downloadable' : 'Hidden'}
                    </p>
                  </div>
                  <Switch
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
                  {editingItem ? 'Update PDF' : 'Upload PDF'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Resource Details Modal */}
        <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
          <DialogContent className='sm:max-w-[460px]'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <FileText className='h-5 w-5 text-red-500' />
                <span>PDF Resource Details</span>
              </DialogTitle>
            </DialogHeader>

            {viewItem && (
              <div className='space-y-4 py-2 text-sm'>
                <div>
                  <p className='text-xs text-muted-foreground'>Title</p>
                  <p className='font-semibold text-base mt-0.5'>{viewItem.title}</p>
                </div>

                <div>
                  <p className='text-xs text-muted-foreground'>Linked Masterclass</p>
                  <p className='font-medium mt-0.5'>
                    {viewItem.recorded_session?.title || viewItem.session?.title || 'None'}
                  </p>
                </div>

                <div>
                  <p className='text-xs text-muted-foreground'>File Name &amp; Size</p>
                  <p className='font-mono text-xs mt-0.5 line-clamp-1'>{viewItem.file_name}</p>
                  <p className='text-xs text-muted-foreground uppercase mt-0.5'>PDF • {viewItem.file_size}</p>
                </div>

                <div className='pt-2 flex justify-end gap-2'>
                  {viewItem.file_url && (
                    <Button asChild variant='default' size='sm' className='gap-1.5'>
                      <a href={viewItem.file_url} target='_blank' rel='noopener noreferrer'>
                        <Download className='h-4 w-4' /> Download PDF
                      </a>
                    </Button>
                  )}
                  <Button variant='outline' size='sm' onClick={() => setViewItem(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Single Resource Confirmation */}
        <ConfirmDialog
          open={!!deleteItem}
          onOpenChange={(open) => !open && setDeleteItem(null)}
          title='Delete PDF'
          desc={`Are you sure you want to delete "${deleteItem?.title}"? The uploaded PDF file will be permanently removed.`}
          confirmText='Delete'
          destructive
          isLoading={isDeleting}
          handleConfirm={handleDelete}
        />

        {/* Bulk Delete Confirmation */}
        <ConfirmDialog
          open={isBulkDeletingOpen}
          onOpenChange={setIsBulkDeletingOpen}
          title='Delete Selected PDFs'
          desc={`Are you sure you want to delete ${selectedIds.length} selected PDFs? All associated files will be deleted.`}
          confirmText='Delete Selected'
          destructive
          isLoading={isBulkDeleting}
          handleConfirm={handleBulkDelete}
        />
      </Main>
    </>
  )
}
