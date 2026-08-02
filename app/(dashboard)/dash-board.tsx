"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { Sidebar, dashboardMenuItems } from "@/components/sidebar";
import {
  getFirstAccessibleHref,
  isPathAccessible,
} from "@/lib/access";
import useAuthStore from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
}

const ADMIN_THEME_ROUTES = [
  "/business",
  "/expert",
  "/mentor",
  "/jobs",
  "/invitations",
  "/blogs",
  "/idea-bank",
  "/skills",
  "/opportunity",
  "/admin-management",
  "/change-password",
] as const;

function isAdminThemedRoute(pathname: string) {
  return ADMIN_THEME_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

// Add this function to get user role from your auth system
const getUserRole = (): string => {
  // Replace this with your actual role detection logic
  // Example: from localStorage, context, or API
  if (typeof window !== 'undefined') {
    // Option 1: From localStorage
    const role = localStorage.getItem('userRole');
    if (role && ['business', 'expert', 'mentor'].includes(role)) {
      return role;
    }
    
    // Option 2: From URL or metadata
    const pathname = window.location.pathname;
    if (pathname.includes('/expert/')) return 'expert';
    if (pathname.includes('/mentor/')) return 'mentor';
    
    // Option 3: From session storage
    const sessionRole = sessionStorage.getItem('userRole');
    if (sessionRole && ['business', 'expert', 'mentor'].includes(sessionRole)) {
      return sessionRole;
    }
  }
  
  return 'business'; // Default role
};

function resolveDashboardTitle(pathname: string): string {
  for (const item of dashboardMenuItems) {
    if (item.href === pathname) return item.label;
    if (item.items?.length) {
      const sub = item.items.find(
        (s) => s.href === pathname || pathname.startsWith(`${s.href}/`)
      );
      if (sub) return sub.label;
    }
  }

  const nestedMatch = dashboardMenuItems
    .filter((item) => item.href !== "/dashboard")
    .find((item) => pathname.startsWith(`${item.href}/`));

  return nestedMatch?.label ?? "Dashboard";
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [userRole, setUserRole] = React.useState<string>('business');
  const pathname = usePathname();
  const router = useRouter();

  const { permissions, hasHydrated } = useAuthStore();

  // Gate every dashboard route on the user's permissions. On first entry (or any
  // link they aren't allowed to open) send them to the first route they can access.
  const canViewCurrentPath =
    !hasHydrated || isPathAccessible(pathname, permissions);

  React.useEffect(() => {
    if (!hasHydrated) return;
    if (isPathAccessible(pathname, permissions)) return;

    const target = getFirstAccessibleHref(permissions) ?? "/change-password";
    if (target !== pathname) {
      router.replace(target);
    }
  }, [hasHydrated, pathname, permissions, router]);

  // Get user role on mount
  React.useEffect(() => {
    const role = getUserRole();
    setUserRole(role);
  }, []);

  const currentTitle = React.useMemo(
    () => resolveDashboardTitle(pathname),
    [pathname]
  );

  React.useEffect(() => {
    // ONLY remove percentages for business role
    // Expert and mentor roles see ALL real data including percentages
    if (userRole === 'business') {
      const removePercentagesFromCards = () => {
        const cards = document.querySelectorAll('[class*="card"], .card, [role="article"]');
        
        cards.forEach(card => {
          if (card.closest('[data-preserve-percentages]')) return;

          const percentageElements = card.querySelectorAll('[class*="percentage"], [class*="percent"], .trend-value, .stat-percentage');
          
          percentageElements.forEach(el => {
            if (el.textContent?.match(/\d+%/) || el.textContent?.match(/\d+\.\d+%/)) {
              el.remove(); 
            }
          });
          
          const walker = document.createTreeWalker(
            card,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: (node) => {
                if (node.textContent?.match(/\d+%/) || node.textContent?.match(/\d+\.\d+%/)) {
                  return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_REJECT;
              }
            }
          );
          
          const textNodesToRemove = [];
          while (walker.nextNode()) {
            textNodesToRemove.push(walker.currentNode);
          }
          
          textNodesToRemove.forEach(node => {
            if (node.parentNode) {
              node.parentNode.removeChild(node);
            }
          });
        });
      };
      
      removePercentagesFromCards();
      
      const observer = new MutationObserver(() => {
        removePercentagesFromCards();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      return () => observer.disconnect();
    }
  }, [children, userRole]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={`fixed hidden h-screen overflow-hidden border-r border-white/20 bg-[#69B34C] transition-[width] duration-200 md:block ${
          isSidebarCollapsed ? "w-14" : "w-72"
        }`}
        aria-label="Main navigation"
      >
        <Sidebar
          collapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      </aside>

      <div
        className={`flex flex-1 flex-col transition-[margin] duration-200 ${
          isSidebarCollapsed ? "md:ml-14" : "md:ml-72"
        }`}
      >
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
          <Sheet
            open={isMobileNavOpen}
            onOpenChange={setIsMobileNavOpen}
          >
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-72 border-white/20 bg-[#69B34C] p-0 [&>button]:hidden">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>

              <Sidebar
                className="h-full"
                onNavigate={() => setIsMobileNavOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <span className="text-sm font-semibold text-agar-navy">
            {currentTitle}
          </span>
        </header>

        <main
          className={cn(
            "min-w-0 flex-1 p-6 md:p-10 max-w-full overflow-x-hidden",
            isAdminThemedRoute(pathname) && "admin-theme"
          )}
        >
          {canViewCurrentPath ? children : null}
        </main>
      </div>
    </div>
  );
}