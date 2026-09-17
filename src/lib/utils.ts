import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sleep(ms: number = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generates page numbers for pagination with ellipsis
 */
export function getPageNumbers(currentPage: number, totalPages: number) {
  const maxVisiblePages = 5 // Maximum number of page buttons to show
  const rangeWithDots = []

  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      rangeWithDots.push(i)
    }
  } else {
    rangeWithDots.push(1)

    if (currentPage <= 3) {
      for (let i = 2; i <= 4; i++) {
        rangeWithDots.push(i)
      }
      rangeWithDots.push('...', totalPages)
    } else if (currentPage >= totalPages - 2) {
      rangeWithDots.push('...')
      for (let i = totalPages - 3; i <= totalPages; i++) {
        rangeWithDots.push(i)
      }
    } else {
      rangeWithDots.push('...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        rangeWithDots.push(i)
      }
      rangeWithDots.push('...', totalPages)
    }
  }

  return rangeWithDots
}

/**
 * Initials from a display name
 */
export function getDisplayNameInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  const first = parts[0][0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  return (first + last).toUpperCase()
}

/**
 * Helper to get full storage URL for Laravel uploaded images
 */
export function getStorageUrl(path?: string | null): string {
  if (!path) return ''
  if (path.startsWith('data:') || path.startsWith('blob:')) {
    return path
  }

  const backendBase = (
    import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
  ).replace(/\/api\/v1\/?$/, '')

  // If path is already a full URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path)
      // If it contains /storage/, redirect to backendBase to guarantee correct port
      if (url.pathname.includes('/storage/')) {
        const storageIndex = url.pathname.indexOf('/storage/')
        const relativeStoragePath = url.pathname.slice(storageIndex)
        return `${backendBase}${relativeStoragePath}`
      }
      return path
    } catch {
      return path
    }
  }

  return `${backendBase}/storage/${path.replace(/^\/+/, '')}`
}
