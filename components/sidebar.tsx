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
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

export { dashboardMenuItems } from "@/lib/access";

const navLinkBase =
  "flex items-center rounded-lg text-sm transition-colors";
const navLinkInactive =
  "text-white/85 hover:bg-white/15 hover:text-white font-medium px-3 py-2";
const navLinkActive =
  "bg-white text-[#69B34C] font-bold rounded-lg px-3 py-2 text-sm shadow-sm";
const sectionTitleClasses =
  "text-white/70 text-[11px] font-bold tracking-wider uppercase px-3 pt-4 pb-1";

function getNavLinkClasses(active: boolean, layoutClasses: string) {
  return cn(
    navLinkBase,
    layoutClasses,
    active ? navLinkActive : navLinkInactive,
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
          "flex h-full w-full flex-col items-center overflow-hidden bg-[#69B34C] text-white md:h-screen md:border-r md:border-white/20",
          className,
        )}
      >
        <div className="flex w-full shrink-0 justify-center border-b border-white/20 px-2 py-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            aria-label="Show sidebar"
            title="Show sidebar"
            className="text-white/85 hover:bg-white/15 hover:text-white"
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
        "flex h-full w-72 flex-col overflow-hidden bg-[#69B34C] text-white md:h-screen md:border-r md:border-white/20",
        className,
      )}
    >
      <div className="relative flex shrink-0 items-center gap-2 border-b border-white/20 px-4 py-5">
        <div className="flex min-w-0 flex-1 items-center gap-2 pr-8">
          <span className="text-lg font-extrabold tracking-tight text-white truncate">
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
            className="absolute top-3 right-3 text-white/85 hover:bg-white/15 hover:text-white"
          >
            <PanelLeftClose className="h-5 w-5" />
          </Button>
        ) : null}
      </div>

      <nav className="sidebar-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4">
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
                        "hover:text-white",
                        childActive && "text-white",
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
                className={getNavLinkClasses(isActive, "gap-3 py-2")}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="mt-auto shrink-0 space-y-2 border-t border-white/20 bg-[#529339] p-3.5">
        <div className="min-w-0 px-1">
          <p className="truncate text-xs font-bold text-white">
            {user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : "Guest"}
          </p>
          <p className="truncate text-[11px] text-white/80">
            {user?.email ?? ""}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={handleLogout}
          disabled={signingOut}
          className="flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-5 w-5" />
          <span>{signingOut ? "Signing out…" : "Logout"}</span>
        </Button>
      </div>
    </div>
  );
}
