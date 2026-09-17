import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { adminAuthService } from '@/services/admin-auth'
import { getApiErrorMessage } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { PasswordInput } from '@/components/password-input'

const changePasswordSchema = z
  .object({
    current_password: z
      .string()
      .min(1, 'Please enter your current password.'),
    new_password: z
      .string()
      .min(5, 'New password must be at least 5 characters long.'),
    new_password_confirmation: z
      .string()
      .min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.new_password === data.new_password_confirmation, {
    message: 'The new password confirmation does not match.',
    path: ['new_password_confirmation'],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: 'The new password must be different from your current password.',
    path: ['new_password'],
  })

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

export function AccountForm() {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      new_password_confirmation: '',
    },
  })

  async function onSubmit(data: ChangePasswordFormValues) {
    setIsLoading(true)
    try {
      const res = await adminAuthService.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
        new_password_confirmation: data.new_password_confirmation,
      })

      if (res.status) {
        toast.success(res.message || 'Password changed successfully.')
        form.reset({
          current_password: '',
          new_password: '',
          new_password_confirmation: '',
        })
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='space-y-6 max-w-xl'>
      <div className='flex items-center gap-3 p-4 border rounded-lg bg-muted/40'>
        <ShieldCheck className='h-8 w-8 text-primary shrink-0' />
        <div>
          <h4 className='text-sm font-semibold'>Password & Security</h4>
          <p className='text-xs text-muted-foreground'>
            Ensure your account is using a secure and strong password.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <FormField
            control={form.control}
            name='current_password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder='••••••••'
                    autoComplete='current-password'
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Enter your current password to authorize changes.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='new_password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder='••••••••'
                    autoComplete='new-password'
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Must be at least 5 characters long and different from current password.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='new_password_confirmation'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder='••••••••'
                    autoComplete='new-password'
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type='submit' disabled={isLoading} className='mt-2'>
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Updating password...
              </>
            ) : (
              <>
                <KeyRound className='mr-2 h-4 w-4' />
                Change password
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
