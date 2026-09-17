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
  MessageSquareText,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  adminContactService,
  type ContactItem,
} from '@/services/admin-contacts'
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
import { ConfirmDialog } from '@/components/confirm-dialog'

export function Contacts() {
  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Detail modal state
  const [viewItem, setViewItem] = useState<ContactItem | null>(null)

  // Delete modal state
  const [deleteItem, setDeleteItem] = useState<ContactItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function fetchContacts() {
    try {
      setIsLoading(true)
      const res = await adminContactService.getContacts({
        search: searchQuery || undefined,
        all: true,
      })
      if (res.status && Array.isArray(res.data)) {
        setContacts(res.data)
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchContacts()
  }

  const openViewModal = async (item: ContactItem) => {
    setViewItem(item)
    // If contact inquiry is unread, fetch detail marks it as read in backend
    if (!item.is_read) {
      try {
        const res = await adminContactService.getContact(item.id)
        if (res.status && res.data) {
          setContacts((prev) =>
            prev.map((c) => (c.id === item.id ? { ...c, is_read: true } : c))
          )
        }
      } catch {
        // silent fail
      }
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return
    setIsDeleting(true)
    try {
      await adminContactService.deleteContact(deleteItem.id)
      toast.success('Contact inquiry deleted successfully.')
      setContacts((prev) => prev.filter((c) => c.id !== deleteItem.id))
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
              Contact Inquiries
            </h1>
            <p className='text-sm text-muted-foreground'>
              View and manage contact form submissions and messages received from website visitors.
            </p>
          </div>
          <Badge variant='outline' className='px-3 py-1 text-sm font-medium'>
            Total: {contacts.length} {contacts.length === 1 ? 'Message' : 'Messages'}
          </Badge>
        </div>

        {/* Search Bar */}
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <Button
            variant='default'
            size='sm'
            onClick={() => fetchContacts()}
          >
            All Messages
          </Button>

          <form
            onSubmit={handleSearchSubmit}
            className='flex items-center gap-2 w-full sm:w-80'
          >
            <div className='relative flex-1'>
              <SearchIcon className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search name, email, phone or subject...'
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
            <p>Loading contact inquiries...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className='flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center'>
            <Inbox className='h-12 w-12 text-muted-foreground/60 mb-2' />
            <h3 className='text-lg font-semibold'>No contact inquiries found</h3>
            <p className='text-sm text-muted-foreground max-w-sm mb-4'>
              {searchQuery
                ? 'No inquiries matched your search criteria.'
                : 'Inquiries submitted through the Contact Us form will appear here.'}
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
                  <TableHead className='w-[150px]'>Phone</TableHead>
                  <TableHead className='w-[160px]'>Subject</TableHead>
                  <TableHead className='min-w-[220px]'>Message</TableHead>
                  <TableHead className='w-[110px]'>Status</TableHead>
                  <TableHead className='w-[120px]'>Date</TableHead>
                  <TableHead className='w-[90px] text-end'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className={`hover:bg-muted/40 ${
                      !item.is_read ? 'bg-primary/5 font-medium' : ''
                    }`}
                  >
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
                        <span className='truncate font-mono'>{item.email || '—'}</span>
                      </div>
                    </TableCell>

                    {/* Phone */}
                    <TableCell className='py-3 text-xs text-muted-foreground font-mono'>
                      {item.phone ? (
                        <span className='flex items-center gap-1'>
                          <Phone className='size-3 text-muted-foreground/70 shrink-0' />
                          <span className='truncate'>{item.phone}</span>
                        </span>
                      ) : (
                        <span className='text-muted-foreground/60'>—</span>
                      )}
                    </TableCell>

                    {/* Subject */}
                    <TableCell className='py-3'>
                      {item.subject ? (
                        <Badge variant='outline' className='font-normal text-xs truncate max-w-[140px]' title={item.subject}>
                          {item.subject}
                        </Badge>
                      ) : (
                        <span className='text-xs text-muted-foreground/60'>General Inquiry</span>
                      )}
                    </TableCell>

                    {/* Message */}
                    <TableCell className='py-3'>
                      <div
                        className='text-xs text-foreground/90 line-clamp-2 cursor-pointer hover:underline'
                        onClick={() => openViewModal(item)}
                        title='Click to view full message'
                      >
                        {item.message || '—'}
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className='py-3'>
                      <Badge
                        variant={item.is_read ? 'secondary' : 'default'}
                        className={
                          item.is_read
                            ? 'text-muted-foreground text-[11px]'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px]'
                        }
                      >
                        {item.is_read ? 'Read' : 'New'}
                      </Badge>
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
                          title='View inquiry'
                        >
                          <Eye className='size-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-8 text-destructive hover:text-destructive hover:bg-destructive/10'
                          onClick={() => setDeleteItem(item)}
                          title='Delete inquiry'
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
                  <DialogTitle className='text-lg'>Contact Inquiry</DialogTitle>
                  <Badge
                    variant={viewItem.is_read ? 'secondary' : 'default'}
                    className='text-[11px]'
                  >
                    {viewItem.is_read ? 'Read' : 'New'}
                  </Badge>
                </div>
                <DialogDescription>
                  Received on {formatDate(viewItem.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className='grid gap-4 py-3'>
                <div className='grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3'>
                  <div>
                    <span className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider'>
                      Sender Name
                    </span>
                    <p className='font-semibold text-sm'>{viewItem.name}</p>
                  </div>
                  <div>
                    <span className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider'>
                      Email Address
                    </span>
                    <p className='font-mono text-xs truncate'>{viewItem.email || '—'}</p>
                  </div>
                  <div>
                    <span className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider'>
                      Phone Number
                    </span>
                    <p className='font-mono text-xs'>{viewItem.phone || '—'}</p>
                  </div>
                  <div>
                    <span className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider'>
                      Subject
                    </span>
                    <p className='text-xs font-medium text-primary truncate'>
                      {viewItem.subject || 'General Inquiry'}
                    </p>
                  </div>
                </div>

                <div className='grid gap-1.5'>
                  <span className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
                    <MessageSquareText className='size-3.5 text-primary' />
                    Message Content
                  </span>
                  <div className='rounded-md border p-3.5 text-sm bg-background whitespace-pre-wrap leading-relaxed'>
                    {viewItem.message || 'No message provided.'}
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
        title='Delete Contact Inquiry'
        desc={`Are you sure you want to delete inquiry from "${deleteItem?.name}"? This action cannot be undone.`}
        confirmText='Delete'
        destructive
        isLoading={isDeleting}
        handleConfirm={handleDeleteConfirm}
        className='sm:max-w-sm'
      />
    </>
  )
}
