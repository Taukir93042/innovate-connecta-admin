import { useState, useEffect } from 'react'
import {
  Search as SearchIcon,
  Eye,
  Users as UsersIcon,
  Loader2,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Clock,
  FileText,
  ExternalLink,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
                  <TableHead className='w-[70px]'>S.No</TableHead>
                  <TableHead className='min-w-[170px]'>Name</TableHead>
                  <TableHead className='min-w-[200px]'>Email</TableHead>
                  <TableHead className='w-[150px]'>Phone No</TableHead>
                  <TableHead className='w-[130px]'>Resume</TableHead>
                  <TableHead className='w-[130px]'>Status</TableHead>
                  <TableHead className='w-[130px]'>Registered</TableHead>
                  <TableHead className='w-[80px] text-end'>Actions</TableHead>
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

                      {/* Name */}
                      <TableCell className='py-3'>
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-9 w-9 border shrink-0'>
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
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-medium'
                                : 'text-muted-foreground text-[11px]'
                            }
                          >
                            {item.is_active ? 'Active' : 'Blocked'}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Registered Date */}
                      <TableCell className='py-3 text-xs'>
                        <span className='flex items-center gap-1.5 text-foreground/80 font-medium'>
                          <Calendar className='size-3.5 text-primary/80 shrink-0' />
                          {formatDate(item.created_at)}
                        </span>
                      </TableCell>

                      {/* Actions: VIEW */}
                      <TableCell className='py-3 text-end'>
                        <div className='flex items-center justify-end'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='size-8 text-primary hover:text-primary hover:bg-primary/10'
                            onClick={() => setViewItem(item)}
                            title='View user profile'
                          >
                            <Eye className='size-4' />
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
        <DialogContent className='sm:max-w-4xl max-h-[90vh] flex flex-col p-4 sm:p-6'>
          {previewPdfUrl && (
            <>
              <DialogHeader className='flex flex-row items-center justify-between gap-2 pb-3 border-b'>
                <div className='min-w-0 flex-1'>
                  <DialogTitle className='flex items-center gap-2 text-lg font-semibold truncate'>
                    <FileText className='h-5 w-5 text-primary shrink-0' />
                    <span className='truncate'>{previewPdfUrl.title}</span>
                  </DialogTitle>
                  <DialogDescription className='text-xs text-muted-foreground truncate mt-0.5'>
                    Candidate: {previewPdfUrl.userName}
                  </DialogDescription>
                </div>

                <div className='flex items-center gap-2 shrink-0 pr-6'>
                  <a
                    href={previewPdfUrl.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline px-3 py-1.5 rounded-md bg-muted/50 border hover:bg-muted transition-colors'
                    title='Open in new browser tab'
                  >
                    <span>Open Full Tab</span>
                    <ExternalLink className='h-3.5 w-3.5' />
                  </a>
                </div>
              </DialogHeader>

              {/* PDF Viewer Container */}
              <div className='flex-1 min-h-[480px] h-[65vh] w-full rounded-md border bg-muted/30 overflow-hidden my-2'>
                <iframe
                  src={`${previewPdfUrl.url}#toolbar=1`}
                  className='w-full h-full border-0'
                  title={previewPdfUrl.title}
                />
              </div>

              <DialogFooter className='pt-2 border-t flex justify-end gap-2'>
                <Button variant='outline' onClick={() => setPreviewPdfUrl(null)}>
                  Close Preview
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
