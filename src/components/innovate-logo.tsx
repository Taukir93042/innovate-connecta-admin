import { cn } from '@/lib/utils'

interface InnovateLogoProps {
  className?: string
  iconSize?: string
  textSize?: string
  showText?: boolean
}

export function InnovateLogo({
  className,
  iconSize = 'size-10',
  textSize = 'text-2xl',
  showText = true,
}: InnovateLogoProps) {
  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-white p-1 shadow-sm shrink-0',
          iconSize
        )}
      >
        <img
          src='/images/logo.png'
          alt='InnoVate Connecta'
          className='size-full object-contain'
        />
      </div>
      {showText && (
        <div className={cn('font-bold tracking-tight leading-none flex items-center gap-1.5', textSize)}>
          <span className='text-foreground'>InnoVate</span>
          <span className='text-[#ea580c] dark:text-[#f97316]'>Connecta</span>
        </div>
      )}
    </div>
  )
}
