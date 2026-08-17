"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useAuthStore from "@/store/useAuthStore"; // 1. Use the NEW store
import { signOut } from "@/lib/auth-session";
import {
  ChevronRight,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type MenuItem,
  canAccessMenuItem,
  dashboardMenuItems,
} from "@/lib/access";
import {
  formatPendingUpdatesCount,
  useAdminPendingUpdatesCount,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

export { dashboardMenuItems } from "@/lib/access";

const navLinkBase = "flex items-center text-sm transition-colors";
const navLinkInactive =
  "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
const navLinkActive =
  "bg-[#69B34C]/10 text-[#3B6A22] font-semibold border-l-[3px] border-[#69B34C] rounded-r-lg px-3 py-2 text-sm transition-colors shadow-xs";
const sectionTitleClasses =
  "text-slate-400 text-[11px] font-extrabold tracking-wider uppercase px-3 pt-4 pb-1";

const toggleButtonClasses =
  "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 transition-colors";

function getNavLinkClasses(active: boolean, layoutClasses: string) {
  return cn(
    navLinkBase,
    layoutClasses,
    active
      ? cn(navLinkActive, "hover:bg-[#69B34C]/10 hover:text-[#3B6A22]")
      : navLinkInactive,
  );
}

export function Sidebar({
  className,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: {
  className?: string;
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const pathname = usePathname();

  const { user, permissions, hasHydrated } = useAuthStore();
  const [signingOut, setSigningOut] = useState(false);
  const { data: pendingUpdatesCountData } = useAdminPendingUpdatesCount();
  const pendingCount = pendingUpdatesCountData?.count ?? 0;

  const canViewItem = (item: MenuItem) => canAccessMenuItem(item, permissions);

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

  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await signOut();
  };

  if (!hasHydrated) return null;

  if (collapsed) {
    return (
      <div
        className={cn(
          "flex h-full w-16 flex-col items-center overflow-hidden bg-white text-slate-800 border-r border-slate-200/80",
          className,
        )}
      >
        <div className="flex w-full shrink-0 justify-center border-b border-slate-100 px-2 py-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            aria-label="Show sidebar"
            title="Show sidebar"
            className={toggleButtonClasses}
          >
            <PanelLeftOpen className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-72 flex-col bg-white text-slate-800 border-r border-slate-200/80 overflow-hidden",
        className,
      )}
    >
      <div className="relative flex shrink-0 items-center gap-2 border-b border-slate-100 px-4 py-5">
        <div className="flex min-w-0 flex-1 items-center gap-2 pr-8">
          <span className="truncate text-lg font-extrabold tracking-tight text-slate-900">
            SHARE
          </span>
          <span className="shrink-0 rounded bg-[#FF4E11] px-1.5 py-0.5 text-[10px] font-bold text-white">
            ADMIN
          </span>
        </div>
        {onToggleCollapse ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            aria-label="Hide sidebar"
            title="Hide sidebar"
            className={cn("absolute top-3 right-3", toggleButtonClasses)}
          >
            <PanelLeftClose className="h-5 w-5" />
          </Button>
        ) : null}
      </div>

      <nav className="sidebar-scroll flex-1 min-h-0 space-y-1 overflow-y-auto px-3 py-4 [scrollbar-color:rgb(203_213_225)_transparent] [&::-webkit-scrollbar-thumb]:bg-slate-300/60">
        <div className="space-y-1">
          {filteredItems.map((item) => {
            const resolvedHref = item.href;

            const isActive =
              pathname === resolvedHref ||
              pathname.startsWith(`${resolvedHref}/`);
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
                        "flex w-full cursor-pointer items-center justify-between rounded-lg transition-colors",
                        sectionTitleClasses,
                        childActive
                          ? "text-slate-600"
                          : "hover:text-slate-500",
                      )}
                    >
                      <span>{item.label}</span>
                      {isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="sr-only">Toggle {item.label}</span>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="ml-3 flex flex-col gap-1">
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
                            className={getNavLinkClasses(
                              isSubActive,
                              "gap-3 py-2",
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
                className={getNavLinkClasses(isActive, "w-full gap-3 py-2")}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.id === "business" && pendingCount > 0 ? (
                  <span
                    aria-label={`${pendingCount} pending profile updates`}
                    className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#FF4E11]/10 px-1.5 text-[11px] font-bold text-[#FF4E11] transition-all"
                  >
                    {formatPendingUpdatesCount(pendingCount)}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="mt-auto shrink-0 border-t border-slate-200/80 bg-slate-50/80 p-3.5 space-y-2.5">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-slate-900 leading-tight">
            {user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : "Portal User"}
          </p>
          <p className="truncate text-[11px] text-slate-500 leading-tight">
            {user?.email ?? ""}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={handleLogout}
          disabled={signingOut}
          className="flex w-full items-center justify-start gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50/80 hover:text-red-700 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0 text-red-600" />
          <span>{signingOut ? "Signing out..." : "Logout"}</span>
        </Button>
      </div>
    </div>
  );
}
