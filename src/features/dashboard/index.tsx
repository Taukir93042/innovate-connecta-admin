import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
 
import {
  Users,
  Video,
  MessageSquare,
  Mail,
  Image as ImageIcon,
  Star,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Plus,
  CheckCircle2,
  Calendar,
  Eye,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'
import { useAuthStore } from '@/stores/auth-store'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { getDisplayNameInitials, getStorageUrl } from '@/lib/utils'

import { adminSessionService, getCategoryName, type SessionItem } from '@/services/admin-sessions'
import { adminUserService, type UserItem } from '@/services/admin-users'
import { adminContactService, type ContactItem } from '@/services/admin-contacts'
import { adminFeedbackService, type FeedbackItem } from '@/services/admin-feedback'
import { adminGalleryService, type GalleryItem } from '@/services/admin-gallery'
import { adminTestimonialService, type TestimonialItem } from '@/services/admin-testimonials'

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1']

export function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.auth.user)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Data states
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [galleries, setGalleries] = useState<GalleryItem[]>([])
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([])

  async function loadDashboardData() {
    try {
      const [
        sessionsRes,
        usersRes,
        contactsRes,
        feedbacksRes,
        galleriesRes,
        testimonialsRes,
      ] = await Promise.allSettled([
        adminSessionService.getSessions({ all: true }),
        adminUserService.getUsers({ all: true }),
        adminContactService.getContacts({ all: true }),
        adminFeedbackService.getFeedbacks({ all: true }),
        adminGalleryService.getGalleries({ all: true }),
        adminTestimonialService.getTestimonials({ all: true }),
      ])

      if (sessionsRes.status === 'fulfilled' && sessionsRes.value?.data) {
        setSessions(Array.isArray(sessionsRes.value.data) ? sessionsRes.value.data : [])
      }
      if (usersRes.status === 'fulfilled' && usersRes.value?.data) {
        const uData = usersRes.value.data
        if (Array.isArray(uData)) {
          setUsers(uData)
        } else if (uData && Array.isArray((uData as any).users)) {
          setUsers((uData as any).users)
        }
      }
      if (contactsRes.status === 'fulfilled' && contactsRes.value?.data) {
        setContacts(Array.isArray(contactsRes.value.data) ? contactsRes.value.data : [])
      }
      if (feedbacksRes.status === 'fulfilled' && feedbacksRes.value?.data) {
        setFeedbacks(Array.isArray(feedbacksRes.value.data) ? feedbacksRes.value.data : [])
      }
      if (galleriesRes.status === 'fulfilled' && galleriesRes.value?.data) {
        setGalleries(Array.isArray(galleriesRes.value.data) ? galleriesRes.value.data : [])
      }
      if (testimonialsRes.status === 'fulfilled' && testimonialsRes.value?.data) {
        setTestimonials(Array.isArray(testimonialsRes.value.data) ? testimonialsRes.value.data : [])
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadDashboardData()
  }

  // Computed metrics
  const activeSessionsCount = sessions.filter((s) => s.is_active).length
  const unreadInquiriesCount = contacts.filter((c) => !c.is_read).length
  const activeUsersCount = users.filter((u) => u.is_active).length
  const activeGalleriesCount = galleries.filter((g) => g.is_active).length
  const activeTestimonialsCount = testimonials.filter((t) => t.is_active).length

  // Sessions by Category for Chart
  const categoryMap: Record<string, number> = {}
  sessions.forEach((s) => {
    const name = getCategoryName(s.category)
    categoryMap[name] = (categoryMap[name] || 0) + 1
  })
  const categoryChartData = Object.entries(categoryMap).map(([name, value], idx) => ({
    name,
    value,
    color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
  }))

  // Platform Distribution Data
  const distributionChartData = [
    { name: 'Sessions', count: sessions.length, active: activeSessionsCount, fill: '#3b82f6' },
    { name: 'Users', count: users.length, active: activeUsersCount, fill: '#10b981' },
    { name: 'Inquiries', count: contacts.length, active: contacts.length - unreadInquiriesCount, fill: '#f59e0b' },
    { name: 'Feedbacks', count: feedbacks.length, active: feedbacks.length, fill: '#8b5cf6' },
    { name: 'Gallery', count: galleries.length, active: activeGalleriesCount, fill: '#06b6d4' },
    { name: 'Testimonials', count: testimonials.length, active: activeTestimonialsCount, fill: '#ec4899' },
  ]

  // Dynamic Greeting based on time
  const currentHour = new Date().getHours()
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening'

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-6 pb-12'>
        {/* ===== HERO WELCOME BANNER ===== */}
        <div className='relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-background p-6 md:p-8 shadow-xs'>
          <div className='relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center'>
            <div className='space-y-1.5'>
              <div className='flex items-center gap-2'>
                <Badge variant='outline' className='bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-0.5'>
                  <Sparkles className='mr-1 size-3' /> Admin Portal
                </Badge>
                <span className='text-xs text-muted-foreground flex items-center gap-1 font-medium'>
                  <Calendar className='size-3.5' /> {todayFormatted}
                </span>
              </div>
              <h1 className='text-2xl font-extrabold tracking-tight md:text-3xl lg:text-4xl text-foreground'>
               <span>
  {greeting}, {user?.name || "Administrator"}!
  <Sparkles className="inline-block ml-2 w-5 h-5" />
</span>
              </h1>
             <p className="text-sm text-muted-foreground">
  Manage your Innovate Connecta dashboard with ease.
</p>
            </div>

            {/* Quick Action Buttons */}
            <div className='flex flex-wrap items-center gap-2.5 shrink-0'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className='h-9 gap-1.5'
              >
                <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
              <Button
                size='sm'
                onClick={() => navigate({ to: '/sessions/create' })}
                className='h-9 gap-1.5 shadow-sm'
              >
                <Plus className='size-4' />
                Create Session
              </Button>
            </div>
          </div>

          {/* Decorative subtle background gradient blur */}
          <div className='absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none' />
          <div className='absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none' />
        </div>

        {/* ===== METRIC STATS CARDS ===== */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'>
          {/* Card 1: Sessions */}
          <Card
            className='group relative cursor-pointer overflow-hidden border transition-all duration-200 hover:border-primary/50 hover:shadow-md'
            onClick={() => navigate({ to: '/sessions' })}
          >
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
              <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                Sessions
              </span>
              <div className='flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors'>
                <Video className='size-4' />
              </div>
            </CardHeader>
            <CardContent className='pt-0'>
              {isLoading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <>
                  <div className='text-2xl font-bold'>{sessions.length}</div>
                  <div className='mt-1 flex items-center justify-between text-xs text-muted-foreground'>
                    <span className='text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5'>
                      <CheckCircle2 className='size-3' /> {activeSessionsCount} active
                    </span>
                    <ArrowUpRight className='size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary' />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Registered Users */}
          <Card
            className='group relative cursor-pointer overflow-hidden border transition-all duration-200 hover:border-primary/50 hover:shadow-md'
            onClick={() => navigate({ to: '/users' })}
          >
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
              <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                Students / Users
              </span>
              <div className='flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors'>
                <Users className='size-4' />
              </div>
            </CardHeader>
            <CardContent className='pt-0'>
              {isLoading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <>
                  <div className='text-2xl font-bold'>{users.length}</div>
                  <div className='mt-1 flex items-center justify-between text-xs text-muted-foreground'>
                    <span className='text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5'>
                      <ShieldCheck className='size-3' /> {activeUsersCount} active
                    </span>
                    <ArrowUpRight className='size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary' />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Contact Inquiries */}
          <Card
            className='group relative cursor-pointer overflow-hidden border transition-all duration-200 hover:border-primary/50 hover:shadow-md'
            onClick={() => navigate({ to: '/contacts' })}
          >
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
              <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                Inquiries
              </span>
              <div className='flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors'>
                <Mail className='size-4' />
              </div>
            </CardHeader>
            <CardContent className='pt-0'>
              {isLoading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <>
                  <div className='text-2xl font-bold'>{contacts.length}</div>
                  <div className='mt-1 flex items-center justify-between text-xs text-muted-foreground'>
                    {unreadInquiriesCount > 0 ? (
                      <span className='text-amber-600 dark:text-amber-400 font-medium'>
                        {unreadInquiriesCount} unread
                      </span>
                    ) : (
                      <span className='text-muted-foreground'>All read</span>
                    )}
                    <ArrowUpRight className='size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary' />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Feedbacks */}
          <Card
            className='group relative cursor-pointer overflow-hidden border transition-all duration-200 hover:border-primary/50 hover:shadow-md'
            onClick={() => navigate({ to: '/feedbacks' })}
          >
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
              <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                Feedbacks
              </span>
              <div className='flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors'>
                <MessageSquare className='size-4' />
              </div>
            </CardHeader>
            <CardContent className='pt-0'>
              {isLoading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <>
                  <div className='text-2xl font-bold'>{feedbacks.length}</div>
                  <div className='mt-1 flex items-center justify-between text-xs text-muted-foreground'>
                    <span>Responses</span>
                    <ArrowUpRight className='size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary' />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 5: Gallery */}
          <Card
            className='group relative cursor-pointer overflow-hidden border transition-all duration-200 hover:border-primary/50 hover:shadow-md'
            onClick={() => navigate({ to: '/galleries' })}
          >
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
              <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                Gallery Media
              </span>
              <div className='flex size-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500 group-hover:bg-cyan-500 group-hover:text-white transition-colors'>
                <ImageIcon className='size-4' />
              </div>
            </CardHeader>
            <CardContent className='pt-0'>
              {isLoading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <>
                  <div className='text-2xl font-bold'>{galleries.length}</div>
                  <div className='mt-1 flex items-center justify-between text-xs text-muted-foreground'>
                    <span>{activeGalleriesCount} published</span>
                    <ArrowUpRight className='size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary' />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 6: Testimonials */}
          <Card
            className='group relative cursor-pointer overflow-hidden border transition-all duration-200 hover:border-primary/50 hover:shadow-md'
            onClick={() => navigate({ to: '/testimonials' })}
          >
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
              <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                Testimonials
              </span>
              <div className='flex size-8 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-colors'>
                <Star className='size-4' />
              </div>
            </CardHeader>
            <CardContent className='pt-0'>
              {isLoading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <>
                  <div className='text-2xl font-bold'>{testimonials.length}</div>
                  <div className='mt-1 flex items-center justify-between text-xs text-muted-foreground'>
                    <span>{activeTestimonialsCount} approved</span>
                    <ArrowUpRight className='size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary' />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ===== ANALYTICS CHARTS SECTION ===== */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Distribution Bar Chart */}
          <Card className='lg:col-span-2 border'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <div>
                <CardTitle className='text-base font-bold flex items-center gap-2'>
                  <TrendingUp className='size-4 text-primary' />
                  Content & Interaction Distribution
                </CardTitle>
                <CardDescription>
                  Summary overview of platform assets, records and inquiries
                </CardDescription>
              </div>
              <Badge variant='outline' className='text-xs font-medium'>
                Live Metrics
              </Badge>
            </CardHeader>
            <CardContent className='pt-4'>
              {isLoading ? (
                <div className='h-[260px] flex items-center justify-center'>
                  <Skeleton className='h-[240px] w-full' />
                </div>
              ) : (
                <div className='h-[260px] w-full'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={distributionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray='3 3' className='stroke-muted/40' vertical={false} />
                      <XAxis dataKey='name' className='text-xs fill-muted-foreground' tickLine={false} axisLine={false} />
                      <YAxis className='text-xs fill-muted-foreground' tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          borderColor: 'var(--border)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                        }}
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                      />
                      <Bar dataKey='count' name='Total Records' radius={[6, 6, 0, 0]}>
                        {distributionChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sessions by Category Breakdown */}
          <Card className='border'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base font-bold flex items-center gap-2'>
                <Layers className='size-4 text-primary' />
                Sessions by Category
              </CardTitle>
              <CardDescription>
                Categorical breakdown of workshop programs
              </CardDescription>
            </CardHeader>
            <CardContent className='pt-2'>
              {isLoading ? (
                <div className='h-[260px] flex items-center justify-center'>
                  <Skeleton className='h-[200px] w-[200px] rounded-full' />
                </div>
              ) : categoryChartData.length === 0 ? (
                <div className='h-[260px] flex flex-col items-center justify-center text-center text-muted-foreground text-xs'>
                  <Layers className='size-8 opacity-40 mb-2' />
                  No session categories recorded yet
                </div>
              ) : (
                <div className='flex flex-col gap-4'>
                  <div className='h-[160px] w-full'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          dataKey='value'
                          nameKey='name'
                          cx='50%'
                          cy='50%'
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--card)',
                            borderColor: 'var(--border)',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Custom Category Legend List */}
                  <div className='flex flex-col gap-2 max-h-[90px] overflow-y-auto pr-1 text-xs'>
                    {categoryChartData.map((cat) => (
                      <div key={cat.name} className='flex items-center justify-between'>
                        <span className='flex items-center gap-2 truncate'>
                          <span className='size-2.5 rounded-full shrink-0' style={{ backgroundColor: cat.color }} />
                          <span className='truncate font-medium'>{cat.name}</span>
                        </span>
                        <span className='font-mono font-semibold text-muted-foreground'>
                          {cat.value} {cat.value === 1 ? 'Session' : 'Sessions'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ===== RECENT ACTIVITY & CONTENT GRIDS ===== */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Recent Live/Upcoming Sessions */}
          <Card className='border'>
            <CardHeader className='flex flex-row items-center justify-between pb-3'>
              <div>
                <CardTitle className='text-base font-bold flex items-center gap-2'>
                  <Video className='size-4 text-primary' />
                  Recent Sessions
                </CardTitle>
                <CardDescription>
                  Recently configured workshops and live training modules
                </CardDescription>
              </div>
              <Button
                variant='ghost'
                size='sm'
                className='text-xs h-8 gap-1'
                onClick={() => navigate({ to: '/sessions' })}
              >
                View All <ChevronRight className='size-3.5' />
              </Button>
            </CardHeader>
            <CardContent className='pt-0'>
              {isLoading ? (
                <div className='flex flex-col gap-3'>
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className='h-12 w-full' />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className='py-8 text-center text-xs text-muted-foreground'>
                  No sessions created yet. Click "Create Session" above.
                </div>
              ) : (
                <div className='divide-y divide-border/60'>
                  {sessions.slice(0, 5).map((s) => {
                    const cover =
                      s.images?.find((img) => img.is_primary)?.image_url ||
                      (s.images?.[0]?.image ? getStorageUrl(s.images[0].image) : null) ||
                      s.image_url

                    return (
                      <div
                        key={s.id}
                        className='group flex items-center justify-between py-3 hover:bg-muted/30 px-2 rounded-lg transition-colors cursor-pointer'
                        onClick={() =>
                          navigate({
                            to: '/sessions/$sessionId',
                            params: { sessionId: String(s.id) },
                          })
                        }
                      >
                        <div className='flex items-center gap-3 min-w-0'>
                          <div className='relative size-10 shrink-0 overflow-hidden rounded-md border bg-muted flex items-center justify-center'>
                            {cover ? (
                              <img src={cover} alt={s.title} className='h-full w-full object-cover' />
                            ) : (
                              <ImageIcon className='size-4 text-muted-foreground/50' />
                            )}
                          </div>
                          <div className='min-w-0 flex-1'>
                            <p className='font-semibold text-sm truncate group-hover:text-primary transition-colors'>
                              {s.title}
                            </p>
                            <div className='flex items-center gap-2 mt-0.5'>
                              <Badge variant='outline' className='text-[10px] px-1.5 py-0 font-normal'>
                                {getCategoryName(s.category)}
                              </Badge>
                              <span className='text-[11px] text-muted-foreground font-mono'>
                                /{s.slug}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className='flex items-center gap-2 shrink-0'>
                          <Badge
                            variant={s.is_active ? 'default' : 'secondary'}
                            className={
                              s.is_active
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]'
                                : 'text-muted-foreground text-[10px]'
                            }
                          >
                            {s.is_active ? 'Active' : 'Hidden'}
                          </Badge>
                          <Button variant='ghost' size='icon' className='size-7 opacity-60 group-hover:opacity-100'>
                            <Eye className='size-3.5' />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Inquiries & Feedbacks Tabs */}
          <Card className='border'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='text-base font-bold flex items-center gap-2'>
                    <Zap className='size-4 text-primary' />
                    Recent Submissions
                  </CardTitle>
                  <CardDescription>
                    Latest contact form inquiries and session feedbacks
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-0'>
              <Tabs defaultValue='inquiries' className='w-full'>
                <TabsList className='grid grid-cols-2 w-full mb-3'>
                  <TabsTrigger value='inquiries' className='text-xs flex items-center gap-1.5'>
                    <Mail className='size-3.5' /> Inquiries ({contacts.length})
                  </TabsTrigger>
                  <TabsTrigger value='feedbacks' className='text-xs flex items-center gap-1.5'>
                    <MessageSquare className='size-3.5' /> Feedbacks ({feedbacks.length})
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Inquiries */}
                <TabsContent value='inquiries' className='mt-0'>
                  {isLoading ? (
                    <div className='flex flex-col gap-3'>
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className='h-12 w-full' />
                      ))}
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className='py-8 text-center text-xs text-muted-foreground'>
                      No contact inquiries received yet.
                    </div>
                  ) : (
                    <div className='divide-y divide-border/60'>
                      {contacts.slice(0, 5).map((c) => (
                        <div
                          key={c.id}
                          className='group flex items-center justify-between py-3 hover:bg-muted/30 px-2 rounded-lg transition-colors cursor-pointer'
                          onClick={() => navigate({ to: '/contacts' })}
                        >
                          <div className='flex items-center gap-2.5 min-w-0'>
                            <Avatar className='size-8 border shrink-0'>
                              <AvatarFallback className='bg-primary/10 text-primary font-semibold text-xs'>
                                {getDisplayNameInitials(c.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className='min-w-0 flex-1'>
                              <div className='flex items-center gap-2'>
                                <p className='font-semibold text-xs truncate'>{c.name}</p>
                                {!c.is_read && (
                                  <span className='size-2 rounded-full bg-emerald-500 shrink-0' title='New inquiry' />
                                )}
                              </div>
                              <p className='text-[11px] text-muted-foreground truncate'>
                                {c.subject || c.message || c.email}
                              </p>
                            </div>
                          </div>

                          <div className='text-end text-[11px] text-muted-foreground shrink-0 font-mono'>
                            {c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className='mt-3 pt-2 border-t text-center'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='w-full text-xs h-8 text-muted-foreground hover:text-foreground'
                      onClick={() => navigate({ to: '/contacts' })}
                    >
                      View All Inquiries <ChevronRight className='size-3.5 ml-1' />
                    </Button>
                  </div>
                </TabsContent>

                {/* Tab: Feedbacks */}
                <TabsContent value='feedbacks' className='mt-0'>
                  {isLoading ? (
                    <div className='flex flex-col gap-3'>
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className='h-12 w-full' />
                      ))}
                    </div>
                  ) : feedbacks.length === 0 ? (
                    <div className='py-8 text-center text-xs text-muted-foreground'>
                      No session feedbacks submitted yet.
                    </div>
                  ) : (
                    <div className='divide-y divide-border/60'>
                      {feedbacks.slice(0, 5).map((f) => (
                        <div
                          key={f.id}
                          className='group flex items-center justify-between py-3 hover:bg-muted/30 px-2 rounded-lg transition-colors cursor-pointer'
                          onClick={() => navigate({ to: '/feedbacks' })}
                        >
                          <div className='flex items-center gap-2.5 min-w-0'>
                            <Avatar className='size-8 border shrink-0'>
                              <AvatarFallback className='bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold text-xs'>
                                {getDisplayNameInitials(f.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className='min-w-0 flex-1'>
                              <p className='font-semibold text-xs truncate'>{f.name}</p>
                              <p className='text-[11px] text-muted-foreground truncate'>
                                {f.session_name || f.key_takeaway || 'General Session'}
                              </p>
                            </div>
                          </div>

                          <div className='text-end text-[11px] text-muted-foreground shrink-0 font-mono'>
                            {f.created_at ? new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className='mt-3 pt-2 border-t text-center'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='w-full text-xs h-8 text-muted-foreground hover:text-foreground'
                      onClick={() => navigate({ to: '/feedbacks' })}
                    >
                      View All Feedbacks <ChevronRight className='size-3.5 ml-1' />
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* ===== QUICK NAVIGATION SHORTCUTS ===== */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h2 className='text-base font-bold tracking-tight'>Quick Navigation & Management</h2>
            <span className='text-xs text-muted-foreground'>Portal shortcuts</span>
          </div>

          <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3'>
            {[
              { name: 'Sessions', icon: Video, color: 'text-blue-500 bg-blue-500/10', href: '/sessions' },
              { name: 'Categories', icon: Layers, color: 'text-indigo-500 bg-indigo-500/10', href: '/session-categories' },
              { name: 'Users', icon: Users, color: 'text-emerald-500 bg-emerald-500/10', href: '/users' },
              { name: 'Gallery', icon: ImageIcon, color: 'text-cyan-500 bg-cyan-500/10', href: '/galleries' },
              { name: 'Gallery Cats', icon: Layers, color: 'text-teal-500 bg-teal-500/10', href: '/gallery-categories' },
              { name: 'Testimonials', icon: Star, color: 'text-pink-500 bg-pink-500/10', href: '/testimonials' },
              { name: 'Feedbacks', icon: MessageSquare, color: 'text-purple-500 bg-purple-500/10', href: '/feedbacks' },
              { name: 'Contacts', icon: Mail, color: 'text-amber-500 bg-amber-500/10', href: '/contacts' },
            ].map((shortcut) => {
              const Icon = shortcut.icon
              return (
                <Card
                  key={shortcut.name}
                  className='group cursor-pointer border p-3 transition-all duration-200 hover:border-primary/50 hover:shadow-sm flex flex-col items-center justify-center gap-2 text-center'
                  onClick={() => navigate({ to: shortcut.href as any })}
                >
                  <div className={`flex size-9 items-center justify-center rounded-lg ${shortcut.color} group-hover:scale-110 transition-transform`}>
                    <Icon className='size-4.5' />
                  </div>
                  <span className='text-xs font-semibold truncate group-hover:text-primary transition-colors'>
                    {shortcut.name}
                  </span>
                </Card>
              )
            })}
          </div>
        </div>
      </Main>
    </>
  )
}
