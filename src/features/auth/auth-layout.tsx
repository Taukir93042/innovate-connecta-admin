import { InnovateLogo } from '@/components/innovate-logo'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='container grid h-svh max-w-none items-center justify-center'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-4 py-8 sm:p-8'>
        <div className='mb-2 flex items-center justify-center'>
          <InnovateLogo iconSize='size-11' textSize='text-2xl' />
        </div>
        {children}
      </div>
    </div>
  )
}
