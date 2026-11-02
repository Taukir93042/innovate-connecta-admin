import { useState, useEffect } from 'react'
import {
  Search as SearchIcon,
  Eye,
  EyeOff,
  Users as UsersIcon,
  Loader2,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Clock,
  FileText,
  ExternalLink,
  Download,
  Trash2,
  Key,
  Copy,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { adminUserService, type UserItem } from '@/services/admin-users'
import { getApiErrorMessage } from '@/lib/api-client'
import { getDisplayNameInitials, getStorageUrl } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ConfirmDialog } from '@/components/confirm-dialog'
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

export function Users() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // View user modal state
  const [viewItem, setViewItem] = useState<UserItem | null>(null)

  // Single delete modal state
  const [deleteItem, setDeleteItem] = useState<UserItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Password visibility & copied state
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({})
  const [copiedId, setCopiedId] = useState<number | null>(null)

  // PDF Preview modal state
  const [previewPdfUrl, setPreviewPdfUrl] = useState<{
    url: string
    title: string
    userName: string
  } | null>(null)

  async function fetchUsers() {
    try {
      setIsLoading(true)
      const res = await adminUserService.getUsers({
        search: searchQuery || undefined,
        all: true,
      })
      if (res.status && res.data && Array.isArray(res.data.users)) {
        setUsers(res.data.users)
      } else if (res.status && Array.isArray(res.data)) {
        setUsers(res.data)
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers()
  }

  const handleToggleStatus = async (item: UserItem) => {
    try {
      await adminUserService.toggleStatus(item.id)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === item.id ? { ...u, is_active: !u.is_active } : u
        )
      )
      if (viewItem && viewItem.id === item.id) {
        setViewItem((prev) => (prev ? { ...prev, is_active: !prev.is_active } : null))
      }
      toast.success(
        `User ${!item.is_active ? 'activated' : 'deactivated'} successfully.`
      )
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return
    try {
      setIsDeleting(true)
      await adminUserService.deleteUser(deleteItem.id)
      setUsers((prev) => prev.filter((u) => u.id !== deleteItem.id))
      toast.success(`User "${deleteItem.name}" deleted successfully.`)
      setDeleteItem(null)
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to delete user.'))
    } finally {
      setIsDeleting(false)
    }
  }

  const togglePassword = (id: number) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleCopyPassword = (id: number, pw: string) => {
    navigator.clipboard.writeText(pw)
    setCopiedId(id)
    toast.success('Password copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getUserAvatarUrl = (user: UserItem) => {
    if (user.avatar_url) return getStorageUrl(user.avatar_url)
    if (user.avatar) return getStorageUrl(user.avatar)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=4f46e5&color=fff&bold=true`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '—'
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
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
              Registered Users
            </h1>
            <p className='text-sm text-muted-foreground'>
              View and manage candidate and learner accounts registered on InnovateConnect.
            </p>
          </div>
          <Badge variant='outline' className='px-3 py-1 text-sm font-medium'>
            Total: {users.length} {users.length === 1 ? 'User' : 'Users'}
          </Badge>
        </div>

        {/* Search Bar */}
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <form
            onSubmit={handleSearchSubmit}
            className='flex items-center gap-2 w-full sm:w-80'
          >
            <div className='relative flex-1'>
              <SearchIcon className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search by name, email, or phone...'
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
            <p>Loading registered users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className='flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center'>
            <UsersIcon className='h-12 w-12 text-muted-foreground/60 mb-2' />
            <h3 className='text-lg font-semibold'>No registered users found</h3>
            <p className='text-sm text-muted-foreground max-w-sm mb-4'>
              {searchQuery
                ? 'No users match your search criteria. Try a different search.'
                : 'Registered user accounts will appear here once candidates sign up.'}
            </p>
          </div>
        ) : (
          <div className='rounded-lg border bg-card shadow-xs overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/50'>
                  <TableHead className='w-[60px]'>S.No</TableHead>
                  <TableHead className='min-w-[170px]'>Name</TableHead>
                  <TableHead className='min-w-[190px]'>Email</TableHead>
                  <TableHead className='w-[140px]'>Phone No</TableHead>
                  <TableHead className='w-[140px]'>Password</TableHead>
                  <TableHead className='w-[120px]'>Resume</TableHead>
                  <TableHead className='w-[90px]'>Status</TableHead>
                  <TableHead className='w-[120px]'>Registered</TableHead>
                  <TableHead className='w-[90px] text-end'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((item, index) => {
                  const effectiveResumeUrl =
                    item.resume_url || (item.resume_path ? getStorageUrl(item.resume_path) : null)

                  return (
                    <TableRow key={item.id} className='hover:bg-muted/40'>
                      {/* S.No */}
                      <TableCell className='py-3 font-mono text-xs text-muted-foreground'>
                        {index + 1}
                      </TableCell>

                      {/* Name & Avatar */}
                      <TableCell className='py-3'>
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-9 w-9 border shrink-0'>
                            <AvatarImage src={getUserAvatarUrl(item)} alt={item.name} />
                            <AvatarFallback className='bg-primary/15 text-primary font-semibold text-xs'>
                              {getDisplayNameInitials(item.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className='font-semibold text-sm text-foreground truncate' title={item.name}>
                            {item.name}
                          </div>
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell className='py-3'>
                        <div className='flex items-center gap-1.5 text-sm'>
                          <Mail className='size-3.5 text-primary shrink-0' />
                          <span className='truncate font-mono text-xs text-foreground font-medium'>{item.email}</span>
                        </div>
                      </TableCell>

                      {/* Phone No */}
                      <TableCell className='py-3'>
                        {item.phone ? (
                          <div className='flex items-center gap-1.5 text-xs text-foreground font-mono font-medium'>
                            <Phone className='size-3.5 text-primary/80 shrink-0' />
                            <span>{item.phone}</span>
                          </div>
                        ) : (
                          <span className='text-xs text-muted-foreground italic'>—</span>
                        )}
                      </TableCell>

                      {/* Password Column */}
                      <TableCell className='py-3'>
                        {item.plain_password ? (
                          <div className='flex items-center gap-1'>
                            <span className='font-mono text-xs bg-muted/60 px-2 py-0.5 rounded border border-border/50 select-all font-medium text-foreground max-w-[90px] truncate'>
                              {showPasswords[item.id] ? item.plain_password : '••••••••'}
                            </span>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='size-6 text-muted-foreground hover:text-foreground shrink-0'
                              onClick={() => togglePassword(item.id)}
                              title={showPasswords[item.id] ? 'Hide password' : 'Show password'}
                            >
                              {showPasswords[item.id] ? (
                                <EyeOff className='size-3.5' />
                              ) : (
                                <Eye className='size-3.5' />
                              )}
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='size-6 text-muted-foreground hover:text-foreground shrink-0'
                              onClick={() => handleCopyPassword(item.id, item.plain_password!)}
                              title='Copy password'
                            >
                              {copiedId === item.id ? (
                                <Check className='size-3.5 text-emerald-500' />
                              ) : (
                                <Copy className='size-3.5' />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <span className='font-mono text-xs text-muted-foreground tracking-wider'>
                            ••••••••
                          </span>
                        )}
                      </TableCell>

                      {/* Resume Column */}
                      <TableCell className='py-3'>
                        {effectiveResumeUrl ? (
                          <Button
                            variant='outline'
                            size='sm'
                            className='h-7 gap-1.5 rounded-full text-xs font-semibold border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-colors px-2.5 shadow-xs'
                            onClick={() =>
                              setPreviewPdfUrl({
                                url: effectiveResumeUrl,
                                title: item.resume_title || `${item.name} - Resume`,
                                userName: item.name,
                              })
                            }
                            title='Preview Candidate Resume'
                          >
                            <FileText className='size-3.5 text-primary' />
                            <span>Preview</span>
                          </Button>
                        ) : (
                          <Badge
                            variant='outline'
                            className='text-[10px] text-muted-foreground border-border/50 bg-muted/20 font-normal px-2 py-0.5'
                          >
                            No Resume
                          </Badge>
                        )}
                      </TableCell>

                      {/* Status & Switch (Active badge removed) */}
                      <TableCell className='py-3'>
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggleStatus(item)}
                          aria-label='Toggle status'
                        />
                      </TableCell>

                      {/* Registered Date */}
                      <TableCell className='py-3 text-xs'>
                        <span className='flex items-center gap-1.5 text-foreground/80 font-medium'>
                          <Calendar className='size-3.5 text-primary/80 shrink-0' />
                          {formatDate(item.created_at)}
                        </span>
                      </TableCell>

                      {/* Actions: VIEW & DELETE */}
                      <TableCell className='py-3 text-end'>
                        <div className='flex items-center justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='size-8 text-primary hover:text-primary hover:bg-primary/10'
                            onClick={() => setViewItem(item)}
                            title='View user profile'
                          >
                            <Eye className='size-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                            onClick={() => setDeleteItem(item)}
                            title='Delete user'
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
          </div>
        )}
      </Main>

      {/* Delete Single Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title='Delete User Account?'
        desc={`Are you sure you want to permanently delete user "${deleteItem?.name}" (${deleteItem?.email})? This action cannot be undone.`}
        confirmText='Delete'
        destructive
        isLoading={isDeleting}
        handleConfirm={handleDeleteConfirm}
        className='sm:max-w-md'
      />

      {/* View User Details Dialog */}
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className='sm:max-w-md'>
          {viewItem && (
            <>
              <DialogHeader>
                <DialogTitle className='flex items-center gap-2 text-xl'>
                  <UsersIcon className='h-5 w-5 text-primary' />
                  User Profile Details
                </DialogTitle>
                <DialogDescription>
                  Detailed registered account information for candidate.
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4 py-3'>
                {/* User Header Avatar & Name */}
                <div className='flex items-center gap-3.5 p-3 rounded-lg border bg-muted/20'>
                  <Avatar className='h-12 w-12 border shrink-0'>
                    <AvatarImage src={getUserAvatarUrl(viewItem)} alt={viewItem.name} />
                    <AvatarFallback className='bg-primary/15 text-primary font-bold text-sm'>
                      {getDisplayNameInitials(viewItem.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1'>
                    <h3 className='font-semibold text-base leading-tight truncate'>
                      {viewItem.name}
                    </h3>
                    <div className='flex items-center gap-2 mt-1'>
                      <Badge
                        variant={viewItem.is_active ? 'default' : 'secondary'}
                        className={
                          viewItem.is_active
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px]'
                            : 'text-muted-foreground text-[11px]'
                        }
                      >
                        {viewItem.is_active ? 'Active Account' : 'Blocked Account'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Info Fields Grid */}
                <div className='grid grid-cols-1 gap-2.5 text-sm'>
                  {/* Email */}
                  <div className='flex items-start gap-2.5 p-2.5 rounded-md border bg-muted/10'>
                    <Mail className='h-4 w-4 text-muted-foreground mt-0.5 shrink-0' />
                    <div className='min-w-0 flex-1'>
                      <div className='text-xs font-medium text-muted-foreground'>Email Address</div>
                      <div className='font-mono text-xs font-medium truncate mt-0.5'>{viewItem.email}</div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className='flex items-start gap-2.5 p-2.5 rounded-md border bg-muted/10'>
                    <Phone className='h-4 w-4 text-muted-foreground mt-0.5 shrink-0' />
                    <div className='min-w-0 flex-1'>
                      <div className='text-xs font-medium text-muted-foreground'>Phone Number</div>
                      <div className='font-mono text-xs font-medium truncate mt-0.5'>
                        {viewItem.phone || 'Not provided'}
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div className='flex items-start gap-2.5 p-2.5 rounded-md border bg-muted/10'>
                    <Key className='h-4 w-4 text-muted-foreground mt-0.5 shrink-0' />
                    <div className='min-w-0 flex-1'>
                      <div className='text-xs font-medium text-muted-foreground'>Account Password</div>
                      <div className='font-mono text-xs font-semibold text-foreground truncate mt-0.5'>
                        {viewItem.plain_password || 'Encrypted (Stored securely)'}
                      </div>
                    </div>
                  </div>

                  {/* Field / Specialization */}
                  <div className='flex items-start gap-2.5 p-2.5 rounded-md border bg-muted/10'>
                    <GraduationCap className='h-4 w-4 text-muted-foreground mt-0.5 shrink-0' />
                    <div className='min-w-0 flex-1'>
                      <div className='text-xs font-medium text-muted-foreground'>Domain / Specialization</div>
                      <div className='text-xs font-medium truncate mt-0.5'>
                        {viewItem.field || 'General / Unspecified'}
                      </div>
                    </div>
                  </div>

                  {/* Registration Timestamp */}
                  <div className='flex items-start gap-2.5 p-2.5 rounded-md border bg-muted/10'>
                    <Clock className='h-4 w-4 text-muted-foreground mt-0.5 shrink-0' />
                    <div className='min-w-0 flex-1'>
                      <div className='text-xs font-medium text-muted-foreground'>Account Created</div>
                      <div className='text-xs font-medium truncate mt-0.5'>
                        {formatDateTime(viewItem.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Candidate Resume / CV (if uploaded) */}
                  {viewItem.resume_path || viewItem.resume_url ? (
                    <div className='flex items-center justify-between gap-2.5 p-3 rounded-lg border border-primary/25 bg-primary/5'>
                      <div className='flex items-center gap-2.5 min-w-0 flex-1'>
                        <div className='p-2 rounded-md bg-primary/15 text-primary shrink-0'>
                          <FileText className='h-4 w-4' />
                        </div>
                        <div className='min-w-0 flex-1'>
                          <div className='text-xs font-semibold text-foreground truncate'>
                            {viewItem.resume_title || 'Candidate Resume (PDF)'}
                          </div>
                          <div className='text-[11px] text-muted-foreground'>
                            {viewItem.resume_size || 'PDF Document'}
                          </div>
                        </div>
                      </div>
                      <Button
                        size='sm'
                        className='h-8 gap-1.5 text-xs'
                        onClick={() =>
                          setPreviewPdfUrl({
                            url:
                              viewItem.resume_url ||
                              (viewItem.resume_path ? getStorageUrl(viewItem.resume_path) : '#'),
                            title: viewItem.resume_title || `${viewItem.name} - Resume`,
                            userName: viewItem.name,
                          })
                        }
                      >
                        <span>Preview</span>
                        <Eye className='size-3.5' />
                      </Button>
                    </div>
                  ) : (
                    <div className='flex items-center gap-2.5 p-2.5 rounded-md border bg-muted/10 text-xs text-muted-foreground'>
                      <FileText className='h-4 w-4 text-muted-foreground/60 shrink-0' />
                      <span>No resume uploaded yet</span>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className='pt-2 border-t'>
                <Button variant='outline' onClick={() => setViewItem(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dedicated PDF Preview Modal */}
      <Dialog open={!!previewPdfUrl} onOpenChange={(open) => !open && setPreviewPdfUrl(null)}>
        <DialogContent className='sm:max-w-5xl w-[95vw] max-h-[94vh] flex flex-col p-4 sm:p-6 bg-card'>
          {previewPdfUrl && (
            <>
              <DialogHeader className='flex flex-row items-center justify-between gap-3 pb-3 border-b'>
                <div className='min-w-0 flex-1'>
                  <DialogTitle className='flex items-center gap-2 text-lg font-semibold truncate'>
                    <FileText className='h-5 w-5 text-primary shrink-0' />
                    <span className='truncate'>{previewPdfUrl.title}</span>
                  </DialogTitle>
                  <DialogDescription className='text-xs text-muted-foreground truncate mt-0.5'>
                    Candidate: <strong className='text-foreground'>{previewPdfUrl.userName}</strong>
                  </DialogDescription>
                </div>

                <div className='flex items-center gap-2 shrink-0 pr-6'>
                  <a
                    href={previewPdfUrl.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md border border-primary/30 shadow-xs transition-colors'
                    title='Open in new browser tab'
                  >
                    <span>Open Full Tab</span>
                    <ExternalLink className='h-3.5 w-3.5' />
                  </a>
                </div>
              </DialogHeader>

              {/* Full-Height PDF Viewer Container */}
              <div className='relative w-full h-[72vh] min-h-[520px] rounded-lg border bg-white overflow-hidden shadow-inner my-2'>
                <iframe
                  src={`${previewPdfUrl.url}#view=FitH&toolbar=1`}
                  className='absolute inset-0 w-full h-full border-0 bg-white'
                  style={{ width: '100%', height: '100%', display: 'block' }}
                  title={previewPdfUrl.title}
                />
              </div>

              <DialogFooter className='pt-2 border-t flex flex-row items-center justify-between gap-2 w-full'>
                <div className='text-xs text-muted-foreground truncate hidden sm:block'>
                  Verified Candidate PDF Resume
                </div>
                <div className='flex items-center gap-2 ml-auto'>
                  <a
                    href={previewPdfUrl.url}
                    download={`${previewPdfUrl.userName}_resume.pdf`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:bg-muted px-3 py-1.5 rounded-md border shadow-xs transition-colors'
                  >
                    <Download className='h-3.5 w-3.5' />
                    <span>Download</span>
                  </a>
                  <Button variant='default' size='sm' onClick={() => setPreviewPdfUrl(null)}>
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
