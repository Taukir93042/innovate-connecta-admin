import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
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
import { Input } from '@/components/ui/input'

const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters.')
    .max(50, 'Name must not be longer than 50 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().max(20, 'Phone number too long.').optional().or(z.literal('')),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
  const { auth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: auth.user?.name || '',
      email: auth.user?.email || '',
      phone: auth.user?.phone || '',
    },
  })

  // Fetch freshest profile on mount
  useEffect(() => {
    let isMounted = true
    async function loadProfile() {
      setIsFetching(true)
      try {
        const res = await adminAuthService.getProfile()
        if (isMounted && res.status && res.data?.admin) {
          auth.setUser(res.data.admin)
          form.reset({
            name: res.data.admin.name || '',
            email: res.data.admin.email || '',
            phone: res.data.admin.phone || '',
          })
        }
      } catch (err: unknown) {
        if (isMounted) {
          toast.error(getApiErrorMessage(err))
        }
      } finally {
        if (isMounted) {
          setIsFetching(false)
        }
      }
    }

    loadProfile()
    return () => {
      isMounted = false
    }
  }, [])

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true)
    try {
      const res = await adminAuthService.updateProfile({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
      })

      if (res.status && res.data?.admin) {
        auth.setUser(res.data.admin)
        toast.success(res.message || 'Profile updated successfully.')
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 max-w-xl'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  placeholder='Admin Name'
                  disabled={isLoading || isFetching}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Your display name in the administration portal.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admin Email</FormLabel>
              <FormControl>
                <Input
                  type='email'
                  placeholder='admin@example.com'
                  disabled={isLoading || isFetching}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The email address used to log in to the admin account.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='phone'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input
                  placeholder='+1 (555) 000-0000'
                  disabled={isLoading || isFetching}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional contact phone number.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' disabled={isLoading || isFetching}>
          {isLoading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Saving changes...
            </>
          ) : (
            <>
              <Save className='mr-2 h-4 w-4' />
              Update profile
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
