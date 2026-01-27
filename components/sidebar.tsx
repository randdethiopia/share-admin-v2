'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore'; // 1. Use the NEW store
import { 
  LayoutDashboard, Users, Mail, Briefcase, BookOpen, 
  Lightbulb, TrendingUp, GraduationCap, FolderOpen, 
  UserCog, UserCheck, Building2, UsersRound, Key
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const dashboardMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['admin', 'advisor', 'sme', 'investor'] },
  { icon: Users, label: 'Projects', href: '/projects', roles: ['admin', 'advisor'] },
  { icon: Mail, label: 'Invitations', href: '/invitations', roles: ['admin', 'advisor', 'sme'] },
  { icon: BookOpen, label: 'Blogs', href: '/blogs', roles: ['admin', 'advisor', 'sme'] },
  { icon: UserCog, label: 'Admin Management', href: '/dashboard/admin-management', roles: ['admin'] },
  { icon: UserCheck, label: 'Expert', href: '/dashboard/advisor-profile', roles: ['admin', 'advisor'] },
  { icon: Building2, label: 'Business', href: '/business', roles: ['admin', 'sme'] },
  { icon: UsersRound, label: 'Mentor', href: '/dashboard/investor-profile', roles: ['admin', 'investor'] },
  { icon: Key, label: 'Change My Password', href: '/change-password', roles: ['admin', 'advisor', 'sme', 'investor'] },
  { icon: Briefcase, label: 'Jobs', href: '/dashboard/jobs', roles: ['admin', 'advisor', 'sme'] },
  { icon: Lightbulb, label: 'Idea Bank', href: '/idea-bank', roles: ['admin', 'advisor', 'sme'] },
  { icon: TrendingUp, label: 'Opportunity', href: '/opportunity', roles: ['admin', 'advisor', 'sme'] },
  { icon: GraduationCap, label: 'Trainee', href: '/dashboard/trainee', roles: ['admin', 'advisor'] },
  { icon: FolderOpen, label: 'Resource', href: '/dashboard/resource', roles: ['admin', 'advisor', 'sme'] }
];

export function Sidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  
  // 2. Get state from the NEW store
  const { role, hasHydrated, } = useAuthStore();

  // 3. SAFETY CHECK: If Zustand hasn't finished reading from localStorage, return null
  // This prevents the "Hydration Mismatch" error in Next.js
  if (!hasHydrated) return null;

  // 4. Filter logic using the new 'role' directly
 const filteredItems = dashboardMenuItems.filter(item => {
  if (!role) return false;
  // Convert the user's role to lowercase before checking the list
  return item.roles.includes(role.toLowerCase());
})

  

  return (
    <div className={cn("flex h-full w-full flex-col bg-white md:h-screen md:w-70 md:border-r", className)}>
      <div className="flex flex-col items-center gap-3 border-b px-6 py-6">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-gray-200 text-gray-600">
            <UserCog className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h2 className="text-lg font-semibold capitalize">{role || "Guest"}</h2>
          <p className="text-xs">Portal Access</p>
        </div>
        <Button className="bg-green-500 hover:bg-green-600 text-white">
          View Profile
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {filteredItems.map((item) => {
            const resolvedHref =
              item.label === "Business" && role?.toLowerCase() === "admin"
                ? "/dashboard/business"
                : item.href;

            const isActive = pathname === resolvedHref;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={resolvedHref}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      
    </div>
  );
}