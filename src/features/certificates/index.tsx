import { useState, useEffect } from 'react'
import {
  adminCertificateService,
  type CertificateItem,
} from '@/services/admin-certificates'
import { adminUserService, type UserItem } from '@/services/admin-users'
import {
  Award,
  Plus,
  Search as SearchIcon,
  Edit2,
  Trash2,
  Loader2,
  Eye,
  Download,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-client'
import { getStorageUrl } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

const CERTIFICATE_TYPES = [
  'Course Completion Certificate',
  'Live Session Certificate',
  'Masterclass Certificate',
  'Bootcamp Certificate',
  'Workshop Certificate',
  'Internship Certificate',
]

export function Certificates() {
  const [certificates, setCertificates] = useState<CertificateItem[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  // Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCert, setEditingCert] = useState<CertificateItem | null>(null)
  const [deleteCert, setDeleteCert] = useState<CertificateItem | null>(null)
  const [previewCert, setPreviewCert] = useState<CertificateItem | null>(null)

  // Form Fields
  const [formUserId, setFormUserId] = useState<string>('')
  const [formTitle, setFormTitle] = useState('')
  const [formType, setFormType] = useState('Course Completion Certificate')
  const [formCertNo, setFormCertNo] = useState('')
  const [formIssueDate, setFormIssueDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [formDescription, setFormDescription] = useState('')
  const [formFile, setFormFile] = useState<File | null>(null)
  const [formIsActive, setFormIsActive] = useState(true)

  // Fetch users for selector
  const fetchUsers = async () => {
    try {
      const res = await adminUserService.getUsers({ all: true })
      if (res.status && Array.isArray(res.data)) {
        setUsers(res.data)
      } else if (res.status && res.data && Array.isArray(res.data.users)) {
        setUsers(res.data.users)
      }
    } catch {
      // ignore
    }
  }

  // Fetch certificates
  const fetchCertificates = async () => {
    setLoading(true)
    try {
      const res = await adminCertificateService.getCertificates({
        search: search || undefined,
        user_id: selectedUserId !== 'all' ? selectedUserId : undefined,
        page,
        per_page: 15,
      })

      if (res.status) {
        setCertificates(res.data || [])
        if (res.pagination) {
          setTotalPages(res.pagination.last_page)
          setTotalCount(res.pagination.total)
        }
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchCertificates()
  }, [page, selectedUserId])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchCertificates()
  }

  const handleOpenCreate = () => {
    setEditingCert(null)
    setFormUserId(users.length > 0 ? String(users[0].id) : '')
    setFormTitle('')
    setFormType('Course Completion Certificate')
    setFormCertNo('')
    setFormIssueDate(new Date().toISOString().split('T')[0])
    setFormDescription('')
    setFormFile(null)
    setFormIsActive(true)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (cert: CertificateItem) => {
    setEditingCert(cert)
    setFormUserId(String(cert.user_id))
    setFormTitle(cert.title)
    setFormType(cert.certificate_type || 'Course Completion Certificate')
    setFormCertNo(cert.certificate_no)
    setFormIssueDate(cert.issue_date ? cert.issue_date.split('T')[0] : '')
    setFormDescription(cert.description || '')
    setFormFile(null)
    setFormIsActive(cert.is_active)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formUserId) {
      toast.error('Please select a recipient candidate user.')
      return
    }
    if (!formTitle.trim()) {
      toast.error('Please enter certificate title.')
      return
    }
    if (!editingCert && !formFile) {
      toast.error('Please upload certificate file (PDF or Image).')
      return
    }

    setIsSubmitting(true)

    try {
      const fd = new FormData()
      fd.append('user_id', formUserId)
      fd.append('title', formTitle.trim())
      fd.append('certificate_type', formType)
      if (formCertNo.trim()) {
        fd.append('certificate_no', formCertNo.trim())
      }
      if (formIssueDate) {
        fd.append('issue_date', formIssueDate)
      }
      if (formDescription.trim()) {
        fd.append('description', formDescription.trim())
      }
      fd.append('is_active', formIsActive ? '1' : '0')
      if (formFile) {
        fd.append('file', formFile)
      }

      if (editingCert) {
        await adminCertificateService.updateCertificate(editingCert.id, fd)
        toast.success('Certificate updated successfully.')
      } else {
        await adminCertificateService.createCertificate(fd)
        toast.success('Certificate issued to candidate successfully.')
      }

      setIsFormOpen(false)
      fetchCertificates()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (item: CertificateItem) => {
    try {
      await adminCertificateService.toggleStatus(item.id)
      setCertificates((prev) =>
        prev.map((c) =>
          c.id === item.id ? { ...c, is_active: !c.is_active } : c
        )
      )
      toast.success(
        `Certificate ${!item.is_active ? 'activated' : 'deactivated'} successfully.`
      )
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteCert) return
    try {
      await adminCertificateService.deleteCertificate(deleteCert.id)
      toast.success('Certificate deleted successfully.')
      setDeleteCert(null)
      fetchCertificates()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handleCopyNo = (cert: CertificateItem) => {
    navigator.clipboard.writeText(cert.certificate_no)
    setCopiedId(cert.id)
    toast.success('Certificate number copied!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6'>
        {/* Top Header & Actions */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='flex items-center gap-2 text-2xl font-bold tracking-tight'>
              <Award className='h-6 w-6' />
              Certificates Management
            </h1>
            <p className='text-sm text-muted-foreground'>
              Issue, manage, and verify candidate session & course certificates.
            </p>
          </div>

          <Button
            onClick={handleOpenCreate}
            className='inline-flex items-center gap-2 bg-primary from-indigo-600 to-purple-600 text-white shadow hover:from-indigo-700 hover:to-purple-700'
          >
            <Plus className='h-4 w-4' />
            Issue Certificate
          </Button>
        </div>

        {/* Filters Bar */}
        <div className='flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between'>
          <form
            onSubmit={handleSearchSubmit}
            className='flex flex-1 items-center gap-2'
          >
            <div className='relative max-w-sm flex-1'>
              <SearchIcon className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search title, candidate, cert no...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-9'
              />
            </div>
            <Button type='submit' variant='secondary' size='sm'>
              Search
            </Button>
            {search && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => {
                  setSearch('')
                  setPage(1)
                  fetchCertificates()
                }}
              >
                Clear
              </Button>
            )}
          </form>

          <div className='flex items-center gap-2'>
            <Label className='text-xs whitespace-nowrap text-muted-foreground'>
              Filter Candidate:
            </Label>
            <Select
              value={selectedUserId}
              onValueChange={(val) => {
                setSelectedUserId(val)
                setPage(1)
              }}
            >
              <SelectTrigger className='h-9 w-[200px] text-xs'>
                <SelectValue placeholder='All Candidates' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Candidates</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Certificates Table */}
        {loading ? (
          <div className='flex min-h-[300px] flex-col items-center justify-center gap-2 rounded-lg border p-8 text-center'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
            <p className='text-sm text-muted-foreground'>
              Loading certificates...
            </p>
          </div>
        ) : certificates.length === 0 ? (
          <div className='flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center'>
            <Award className='mb-2 h-12 w-12 text-muted-foreground/60' />
            <h3 className='text-lg font-semibold'>No certificates found</h3>
            <p className='mb-4 max-w-sm text-sm text-muted-foreground'>
              {search || selectedUserId !== 'all'
                ? 'No certificates matched your search/filter criteria.'
                : 'Click "Issue Certificate" above to issue a verified certificate to any candidate.'}
            </p>
            <Button onClick={handleOpenCreate} size='sm'>
              <Plus className='mr-1 h-4 w-4' /> Issue First Certificate
            </Button>
          </div>
        ) : (
          <div className='overflow-hidden rounded-lg border bg-card shadow-xs'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/50'>
                  <TableHead className='w-[50px]'>S.No</TableHead>
                  <TableHead className='min-w-[190px]'>Candidate</TableHead>
                  <TableHead className='min-w-[200px]'>
                    Certificate Title
                  </TableHead>
                  <TableHead className='w-[140px]'>Type</TableHead>
                  <TableHead className='w-[140px]'>Cert No</TableHead>
                  <TableHead className='w-[110px]'>Issue Date</TableHead>
                  <TableHead className='w-[90px]'>File</TableHead>
                  <TableHead className='w-[80px]'>Status</TableHead>
                  <TableHead className='w-[110px] text-end'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((item, index) => {
                  const certFileUrl = item.file_url
                    ? getStorageUrl(item.file_url)
                    : item.file_path
                      ? getStorageUrl(item.file_path)
                      : null

                  return (
                    <TableRow key={item.id} className='hover:bg-muted/40'>
                      <TableCell className='py-3 font-mono text-xs text-muted-foreground'>
                        {(page - 1) * 15 + index + 1}
                      </TableCell>

                      {/* Candidate User */}
                      <TableCell className='py-3'>
                        <div className='flex items-center gap-2.5'>
                          <Avatar className='h-8 w-8 shrink-0 border'>
                            <AvatarImage
                              src={
                                item.user?.avatar_url
                                  ? getStorageUrl(item.user.avatar_url)
                                  : undefined
                              }
                              alt={item.user?.name || 'User'}
                            />
                            <AvatarFallback className='bg-purple-500/15 text-xs font-semibold text-purple-600'>
                              {(item.user?.name || 'U')
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className='min-w-0'>
                            <p className='truncate text-sm leading-none font-semibold'>
                              {item.user?.name || 'Unknown Candidate'}
                            </p>
                            <p className='mt-0.5 truncate text-xs text-muted-foreground'>
                              {item.user?.email || 'No email'}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Title */}
                      <TableCell className='py-3'>
                        <p
                          className='line-clamp-1 text-sm font-medium text-foreground'
                          title={item.title}
                        >
                          {item.title}
                        </p>
                        {item.file_size && (
                          <span className='text-xs text-muted-foreground'>
                            {item.file_size}
                          </span>
                        )}
                      </TableCell>

                      {/* Type */}
                      <TableCell className='py-3'>
                        <Badge
                          variant='outline'
                          className='text-xs font-normal'
                        >
                          {item.certificate_type || 'Certificate'}
                        </Badge>
                      </TableCell>

                      {/* Cert No */}
                      <TableCell className='py-3'>
                        <div className='inline-flex items-center gap-1 rounded border bg-muted/60 px-2 py-1 font-mono text-xs'>
                          <span
                            className='max-w-[100px] truncate'
                            title={item.certificate_no}
                          >
                            {item.certificate_no}
                          </span>
                          <button
                            type='button'
                            onClick={() => handleCopyNo(item)}
                            className='transition-colors hover:text-primary'
                            title='Copy ID'
                          >
                            {copiedId === item.id ? (
                              <Check className='h-3 w-3 text-emerald-500' />
                            ) : (
                              <Copy className='h-3 w-3' />
                            )}
                          </button>
                        </div>
                      </TableCell>

                      {/* Issue Date */}
                      <TableCell className='py-3 text-xs whitespace-nowrap text-muted-foreground'>
                        {item.issue_date}
                      </TableCell>

                      {/* File */}
                      <TableCell className='py-3'>
                        {certFileUrl ? (
                          <div className='flex items-center gap-1'>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-7 w-7 hover:text-indigo-700'
                              onClick={() => setPreviewCert(item)}
                              title='Preview'
                            >
                              <Eye className='h-3.5 w-3.5' />
                            </Button>
                            <a
                              href={certFileUrl}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground'
                              title='Open File'
                            >
                              <ExternalLink className='h-3.5 w-3.5' />
                            </a>
                          </div>
                        ) : (
                          <span className='text-xs text-muted-foreground'>
                            No file
                          </span>
                        )}
                      </TableCell>

                      {/* Status Toggle */}
                      <TableCell className='py-3'>
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggleStatus(item)}
                          title={item.is_active ? 'Active' : 'Inactive'}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell className='py-3 text-end'>
                        <div className='flex items-center justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 text-muted-foreground hover:text-foreground'
                            onClick={() => handleOpenEdit(item)}
                            title='Edit Certificate'
                          >
                            <Edit2 className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30'
                            onClick={() => setDeleteCert(item)}
                            title='Delete Certificate'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <PaginationBar
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalCount}
            perPage={15}
            itemName='certificates'
            onPageChange={setPage}
          />
        )}
      </Main>

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {editingCert ? 'Edit Certificate' : 'Issue New Certificate'}
            </DialogTitle>
            <DialogDescription>
              {editingCert
                ? 'Update certificate details or replace the attached document.'
                : 'Issue a verified completion certificate to a candidate user.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className='space-y-4 py-2'>
            {/* Recipient Candidate */}
            <div className='space-y-1.5'>
              <Label htmlFor='certUser'>Recipient Candidate *</Label>
              <Select
                value={formUserId}
                onValueChange={setFormUserId}
                disabled={users.length === 0}
              >
                <SelectTrigger id='certUser'>
                  <SelectValue placeholder='Select candidate user' />
                </SelectTrigger>
                <SelectContent className='max-h-56'>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name} — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className='space-y-1.5'>
              <Label htmlFor='certTitle'>Certificate Title *</Label>
              <Input
                id='certTitle'
                placeholder='e.g. Full Stack Web Development Masterclass'
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            {/* Type & Issue Date Grid */}
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label htmlFor='certType'>Certificate Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger id='certType'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CERTIFICATE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='certDate'>Issue Date</Label>
                <Input
                  id='certDate'
                  type='date'
                  value={formIssueDate}
                  onChange={(e) => setFormIssueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Certificate Number */}
            <div className='space-y-1.5'>
              <Label htmlFor='certNo'>Certificate Number (Optional)</Label>
              <Input
                id='certNo'
                placeholder='Auto-generated if left blank (e.g. IC-2026-AB123)'
                value={formCertNo}
                onChange={(e) => setFormCertNo(e.target.value)}
              />
            </div>

            {/* File Upload */}
            <div className='space-y-1.5'>
              <Label htmlFor='certFile'>
                {editingCert
                  ? 'Replace Certificate File (PDF / Image)'
                  : 'Certificate Document (PDF / Image) *'}
              </Label>
              <Input
                id='certFile'
                type='file'
                accept='.pdf,image/png,image/jpeg,image/webp'
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFormFile(e.target.files[0])
                  }
                }}
                required={!editingCert}
              />
              {editingCert && editingCert.file_name && !formFile && (
                <p className='text-xs text-muted-foreground'>
                  Current file: {editingCert.file_name} (
                  {editingCert.file_size || 'Attached'})
                </p>
              )}
            </div>

            {/* Description */}
            <div className='space-y-1.5'>
              <Label htmlFor='certDesc'>Notes / Description (Optional)</Label>
              <Input
                id='certDesc'
                placeholder='Optional verification or session details'
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            {/* Active Toggle */}
            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div>
                <Label className='text-sm font-medium'>
                  Visible to Candidate
                </Label>
                <p className='text-xs text-muted-foreground'>
                  When active, certificate displays in candidate dashboard.
                </p>
              </div>
              <Switch
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
              />
            </div>

            <DialogFooter className='pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isSubmitting}
                className='bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Saving...
                  </>
                ) : editingCert ? (
                  'Update Certificate'
                ) : (
                  'Issue Certificate'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteCert}
        onOpenChange={(open) => !open && setDeleteCert(null)}
        handleConfirm={handleDeleteConfirm}
        title='Delete Certificate?'
        desc={`Are you sure you want to delete "${deleteCert?.title}" for ${deleteCert?.user?.name || 'this candidate'}? This cannot be undone.`}
        confirmText='Delete'
        destructive
      />

      {/* Preview Dialog */}
      {previewCert && (
        <Dialog open={!!previewCert} onOpenChange={() => setPreviewCert(null)}>
          <DialogContent className='max-w-3xl'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <Award className='h-5 w-5 text-purple-500' />
                {previewCert.title}
              </DialogTitle>
              <DialogDescription>
                Issued to {previewCert.user?.name} ({previewCert.user?.email}) •
                ID: {previewCert.certificate_no}
              </DialogDescription>
            </DialogHeader>

            <div className='flex items-center justify-center overflow-hidden rounded-lg bg-black/10 py-2'>
              {previewCert.file_url && previewCert.file_url.match(/\.pdf$/i) ? (
                <iframe
                  src={getStorageUrl(previewCert.file_url)}
                  className='h-[480px] w-full rounded border'
                  title={previewCert.title}
                />
              ) : (
                <img
                  src={
                    previewCert.file_url
                      ? getStorageUrl(previewCert.file_url)
                      : '/assets/images/certificate.png'
                  }
                  alt={previewCert.title}
                  className='max-h-[480px] max-w-full rounded object-contain shadow'
                />
              )}
            </div>

            <DialogFooter className='flex items-center justify-between sm:justify-between'>
              <p className='text-xs text-muted-foreground'>
                Date: {previewCert.issue_date} • {previewCert.file_size || ''}
              </p>
              <div className='flex gap-2'>
                {previewCert.file_url && (
                  <Button
                    size='sm'
                    asChild
                    className='bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  >
                    <a
                      href={getStorageUrl(previewCert.file_url)}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <Download className='mr-1.5 h-3.5 w-3.5' /> Open File
                    </a>
                  </Button>
                )}
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPreviewCert(null)}
                >
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
export default Certificates
