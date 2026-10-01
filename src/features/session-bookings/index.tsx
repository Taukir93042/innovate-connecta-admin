import { useState, useEffect } from 'react'
import {
  Search as SearchIcon,
  Trash2,
  Eye,
  Mail,
  Phone,
  Loader2,
  Calendar,
  Inbox,
  GraduationCap,
  Building2,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  adminSessionBookingService,
  type SessionBookingItem,
} from '@/services/admin-session-bookings'
import { getApiErrorMessage } from '@/lib/api-client'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/confirm-dialog'

export function SessionBookings() {
  const [bookings, setBookings] = useState<SessionBookingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Detail modal state
  const [viewItem, setViewItem] = useState<SessionBookingItem | null>(null)

  // Single delete modal state
  const [deleteItem, setDeleteItem] = useState<SessionBookingItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Bulk delete modal state
  const [isBulkDeletingOpen, setIsBulkDeletingOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // Status updating state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  async function fetchBookings() {
    try {
      setIsLoading(true)
      const res = await adminSessionBookingService.getBookings({
        page: currentPage,
        per_page: perPage,
        search: searchQuery.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })

      if (res.status && Array.isArray(res.data)) {
        setBookings(res.data)
        if (res.pagination) {
          setTotalPages(res.pagination.last_page)
          setTotalCount(res.pagination.total)
        } else {
          setTotalPages(1)
          setTotalCount(res.data.length)
        }
      }
    } catch (err: any) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [currentPage, perPage, statusFilter])

  // Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchBookings()
  }

  // Handle status update
  const handleStatusChange = async (
    bookingId: number,
    newStatus: 'pending' | 'confirmed' | 'cancelled'
  ) => {
    try {
      setIsUpdatingStatus(true)
      const res = await adminSessionBookingService.updateBookingStatus(
        bookingId,
        newStatus
      )
      if (res.status) {
        toast.success(`Booking status updated to ${newStatus}`)
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
        )
        if (viewItem && viewItem.id === bookingId) {
          setViewItem({ ...viewItem, status: newStatus })
        }
      }
    } catch (err: any) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Handle single delete
  const handleDeleteConfirm = async () => {
    if (!deleteItem) return
    try {
      setIsDeleting(true)
      const res = await adminSessionBookingService.deleteBooking(deleteItem.id)
      if (res.status) {
        toast.success(res.message || 'Booking deleted successfully')
        setDeleteItem(null)
        if (viewItem?.id === deleteItem.id) {
          setViewItem(null)
        }
        fetchBookings()
      }
    } catch (err: any) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle bulk delete
  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.length === 0) return
    try {
      setIsBulkDeleting(true)
      const res = await adminSessionBookingService.bulkDeleteBookings(selectedIds)
      if (res.status) {
        toast.success(res.message || 'Selected bookings deleted successfully')
        setSelectedIds([])
        setIsBulkDeletingOpen(false)
        fetchBookings()
      }
    } catch (err: any) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsBulkDeleting(false)
    }
  }

  // Select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(bookings.map((b) => b.id))
    } else {
      setSelectedIds([])
    }
  }

  // Select single checkbox
  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const isAllSelected =
    bookings.length > 0 && selectedIds.length === bookings.length

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return (
          <Badge className='bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 font-medium'>
            <CheckCircle2 className='size-3' /> Confirmed
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className='bg-destructive/15 text-destructive border-destructive/30 gap-1 font-medium'>
            <XCircle className='size-3' /> Cancelled
          </Badge>
        )
      default:
        return (
          <Badge className='bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 font-medium'>
            <Clock className='size-3' /> Pending
          </Badge>
        )
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
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
        {/* Top title and counts */}
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
              <CalendarCheck className='size-6 text-primary' />
              Seat Bookings &amp; Registrations
            </h1>
            <p className='text-sm text-muted-foreground'>
              Manage student reservations and seat bookings submitted for live &amp; upcoming sessions.
            </p>
          </div>
        </div>

        {/* Filter bar: Search, Status filter & Bulk actions */}
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <form
            onSubmit={handleSearchSubmit}
            className='flex items-center gap-2 flex-1 max-w-md'
          >
            <div className='relative flex-1'>
              <SearchIcon className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
              <Input
                placeholder='Search student name, email, phone, college...'
                className='pl-8'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type='submit' variant='secondary' size='sm'>
              Search
            </Button>
          </form>

          <div className='flex items-center gap-2 flex-wrap'>
            <div className='flex items-center gap-1.5'>
              <Filter className='size-4 text-muted-foreground' />
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className='w-[140px] h-9 text-xs'>
                  <SelectValue placeholder='Filter Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='confirmed'>Confirmed</SelectItem>
                  <SelectItem value='cancelled'>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedIds.length > 0 && (
              <Button
                variant='destructive'
                size='sm'
                onClick={() => setIsBulkDeletingOpen(true)}
                className='h-9 gap-1.5'
              >
                <Trash2 className='size-3.5' /> Delete Selected ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>

        {/* Table content */}
        {isLoading ? (
          <div className='flex flex-col items-center justify-center min-h-[300px] gap-2 rounded-lg border bg-card'>
            <Loader2 className='size-8 animate-spin text-primary' />
            <span className='text-sm text-muted-foreground'>Loading seat bookings...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className='flex flex-col items-center justify-center min-h-[300px] gap-3 rounded-lg border border-dashed p-8 text-center bg-card'>
            <div className='flex size-12 items-center justify-center rounded-full bg-muted'>
              <Inbox className='size-6 text-muted-foreground' />
            </div>
            <div className='space-y-1'>
              <h3 className='font-semibold text-lg'>No Seat Bookings Found</h3>
              <p className='text-sm text-muted-foreground max-w-sm'>
                {searchQuery || statusFilter !== 'all'
                  ? 'No reservations matched your filter criteria. Try clearing search.'
                  : 'New student registrations submitted through session reserve modal will appear here.'}
              </p>
            </div>
          </div>
        ) : (
          <div className='rounded-lg border bg-card shadow-sm overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[40px] px-3'>
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label='Select all'
                    />
                  </TableHead>
                  <TableHead>Student Details</TableHead>
                  <TableHead>Session Name</TableHead>
                  <TableHead>Academic Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Booked At</TableHead>
                  <TableHead className='text-end'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((item) => {
                  const isChecked = selectedIds.includes(item.id)
                  return (
                    <TableRow key={item.id} data-state={isChecked ? 'selected' : undefined}>
                      <TableCell className='px-3'>
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(val) => handleSelectOne(item.id, !!val)}
                          aria-label={`Select ${item.name}`}
                        />
                      </TableCell>

                      {/* Student Details */}
                      <TableCell className='py-3'>
                        <div className='flex flex-col gap-0.5'>
                          <span className='font-semibold text-sm text-foreground'>
                            {item.name}
                          </span>
                          <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                            <Mail className='size-3 text-muted-foreground/70 shrink-0' />
                            <a href={`mailto:${item.email}`} className='hover:underline'>
                              {item.email}
                            </a>
                          </span>
                          <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                            <Phone className='size-3 text-muted-foreground/70 shrink-0' />
                            <a href={`tel:${item.phone}`} className='hover:underline'>
                              {item.phone}
                            </a>
                          </span>
                        </div>
                      </TableCell>

                      {/* Session Name */}
                      <TableCell className='py-3'>
                        <div className='flex flex-col gap-0.5 max-w-[200px]'>
                          <span className='font-medium text-xs text-primary truncate' title={item.session_title || item.session?.title || 'Session'}>
                            {item.session_title || item.session?.title || 'Live Session'}
                          </span>
                          {item.session?.slug && (
                            <span className='text-[11px] text-muted-foreground truncate'>
                              /sessions/{item.session.slug}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Academic Info */}
                      <TableCell className='py-3'>
                        <div className='flex flex-col gap-0.5 max-w-[220px] text-xs text-foreground/90'>
                          <span className='flex items-center gap-1 truncate' title={item.institute}>
                            <Building2 className='size-3 text-muted-foreground/70 shrink-0' />
                            <span className='truncate'>{item.institute}</span>
                          </span>
                          <span className='flex items-center gap-1 truncate text-muted-foreground' title={item.course}>
                            <BookOpen className='size-3 text-muted-foreground/70 shrink-0' />
                            <span className='truncate'>{item.course}</span>
                          </span>
                          <span className='flex items-center gap-1 text-[11px] text-muted-foreground'>
                            <GraduationCap className='size-3 text-muted-foreground/70 shrink-0' />
                            <span>{item.semester}</span>
                          </span>
                        </div>
                      </TableCell>

                      {/* Status with Quick Change */}
                      <TableCell className='py-3'>
                        <div className='flex items-center gap-2'>
                          <Select
                            value={item.status || 'pending'}
                            onValueChange={(val: any) => handleStatusChange(item.id, val)}
                            disabled={isUpdatingStatus}
                          >
                            <SelectTrigger className='w-[125px] h-8 text-xs border-0 bg-transparent p-0 shadow-none'>
                              {getStatusBadge(item.status)}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='pending'>Pending</SelectItem>
                              <SelectItem value='confirmed'>Confirmed</SelectItem>
                              <SelectItem value='cancelled'>Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className='py-3 text-xs text-muted-foreground'>
                        <span className='flex items-center gap-1 whitespace-nowrap'>
                          <Calendar className='size-3 text-muted-foreground/70 shrink-0' />
                          {formatDate(item.created_at)}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className='py-3 text-end'>
                        <div className='flex items-center justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='size-8'
                            onClick={() => setViewItem(item)}
                            title='View full details'
                          >
                            <Eye className='size-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='size-8 text-destructive hover:text-destructive hover:bg-destructive/10'
                            onClick={() => setDeleteItem(item)}
                            title='Delete booking'
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
            <div className='flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-muted/20 text-xs text-muted-foreground'>
              <div>
                Showing <strong>{bookings.length}</strong> of <strong>{totalCount}</strong> reservations
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || isLoading}
                  className='h-8 gap-1'
                >
                  <ChevronLeft className='size-3.5' /> Previous
                </Button>
                <span>
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || isLoading}
                  className='h-8 gap-1'
                >
                  Next <ChevronRight className='size-3.5' />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Main>

      {/* View Detail Modal */}
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className='sm:max-w-lg'>
          {viewItem && (
            <>
              <DialogHeader>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <DialogTitle className='text-lg'>Reservation Details</DialogTitle>
                    {getStatusBadge(viewItem.status)}
                  </div>
                </div>
                <DialogDescription>
                  Registered on {formatDate(viewItem.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className='grid gap-4 py-3'>
                {/* Session title banner */}
                <div className='rounded-lg border bg-primary/5 p-3'>
                  <span className='text-[11px] font-medium text-primary uppercase tracking-wider block mb-1'>
                    Target Session
                  </span>
                  <p className='font-bold text-sm text-foreground'>
                    {viewItem.session_title || viewItem.session?.title || 'Live Session'}
                  </p>
                </div>

                <div className='grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3'>
                  <div>
                    <span className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1'>
                      Full Name
                    </span>
                    <p className='font-semibold text-sm'>{viewItem.name}</p>
                  </div>
                  <div>
                    <span className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1'>
                      Phone / WhatsApp
                    </span>
                    <p className='font-mono text-xs'>{viewItem.phone}</p>
                  </div>
                  <div className='col-span-2'>
                    <span className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1'>
                      Email Address
                    </span>
                    <p className='font-mono text-xs'>{viewItem.email}</p>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3'>
                  <div className='col-span-2'>
                    <span className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1'>
                      College / Institute
                    </span>
                    <p className='text-xs font-medium'>{viewItem.institute}</p>
                  </div>
                  <div>
                    <span className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1'>
                      Course / Field
                    </span>
                    <p className='text-xs font-medium'>{viewItem.course}</p>
                  </div>
                  <div>
                    <span className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1'>
                      Semester
                    </span>
                    <p className='text-xs font-medium'>{viewItem.semester}</p>
                  </div>
                </div>

                {/* Change Status in Modal */}
                <div className='flex items-center justify-between rounded-lg border p-3 bg-card'>
                  <span className='text-xs font-medium text-muted-foreground'>
                    Update Status:
                  </span>
                  <div className='flex items-center gap-2'>
                    <Button
                      size='sm'
                      variant={viewItem.status === 'confirmed' ? 'default' : 'outline'}
                      className='h-8 text-xs'
                      onClick={() => handleStatusChange(viewItem.id, 'confirmed')}
                    >
                      Mark Confirmed
                    </Button>
                    <Button
                      size='sm'
                      variant={viewItem.status === 'cancelled' ? 'destructive' : 'outline'}
                      className='h-8 text-xs'
                      onClick={() => handleStatusChange(viewItem.id, 'cancelled')}
                    >
                      Mark Cancelled
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter className='flex items-center justify-between sm:justify-between'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    const itemToDelete = viewItem
                    setViewItem(null)
                    setDeleteItem(itemToDelete)
                  }}
                  className='text-destructive hover:bg-destructive/10'
                >
                  <Trash2 className='mr-1.5 size-3.5' /> Delete
                </Button>
                <Button type='button' onClick={() => setViewItem(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title='Delete Seat Booking'
        desc={`Are you sure you want to delete reservation from "${deleteItem?.name}"? This action cannot be undone.`}
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
        title='Delete Selected Bookings'
        desc={`Are you sure you want to permanently delete the ${selectedIds.length} selected seat bookings? This action cannot be undone.`}
        confirmText={`Delete ${selectedIds.length} Bookings`}
        destructive
        isLoading={isBulkDeleting}
        handleConfirm={handleBulkDeleteConfirm}
        className='sm:max-w-sm'
      />
    </>
  )
}
