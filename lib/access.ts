import {
  LayoutDashboard,
  Users,
  Mail,
  Briefcase,
  BookOpen,
  Lightbulb,
  TrendingUp,
  GraduationCap,
  UserCog,
  UserCheck,
  Building2,
  UsersRound,
  Key,
  ListPlus,
  List,
  Calendar,
  ClipboardList,
  Sparkles,
  BarChart,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";
import { TRAINING_MENU_PERMISSIONS } from "@/lib/permissions";

export type MenuItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  href: string;
  permissions?: string[];
  isCollapsable?: boolean;
  items?: MenuItem[];
};


export const ALWAYS_ACCESSIBLE_ITEM_IDS = new Set<string>(["change-password"]);

export const dashboardMenuItems: MenuItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", permissions: ["dashboard.read", "dashboard.write", "dashboard.delete"] },
  {
    id: "agar-waitlist",
    icon: ClipboardList,
    label: "AGAR Waitlist",
    href: "/agar-waitlist",
    permissions: ["agar.waitlist.read", "agar.waitlist.write", "agar.waitlist.delete"],
    isCollapsable: true,
    items: [
      {
        id: "agar-waitlist-business",
        icon: Building2,
        label: "Business",
        href: "/agar-waitlist",
        permissions: ["agar.waitlist.read", "agar.waitlist.write", "agar.waitlist.delete"],
      },
      {
        id: "agar-waitlist-mentor",
        icon: UsersRound,
        label: "Mentor",
        href: "/agar-mentor-waitlist",
        permissions: ["agar.waitlist.read", "agar.waitlist.write", "agar.waitlist.delete"],
      },
    ],
  },
  { id: "mentor", icon: UsersRound, label: "Mentor", href: "/mentor", permissions: ["investor.read", "investor.write", "investor.delete"] },
  { id: "business", icon: Building2, label: "Business", href: "/business", permissions: ["business.read", "business.write", "business.delete"] },
  { id: "expert", icon: UserCheck, label: "Expert", href: "/expert", permissions: ["advisor.read", "advisor.write", "advisor.delete"] },
  {
    id: "trainee", icon: GraduationCap, label: "Trainee", href: "/trainee", permissions: ["trainee.read", "trainee.write", "trainee.delete"], isCollapsable: true, items: [
      { id: "trainee-dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/trainee/dashboard", permissions: ["trainee.read", "trainee.write", "trainee.delete"] },
      { id: "trainee-wait-list", icon: ListPlus, label: "Wait-list", href: "/trainee/wait-list", permissions: ["trainee.read", "trainee.write", "trainee.delete"] },
      { id: "trainee-list", icon: List, label: "List", href: "/trainee/list", permissions: ["trainee.read", "trainee.write", "trainee.delete"] },
      { id: "trainee-stat", icon: BarChart, label: "Stats", href: "/trainee/stat", permissions: ["trainee.read", "trainee.write", "trainee.delete"] }
    ]
  },
  { id: "projects", icon: Users, label: "Projects", href: "/projects", permissions: ["project.read", "project.write", "project.delete"] },
  { id: "jobs", icon: Briefcase, label: "Jobs", href: "/jobs", permissions: ["job.read", "job.write", "job.delete"] },
  { id: "invitations", icon: Mail, label: "Invitations", href: "/invitations", permissions: ["invitation.read", "invitation.write", "invitation.delete"] },
  { id: "support", icon: LifeBuoy, label: "Support Tickets", href: "/support", permissions: ["support.read", "support.write", "support.delete"] },
  { id: "blogs", icon: BookOpen, label: "Blogs", href: "/blogs", permissions: ["blog.read", "blog.write", "blog.delete"] },
  { id: "idea-bank", icon: Lightbulb, label: "Idea Bank", href: "/idea-bank", permissions: ["idea.read", "idea.write", "idea.delete"] },
  { id: "skills", icon: Sparkles, label: "Skills", href: "/skills", permissions: ["skill.read", "skill.write", "skill.delete"] },
  { id: "opportunity", icon: TrendingUp, label: "Opportunity", href: "/opportunity", permissions: ["opportunity.read", "opportunity.write", "opportunity.delete"] },
  {
    id: "admin-management", icon: UserCog, label: "Admin Management", href: "/admin", permissions: ["admin.read", "admin.write", "admin.delete"], isCollapsable: true, items: [
      { id: "admins", icon: Users, label: "Users", href: "/admin", permissions: ["admin.read", "admin.write", "admin.delete"] },
      { id: "roles", icon: Users, label: "Roles", href: "/admin/roles", permissions: ["admin.read", "admin.write", "admin.delete"] },
    ]
  },
  {
    id: "training-manage",
    icon: UserCog,
    label: "Training manage",
    href: "/coordinator",
    permissions: [...TRAINING_MENU_PERMISSIONS],
    isCollapsable: true,
    items: [
      { id: "training-manage-my-trainees", icon: Users, label: "My trainees", href: "/coordinator/my-trainees", permissions: [...TRAINING_MENU_PERMISSIONS] },
      { id: "training-manage-sessions", icon: Calendar, label: "Training sessions", href: "/coordinator/sessions", permissions: [...TRAINING_MENU_PERMISSIONS] },
    ],
  },

  { id: "change-password", icon: Key, label: "Change My Password", href: "/change-password" },
];

export function normalizePermissions(permissions?: string[] | null): string[] {
  return (
    permissions
      ?.map((permission) => permission.toLowerCase().trim())
      .filter((permission) => permission.length > 0) ?? []
  );
}

export function hasAllAccessPermission(permissions?: string[] | null): boolean {
  return normalizePermissions(permissions).includes("all_access");
}

/**
 * Access is derived purely from the user's granted permissions (no role checks).
 * `change-password` (ALWAYS_ACCESSIBLE_ITEM_IDS) and `all_access` bypass the check.
 */
export function canAccessMenuItem(
  item: MenuItem,
  permissions?: string[] | null
): boolean {
  if (ALWAYS_ACCESSIBLE_ITEM_IDS.has(item.id)) return true;
  if (hasAllAccessPermission(permissions)) return true;

  const normalized = normalizePermissions(permissions);
  if (normalized.length === 0) return false;

  return (
    item.permissions?.some((permission) =>
      normalized.includes(permission.toLowerCase())
    ) ?? false
  );
}

/**
 * Filters the menu tree down to only the items (and sub-items) the user can see.
 */
export function getVisibleMenuItems(
  permissions?: string[] | null
): MenuItem[] {
  return dashboardMenuItems.reduce<MenuItem[]>((items, item) => {
    if (!canAccessMenuItem(item, permissions)) return items;

    if (!item.items?.length) {
      items.push(item);
      return items;
    }

    const visibleSubItems = item.items.filter((sub) =>
      canAccessMenuItem(sub, permissions)
    );
    if (!visibleSubItems.length) return items;

    items.push({ ...item, items: visibleSubItems });
    return items;
  }, []);
}



export function getFirstAccessibleHref(
  permissions?: string[] | null
): string | null {
  const visible = getVisibleMenuItems(permissions);

  const resolveHref = (item: MenuItem): string | null => {
    if (item.items?.length) return item.items[0]?.href ?? null;
    return item.href;
  };

  const preferred = visible.find(
    (item) => !ALWAYS_ACCESSIBLE_ITEM_IDS.has(item.id)
  );
  if (preferred) return resolveHref(preferred);

  const fallback = visible[0];
  return fallback ? resolveHref(fallback) : null;
}

function flattenMenuItems(items: MenuItem[]): MenuItem[] {
  return items.flatMap((item) =>
    item.items?.length ? [item, ...item.items] : [item]
  );
}


/** Whether the user may view `pathname`. Unknown routes are allowed. */
export function isPathAccessible(
  pathname: string,
  permissions?: string[] | null
): boolean {
  const matches = flattenMenuItems(dashboardMenuItems).filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  if (matches.length === 0) return true;

  // Longest href wins so a sub-route is checked against its most specific item.
  const bestMatch = matches.reduce((best, current) =>
    current.href.length > best.href.length ? current : best
  );

  return canAccessMenuItem(bestMatch, permissions);
}
