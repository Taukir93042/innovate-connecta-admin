import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { adminAuthService } from '@/services/admin-auth'
import { CheckCircle2, KeyRound, Loader2, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

const formSchema = z
  .object({
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long.'),
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'The passwords do not match.',
    path: ['confirmPassword'],
  })

interface ResetPasswordFormProps extends React.HTMLAttributes<HTMLFormElement> {
  token: string
  email: string
}

export function ResetPasswordForm({
  token,
  email,
  className,
  ...props
}: ResetPasswordFormProps) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    // Sanitize address bar to strip sensitive token after loading into component
    if (token && typeof window !== 'undefined') {
      const cleanUrl =
        window.location.pathname +
        (email ? `?email=${encodeURIComponent(email)}` : '')
      window.history.replaceState(null, '', cleanUrl)
    }
  }, [token, email])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setErrorMessage(null)

    if (!token || !email) {
      setErrorMessage(
        'Invalid reset request. The token or email is missing from the link.'
      )
      setIsLoading(false)
      return
    }

    try {
      const response = await adminAuthService.resetPassword({
        token,
        email,
        password: data.password,
        password_confirmation: data.confirmPassword,
      })

      setIsSuccess(true)
      toast.success(response.message || 'Admin password reset successfully!')
    } catch (err: unknown) {
      const msg = getApiErrorMessage(
        err,
        'Failed to reset password. The link may have expired or is invalid.'
      )
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className={cn('grid gap-4 py-2', className)}>
        <Alert className='border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'>
          <CheckCircle2 className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />
          <AlertDescription className='text-xs leading-relaxed'>
            <span className='mb-1 block font-semibold'>Password Updated!</span>
            Your admin password has been securely updated. You can now log in
            with your new credentials.
          </AlertDescription>
        </Alert>

        <Button onClick={() => navigate({ to: '/sign-in' })} className='w-full'>
          Sign In with New Password
        </Button>
      </div>
    )
  }

  if (!token || !email) {
    return (
      <div className={cn('grid gap-4 py-2', className)}>
        <Alert variant='destructive'>
          <ShieldAlert className='h-4 w-4' />
          <AlertDescription className='text-xs leading-relaxed'>
            <span className='mb-1 block font-semibold'>Invalid Link</span>
            This password reset link is invalid or incomplete. Please request a
            new link.
          </AlertDescription>
        </Alert>

        <Link
          to='/forgot-password'
          className='w-full text-center text-xs text-primary underline underline-offset-4'
        >
          Request new reset link
        </Link>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        {errorMessage && (
          <Alert variant='destructive' className='px-3 py-2'>
            <ShieldAlert className='h-4 w-4' />
            <AlertDescription className='text-xs'>
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <div className='grid gap-1.5'>
          <FormLabel className='text-xs text-muted-foreground'>
            Admin Email
          </FormLabel>
          <Input
            value={email}
            disabled
            readOnly
            className='cursor-not-allowed bg-muted/50'
          />
        </div>

        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder='At least 6 characters'
                  autoComplete='new-password'
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder='Repeat new password'
                  autoComplete='new-password'
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className='mt-2 w-full' disabled={isLoading} type='submit'>
          {isLoading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Resetting Password...
            </>
          ) : (
            <>
              <KeyRound className='mr-2 h-4 w-4' />
              Reset Password
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
