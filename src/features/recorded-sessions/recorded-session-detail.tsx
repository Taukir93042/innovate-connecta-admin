'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Clock,
  BookOpen,
  GraduationCap,
  Sparkles,
} from 'lucide-react'
import { type RecordedSessionItem } from '@/services/admin-recorded-sessions'

interface RecordedSessionDetailProps {
  session: RecordedSessionItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (session: RecordedSessionItem) => void
}

export function RecordedSessionDetail({
  session,
  open,
  onOpenChange,
  onEdit,
}: RecordedSessionDetailProps) {
  if (!session) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl max-h-[85vh] overflow-y-auto p-6'>
        <DialogHeader className='border-b pb-4'>
          <div className='flex items-center gap-2 mb-1'>
            {session.category && (
              <Badge variant='outline' className='text-xs font-semibold'>
                {session.category.name}
              </Badge>
            )}
            <Badge variant={session.is_active ? 'default' : 'secondary'} className='text-xs'>
              {session.is_active ? 'Active' : 'Inactive'}
            </Badge>
            {session.is_featured && (
              <Badge className='bg-amber-500 hover:bg-amber-600 text-white text-xs gap-1'>
                <Sparkles className='h-3 w-3' /> Featured
              </Badge>
            )}
          </div>
          <DialogTitle className='text-xl font-bold'>{session.title}</DialogTitle>
          {session.heading && (
            <p className='text-sm text-muted-foreground mt-1'>{session.heading}</p>
          )}
        </DialogHeader>

        <div className='space-y-6 pt-4'>
          {/* Top Quick Meta */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
            <div className='p-3 rounded-lg border bg-muted/30'>
              <span className='text-[11px] text-muted-foreground block font-medium'>PRICE</span>
              <span className='text-base font-bold text-emerald-600'>
                {session.formatted_discount_price || `₹${session.discount_price || 0}`}
              </span>
              {session.original_price && (
                <span className='text-xs line-through text-muted-foreground ml-1.5'>
                  {session.formatted_original_price || `₹${session.original_price}`}
                </span>
              )}
            </div>

            <div className='p-3 rounded-lg border bg-muted/30'>
              <span className='text-[11px] text-muted-foreground block font-medium flex items-center gap-1'>
                <Clock className='h-3 w-3' /> DURATION
              </span>
              <span className='text-sm font-semibold'>{session.duration || 'N/A'}</span>
            </div>

            <div className='p-3 rounded-lg border bg-muted/30'>
              <span className='text-[11px] text-muted-foreground block font-medium flex items-center gap-1'>
                <BookOpen className='h-3 w-3' /> LESSONS
              </span>
              <span className='text-sm font-semibold'>{session.lessons || 'N/A'}</span>
            </div>

            <div className='p-3 rounded-lg border bg-muted/30'>
              <span className='text-[11px] text-muted-foreground block font-medium flex items-center gap-1'>
                <GraduationCap className='h-3 w-3' /> INSTRUCTOR
              </span>
              <span className='text-sm font-semibold truncate block'>
                {session.instructor?.name || 'Unassigned'}
              </span>
            </div>
          </div>

          {/* Thumbnail preview if present */}
          {session.thumbnail_url && (
            <div className='rounded-lg overflow-hidden border aspect-video max-h-56 bg-black flex items-center justify-center'>
              <img
                src={session.thumbnail_url}
                alt={session.title}
                className='w-full h-full object-cover'
              />
            </div>
          )}

          {/* Section 1: Course Overview (Editor 1 content) */}
          {session.course_overview && (
            <div className='space-y-2'>
              <h4 className='text-sm font-bold uppercase tracking-wider text-primary border-b pb-1'>
                Course Overview (About This Masterclass)
              </h4>
              <div
                className='prose prose-sm dark:prose-invert max-w-none text-muted-foreground text-sm'
                dangerouslySetInnerHTML={{ __html: session.course_overview }}
              />
            </div>
          )}

          {/* Section 2: What You'll Learn (Editor 2 content) */}
          {session.what_you_will_learn && (
            <div className='space-y-2'>
              <h4 className='text-sm font-bold uppercase tracking-wider text-emerald-600 border-b pb-1'>
                What You'll Learn / Key Highlights
              </h4>
              <div
                className='prose prose-sm dark:prose-invert max-w-none text-muted-foreground text-sm'
                dangerouslySetInnerHTML={{ __html: session.what_you_will_learn }}
              />
            </div>
          )}

          {/* Assigned Instructor Card */}
          {session.instructor && (
            <div className='p-4 rounded-xl border bg-card flex items-center gap-4'>
              <Avatar className='h-12 w-12 border'>
                <AvatarImage src={session.instructor.image_url || undefined} alt={session.instructor.name} />
                <AvatarFallback className='bg-primary/10 text-primary font-bold'>
                  {session.instructor.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h5 className='text-sm font-bold'>{session.instructor.name}</h5>
                <p className='text-xs text-muted-foreground'>{session.instructor.designation}</p>
                {session.instructor.experience && (
                  <p className='text-[11px] text-muted-foreground mt-0.5'>{session.instructor.experience}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className='flex items-center justify-end gap-2 border-t pt-4 mt-6'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onEdit && (
            <Button
              onClick={() => {
                onOpenChange(false)
                onEdit(session)
              }}
            >
              Edit Session
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
