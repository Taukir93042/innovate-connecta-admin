import { useState, useEffect } from 'react'
import {
  Search as SearchIcon,
  Eye,
  Users as UsersIcon,
  Loader2,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  ShieldAlert,
  GraduationCap,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { adminUserService, type UserItem } from '@/services/admin-users'
import { getApiErrorMessage } from '@/lib/api-client'
import { getDisplayNameInitials } from '@/lib/utils'
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
                  <TableHead className='w-[80px]'>S.No</TableHead>
                  <TableHead className='min-w-[180px]'>Name</TableHead>
                  <TableHead className='min-w-[220px]'>Email</TableHead>
                  <TableHead className='w-[160px]'>Phone No</TableHead>
                  <TableHead className='w-[140px]'>Status</TableHead>
                  <TableHead className='w-[140px]'>Registered</TableHead>
                  <TableHead className='w-[90px] text-end'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((item, index) => (
                  <TableRow key={item.id} className='hover:bg-muted/40'>
                    {/* S.No */}
                    <TableCell className='py-3 font-mono text-xs text-muted-foreground'>
                      {index + 1}
                    </TableCell>

                    {/* Name */}
                    <TableCell className='py-3'>
                      <div className='flex items-center gap-3'>
                        <Avatar className='h-9 w-9 border shrink-0'>
                          <AvatarFallback className='bg-primary/10 text-primary font-semibold text-xs'>
                            {getDisplayNameInitials(item.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className='font-semibold text-sm truncate' title={item.name}>
                          {item.name}
                        </div>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className='py-3'>
                      <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
                        <Mail className='size-3.5 text-muted-foreground/70 shrink-0' />
                        <span className='truncate font-mono text-xs'>{item.email}</span>
                      </div>
                    </TableCell>

                    {/* Phone No */}
                    <TableCell className='py-3'>
                      {item.phone ? (
                        <div className='flex items-center gap-1.5 text-xs text-foreground/90 font-mono'>
                          <Phone className='size-3.5 text-muted-foreground/70 shrink-0' />
                          <span>{item.phone}</span>
                        </div>
                      ) : (
                        <span className='text-xs text-muted-foreground italic'>—</span>
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
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px]'
                              : 'text-muted-foreground text-[11px]'
                          }
                        >
                          {item.is_active ? 'Active' : 'Blocked'}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Registered Date */}
                    <TableCell className='py-3 text-xs text-muted-foreground'>
                      <span className='flex items-center gap-1'>
                        <Calendar className='size-3.5 text-muted-foreground/70 shrink-0' />
                        {formatDate(item.created_at)}
                      </span>
                    </TableCell>

                    {/* Actions: ONLY VIEW */}
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
                ))}
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
                      {viewItem.email_verified_at ? (
                        <Badge variant='outline' className='text-[10px] text-emerald-600 border-emerald-500/30 gap-1'>
                          <CheckCircle2 className='h-3 w-3' /> Verified
                        </Badge>
                      ) : (
                        <Badge variant='outline' className='text-[10px] text-amber-600 border-amber-500/30 gap-1'>
                          <ShieldAlert className='h-3 w-3' /> Unverified
                        </Badge>
                      )}
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
    </>
  )
}
