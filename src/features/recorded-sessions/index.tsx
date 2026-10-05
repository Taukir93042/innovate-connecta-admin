'use client'

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Plus,
  Search,
  Loader2,
  Trash2,
  Edit,
  Eye,
  Video,
  Clock,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  adminRecordedSessionService,
  type RecordedSessionItem,
} from '@/services/admin-recorded-sessions'
import {
  adminSessionCategoryService,
  type SessionCategoryItem,
} from '@/services/admin-session-category'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search as SearchHeader } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

export function RecordedSessions() {
  const navigate = useNavigate()

  // State
  const [sessions, setSessions] = useState<RecordedSessionItem[]>([])
  const [categories, setCategories] = useState<SessionCategoryItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Search
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Deletion modals
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await adminSessionCategoryService.getCategories({ all: true })
      if (res?.data) {
        setCategories(Array.isArray(res.data) ? res.data : [])
      }
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }, [])

  // Fetch Sessions
  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search.trim()) params.search = search.trim()
      if (selectedCategory !== 'all') params.session_category_id = Number(selectedCategory)
      if (selectedStatus === 'active') params.is_active = true
      if (selectedStatus === 'inactive') params.is_active = false
      params.all = true

      const res = await adminRecordedSessionService.getRecordedSessions(params)
      if (res?.data) {
        setSessions(Array.isArray(res.data) ? res.data : [])
      }
    } catch (err) {
      console.error('Failed to fetch recorded sessions:', err)
    } finally {
      setLoading(false)
    }
  }, [search, selectedCategory, selectedStatus])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSessions()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchSessions])

  // Select all checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(sessions.map((s) => s.id))
    } else {
      setSelectedIds([])
    }
  }

  // Select single row
  const handleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // Toggle active status
  const handleToggleStatus = async (session: RecordedSessionItem) => {
    try {
      const res = await adminRecordedSessionService.toggleRecordedSessionStatus(session.id)
      if (res?.status) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === session.id ? { ...s, is_active: !s.is_active } : s
          )
        )
      }
    } catch (err) {
      console.error('Failed to toggle status:', err)
    }
  }

  // Delete Single
  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await adminRecordedSessionService.deleteRecordedSession(deleteId)
      setSessions((prev) => prev.filter((s) => s.id !== deleteId))
      setSelectedIds((prev) => prev.filter((id) => id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      console.error('Failed to delete session:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  // Bulk Delete
  const handleBulkDeleteConfirm = async () => {
    if (!selectedIds.length) return
    setIsDeleting(true)
    try {
      await adminRecordedSessionService.bulkDeleteRecordedSessions(selectedIds)
      setSessions((prev) => prev.filter((s) => !selectedIds.includes(s.id)))
      setSelectedIds([])
      setBulkDeleteOpen(false)
    } catch (err) {
      console.error('Failed to bulk delete sessions:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Header fixed>
        <SearchHeader />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='space-y-6'>
        {/* Page Header */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight text-foreground'>
              Recorded Sessions
            </h1>
            <p className='text-sm text-muted-foreground mt-1'>
              Manage recorded courses, rich text curriculum, attached study PDFs &amp; pricing.
            </p>
          </div>

          <div className='flex items-center gap-2'>
            {selectedIds.length > 0 && (
              <Button
                variant='destructive'
                onClick={() => setBulkDeleteOpen(true)}
                className='gap-1.5 shadow-sm'
              >
                <Trash2 className='h-4 w-4' />
                Delete Selected ({selectedIds.length})
              </Button>
            )}

            <Button
              onClick={() => navigate({ to: '/recorded-sessions/create' })}
              className='gap-2 shadow-sm'
            >
              <Plus className='h-4 w-4' />
              Create Recorded Session
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className='flex flex-wrap items-center gap-3 bg-card p-3.5 rounded-xl border shadow-sm'>
          <div className='relative flex-1 min-w-[240px]'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search by title, subtitle, instructor...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9 bg-background'
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className='w-[180px] bg-background'>
              <SelectValue placeholder='Category' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className='w-[140px] bg-background'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='inactive'>Inactive</SelectItem>
            </SelectContent>
          </Select>

          {(search || selectedCategory !== 'all' || selectedStatus !== 'all') && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                setSearch('')
                setSelectedCategory('all')
                setSelectedStatus('all')
              }}
              className='text-xs text-muted-foreground hover:text-foreground'
            >
              Reset Filters
            </Button>
          )}
        </div>

        {/* Table View */}
        <div className='border rounded-xl bg-card overflow-hidden shadow-sm'>
          <Table>
            <TableHeader>
              <TableRow className='bg-muted/40 hover:bg-muted/40'>
                <TableHead className='w-[40px]'>
                  <input
                    type='checkbox'
                    className='rounded border-gray-300'
                    checked={
                      sessions.length > 0 &&
                      selectedIds.length === sessions.length
                    }
                    onChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className='w-[70px]'>Image</TableHead>
                <TableHead className='min-w-[200px]'>Course Title &amp; Heading</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Duration &amp; Lessons</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead className='text-center'>Status</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className='h-36 text-center'>
                    <div className='flex items-center justify-center gap-2 text-muted-foreground'>
                      <Loader2 className='h-5 w-5 animate-spin text-primary' />
                      <span>Loading recorded sessions...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className='h-36 text-center'>
                    <div className='text-muted-foreground'>
                      <p className='font-medium'>No recorded sessions found</p>
                      <p className='text-xs mt-1'>
                        Create a recorded course or adjust your search filter.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id} className='hover:bg-muted/30'>
                    {/* Checkbox */}
                    <TableCell>
                      <input
                        type='checkbox'
                        className='rounded border-gray-300'
                        checked={selectedIds.includes(session.id)}
                        onChange={() => handleSelectRow(session.id)}
                      />
                    </TableCell>

                    {/* Thumbnail */}
                    <TableCell>
                      <div className='w-12 h-10 rounded-md overflow-hidden bg-muted flex items-center justify-center border'>
                        {session.thumbnail_url ? (
                          <img
                            src={session.thumbnail_url}
                            alt={session.title}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <Video className='h-4 w-4 text-muted-foreground' />
                        )}
                      </div>
                    </TableCell>

                    {/* Title & Heading */}
                    <TableCell>
                      <div className='min-w-[240px]'>
                        <div className='font-semibold text-sm leading-tight text-foreground line-clamp-1'>
                          {session.title}
                        </div>
                        {session.heading && (
                          <p className='text-xs text-muted-foreground line-clamp-1 mt-0.5'>
                            {session.heading}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      {session.category ? (
                        <Badge variant='outline' className='text-[11px] font-medium'>
                          {session.category.name}
                        </Badge>
                      ) : (
                        <span className='text-xs text-muted-foreground'>—</span>
                      )}
                    </TableCell>

                    {/* Instructor */}
                    <TableCell>
                      <div className='text-xs font-medium'>
                        {session.instructor ? (
                          session.instructor.name
                        ) : (
                          <span className='text-muted-foreground'>Unassigned</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Duration & Lessons */}
                    <TableCell>
                      <div className='text-xs space-y-0.5'>
                        <div className='flex items-center gap-1 text-muted-foreground'>
                          <Clock className='h-3 w-3' />
                          <span>{session.duration || '—'}</span>
                        </div>
                        <div className='flex items-center gap-1 text-muted-foreground'>
                          <BookOpen className='h-3 w-3' />
                          <span>{session.lessons || '—'}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Pricing */}
                    <TableCell>
                      <div className='text-xs'>
                        <span className='font-bold text-emerald-600'>
                          {session.formatted_discount_price || (session.discount_price ? `₹${session.discount_price}` : 'Free')}
                        </span>
                        {session.original_price && (
                          <div className='text-[10px] text-muted-foreground line-through'>
                            {session.formatted_original_price || `₹${session.original_price}`}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Active Toggle */}
                    <TableCell className='text-center'>
                      <Switch
                        checked={session.is_active}
                        onCheckedChange={() => handleToggleStatus(session)}
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-1'>
                        {/* View Button -> Opens Dedicated Course Detail Page */}
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() =>
                            navigate({
                              to: '/recorded-sessions/$recordedSessionId',
                              params: { recordedSessionId: String(session.id) },
                            })
                          }
                          title='View Course Details Page'
                        >
                          <Eye className='h-4 w-4 text-muted-foreground' />
                        </Button>

                        {/* Edit Button */}
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() =>
                            navigate({
                              to: '/recorded-sessions/create',
                              search: { id: String(session.id) },
                            })
                          }
                          title='Edit Course'
                        >
                          <Edit className='h-4 w-4 text-primary' />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => setDeleteId(session.id)}
                          className='text-destructive hover:text-destructive'
                          title='Delete Course'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Recorded Session?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this recorded session? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className='bg-destructive hover:bg-destructive/90 text-destructive-foreground'
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Delete Dialog */}
        <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Selected Sessions?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedIds.length} selected recorded sessions? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDeleteConfirm}
                disabled={isDeleting}
                className='bg-destructive hover:bg-destructive/90 text-destructive-foreground'
              >
                {isDeleting ? 'Deleting...' : 'Delete All'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Main>
    </>
  )
}
