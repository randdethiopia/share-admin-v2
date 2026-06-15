"use client";
import Cookies from "js-cookie";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  List,
  LogOut,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TRAINING_MENU_PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
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
  permissions: string[];
  isCollapsable?: boolean;
  items?: MenuItem[];
};

export const dashboardMenuItems: MenuItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", permissions: ["dashboard.read", "dashboard.write", "dashboard.delete"] },
  { id: "mentor", icon: UsersRound, label: "Mentor", href: "/mentor", permissions: ["investor.read", "investor.write", "investor.delete"] },
  { id: "business", icon: Building2, label: "Business", href: "/business", permissions: ["business.read", "business.write", "business.delete"] },
  { id: "expert", icon: UserCheck, label: "Expert", href: "/expert", permissions: ["advisor.read", "advisor.write", "advisor.delete"] },
   {
    id: "trainee", icon: GraduationCap, label: "Trainee", href: "/trainee", permissions: ["trainee.read", "trainee.write", "trainee.delete"], isCollapsable: true, items: [
      { id: "trainee-dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/trainee/dashboard", permissions: ["trainee.read", "trainee.write", "trainee.delete"] },
      { id: "trainee-wait-list", icon: ListPlus, label: "Wait-list", href: "/trainee/wait-list", permissions: ["trainee.read", "trainee.write", "trainee.delete"] },
      { id: "trainee-list", icon: List, label: "List", href: "/trainee/list", permissions: ["trainee.read", "trainee.write", "trainee.delete"] }
    ]
  },
  { id: "projects", icon: Users, label: "Projects", href: "/projects", permissions: ["project.read", "project.write", "project.delete"] },
   { id: "jobs", icon: Briefcase, label: "Jobs", href: "/jobs", permissions: ["job.read", "job.write", "job.delete"] },
  { id: "invitations", icon: Mail, label: "Invitations", href: "/invitations", permissions: ["invitation.read", "invitation.write", "invitation.delete"] },
  { id: "blogs", icon: BookOpen, label: "Blogs", href: "/blogs", permissions: ["blog.read", "blog.write", "blog.delete"] },
  { id: "idea-bank", icon: Lightbulb, label: "Idea Bank", href: "/idea-bank", permissions: ["idea.read", "idea.write", "idea.delete"] },
  { id: "opportunity", icon: TrendingUp, label: "Opportunity", href: "/opportunity", permissions: ["opportunity.read", "opportunity.write", "opportunity.delete"] },
  { id: "admin-management", icon: UserCog, label: "Admin Management", href: "/admin", permissions: ["admin.read", "admin.write", "admin.delete"], isCollapsable: true, items: [
    { id: "admins", icon: Users, label: "Users", href: "/admin", permissions: ["admin.read", "admin.write", "admin.delete"] },
    { id: "roles", icon: Users, label: "Roles", href: "/admin/roles", permissions: ["admin.read", "admin.write", "admin.delete"] },
  ] },
  
  {
    id: "training-manage",
    icon: UserCog,
    label: "Training manage",
    href: "/coordinator",
    permissions: [...TRAINING_MENU_PERMISSIONS],
    isCollapsable: true,
    items: [
      {
        id: "training-manage-my-trainees",
        icon: Users,
        label: "My trainees",
        href: "/coordinator/my-trainees",
        permissions: [...TRAINING_MENU_PERMISSIONS],
      },
      {
        id: "training-manage-sessions",
        icon: Calendar,
        label: "Training sessions",
        href: "/coordinator/sessions",
        permissions: [...TRAINING_MENU_PERMISSIONS],
      },
    ],
  },
  
  
  { id: "change-password", icon: Key, label: "Change My Password", href: "/change-password", permissions: ["user.read", "user.write", "user.delete"] },
 
 
  
 

  
];


export function Sidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const pathname = usePathname();
  const router = useRouter();

  const { user, role, permissions, hasHydrated, logOut } = useAuthStore();

  const normalizedPermissions = permissions?.map((permission) =>
    permission.toLowerCase()
  ) ?? [];
  const hasAllAccess = normalizedPermissions.includes("all_access");

  const normalizedRole = role?.trim().toUpperCase() ?? "";
  const isTrainingOnlyAdmin =
    normalizedRole === "ADMIN" &&
    !hasAllAccess &&
    !normalizedPermissions.some((p) => p.startsWith("admin.")) &&
    !normalizedPermissions.some((p) => p.startsWith("admin:")) &&
    normalizedPermissions.some(
      (p) =>
        p.startsWith("trainee.") ||
        p.startsWith("trainee:") ||
        p.startsWith("training.") ||
        p.startsWith("training:") ||
        p.startsWith("coordinator.") ||
        p.startsWith("coordinator:")
    );
  const isCoordinatorLike = normalizedRole === "COORDINATOR" || isTrainingOnlyAdmin;

  const canViewItem = (item: MenuItem) => {
   
    if (hasAllAccess) return true;
    if (normalizedPermissions.length === 0) return false;

    // Coordinators (and training-only admins acting as coordinators) only see Training manage (+ change password)
    if (isCoordinatorLike) {
      return (
        item.id === "change-password" ||
        item.id.startsWith("training-manage") ||
        item.href.startsWith("/coordinator")
      );
    }

    return item.permissions.some((permission) =>
      normalizedPermissions.includes(permission.toLowerCase())
    );
  };

  const filteredItems = dashboardMenuItems.reduce<MenuItem[]>((items, item) => {
    if (!canViewItem(item)) return items;

    if (!item.items?.length) {
      items.push(item);
      return items;
    }

    const visibleSubItems = item.items.filter(canViewItem);
    if (!visibleSubItems.length) return items;

    items.push({
      ...item,
      items: visibleSubItems,
    });

    return items;
  }, []);

  useEffect(() => {
    const autoOpen: Record<string, boolean> = {};

    filteredItems.forEach((item) => {
      if (!item.isCollapsable || !item.items?.length) return;

      const childActive = item.items.some(
        (s) =>
          pathname === s.href || pathname.startsWith(`${s.href}/`)
      );

      if (childActive) {
        autoOpen[item.id] = true;
      }
    });

    if (Object.keys(autoOpen).length > 0) {
      setOpenSections((prev) => ({ ...prev, ...autoOpen }));
    }
  }, [pathname]);

  const handleLogout = () => {
    Cookies.remove("session_token");
    logOut();
    router.push("/login");
  };

  if (!hasHydrated) return null;

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
            {user?.firstName || "Guest"}
            {user?.lastName || ""}
          </h2>
          <p className="text-xs">Portal Access</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {filteredItems.map((item) => {
            const resolvedHref =
              item.label === "Business" && role?.toLowerCase() === "admin"
                ? "/business"
                : item.href;

            const isActive = pathname === resolvedHref;
            const Icon = item.icon;

            if (item.isCollapsable && item.items?.length) {
              const childActive = item.items.some(
                (s) =>
                  pathname === s.href || pathname.startsWith(`${s.href}/`)
              );
              const isOpen = openSections[item.id] ?? childActive;

              return (
                <Collapsible
                  key={item.id}
                  open={isOpen}
                  onOpenChange={(open) =>
                    setOpenSections((prev) => ({ ...prev, [item.id]: open }))
                  }
                  className="space-y-1"
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isOpen
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-50",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="sr-only">Toggle {item.label}</span>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="ml-6 flex flex-col gap-1">
                      {item.items.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive =
                          pathname === subItem.href ||
                          pathname.startsWith(`${subItem.href}/`);

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

      <div className="border-t px-3 py-4">
        <Button
          type="button"
          variant="ghost"
          onClick={handleLogout}
          className="flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
