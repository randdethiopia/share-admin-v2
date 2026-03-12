"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import {
  LayoutDashboard,
  Users,
  Mail,
  Briefcase,
  BookOpen,
  Lightbulb,
  TrendingUp,
  GraduationCap,
  FolderOpen,
  UserCog,
  UserCheck,
  Building2,
  UsersRound,
  Key,
  ChevronRight,
  ChevronDown,
  ListPlus,
  List,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

type MenuItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  href: string;
  roles: string[];
  isCollapsable?: boolean;
  items?: MenuItem[];
};

export const dashboardMenuItems: MenuItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", roles: ["admin", "advisor", "sme", "investor"] },
  { id: "projects", icon: Users, label: "Projects", href: "/projects", roles: ["admin", "advisor"] },
  { id: "investigations", icon: Mail, label: "Invitations", href: "/invitations", roles: ["admin", "advisor", "sme"] },
  { id: "blogs", icon: BookOpen, label: "Blogs", href: "/blogs", roles: ["admin", "advisor", "sme"] },
  {
    id: "admin-management",
    icon: UserCog,
    label: "Admin Management",
    href: "/admin-dashboard",
    roles: ["admin"],
    isCollapsable: true,
    items: [
      { id: "admin-dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/admin-dashboard/admin", roles: ["admin"] },
      { id: "admin-access", icon: Users, label: "Access Management", href: "/admin-dashboard/access", roles: ["admin"] },
    ],
  },
  { id: "expert", icon: UserCheck, label: "Expert", href: "/expert", roles: ["admin", "advisor"] },
  { id: "business", icon: Building2, label: "Business", href: "/business", roles: ["admin", "sme"] },
  { id: "mentor", icon: UsersRound, label: "Mentor", href: "/mentor", roles: ["admin", "investor"] },
  { id: "jobs", icon: Briefcase, label: "Jobs", href: "/jobs", roles: ["admin", "advisor", "sme"] },
  { id: "idea-bank", icon: Lightbulb, label: "Idea Bank", href: "/idea-bank", roles: ["admin", "advisor", "sme"] },
  { id: "opportunity", icon: TrendingUp, label: "Opportunity", href: "/opportunity", roles: ["admin", "advisor", "sme"] },
  {
    id: "trainee",
    icon: GraduationCap,
    label: "Trainee",
    href: "/trainee",
    roles: ["admin", "advisor"],
    isCollapsable: true,
    items: [
      { id: "trainee-dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/trainee/dashboard", roles: ["admin", "advisor"] },
      { id: "trainee-wait-list", icon: ListPlus, label: "Wait-list", href: "/trainee/wait-list", roles: ["admin", "advisor"] },
      { id: "trainee-list", icon: List, label: "List", href: "/trainee/list", roles: ["admin", "advisor"] },
    ],
  },
  {
    id: "coordinator",
    icon: Users,
    label: "Coordinator",
    href: "/coordinator",
    roles: ["admin", "coordinator"],
    isCollapsable: true,
    items: [
      { id: "coordinator-my-trainees", icon: ListPlus, label: "My Trainees", href: "/coordinator/my-trainees", roles: ["admin"] },
      { id: "coordinator-attendance", icon: List, label: "Attendance", href: "/coordinator/Attendance", roles: ["admin"] },
    ],
  },
  { id: "resource", icon: FolderOpen, label: "Resource", href: "/resource", roles: ["admin", "advisor", "sme"] },
  { id: "change-password", icon: Key, label: "Change My Password", href: "/change-password", roles: ["admin", "advisor", "sme", "investor", "coordinator"] },
];

export function Sidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const [activeId, setActiveId] = useState<string>();

  const pathname = usePathname();
  const { role, hasHydrated } = useAuthStore();

  if (!hasHydrated) return null;

  const filteredItems = dashboardMenuItems.filter((item) => {
    if (!role) return false;
    return item.roles.includes(role.toLowerCase());
  });

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col bg-white md:h-screen md:w-70 md:border-r",
        className,
      )}
    >
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
        <Button className="bg-green-500 text-white hover:bg-green-600">
          View Profile
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {dashboardMenuItems.map((item) => {
            const resolvedHref = item.href;
            const isActive = pathname === resolvedHref;
            const Icon = item.icon;

            if (item.isCollapsable && item.items?.length) {
              const isOpen = activeId === item.id;

              return (
                <Collapsible
                  key={item.id}
                  open={isOpen}
                  onOpenChange={(open) =>
                    setActiveId(open ? item.id : undefined)
                  }
                  className="space-y-1"
                >
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isOpen
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="sr-only">Toggle {item.label}</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent>
                    <div className="ml-6 flex flex-col gap-1">
                      {item.items.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = pathname === subItem.href;

                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={onNavigate}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                              isSubActive
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-700 hover:bg-gray-50",
                            )}
                          >
                            <SubIcon className="h-4 w-4" />
                            <span>{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            return (
              <Link
                key={item.id}
                href={resolvedHref}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50",
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
