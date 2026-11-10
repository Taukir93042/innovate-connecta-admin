import { useState, useEffect } from 'react'
import {
  adminRecordedSessionService,
  type RecordedSessionItem,
} from '@/services/admin-recorded-sessions'
import {
  adminResourceService,
  adminResourceSectionService,
  type ResourceItem,
  type ResourceSectionItem,
} from '@/services/admin-resources'
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
  Layers,
  Video,
} from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { PaginationBar } from '@/components/pagination-bar'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

export function Resources() {
  return <ResourcesFeature />
}

export function ResourcesFeature() {
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [recordedSessions, setRecordedSessions] = useState<
    RecordedSessionItem[]
  >([])
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
  const [formSectionId, setFormSectionId] = useState<string>('none')
  const [formTitle, setFormTitle] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [resourceFile, setResourceFile] = useState<File | null>(null)
  const [formResourceType, setFormResourceType] = useState<'pdf' | 'video'>(
    'pdf'
  )
  const [formVideoUrl, setFormVideoUrl] = useState('')
  const [formAvailableSections, setFormAvailableSections] = useState<
    ResourceSectionItem[]
  >([])
  const [loadingFormSections, setLoadingFormSections] = useState(false)

  // Section Management Dialog state
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false)
  const [sectionSessionId, setSectionSessionId] = useState<string>('')
  const [sections, setSections] = useState<ResourceSectionItem[]>([])
  const [loadingSections, setLoadingSections] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newSectionDesc, setNewSectionDesc] = useState('')
  const [newSectionVideoUrl, setNewSectionVideoUrl] = useState('')
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null)
  const [editingSectionTitle, setEditingSectionTitle] = useState('')
  const [editingSectionDesc, setEditingSectionDesc] = useState('')
  const [editingSectionVideoUrl, setEditingSectionVideoUrl] = useState('')
  const [isSavingSection, setIsSavingSection] = useState(false)

  const fetchRecordedSessions = async () => {
    try {
      const res = await adminRecordedSessionService.getRecordedSessions({
        per_page: 100,
      })
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

  const loadSectionsForSession = async (sessionId: string) => {
    if (!sessionId || sessionId === 'all') {
      setFormAvailableSections([])
      return
    }
    try {
      setLoadingFormSections(true)
      const res = await adminResourceSectionService.getSections(
        Number(sessionId)
      )
      if (res.status && Array.isArray(res.data)) {
        setFormAvailableSections(res.data)
      }
    } catch {
      setFormAvailableSections([])
    } finally {
      setLoadingFormSections(false)
    }
  }

  const handleOpenCreateModal = () => {
    setEditingItem(null)
    setFormRecordedSessionId(
      selectedSessionId !== 'all' ? selectedSessionId : ''
    )
    setFormSectionId('none')
    setFormTitle('')
    setFormIsActive(true)
    setResourceFile(null)
    setFormResourceType('pdf')
    setFormVideoUrl('')
    if (selectedSessionId !== 'all') {
      loadSectionsForSession(selectedSessionId)
    } else {
      setFormAvailableSections([])
    }
    setIsFormOpen(true)
  }

  const handleOpenEditModal = (item: ResourceItem) => {
    setEditingItem(item)
    const recId = item.recorded_session_id
      ? String(item.recorded_session_id)
      : ''
    setFormRecordedSessionId(recId)
    setFormSectionId(
      item.resource_section_id ? String(item.resource_section_id) : 'none'
    )
    setFormTitle(item.title)
    setFormIsActive(item.is_active)
    setResourceFile(null)
    if (
      item.file_type === 'video' ||
      item.file_size === 'Video' ||
      item.file_path?.startsWith('http')
    ) {
      setFormResourceType('video')
      setFormVideoUrl(item.file_path || '')
    } else {
      setFormResourceType('pdf')
      setFormVideoUrl('')
    }
    setIsFormOpen(true)
    if (recId) {
      loadSectionsForSession(recId)
    } else {
      setFormAvailableSections([])
    }
  }

  // When session is selected, load sections and propose a title
  const handleSessionSelect = (sessionId: string) => {
    setFormRecordedSessionId(sessionId)
    setFormSectionId('none')
    if (sessionId) {
      loadSectionsForSession(sessionId)
      const selectedSession = recordedSessions.find(
        (s) => String(s.id) === sessionId
      )
      if (selectedSession && (!formTitle || formTitle.trim() === '')) {
        setFormTitle(`${selectedSession.title} - PDF Notes`)
      }
    } else {
      setFormAvailableSections([])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const isPdf =
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf')
      if (!isPdf) {
        toast.error('Only PDF files (.pdf) are allowed.')
        e.target.value = ''
        setResourceFile(null)
        return
      }
      if (file.size > MAX_PDF_SIZE_BYTES) {
        toast.error(
          'PDF file size exceeds 20 MB limit. Please select a smaller PDF.'
        )
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
          prev.map((r) =>
            r.id === item.id ? { ...r, is_active: !r.is_active } : r
          )
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

    if (formResourceType === 'video') {
      if (!formVideoUrl.trim()) {
        toast.error('Please enter a Video URL (YouTube, Vimeo, MP4, etc.)')
        return
      }
    } else {
      if (!editingItem && !resourceFile) {
        toast.error('Please select a PDF file to upload')
        return
      }
      if (resourceFile && resourceFile.size > MAX_PDF_SIZE_BYTES) {
        toast.error('PDF file size must not exceed 20 MB.')
        return
      }
    }

    try {
      setIsSubmitting(true)
      const formData = new FormData()
      formData.append('recorded_session_id', formRecordedSessionId)
      if (formSectionId && formSectionId !== 'none') {
        formData.append('resource_section_id', formSectionId)
      }
      formData.append('title', formTitle.trim())
      formData.append('resource_type', formResourceType)
      formData.append(
        'category',
        formResourceType === 'video' ? 'Video Lecture' : 'PDF Notes'
      )
      formData.append('is_active', formIsActive ? '1' : '0')

      if (formResourceType === 'video') {
        formData.append('video_url', formVideoUrl.trim())
      } else if (resourceFile) {
        formData.append('file', resourceFile)
      }

      if (editingItem) {
        formData.append('_method', 'PUT')
        const res = await adminResourceService.updateResource(
          editingItem.id,
          formData
        )
        if (res.status) {
          toast.success(res.message || 'Resource updated successfully')
          setIsFormOpen(false)
          fetchResources()
        }
      } else {
        const res = await adminResourceService.createResource(formData)
        if (res.status) {
          toast.success(res.message || 'Resource uploaded successfully')
          setIsFormOpen(false)
          fetchResources()
        }
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save resource'))
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

  // Section Management Handlers
  const fetchSectionsForManage = async (sessionId: string) => {
    if (!sessionId || sessionId === 'all') {
      setSections([])
      return
    }
    try {
      setLoadingSections(true)
      const res = await adminResourceSectionService.getSections(
        Number(sessionId)
      )
      if (res.status && Array.isArray(res.data)) {
        setSections(res.data)
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to fetch sections'))
    } finally {
      setLoadingSections(false)
    }
  }

  const handleOpenManageSections = (sessionId?: string) => {
    const target =
      sessionId ||
      (selectedSessionId !== 'all' ? selectedSessionId : '') ||
      (recordedSessions.length > 0 ? String(recordedSessions[0].id) : '')
    setSectionSessionId(target)
    setIsSectionModalOpen(true)
    if (target) {
      fetchSectionsForManage(target)
    }
  }

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sectionSessionId) {
      toast.error('Please select a recorded session first.')
      return
    }
    if (!newSectionTitle.trim()) {
      toast.error('Section title is required.')
      return
    }
    try {
      setIsSavingSection(true)
      const res = await adminResourceSectionService.createSection({
        recorded_session_id: Number(sectionSessionId),
        title: newSectionTitle.trim(),
        description: newSectionDesc.trim() || undefined,
        video_url: newSectionVideoUrl.trim() || undefined,
        sort_order: sections.length,
      })
      if (res.status) {
        toast.success('Section heading created!')
        setNewSectionTitle('')
        setNewSectionDesc('')
        setNewSectionVideoUrl('')
        fetchSectionsForManage(sectionSessionId)
        if (formRecordedSessionId === sectionSessionId) {
          loadSectionsForSession(sectionSessionId)
        }
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create section'))
    } finally {
      setIsSavingSection(false)
    }
  }

  const handleUpdateSection = async (sectionId: number) => {
    if (!editingSectionTitle.trim()) {
      toast.error('Section title cannot be empty.')
      return
    }
    try {
      setIsSavingSection(true)
      const res = await adminResourceSectionService.updateSection(sectionId, {
        title: editingSectionTitle.trim(),
        description: editingSectionDesc.trim() || undefined,
        video_url: editingSectionVideoUrl.trim() || undefined,
      })
      if (res.status) {
        toast.success('Section updated successfully!')
        setEditingSectionId(null)
        fetchSectionsForManage(sectionSessionId)
        if (formRecordedSessionId === sectionSessionId) {
          loadSectionsForSession(sectionSessionId)
        }
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update section'))
    } finally {
      setIsSavingSection(false)
    }
  }

  const handleDeleteSection = async (sectionId: number) => {
    if (
      !confirm(
        'Delete this section heading? PDF files under it will NOT be deleted; they will be kept as general resources.'
      )
    ) {
      return
    }
    try {
      const res = await adminResourceSectionService.deleteSection(sectionId)
      if (res.status) {
        toast.success(res.message || 'Section deleted.')
        fetchSectionsForManage(sectionSessionId)
        fetchResources(page, search, selectedSessionId)
        if (formRecordedSessionId === sectionSessionId) {
          loadSectionsForSession(sectionSessionId)
        }
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete section'))
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
            <h1 className='flex items-center gap-2 text-2xl font-bold tracking-tight'>
              <FolderOpen className='h-6 w-6 text-primary' /> Curriculum &
              Resources (Videos & PDFs)
            </h1>
            <p className='text-sm text-muted-foreground'>
              Manage curriculum sections, video lectures, and study PDFs for
              each recorded session.
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

            <Button
              variant='outline'
              onClick={() => handleOpenManageSections()}
              className='gap-2 shadow-sm'
            >
              <Layers className='h-4 w-4 text-primary' />
              Manage Sections & Videos
            </Button>

            <Button onClick={handleOpenCreateModal} className='gap-2 shadow-sm'>
              <Plus className='h-4 w-4' />+ Add Resource (Video or PDF)
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className='flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3.5 shadow-sm'>
          <div className='relative min-w-[240px] flex-1'>
            <SearchIcon className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search by title, file name, session...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9'
            />
          </div>

          <div className='w-[280px]'>
            <Select
              value={selectedSessionId}
              onValueChange={setSelectedSessionId}
            >
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
        <div className='overflow-hidden rounded-xl border bg-card shadow-sm'>
          <Table>
            <TableHeader>
              <TableRow className='bg-muted/40'>
                <TableHead className='w-[40px]'>
                  <input
                    type='checkbox'
                    className='rounded border-gray-300'
                    checked={
                      resources.length > 0 &&
                      selectedIds.length === resources.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead className='min-w-[260px]'>
                  Resource Title &amp; PDF File
                </TableHead>
                <TableHead>Section / Heading</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className='text-center'>Status</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-36 text-center'>
                    <div className='flex flex-col items-center justify-center gap-2 text-muted-foreground'>
                      <Loader2 className='h-6 w-6 animate-spin text-primary' />
                      <span>Loading PDF resources...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : resources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-40 text-center'>
                    <div className='flex flex-col items-center justify-center gap-2 text-muted-foreground'>
                      <FolderOpen className='h-8 w-8 text-muted-foreground/50' />
                      <p className='font-medium text-foreground'>
                        No session PDFs found
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Upload your PDF notes to make them available for
                        enrolled students.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                resources.map((res) => {
                  const isSelected = selectedIds.includes(res.id)
                  const isVideo =
                    res.file_type === 'video' ||
                    res.file_size === 'Video' ||
                    res.category === 'Video Lecture' ||
                    (res.file_path && res.file_path.startsWith('http'))

                  return (
                    <TableRow
                      key={res.id}
                      className={
                        isSelected
                          ? 'bg-primary/5 hover:bg-primary/10'
                          : undefined
                      }
                    >
                      {/* Checkbox */}
                      <TableCell>
                        <input
                          type='checkbox'
                          className='rounded border-gray-300'
                          checked={isSelected}
                          onChange={(e) =>
                            handleSelectOne(res.id, e.target.checked)
                          }
                        />
                      </TableCell>

                      {/* Title & PDF File Name */}
                      <TableCell>
                        <div className='flex items-start gap-3'>
                          {isVideo ? (
                            <div
                              className='mt-0.5 flex-shrink-0 rounded-lg bg-purple-500/10 p-2 text-purple-400'
                              title='Video Lecture'
                            >
                              <Video className='h-5 w-5' />
                            </div>
                          ) : (
                            <div
                              className='mt-0.5 flex-shrink-0 rounded-lg bg-red-500/10 p-2 text-red-500'
                              title='PDF Document'
                            >
                              <FileText className='h-5 w-5' />
                            </div>
                          )}
                          <div>
                            <p className='line-clamp-1 text-sm font-semibold text-foreground'>
                              {res.title}
                            </p>
                            <div className='mt-0.5 flex items-center gap-2'>
                              {res.recorded_session && (
                                <span className='text-xs text-muted-foreground'>
                                  {res.recorded_session.title}
                                </span>
                              )}
                              <span className='font-mono text-[11px] text-muted-foreground'>
                                • {res.file_name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Section Heading */}
                      <TableCell>
                        {res.resource_section ? (
                          <Badge
                            variant='outline'
                            className='px-2 py-0.5 text-xs font-normal text-muted-foreground'
                          >
                            {res.resource_section.title}
                          </Badge>
                        ) : (
                          <Badge
                            variant='outline'
                            className='px-2 py-0.5 text-xs font-normal text-muted-foreground'
                          >
                            General
                          </Badge>
                        )}
                      </TableCell>

                      {/* File Size */}
                      <TableCell>
                        {isVideo ? (
                          <Badge
                            variant='outline'
                            className='border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400'
                          >
                            Video Lecture
                          </Badge>
                        ) : (
                          <Badge
                            variant='outline'
                            className='py-0 font-mono text-xs text-muted-foreground'
                          >
                            {res.file_size || 'PDF'}
                          </Badge>
                        )}
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
                              className='inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground'
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
                              className='inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground'
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
            <div className='border-t p-4'>
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
                  {editingItem
                    ? formResourceType === 'video'
                      ? 'Edit Video Lecture'
                      : 'Edit Resource PDF'
                    : formResourceType === 'video'
                      ? 'Add Video Lecture'
                      : 'Upload Resource PDF'}
                </DialogTitle>
                <DialogDescription>
                  Add a chapter video lecture or upload a PDF document for this
                  masterclass section.
                </DialogDescription>
              </DialogHeader>

              <div className='grid gap-4 py-4'>
                {/* 1. Select Recorded Session (Required) */}
                <div className='grid gap-2'>
                  <Label htmlFor='session' className='font-semibold'>
                    Recorded Session / Masterclass{' '}
                    <span className='text-destructive'>*</span>
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
                </div>

                {/* 2. Select Resource Section Heading (Optional) */}
                <div className='grid gap-2'>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='section' className='font-semibold'>
                      Section Heading
                    </Label>
                    {formRecordedSessionId && (
                      <button
                        type='button'
                        onClick={() => {
                          setIsFormOpen(false)
                          handleOpenManageSections(formRecordedSessionId)
                        }}
                        className='text-xs font-medium text-primary hover:underline'
                      >
                        + Manage Sections
                      </button>
                    )}
                  </div>
                  <Select
                    value={formSectionId}
                    onValueChange={setFormSectionId}
                    disabled={!formRecordedSessionId || loadingFormSections}
                  >
                    <SelectTrigger id='section'>
                      <SelectValue
                        placeholder={
                          loadingFormSections
                            ? 'Loading sections...'
                            : 'General (No Section)'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>General / No Section</SelectItem>
                      {formAvailableSections.map((sec) => (
                        <SelectItem key={sec.id} value={String(sec.id)}>
                          {sec.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className='text-[11px] text-muted-foreground'>
                    Organizes this PDF under an accordion group on the student
                    portal.
                  </p>
                </div>

                {/* Resource Type Selection */}
                <div className='grid gap-1.5'>
                  <Label className='text-xs font-semibold'>Resource Type</Label>
                  <div className='grid grid-cols-1 gap-3'>
                    <button
                      type='button'
                      onClick={() => setFormResourceType('pdf')}
                      className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold transition ${
                        formResourceType === 'pdf'
                          ? 'border-red-500 bg-red-500/10 text-red-500'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <FileText className='size-3.5' /> PDF Document (.pdf)
                    </button>
                  </div>
                </div>

                {/* 3. Resource Title */}
                <div className='grid gap-2'>
                  <Label htmlFor='title' className='font-semibold'>
                    PDF Title <span className='text-destructive'>*</span>
                  </Label>
                  <Input
                    id='title'
                    placeholder='e.g. Course Introduction & Notes'
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>

                {formResourceType === 'video' ? (
                  <div className='grid gap-2'>
                    <Label
                      htmlFor='videoUrl'
                      className='flex items-center gap-1.5 font-semibold'
                    >
                      <Video className='size-4 text-purple-400' /> Video URL
                      (YouTube, Vimeo, MP4){' '}
                      <span className='text-destructive'>*</span>
                    </Label>
                    <Input
                      id='videoUrl'
                      placeholder='e.g. https://www.youtube.com/watch?v=... or https://vimeo.com/...'
                      value={formVideoUrl}
                      onChange={(e) => setFormVideoUrl(e.target.value)}
                      required
                    />
                    <p className='text-[11px] text-muted-foreground'>
                      Enrolled students will be able to watch this video lesson
                      directly in this chapter/section.
                    </p>
                  </div>
                ) : (
                  <div className='grid gap-2'>
                    <div className='flex items-center justify-between'>
                      <Label htmlFor='file' className='font-semibold'>
                        PDF File{' '}
                        {editingItem ? (
                          '(Leave blank to keep current)'
                        ) : (
                          <span className='text-destructive'>*</span>
                        )}
                      </Label>
                      <span className='text-xs font-medium text-muted-foreground'>
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
                      <p className='font-mono text-xs text-muted-foreground'>
                        Current PDF: {editingItem.file_name} (
                        {editingItem.file_size})
                      </p>
                    )}
                  </div>
                )}

                {/* 5. Active Switch */}
                <div className='flex items-center justify-between rounded-lg border bg-muted/20 p-3'>
                  <div>
                    <Label className='text-xs font-semibold'>
                      Visible to Enrolled Students
                    </Label>
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

        {/* Manage Resource Sections Modal */}
        <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
          <DialogContent className='sm:max-w-[620px] max-h-[90vh] overflow-y-auto overflow-x-hidden'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <Layers className='h-5 w-5 text-primary' />
                <span>Manage Course Resource Sections</span>
              </DialogTitle>
              <DialogDescription>
                Create and organize accordion headings (e.g. &quot;01. HTML
                Basics&quot;) for this masterclass.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4 py-2 min-w-0 w-full'>
              {/* Select Session */}
              <div className='grid gap-2'>
                <Label className='text-xs font-semibold'>
                  Recorded Session
                </Label>
                <Select
                  value={sectionSessionId}
                  onValueChange={(val) => {
                    setSectionSessionId(val)
                    fetchSectionsForManage(val)
                  }}
                >
                  <SelectTrigger>
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
              </div>

              {/* Add New Section Form */}
              <form
                onSubmit={handleCreateSection}
                className='space-y-3 rounded-lg border bg-muted/20 p-3.5 min-w-0 w-full'
              >
                <p className='flex items-center gap-1.5 text-xs font-semibold text-foreground'>
                  <Plus className='h-3.5 w-3.5 text-primary' /> Add New Section
                  Heading
                </p>
                <div className='grid gap-2'>
                  <Input
                    placeholder='Section Title (e.g. 01. Course Notes & Study Material)'
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    required
                  />
                  <Input
                    placeholder='Optional short description (e.g. Comprehensive guide & quick revision)'
                    value={newSectionDesc}
                    onChange={(e) => setNewSectionDesc(e.target.value)}
                  />
                  <Input
                    placeholder='Section Video URL (YouTube, Vimeo, MP4) — e.g. https://youtu.be/...'
                    value={newSectionVideoUrl}
                    onChange={(e) => setNewSectionVideoUrl(e.target.value)}
                  />
                </div>
                <div className='flex justify-end'>
                  <Button
                    type='submit'
                    size='sm'
                    disabled={
                      isSavingSection ||
                      !sectionSessionId ||
                      !newSectionTitle.trim()
                    }
                    className='gap-1.5'
                  >
                    {isSavingSection && (
                      <Loader2 className='h-3.5 w-3.5 animate-spin' />
                    )}
                    Save Section
                  </Button>
                </div>
              </form>

              {/* Existing Sections List */}
              <div className='space-y-2 min-w-0 w-full'>
                <Label className='text-xs font-semibold'>
                  Existing Sections ({sections.length})
                </Label>
                {loadingSections ? (
                  <div className='flex items-center justify-center gap-2 py-6 text-center text-xs text-muted-foreground'>
                    <Loader2 className='h-4 w-4 animate-spin text-primary' />{' '}
                    Loading sections...
                  </div>
                ) : sections.length === 0 ? (
                  <div className='rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground'>
                    No sections added for this session yet. Create your first
                    heading above.
                  </div>
                ) : (
                  <div className='max-h-[280px] space-y-2 overflow-y-auto pr-1 min-w-0 w-full'>
                    {sections.map((sec, idx) => (
                      <div
                        key={sec.id}
                        className='flex items-center justify-between gap-3 rounded-lg border bg-card p-3 text-sm min-w-0 w-full'
                      >
                        {editingSectionId === sec.id ? (
                          <div className='flex-1 space-y-2 min-w-0'>
                            <Input
                              value={editingSectionTitle}
                              onChange={(e) =>
                                setEditingSectionTitle(e.target.value)
                              }
                              placeholder='Section title'
                              className='h-8 text-xs'
                            />
                            <Input
                              value={editingSectionDesc}
                              onChange={(e) =>
                                setEditingSectionDesc(e.target.value)
                              }
                              placeholder='Optional description'
                            />
                            <Input
                              value={editingSectionVideoUrl}
                              onChange={(e) =>
                                setEditingSectionVideoUrl(e.target.value)
                              }
                              placeholder='Section Video URL (YouTube, Vimeo, MP4) — Optional'
                              className='h-8 text-xs'
                            />
                            <div className='flex items-center justify-end gap-2'>
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={() => setEditingSectionId(null)}
                                className='h-7 text-xs'
                              >
                                Cancel
                              </Button>
                              <Button
                                size='sm'
                                onClick={() => handleUpdateSection(sec.id)}
                                disabled={isSavingSection}
                                className='h-7 text-xs'
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className='flex min-w-0 flex-1 items-center gap-2.5'>
                              <span className='font-mono text-xs font-semibold text-muted-foreground shrink-0'>
                                {String(idx + 1).padStart(2, '0')}.
                              </span>
                              <div className='min-w-0 flex-1'>
                                <p
                                  className='truncate text-xs font-medium text-foreground'
                                  title={sec.title}
                                >
                                  {sec.title}
                                </p>
                                {sec.description && (
                                  <p
                                    className='truncate text-[11px] text-muted-foreground'
                                    title={sec.description}
                                  >
                                    {sec.description}
                                  </p>
                                )}
                              </div>
                              <div className='flex items-center gap-1.5 shrink-0'>
                                <Badge
                                  variant='outline'
                                  className='px-1.5 py-0 font-mono text-[10px] text-muted-foreground'
                                >
                                  {sec.total_files || 0} PDFs
                                </Badge>
                                {sec.video_url && (
                                  <Badge
                                    variant='outline'
                                    className='flex items-center gap-1 border-primary/30 px-1.5 py-0 text-[10px] text-primary'
                                  >
                                    <Video className='h-2.5 w-2.5' /> Video
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className='flex shrink-0 items-center gap-1'>
                              <Button
                                size='icon'
                                variant='ghost'
                                className='h-7 w-7'
                                onClick={() => {
                                  setEditingSectionId(sec.id)
                                  setEditingSectionTitle(sec.title)
                                  setEditingSectionDesc(sec.description || '')
                                  setEditingSectionVideoUrl(sec.video_url || '')
                                }}
                                title='Edit section'
                              >
                                <Edit2 className='h-3.5 w-3.5' />
                              </Button>
                              <Button
                                size='icon'
                                variant='ghost'
                                className='h-7 w-7 text-destructive hover:text-destructive'
                                onClick={() => handleDeleteSection(sec.id)}
                                title='Delete section'
                              >
                                <Trash2 className='h-3.5 w-3.5' />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className='w-full'>
              <Button
                variant='outline'
                onClick={() => setIsSectionModalOpen(false)}
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Resource Details Modal */}
        <Dialog
          open={!!viewItem}
          onOpenChange={(open) => !open && setViewItem(null)}
        >
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
                  <p className='mt-0.5 text-base font-semibold'>
                    {viewItem.title}
                  </p>
                </div>

                <div>
                  <p className='text-xs text-muted-foreground'>
                    Linked Masterclass
                  </p>
                  <p className='mt-0.5 font-medium'>
                    {viewItem.recorded_session?.title ||
                      viewItem.session?.title ||
                      'None'}
                  </p>
                </div>

                {viewItem.resource_section && (
                  <div>
                    <p className='text-xs text-muted-foreground'>
                      Section Heading
                    </p>
                    <p className='mt-0.5 font-medium text-purple-400'>
                      {viewItem.resource_section.title}
                    </p>
                  </div>
                )}

                <div>
                  <p className='text-xs text-muted-foreground'>
                    File Name &amp; Size
                  </p>
                  <p className='mt-0.5 line-clamp-1 font-mono text-xs'>
                    {viewItem.file_name}
                  </p>
                  <p className='mt-0.5 text-xs text-muted-foreground uppercase'>
                    PDF • {viewItem.file_size}
                  </p>
                </div>

                <div className='flex justify-end gap-2 pt-2'>
                  {viewItem.file_url && (
                    <Button
                      asChild
                      variant='default'
                      size='sm'
                      className='gap-1.5'
                    >
                      <a
                        href={viewItem.file_url}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <Download className='h-4 w-4' /> Download PDF
                      </a>
                    </Button>
                  )}
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setViewItem(null)}
                  >
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
