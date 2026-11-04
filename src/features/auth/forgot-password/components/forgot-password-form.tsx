import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react'
import { adminAuthService } from '@/services/admin-auth'
import { getApiErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/utils'
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
import { Alert, AlertDescription } from '@/components/ui/alert'

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
})

export function ForgotPasswordForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await adminAuthService.forgotPassword({
        email: data.email.trim(),
        admin_url: typeof window !== 'undefined' ? window.location.origin : undefined,
      })

      setIsSuccess(true)
      setSuccessMessage(
        response.message ||
          'If this email is registered, you will receive a password reset link shortly.'
      )
      form.reset()
    } catch (err: unknown) {
      const msg = getApiErrorMessage(
        err,
        'Unable to send reset link. Please try again later.'
      )
      setErrorMessage(msg)
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
            <span className='font-semibold block mb-1'>Check Your Inbox</span>
            {successMessage}
          </AlertDescription>
        </Alert>
        <p className='text-xs text-muted-foreground leading-relaxed'>
          The reset link will remain valid for <strong>30 minutes</strong>. If you
          don't see the email, please check your spam or junk folder.
        </p>
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            setIsSuccess(false)
            setSuccessMessage(null)
          }}
          className='w-full'
        >
          Send to a different email
        </Button>
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
          <Alert variant='destructive' className='py-2 px-3'>
            <ShieldAlert className='h-4 w-4' />
            <AlertDescription className='text-xs'>
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admin Email</FormLabel>
              <FormControl>
                <Input
                  type='email'
                  placeholder='admin@gmail.com'
                  autoComplete='email'
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
              Sending Link...
            </>
          ) : (
            <>
              Send Reset Link
              <ArrowRight className='ml-2 h-4 w-4' />
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
