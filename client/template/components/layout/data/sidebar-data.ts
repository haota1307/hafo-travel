import {
  Construction,
  LayoutDashboard,
  Monitor,
  Bug,
  ListTodo,
  FileX,
  HelpCircle,
  Lock,
  Bell,
  Palette,
  ServerOff,
  Settings,
  Wrench,
  UserCog,
  UserX,
  Users,
  MessagesSquare,
  ShieldCheck,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
} from 'lucide-react';

import { type SidebarData } from '../types';

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/template/avatar.svg',
  },
  teams: [
    {
      name: 'Shadcn Admin',
      logo: Command,
      plan: 'Next.js + ShadcnUI',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/template',
          icon: LayoutDashboard,
        },
        {
          title: 'Tasks',
          url: '/template/tasks',
          icon: ListTodo,
        },
        {
          title: 'Chats',
          url: '/template/chats',
          badge: '3',
          icon: MessagesSquare,
        },
        {
          title: 'Users',
          url: '/template/users',
          icon: Users,
        },
      ],
    },
    {
      title: 'Pages',
      items: [
        {
          title: 'Auth',
          icon: ShieldCheck,
          items: [
            {
              title: 'Sign In',
              url: '/template/sign-in',
            },
            {
              title: 'Sign In (2 Col)',
              url: '/template/sign-in-2',
            },
            {
              title: 'Sign Up',
              url: '/template/sign-up',
            },
            {
              title: 'Forgot Password',
              url: '/template/forgot-password',
            },
            {
              title: 'OTP',
              url: '/template/otp',
            },
          ],
        },
        {
          title: 'Errors',
          icon: Bug,
          items: [
            {
              title: 'Unauthorized',
              url: '/template/errors/unauthorized',
              icon: Lock,
            },
            {
              title: 'Forbidden',
              url: '/template/errors/forbidden',
              icon: UserX,
            },
            {
              title: 'Not Found',
              url: '/template/errors/not-found',
              icon: FileX,
            },
            {
              title: 'Internal Server Error',
              url: '/template/errors/internal-server-error',
              icon: ServerOff,
            },
            {
              title: 'Maintenance Error',
              url: '/template/errors/maintenance-error',
              icon: Construction,
            },
          ],
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Profile',
              url: '/template/settings',
              icon: UserCog,
            },
            {
              title: 'Account',
              url: '/template/settings/account',
              icon: Wrench,
            },
            {
              title: 'Appearance',
              url: '/template/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notifications',
              url: '/template/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Display',
              url: '/template/settings/display',
              icon: Monitor,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/template/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
};
