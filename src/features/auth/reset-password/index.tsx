import { Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { ResetPasswordForm } from './components/reset-password-form'

interface ResetPasswordProps {
  token?: string
  email?: string
}

export function ResetPassword({ token, email }: ResetPasswordProps) {
  return (
    <AuthLayout>
      <Card className='max-w-sm gap-4 sm:min-w-sm'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Reset Password
          </CardTitle>
          <CardDescription>
            Enter your new password below. It must be at least 6 characters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm token={token || ''} email={email || ''} />
        </CardContent>
        <CardFooter>
          <p className='mx-auto px-8 text-center text-sm text-balance text-muted-foreground'>
            Remember your credentials?{' '}
            <Link
              to='/sign-in'
              className='font-medium underline underline-offset-4 hover:text-primary'
            >
              Back to Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
