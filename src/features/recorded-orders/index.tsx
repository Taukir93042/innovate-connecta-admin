import { useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  Search as SearchIcon,
  Trash2,
  Eye,
  Mail,
  Phone,
  Loader2,
  Inbox,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  ShoppingBag,
  CreditCard,
  Receipt,
  Copy,
  Check,
  Video,
  AlertTriangle,
  FileDown,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  adminRecordedOrderService,
  type RecordedOrderItem,
  type RecordedOrderStats,
} from '@/services/admin-recorded-orders'
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
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/confirm-dialog'

export function RecordedOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<RecordedOrderItem[]>([])
  const [stats, setStats] = useState<RecordedOrderStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Modals
  const [viewItem, setViewItem] = useState<RecordedOrderItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<RecordedOrderItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBulkDeletingOpen, setIsBulkDeletingOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function fetchOrders() {
    try {
      setIsLoading(true)
      const res = await adminRecordedOrderService.getOrders({
        page: currentPage,
        per_page: perPage,
        search: searchQuery.trim() || undefined,
        payment_status: statusFilter !== 'all' ? statusFilter : undefined,
        payment_method: methodFilter !== 'all' ? methodFilter : undefined,
      })

      if (res.status && Array.isArray(res.data)) {
        setOrders(res.data)
        if (res.stats) {
          setStats(res.stats)
        }
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
    fetchOrders()
  }, [currentPage, perPage, statusFilter, methodFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchOrders()
  }

  const handleStatusChange = async (
    orderId: number,
    newStatus: 'completed' | 'pending' | 'refunded' | 'failed'
  ) => {
    try {
      setIsUpdatingStatus(true)
      const res = await adminRecordedOrderService.updateOrderStatus(orderId, newStatus)
      if (res.status) {
        toast.success(`Payment status updated to ${newStatus}`)
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, payment_status: newStatus } : o))
        )
        if (viewItem && viewItem.id === orderId) {
          setViewItem({ ...viewItem, payment_status: newStatus })
        }
        fetchOrders()
      }
    } catch (err: any) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return
    try {
      setIsDeleting(true)
      const res = await adminRecordedOrderService.deleteOrder(deleteItem.id)
      if (res.status) {
        toast.success(res.message || 'Order deleted successfully')
        setDeleteItem(null)
        if (viewItem?.id === deleteItem.id) {
          setViewItem(null)
        }
        fetchOrders()
      }
    } catch (err: any) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.length === 0) return
    try {
      setIsBulkDeleting(true)
      const res = await adminRecordedOrderService.bulkDeleteOrders(selectedIds)
      if (res.status) {
        toast.success(res.message || 'Selected orders deleted successfully')
        setSelectedIds([])
        setIsBulkDeletingOpen(false)
        fetchOrders()
      }
    } catch (err: any) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(orders.map((o) => o.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const isAllSelected = orders.length > 0 && selectedIds.length === orders.length

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(key)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return (
          <Badge className='bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 font-medium'>
            <CheckCircle2 className='size-3' /> Paid / Completed
          </Badge>
        )
      case 'refunded':
        return (
          <Badge className='bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 gap-1 font-medium'>
            <AlertTriangle className='size-3' /> Refunded
          </Badge>
        )
      case 'failed':
        return (
          <Badge className='bg-destructive/15 text-destructive border-destructive/30 gap-1 font-medium'>
            <XCircle className='size-3' /> Failed
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
    if (!dateStr) return '-'
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

      <Main className='p-6 space-y-6'>
        {/* Title & Actions */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Recorded Course Orders</h1>
            <p className='text-sm text-muted-foreground'>
              Monitor online course purchases, verify payment transactions, and update student access status.
            </p>
          </div>
          {selectedIds.length > 0 && (
            <Button
              variant='destructive'
              size='sm'
              onClick={() => setIsBulkDeletingOpen(true)}
              className='gap-2'
            >
              <Trash2 className='size-4' />
              Delete Selected ({selectedIds.length})
            </Button>
          )}
        </div>

        {/* Metric Cards Banner */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div className='p-5 rounded-xl border bg-card text-card-foreground shadow-sm flex items-center gap-4'>
            <div className='p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
              <IndianRupee className='size-6' />
            </div>
            <div>
              <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>Total Revenue</p>
              <h3 className='text-2xl font-bold mt-0.5'>₹{Number(stats?.total_revenue || 0).toLocaleString('en-IN')}</h3>
            </div>
          </div>

          <div className='p-5 rounded-xl border bg-card text-card-foreground shadow-sm flex items-center gap-4'>
            <div className='p-3 rounded-lg bg-primary/10 text-primary'>
              <ShoppingBag className='size-6' />
            </div>
            <div>
              <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>Total Orders</p>
              <h3 className='text-2xl font-bold mt-0.5'>{stats?.total_orders || totalCount}</h3>
            </div>
          </div>

          <div className='p-5 rounded-xl border bg-card text-card-foreground shadow-sm flex items-center gap-4'>
            <div className='p-3 rounded-lg bg-emerald-500/10 text-emerald-600'>
              <CheckCircle2 className='size-6' />
            </div>
            <div>
              <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>Completed / Paid</p>
              <h3 className='text-2xl font-bold mt-0.5'>{stats?.completed_orders || 0}</h3>
            </div>
          </div>

          <div className='p-5 rounded-xl border bg-card text-card-foreground shadow-sm flex items-center gap-4'>
            <div className='p-3 rounded-lg bg-amber-500/10 text-amber-600'>
              <Clock className='size-6' />
            </div>
            <div>
              <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>Pending / Review</p>
              <h3 className='text-2xl font-bold mt-0.5'>{stats?.pending_orders || 0}</h3>
            </div>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className='flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border shadow-sm'>
          <form onSubmit={handleSearchSubmit} className='flex gap-2 w-full sm:w-auto flex-1 max-w-md'>
            <div className='relative w-full'>
              <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
              <Input
                placeholder='Search by Order ID, Student, Email, Course...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9 h-9'
              />
            </div>
            <Button type='submit' size='sm' variant='secondary' className='h-9 px-4'>
              Search
            </Button>
          </form>

          <div className='flex items-center gap-3 w-full sm:w-auto justify-end'>
            <div className='flex items-center gap-2'>
              <Filter className='size-4 text-muted-foreground' />
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className='w-[150px] h-9 text-xs'>
                  <SelectValue placeholder='All Statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  <SelectItem value='completed'>Completed (Paid)</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='refunded'>Refunded</SelectItem>
                  <SelectItem value='failed'>Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select
              value={methodFilter}
              onValueChange={(val) => {
                setMethodFilter(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className='w-[150px] h-9 text-xs'>
                <SelectValue placeholder='All Methods' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Methods</SelectItem>
                <SelectItem value='UPI / QR Code'>UPI / QR Code</SelectItem>
                <SelectItem value='Credit / Debit Card'>Card</SelectItem>
                <SelectItem value='Net Banking'>Net Banking</SelectItem>
                <SelectItem value='Online Gateway'>Online Gateway</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Data Table */}
        <div className='rounded-xl border bg-card shadow-sm overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow className='bg-muted/50'>
                <TableHead className='w-[40px] px-3'>
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label='Select all'
                  />
                </TableHead>
                <TableHead className='font-semibold'>Order ID & Date</TableHead>
                <TableHead className='font-semibold'>Student Details</TableHead>
                <TableHead className='font-semibold'>Course Session</TableHead>
                <TableHead className='font-semibold'>Amount Paid</TableHead>
                <TableHead className='font-semibold'>Payment Method</TableHead>
                <TableHead className='font-semibold'>Status</TableHead>
                <TableHead className='text-right font-semibold pr-4'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className='h-48 text-center'>
                    <div className='flex flex-col items-center justify-center gap-2 text-muted-foreground'>
                      <Loader2 className='size-6 animate-spin text-primary' />
                      <p className='text-sm'>Loading course orders...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className='h-48 text-center'>
                    <div className='flex flex-col items-center justify-center gap-2 text-muted-foreground'>
                      <Inbox className='size-8 opacity-40' />
                      <p className='text-base font-medium'>No orders found</p>
                      <p className='text-xs'>
                        {searchQuery || statusFilter !== 'all' || methodFilter !== 'all'
                          ? 'Try clearing the search query or status filter.'
                          : 'Orders placed on the website will appear here in real-time.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} className='hover:bg-muted/40 transition-colors'>
                    <TableCell className='px-3'>
                      <Checkbox
                        checked={selectedIds.includes(order.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(order.id, !!checked)
                        }
                        aria-label={`Select order ${order.order_id}`}
                      />
                    </TableCell>

                    <TableCell>
                      <div className='flex flex-col gap-0.5'>
                        <div className='flex items-center gap-1.5'>
                          <button
                            type='button'
                            onClick={() => navigate({ to: '/recorded-orders/$orderId', params: { orderId: String(order.id) } })}
                            className='font-mono font-semibold text-xs text-primary hover:underline text-left'
                            title='View Order Details'
                          >
                            {order.order_id}
                          </button>
                          <button
                            type='button'
                            onClick={() => handleCopy(order.order_id, `order-${order.id}`)}
                            className='text-muted-foreground hover:text-foreground transition-colors'
                            title='Copy Order ID'
                          >
                            {copiedId === `order-${order.id}` ? (
                              <Check className='size-3 text-emerald-500' />
                            ) : (
                              <Copy className='size-3' />
                            )}
                          </button>
                        </div>
                        <span className='text-[11px] text-muted-foreground'>
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='font-medium text-sm text-foreground'>{order.name}</span>
                        <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                          <Mail className='size-3 shrink-0' />
                          <span className='truncate max-w-[170px]'>{order.email}</span>
                        </div>
                        {order.phone && (
                          <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                            <Phone className='size-3 shrink-0' />
                            <span>{order.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className='flex items-center gap-2 max-w-[240px]'>
                        <div className='size-8 rounded bg-primary/10 flex items-center justify-center shrink-0 text-primary'>
                          <Video className='size-4' />
                        </div>
                        <div className='truncate'>
                          <p className='text-xs font-semibold truncate' title={order.session_title}>
                            {order.session_title}
                          </p>
                          {order.recorded_session?.duration_minutes && (
                            <span className='text-[11px] text-muted-foreground'>
                              {order.recorded_session.duration_minutes} mins
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className='flex flex-col'>
                        <span className='font-bold text-sm text-foreground'>
                          ₹{Number(order.amount).toLocaleString('en-IN')}
                        </span>
                        {order.original_price && Number(order.original_price) > Number(order.amount) && (
                          <span className='text-[11px] text-muted-foreground line-through'>
                            ₹{Number(order.original_price).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className='flex flex-col gap-0.5'>
                        <Badge variant='outline' className='w-fit text-[11px] font-normal gap-1'>
                          <CreditCard className='size-3' />
                          {order.payment_method || 'Online'}
                        </Badge>
                        {order.transaction_id && (
                          <span className='text-[10px] font-mono text-muted-foreground truncate max-w-[130px]'>
                            Txn: {order.transaction_id}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Select
                          value={order.payment_status}
                          onValueChange={(val: any) => handleStatusChange(order.id, val)}
                          disabled={isUpdatingStatus}
                        >
                          <SelectTrigger className='h-7 w-[130px] text-xs border-transparent hover:border-border bg-transparent hover:bg-muted/50 p-1'>
                            <SelectValue>{getStatusBadge(order.payment_status)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='completed'>Completed (Paid)</SelectItem>
                            <SelectItem value='pending'>Pending</SelectItem>
                            <SelectItem value='refunded'>Refunded</SelectItem>
                            <SelectItem value='failed'>Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>

                    <TableCell className='text-right pr-4'>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-8'
                          onClick={() => navigate({ to: '/recorded-orders/$orderId', params: { orderId: String(order.id) } })}
                          title='View Order Details Page'
                        >
                          <Eye className='size-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-8 text-destructive hover:text-destructive hover:bg-destructive/10'
                          onClick={() => setDeleteItem(order)}
                          title='Delete Order'
                        >
                          <Trash2 className='size-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className='flex items-center justify-between p-4 border-t text-sm text-muted-foreground'>
              <div>
                Showing page <span className='font-medium text-foreground'>{currentPage}</span> of{' '}
                <span className='font-medium text-foreground'>{totalPages}</span> ({totalCount} total orders)
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className='h-8 gap-1'
                >
                  <ChevronLeft className='size-4' /> Previous
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className='h-8 gap-1'
                >
                  Next <ChevronRight className='size-4' />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* View / Invoice Dialog */}
        <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
          <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0'>
            {viewItem && (
              <>
                <div className='p-6 bg-gradient-to-br from-primary/10 via-card to-card border-b'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <Badge variant='outline' className='mb-2 bg-background/80'>
                        <Receipt className='size-3 mr-1 text-primary' /> Payment Invoice & Receipt
                      </Badge>
                      <h2 className='text-xl font-bold'>Order #{viewItem.order_id}</h2>
                      <p className='text-xs text-muted-foreground mt-0.5'>
                        Placed on {formatDate(viewItem.created_at)}
                      </p>
                    </div>
                    <div>{getStatusBadge(viewItem.payment_status)}</div>
                  </div>
                </div>

                <div className='p-6 space-y-6'>
                  {/* Student & Payment Summary Grid */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='p-4 rounded-xl border bg-muted/20 space-y-3'>
                      <h4 className='text-xs font-semibold uppercase text-muted-foreground tracking-wider'>
                        Student Information
                      </h4>
                      <div className='space-y-1.5 text-sm'>
                        <p className='font-medium text-foreground'>{viewItem.name}</p>
                        <div className='flex items-center gap-2 text-muted-foreground text-xs'>
                          <Mail className='size-3.5 shrink-0' /> {viewItem.email}
                        </div>
                        {viewItem.phone && (
                          <div className='flex items-center gap-2 text-muted-foreground text-xs'>
                            <Phone className='size-3.5 shrink-0' /> {viewItem.phone}
                          </div>
                        )}
                        {viewItem.user && (
                          <div className='mt-2 pt-2 border-t text-[11px] text-muted-foreground'>
                            Registered Account User ID: #{viewItem.user.id}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='p-4 rounded-xl border bg-muted/20 space-y-3'>
                      <h4 className='text-xs font-semibold uppercase text-muted-foreground tracking-wider'>
                        Payment Details
                      </h4>
                      <div className='space-y-1.5 text-sm'>
                        <div className='flex justify-between items-center'>
                          <span className='text-xs text-muted-foreground'>Payment Method:</span>
                          <span className='font-medium text-xs'>{viewItem.payment_method}</span>
                        </div>
                        {viewItem.transaction_id && (
                          <div className='flex justify-between items-center'>
                            <span className='text-xs text-muted-foreground'>Transaction ID:</span>
                            <span className='font-mono text-xs font-semibold text-primary'>
                              {viewItem.transaction_id}
                            </span>
                          </div>
                        )}
                        <div className='flex justify-between items-center pt-1 border-t'>
                          <span className='text-xs font-medium'>Amount Paid:</span>
                          <span className='text-base font-bold text-emerald-600 dark:text-emerald-400'>
                            ₹{Number(viewItem.amount).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Course Item Box */}
                  <div className='p-4 rounded-xl border bg-card space-y-3'>
                    <h4 className='text-xs font-semibold uppercase text-muted-foreground tracking-wider'>
                      Purchased Course / Recorded Session
                    </h4>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='space-y-1'>
                        <p className='font-semibold text-sm text-foreground'>{viewItem.session_title}</p>
                        {viewItem.recorded_session?.slug && (
                          <p className='text-xs text-muted-foreground font-mono'>
                            Slug: /recorded-sessions/{viewItem.recorded_session.slug}
                          </p>
                        )}
                      </div>
                      <div className='text-right shrink-0'>
                        <p className='font-bold text-sm'>₹{Number(viewItem.amount).toLocaleString('en-IN')}</p>
                        {viewItem.original_price && Number(viewItem.original_price) > Number(viewItem.amount) && (
                          <p className='text-xs text-muted-foreground line-through'>
                            ₹{Number(viewItem.original_price).toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status update selector in modal */}
                  <div className='p-4 rounded-xl border bg-muted/10 space-y-2'>
                    <h4 className='text-xs font-semibold text-muted-foreground'>Update Payment Status</h4>
                    <div className='flex items-center gap-3'>
                      <Select
                        value={viewItem.payment_status}
                        onValueChange={(val: any) => handleStatusChange(viewItem.id, val)}
                        disabled={isUpdatingStatus}
                      >
                        <SelectTrigger className='w-[200px] h-9 text-xs'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='completed'>Completed (Paid)</SelectItem>
                          <SelectItem value='pending'>Pending</SelectItem>
                          <SelectItem value='refunded'>Refunded</SelectItem>
                          <SelectItem value='failed'>Failed</SelectItem>
                        </SelectContent>
                      </Select>
                      {isUpdatingStatus && <Loader2 className='size-4 animate-spin text-primary' />}
                    </div>
                  </div>
                </div>

                <DialogFooter className='p-4 bg-muted/30 border-t flex items-center justify-between sm:justify-between'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => window.print()}
                    className='gap-2'
                  >
                    <FileDown className='size-4' /> Print Receipt
                  </Button>
                  <Button variant='default' size='sm' onClick={() => setViewItem(null)}>
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={!!deleteItem}
          onOpenChange={(open) => !open && setDeleteItem(null)}
          handleConfirm={handleDeleteConfirm}
          isLoading={isDeleting}
          title='Delete Order'
          desc={`Are you sure you want to delete order #${deleteItem?.order_id}? This action cannot be undone.`}
          confirmText='Delete'
          destructive
        />

        {/* Bulk Delete Confirmation */}
        <ConfirmDialog
          open={isBulkDeletingOpen}
          onOpenChange={setIsBulkDeletingOpen}
          handleConfirm={handleBulkDeleteConfirm}
          isLoading={isBulkDeleting}
          title={`Delete ${selectedIds.length} Orders`}
          desc={`Are you sure you want to delete ${selectedIds.length} selected orders? This action cannot be undone.`}
          confirmText='Delete Selected'
          destructive
        />
      </Main>
    </>
  )
}
