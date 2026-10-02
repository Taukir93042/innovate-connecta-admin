import {
  Video,
  ReceiptText,
  LayoutDashboard,
  Users,
  Images,
  FolderTree,
  MessageSquareQuote,
  MessageSquare,
  Presentation,
  GraduationCap,
  CalendarCheck,
  Mail,
  Layers,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Admin',
    email: 'admin@gmail.com',
    avatar: '',
  },
  teams: [
    {
      name: 'InnoVate Connecta',
      logo: Layers,
      plan: 'Admin Portal',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Users',
          url: '/users',
          icon: Users,
        },
        {
          title: 'Gallery',
          url: '/galleries',
          icon: Images,
        },
        {
          title: 'Gallery Categories',
          url: '/gallery-categories',
          icon: FolderTree,
        },
        {
          title: 'Testimonials',
          url: '/testimonials',
          icon: MessageSquareQuote,
        },
        {
          title: 'Feedbacks',
          url: '/feedbacks',
          icon: MessageSquare,
        },
        {
          title: 'Sessions',
          url: '/sessions',
          icon: Presentation,
        },
        {
          title: 'Recorded Sessions',
          url: '/recorded-sessions',
          icon: Video,
        },
        {
          title: 'Course Orders',
          url: '/recorded-orders',
          icon: ReceiptText,
        },
        {
          title: 'Instructors',
          url: '/instructors',
          icon: GraduationCap,
        },
        {
          title: 'Seat Bookings',
          url: '/session-bookings',
          icon: CalendarCheck,
        },
        {
          title: 'Session Categories',
          url: '/session-categories',
          icon: FolderTree,
        },
        {
          title: 'Contacts',
          url: '/contacts',
          icon: Mail,
        },
      ],
    },
  ],
}
