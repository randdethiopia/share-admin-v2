"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useAuthStore from "@/store/useAuthStore"; // 1. Use the NEW store
import {
  UserCog,
  ChevronRight,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export function Sidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const pathname = usePathname();

  const { user, permissions, hasHydrated, logOut } = useAuthStore();

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

  const handleLogout = () => {
    logOut();
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
            {user?.firstName && user?.lastName ? `${user?.firstName} ${user?.lastName}` : "Guest"}
          </h2>
          <p className="text-xs">Portal Access</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
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
