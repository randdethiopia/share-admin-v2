"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useAuthStore from "@/store/useAuthStore"; // 1. Use the NEW store
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
  List
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

export const dashboardMenuItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", roles: ["admin", "advisor", "sme", "investor"] },
  { id: "projects", icon: Users, label: "Projects", href: "/projects", roles: ["admin", "advisor"] },
  { id: "investigations", icon: Mail, label: "Invitations", href: "/invitations", roles: ["admin", "advisor", "sme"] },
  { id: "blogs", icon: BookOpen, label: "Blogs", href: "/blogs", roles: ["admin", "advisor", "sme"] },
  { id: "admin-management", icon: UserCog, label: "Admin Management", href: "/admin", roles: ["admin"] },
  { id: "expert", icon: UserCheck, label: "Expert", href: "/expert", roles: ["admin", "advisor"] },
  { id: "business", icon: Building2, label: "Business", href: "/business", roles: ["admin", "sme"] },
  { id: "mentor", icon: UsersRound, label: "Mentor", href: "/investor-profile", roles: ["admin", "investor"] },
  { id: "change-password", icon: Key, label: "Change My Password", href: "/change-password", roles: ["admin", "advisor", "sme", "investor"] },
  { id: "jobs", icon: Briefcase, label: "Jobs", href: "/jobs", roles: ["admin", "advisor", "sme"] },
  { id: "idea-bank", icon: Lightbulb, label: "Idea Bank", href: "/idea-bank", roles: ["admin", "advisor", "sme"] },
  { id: "opportunity", icon: TrendingUp, label: "Opportunity", href: "/opportunity", roles: ["admin", "advisor", "sme"] },
  { id: "trainee", icon: GraduationCap, label: "Trainee", href: "/trainee", roles: ["admin", "advisor"], isCollapsable: true, items: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/trainee/dashboard", roles: ["admin", "advisor"] },
    { icon: ListPlus, label: "wait-list", href: "/trainee/wait-list", roles: ["admin", "advisor"] },
    { icon: List, label: "list", href: "/trainee/list", roles: ["admin", "advisor"] },
  ] },
  { id: "resource", icon: FolderOpen, label: "Resource", href: "/resource", roles: ["admin", "advisor", "sme"] },
]

export function Sidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const [activeId, setActiveId] = useState<string>();

  const pathname = usePathname();

  // 2. Get state from the NEW store
  const { role, hasHydrated } = useAuthStore();

  // 3. SAFETY CHECK: If Zustand hasn't finished reading from localStorage, return null
  // This prevents the "Hydration Mismatch" error in Next.js
  if (!hasHydrated) return null;

  // 4. Filter logic using the new 'role' directly
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
          <h2 className="text-lg font-semibold capitalize">
            {role || "Guest"}
          </h2>
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
