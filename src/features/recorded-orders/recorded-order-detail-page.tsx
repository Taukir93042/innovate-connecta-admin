'use client'

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import {
  ArrowLeft,
  Receipt,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Printer,
  Trash2,
  ExternalLink,
  Video,
  User,
  ShieldCheck,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  adminRecordedOrderService,
  type RecordedOrderItem,
} from '@/services/admin-recorded-orders'
import { getApiErrorMessage } from '@/lib/api-client'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/confirm-dialog'

export function RecordedOrderDetailPage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { orderId?: string }
  const orderId = Number(params?.orderId)

  const [order, setOrder] = useState<RecordedOrderItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId || isNaN(orderId)) {
      toast.error('Invalid order ID')
      navigate({ to: '/recorded-orders' })
      return
    }

    async function fetchOrderDetail() {
      try {
        setIsLoading(true)
        const res = await adminRecordedOrderService.getOrder(orderId)
        if (res.status && res.data) {
          setOrder(res.data)
        } else {
          toast.error('Order not found')
          navigate({ to: '/recorded-orders' })
        }
      } catch (err) {
        toast.error(getApiErrorMessage(err))
        navigate({ to: '/recorded-orders' })
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderDetail()
  }, [orderId, navigate])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success(`Copied ${field} to clipboard`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return
    try {
      setIsUpdatingStatus(true)
      const res = await adminRecordedOrderService.updateOrderStatus(
        order.id,
        newStatus as 'completed' | 'pending' | 'refunded' | 'failed'
      )
      if (res.status && res.data) {
        setOrder(res.data)
        toast.success(`Order status updated to ${newStatus}`)
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDelete = async () => {
    if (!order) return
    try {
      setIsDeleting(true)
      await adminRecordedOrderService.deleteOrder(order.id)
      toast.success('Order deleted successfully')
      navigate({ to: '/recorded-orders' })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return (
          <Badge className='bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold gap-1.5 px-3 py-1'>
            <CheckCircle2 className='size-3.5' /> Paid / Completed
          </Badge>
        )
      case 'pending':
        return (
          <Badge className='bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold gap-1.5 px-3 py-1'>
            <Clock className='size-3.5' /> Pending Payment
          </Badge>
        )
      case 'refunded':
        return (
          <Badge className='bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-semibold gap-1.5 px-3 py-1'>
            <AlertTriangle className='size-3.5' /> Refunded
          </Badge>
        )
      case 'failed':
        return (
          <Badge className='bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-semibold gap-1.5 px-3 py-1'>
            <XCircle className='size-3.5' /> Failed
          </Badge>
        )
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return dateStr
    }
  }

  if (isLoading) {
    return (
      <div className='flex min-h-screen flex-col'>
        <Header fixed>
          <Search />
          <div className='ms-auto flex items-center gap-2'>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <Main className='flex flex-1 items-center justify-center'>
          <div className='flex flex-col items-center gap-3'>
            <Loader2 className='size-8 animate-spin text-primary' />
            <p className='text-sm text-muted-foreground'>Loading order details...</p>
          </div>
        </Main>
      </div>
    )
  }

  if (!order) {
    return null
  }

  const studentInitials = order.name
    ? order.name
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'ST'

  const liveCourseUrl = order.recorded_session?.slug
    ? `https://innovate-connecta.netlify.app/recorded-sessions/${order.recorded_session.slug}`
    : 'https://innovate-connecta.netlify.app/recorded-sessions'

  return (
    <div className='flex min-h-screen flex-col'>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center gap-2'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex-1 space-y-6 p-4 md:p-8 max-w-6xl mx-auto w-full'>
        {/* Top Header & Breadcrumb Actions */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5'>
          <div className='flex items-center gap-3'>
            <Button
              variant='outline'
              size='icon'
              className='size-9 shrink-0'
              onClick={() => navigate({ to: '/recorded-orders' })}
              title='Back to Orders'
            >
              <ArrowLeft className='size-4' />
            </Button>
            <div>
              <div className='flex items-center gap-2.5 flex-wrap'>
                <h1 className='text-2xl font-bold tracking-tight'>Order #{order.order_id}</h1>
                {getStatusBadge(order.payment_status)}
              </div>
              <p className='text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5'>
                <Calendar className='size-3.5' /> Placed on {formatDate(order.created_at)}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2.5 flex-wrap'>
            <Button variant='outline' size='sm' onClick={handlePrint} className='gap-2'>
              <Printer className='size-4' /> Print Receipt
            </Button>

            <div className='flex items-center gap-2'>
              <Select
                value={order.payment_status}
                onValueChange={handleStatusChange}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger className='h-9 w-[160px] text-xs font-semibold'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='completed' className='text-emerald-600 font-medium'>
                    Completed (Paid)
                  </SelectItem>
                  <SelectItem value='pending' className='text-amber-600 font-medium'>
                    Pending
                  </SelectItem>
                  <SelectItem value='refunded' className='text-blue-600 font-medium'>
                    Refunded
                  </SelectItem>
                  <SelectItem value='failed' className='text-rose-600 font-medium'>
                    Failed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant='destructive'
              size='sm'
              onClick={() => setIsDeleteDialogOpen(true)}
              className='gap-1.5'
            >
              <Trash2 className='size-4' /> Delete
            </Button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
          {/* Left Column (8 cols): Order & Payment Details + Course */}
          <div className='lg:col-span-8 space-y-6'>
            {/* 1. Payment & Invoice Breakdown Card */}
            <Card className='shadow-sm overflow-hidden border'>
              <CardHeader className='bg-muted/30 border-b pb-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Receipt className='size-5 text-primary' />
                    <div>
                      <CardTitle className='text-lg'>Payment & Invoice Summary</CardTitle>
                      <CardDescription>Transaction references and invoice breakdown</CardDescription>
                    </div>
                  </div>
                  <span className='text-2xl font-black text-emerald-600 dark:text-emerald-400'>
                    ₹{Number(order.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className='p-6 space-y-6'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='p-3.5 rounded-xl border bg-muted/20 space-y-1.5'>
                    <span className='text-xs text-muted-foreground font-medium uppercase tracking-wider block'>
                      Order ID
                    </span>
                    <div className='flex items-center justify-between font-mono text-sm font-semibold'>
                      <span>{order.order_id}</span>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-7'
                        onClick={() => copyToClipboard(order.order_id, 'Order ID')}
                      >
                        {copiedField === 'Order ID' ? (
                          <Check className='size-3.5 text-emerald-600' />
                        ) : (
                          <Copy className='size-3.5 text-muted-foreground' />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className='p-3.5 rounded-xl border bg-muted/20 space-y-1.5'>
                    <span className='text-xs text-muted-foreground font-medium uppercase tracking-wider block'>
                      Transaction Reference ID
                    </span>
                    <div className='flex items-center justify-between font-mono text-sm font-semibold'>
                      <span className='truncate max-w-[200px]'>
                        {order.transaction_id || 'N/A'}
                      </span>
                      {order.transaction_id && (
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-7'
                          onClick={() => copyToClipboard(order.transaction_id!, 'Transaction ID')}
                        >
                          {copiedField === 'Transaction ID' ? (
                            <Check className='size-3.5 text-emerald-600' />
                          ) : (
                            <Copy className='size-3.5 text-muted-foreground' />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className='p-3.5 rounded-xl border bg-muted/20 space-y-1.5'>
                    <span className='text-xs text-muted-foreground font-medium uppercase tracking-wider block'>
                      Payment Method
                    </span>
                    <div className='flex items-center gap-2 text-sm font-semibold'>
                      <CreditCard className='size-4 text-primary' />
                      <span>{order.payment_method || 'Online Payment'}</span>
                    </div>
                  </div>

                  <div className='p-3.5 rounded-xl border bg-muted/20 space-y-1.5'>
                    <span className='text-xs text-muted-foreground font-medium uppercase tracking-wider block'>
                      Security & Gateway Status
                    </span>
                    <div className='flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400'>
                      <ShieldCheck className='size-4' />
                      <span>Verified Encrypted 256-bit</span>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown Table */}
                <div className='rounded-xl border overflow-hidden'>
                  <div className='bg-muted/40 px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b'>
                    Invoice Breakdown
                  </div>
                  <div className='p-4 space-y-3 text-sm'>
                    <div className='flex justify-between items-center text-muted-foreground'>
                      <span>Original Session Fee:</span>
                      <span>
                        ₹{Number(order.original_price || order.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {order.original_price && Number(order.original_price) > Number(order.amount) && (
                      <div className='flex justify-between items-center text-emerald-600 font-medium'>
                        <span>Promotional Discount:</span>
                        <span>
                          -₹{(Number(order.original_price) - Number(order.amount)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    <div className='flex justify-between items-center border-t pt-3 text-base font-bold'>
                      <span>Total Amount Paid:</span>
                      <span className='text-emerald-600 dark:text-emerald-400 font-black'>
                        ₹{Number(order.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Purchased Course / Masterclass Card */}
            <Card className='shadow-sm border'>
              <CardHeader className='bg-muted/30 border-b pb-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Video className='size-5 text-primary' />
                    <div>
                      <CardTitle className='text-lg'>Purchased Course / Masterclass</CardTitle>
                      <CardDescription>Digital recorded session linked to this enrollment</CardDescription>
                    </div>
                  </div>
                  <a
                    href={liveCourseUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold'
                  >
                    View on Live Website <ExternalLink className='size-3.5' />
                  </a>
                </div>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4'>
                  {order.recorded_session?.thumbnail ? (
                    <img
                      src={order.recorded_session.thumbnail}
                      alt={order.session_title}
                      className='w-full sm:w-40 h-24 rounded-xl object-cover border bg-muted shadow-sm shrink-0'
                    />
                  ) : (
                    <div className='w-full sm:w-40 h-24 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-muted border flex items-center justify-center text-primary shadow-sm shrink-0'>
                      <Video className='size-8' />
                    </div>
                  )}
                  <div className='space-y-2 flex-1'>
                    <h3 className='text-base font-bold text-foreground'>{order.session_title}</h3>
                    {order.recorded_session?.slug && (
                      <p className='font-mono text-xs text-muted-foreground'>
                        Slug: /recorded-sessions/{order.recorded_session.slug}
                      </p>
                    )}
                    <div className='flex items-center gap-3 text-xs text-muted-foreground pt-1 flex-wrap'>
                      {order.recorded_session?.duration_minutes && (
                        <span className='flex items-center gap-1'>
                          <Clock className='size-3.5 text-primary' /> {order.recorded_session.duration_minutes} Mins
                        </span>
                      )}
                      <span className='flex items-center gap-1 text-emerald-600 font-semibold'>
                        <CheckCircle2 className='size-3.5' /> Unlimited Lifetime Access Unlocked
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (4 cols): Student Profile & Metadata */}
          <div className='lg:col-span-4 space-y-6'>
            {/* Student Info Card */}
            <Card className='shadow-sm border'>
              <CardHeader className='bg-muted/30 border-b pb-4'>
                <div className='flex items-center gap-2'>
                  <User className='size-5 text-primary' />
                  <div>
                    <CardTitle className='text-base'>Student Details</CardTitle>
                    <CardDescription>Learner profile & contact</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='p-6 space-y-4'>
                <div className='flex items-center gap-3.5'>
                  <Avatar className='size-12 border bg-primary/10 text-primary font-bold'>
                    <AvatarFallback>{studentInitials}</AvatarFallback>
                  </Avatar>
                  <div className='space-y-0.5 overflow-hidden'>
                    <h4 className='font-bold text-sm text-foreground truncate'>{order.name}</h4>
                    <p className='text-xs text-muted-foreground'>
                      {order.user_id ? `Registered User (ID: #${order.user_id})` : 'Guest Checkout'}
                    </p>
                  </div>
                </div>

                <div className='space-y-3 pt-3 border-t text-sm'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2 text-muted-foreground text-xs'>
                      <Mail className='size-3.5 shrink-0' />
                      <a href={`mailto:${order.email}`} className='hover:underline truncate max-w-[180px]'>
                        {order.email}
                      </a>
                    </div>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-6 shrink-0'
                      onClick={() => copyToClipboard(order.email, 'Email')}
                    >
                      {copiedField === 'Email' ? (
                        <Check className='size-3 text-emerald-600' />
                      ) : (
                        <Copy className='size-3 text-muted-foreground' />
                      )}
                    </Button>
                  </div>

                  {order.phone && (
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2 text-muted-foreground text-xs'>
                        <Phone className='size-3.5 shrink-0' />
                        <a href={`tel:${order.phone}`} className='hover:underline'>
                          {order.phone}
                        </a>
                      </div>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-6 shrink-0'
                        onClick={() => copyToClipboard(order.phone, 'Phone')}
                      >
                        {copiedField === 'Phone' ? (
                          <Check className='size-3 text-emerald-600' />
                        ) : (
                          <Copy className='size-3 text-muted-foreground' />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Technical Metadata Card */}
            <Card className='shadow-sm border'>
              <CardHeader className='bg-muted/30 border-b pb-3'>
                <CardTitle className='text-sm font-semibold'>Audit & System Info</CardTitle>
              </CardHeader>
              <CardContent className='p-4 space-y-2.5 text-xs text-muted-foreground'>
                <div className='flex justify-between py-1 border-b border-dashed'>
                  <span>Order Record ID:</span>
                  <span className='font-mono text-foreground font-semibold'>#{order.id}</span>
                </div>
                <div className='flex justify-between py-1 border-b border-dashed'>
                  <span>Created Timestamp:</span>
                  <span className='text-foreground'>{formatDate(order.created_at)}</span>
                </div>
                {order.ip_address && (
                  <div className='flex justify-between py-1 border-b border-dashed'>
                    <span>IP Address:</span>
                    <span className='font-mono text-foreground'>{order.ip_address}</span>
                  </div>
                )}
                {order.notes && (
                  <div className='pt-2'>
                    <span className='font-semibold block text-foreground mb-1'>Admin Notes:</span>
                    <p className='p-2 rounded bg-muted/40 border text-xs text-foreground'>{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title='Delete Order Record?'
        desc='Are you sure you want to delete this order record? This action is permanent and cannot be undone.'
        confirmText='Delete'
        destructive
        isLoading={isDeleting}
        handleConfirm={handleDelete}
      />
    </div>
  )
}
