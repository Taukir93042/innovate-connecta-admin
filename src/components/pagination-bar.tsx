import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getPageNumbers } from '@/lib/utils'

export interface PaginationBarProps {
  currentPage: number
  totalPages: number
  totalItems: number
  perPage: number
  onPageChange: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  itemName?: string
  className?: string
}

export function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
  onPerPageChange,
  itemName = 'entries',
  className = '',
}: PaginationBarProps) {
  if (totalItems <= 0) return null

  const from = Math.min((currentPage - 1) * perPage + 1, totalItems)
  const to = Math.min(currentPage * perPage, totalItems)
  const pageNumbers = getPageNumbers(currentPage, totalPages)

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 py-4 px-1 text-sm ${className}`}
    >
      {/* Left: Entries Counter & Rows per page */}
      <div className='flex flex-wrap items-center gap-3 text-muted-foreground text-xs sm:text-sm'>
        <span>
          Showing <strong className='text-foreground font-semibold'>{from}</strong> to{' '}
          <strong className='text-foreground font-semibold'>{to}</strong> of{' '}
          <strong className='text-foreground font-semibold'>{totalItems}</strong> {itemName}
        </span>

        {onPerPageChange && (
          <div className='flex items-center gap-1.5 ml-2'>
            <span className='text-xs'>Rows:</span>
            <Select
              value={String(perPage)}
              onValueChange={(val) => onPerPageChange(Number(val))}
            >
              <SelectTrigger className='h-7 w-[70px] text-xs'>
                <SelectValue placeholder={String(perPage)} />
              </SelectTrigger>
              <SelectContent side='top'>
                <SelectItem value='5'>5</SelectItem>
                <SelectItem value='10'>10</SelectItem>
                <SelectItem value='20'>20</SelectItem>
                <SelectItem value='50'>50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Controls */}
      {totalPages > 1 && (
        <div className='flex items-center gap-1 ml-auto'>
          {/* First Page */}
          <Button
            variant='outline'
            size='icon'
            className='h-8 w-8 hidden sm:inline-flex'
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            title='First Page'
          >
            <ChevronsLeft className='h-4 w-4' />
          </Button>

          {/* Previous Page */}
          <Button
            variant='outline'
            size='icon'
            className='h-8 w-8'
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            title='Previous Page'
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>

          {/* Page Numbers */}
          <div className='flex items-center gap-1'>
            {pageNumbers.map((page, idx) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className='px-2 text-xs text-muted-foreground select-none'
                  >
                    ...
                  </span>
                )
              }

              const pageNum = Number(page)
              const isActive = pageNum === currentPage

              return (
                <Button
                  key={pageNum}
                  variant={isActive ? 'default' : 'outline'}
                  size='sm'
                  className={`h-8 min-w-[32px] px-2 text-xs font-medium ${
                    isActive ? 'pointer-events-none shadow-xs' : ''
                  }`}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          {/* Next Page */}
          <Button
            variant='outline'
            size='icon'
            className='h-8 w-8'
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            title='Next Page'
          >
            <ChevronRight className='h-4 w-4' />
          </Button>

          {/* Last Page */}
          <Button
            variant='outline'
            size='icon'
            className='h-8 w-8 hidden sm:inline-flex'
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            title='Last Page'
          >
            <ChevronsRight className='h-4 w-4' />
          </Button>
        </div>
      )}
    </div>
  )
}
