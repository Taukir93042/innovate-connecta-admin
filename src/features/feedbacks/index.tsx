import { useState, useEffect } from 'react'
import {
  Search as SearchIcon,
  Trash2,
  Eye,
  MessageSquare,
  Loader2,
  Mail,
  Sparkles,
  Calendar,
  Layers,
  BookOpen,
  Lightbulb,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  adminFeedbackService,
  type FeedbackItem,
} from '@/services/admin-feedback'
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
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'

export function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFeaturedOnly, setFilterFeaturedOnly] = useState(false)

  // Detail modal state
  const [viewItem, setViewItem] = useState<FeedbackItem | null>(null)

  // Delete modal state
  const [deleteItem, setDeleteItem] = useState<FeedbackItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function fetchFeedbacks() {
    try {
      setIsLoading(true)
      const res = await adminFeedbackService.getFeedbacks({
        search: searchQuery || undefined,
        is_featured: filterFeaturedOnly ? true : undefined,
        all: true,
      })
      if (res.status && Array.isArray(res.data)) {
        setFeedbacks(res.data)
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedbacks()
  }, [filterFeaturedOnly])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchFeedbacks()
  }

  const openViewModal = async (item: FeedbackItem) => {
    setViewItem(item)
    // If feedback is unread, fetch detail marks it as read in backend
    if (!item.is_read) {
      try {
        const res = await adminFeedbackService.getFeedback(item.id)
        if (res.status && res.data) {
          setFeedbacks((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, is_read: true } : f))
          )
        }
      } catch {
        // silent fail
      }
    }
  }

  const handleToggleFeatured = async (item: FeedbackItem) => {
    try {
      await adminFeedbackService.toggleFeatured(item.id)
      setFeedbacks((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, is_featured: !f.is_featured } : f
        )
      )
      if (viewItem && viewItem.id === item.id) {
        setViewItem({ ...viewItem, is_featured: !viewItem.is_featured })
      }
      toast.success(
        `Feedback ${!item.is_featured ? 'marked as featured' : 'unmarked from featured'}.`
      )
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return
    setIsDeleting(true)
    try {
      await adminFeedbackService.deleteFeedback(deleteItem.id)
      toast.success('Feedback deleted successfully.')
      setFeedbacks((prev) => prev.filter((f) => f.id !== deleteItem.id))
      setDeleteItem(null)
      if (viewItem && viewItem.id === deleteItem.id) {
        setViewItem(null)
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsDeleting(false)
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
              Session & Program Feedbacks
            </h1>
            <p className='text-sm text-muted-foreground'>
              Review candidate responses, key takeaways, and suggestions from completed sessions.
            </p>
          </div>
          <Badge variant='outline' className='px-3 py-1 text-sm font-medium'>
            Total: {feedbacks.length} {feedbacks.length === 1 ? 'Feedback' : 'Feedbacks'}
          </Badge>
        </div>

        {/* Filters & Search Bar */}
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <Button
              variant={!filterFeaturedOnly ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilterFeaturedOnly(false)}
            >
              All Feedbacks
            </Button>
            <Button
              variant={filterFeaturedOnly ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilterFeaturedOnly(true)}
              className='gap-1.5'
            >
              <Sparkles className='h-3.5 w-3.5 text-amber-500' />
              Featured Only
            </Button>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className='flex items-center gap-2 w-full sm:w-80'
          >
            <div className='relative flex-1'>
              <SearchIcon className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search name, session or takeaways...'
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
            <p>Loading session feedbacks...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className='flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center'>
            <MessageSquare className='h-12 w-12 text-muted-foreground/60 mb-2' />
            <h3 className='text-lg font-semibold'>No feedbacks found</h3>
            <p className='text-sm text-muted-foreground max-w-sm mb-4'>
              {searchQuery
                ? 'No feedback entries matched your search term.'
                : 'Session attendees feedback will be collected and listed here automatically.'}
            </p>
          </div>
        ) : (
          <div className='rounded-lg border bg-card shadow-xs overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/50'>
                  <TableHead className='w-[70px]'>S.No</TableHead>
                  <TableHead className='min-w-[180px]'>Name</TableHead>
                  <TableHead className='min-w-[200px]'>Email</TableHead>
                  <TableHead className='w-[180px]'>Session / Workshop</TableHead>
                  <TableHead className='min-w-[240px]'>Key Takeaways</TableHead>
                  <TableHead className='w-[120px]'>Featured</TableHead>
                  <TableHead className='w-[130px]'>Date</TableHead>
                  <TableHead className='w-[90px] text-end'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks.map((item, index) => (
                  <TableRow key={item.id} className='hover:bg-muted/40'>
                    {/* S.No */}
                    <TableCell className='py-3 font-mono text-xs text-muted-foreground'>
                      {index + 1}
                    </TableCell>

                    {/* Name */}
                    <TableCell className='py-3'>
                      <div className='flex items-center gap-2.5'>
                        <Avatar className='h-8 w-8 border shrink-0'>
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
                      <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                        <Mail className='size-3 text-muted-foreground/70 shrink-0' />
                        <span className='truncate font-mono'>{item.email}</span>
                      </div>
                    </TableCell>

                    {/* Session Name */}
                    <TableCell className='py-3'>
                      {item.session_name ? (
                        <Badge variant='outline' className='font-normal text-xs flex items-center gap-1 w-fit'>
                          <Layers className='size-3 text-muted-foreground' />
                          <span className='truncate max-w-[140px]'>{item.session_name}</span>
                        </Badge>
                      ) : (
                        <span className='text-xs text-muted-foreground/60'>General Session</span>
                      )}
                    </TableCell>

                    {/* Key Takeaways */}
                    <TableCell className='py-3'>
                      <div
                        className='text-xs text-foreground/90 line-clamp-2 cursor-pointer hover:underline'
                        onClick={() => openViewModal(item)}
                        title='Click to view details'
                      >
                        {item.key_takeaway || item.suggestions || '—'}
                      </div>
                    </TableCell>

                    {/* Featured Toggle */}
                    <TableCell className='py-3'>
                      <Button
                        variant={item.is_featured ? 'secondary' : 'ghost'}
                        size='sm'
                        className={`h-7 text-xs px-2 gap-1 rounded-full ${
                          item.is_featured
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={() => handleToggleFeatured(item)}
                        title='Toggle featured'
                      >
                        <Sparkles
                          className={`h-3 w-3 ${
                            item.is_featured ? 'text-amber-500 fill-amber-500' : ''
                          }`}
                        />
                        {item.is_featured ? 'Featured' : 'Regular'}
                      </Button>
                    </TableCell>

                    {/* Date */}
                    <TableCell className='py-3 text-xs text-muted-foreground'>
                      <span className='flex items-center gap-1'>
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
                          onClick={() => openViewModal(item)}
                          title='View details'
                        >
                          <Eye className='size-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-8 text-destructive hover:text-destructive hover:bg-destructive/10'
                          onClick={() => setDeleteItem(item)}
                          title='Delete feedback'
                        >
                          <Trash2 className='size-4' />
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

      {/* View Detail Modal */}
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className='sm:max-w-lg'>
          {viewItem && (
            <>
              <DialogHeader>
                <div className='flex items-center gap-2'>
                  <DialogTitle className='text-lg'>Feedback Details</DialogTitle>
                  {viewItem.is_featured && (
                    <Badge className='bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px] gap-1'>
                      <Sparkles className='size-3' /> Featured
                    </Badge>
                  )}
                </div>
                <DialogDescription>
                  Submitted on {formatDate(viewItem.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className='grid gap-4 py-3'>
                <div className='grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3'>
                  <div>
                    <span className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider'>
                      Attendee Name
                    </span>
                    <p className='font-semibold text-sm'>{viewItem.name}</p>
                  </div>
                  <div>
                    <span className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider'>
                      Email Address
                    </span>
                    <p className='font-mono text-xs truncate'>{viewItem.email}</p>
                  </div>
                  <div className='col-span-2 pt-2 border-t'>
                    <span className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider'>
                      Session / Program
                    </span>
                    <p className='text-sm font-medium text-primary'>
                      {viewItem.session_name || 'General Event'}
                    </p>
                  </div>
                </div>

                <div className='grid gap-1.5'>
                  <Label className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                    <BookOpen className='size-3.5 text-primary' />
                    Key Takeaways
                  </Label>
                  <div className='rounded-md border p-3 text-sm bg-background'>
                    {viewItem.key_takeaway || 'No specific takeaways provided.'}
                  </div>
                </div>

                <div className='grid gap-1.5'>
                  <Label className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                    <Lightbulb className='size-3.5 text-amber-500' />
                    Suggestions for Future Sessions
                  </Label>
                  <div className='rounded-md border p-3 text-sm bg-background'>
                    {viewItem.suggestions || 'No suggestions provided.'}
                  </div>
                </div>
              </div>

              <DialogFooter className='flex items-center justify-between sm:justify-between'>
                <Button
                  type='button'
                  variant={viewItem.is_featured ? 'secondary' : 'outline'}
                  size='sm'
                  onClick={() => handleToggleFeatured(viewItem)}
                  className='gap-1.5'
                >
                  <Sparkles className='size-3.5 text-amber-500' />
                  {viewItem.is_featured ? 'Unmark Featured' : 'Mark as Featured'}
                </Button>
                <Button
                  type='button'
                  onClick={() => setViewItem(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title='Delete Feedback'
        desc={`Are you sure you want to delete feedback from "${deleteItem?.name}"? This action cannot be undone.`}
        confirmText='Delete'
        destructive
        isLoading={isDeleting}
        handleConfirm={handleDeleteConfirm}
        className='sm:max-w-sm'
      />
    </>
  )
}
