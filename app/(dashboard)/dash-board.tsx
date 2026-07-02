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

interface DashboardShellProps {
  children: React.ReactNode;
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
    <div className="flex min-h-screen bg-[#E2EDF8]">
      <aside
        className="fixed hidden h-full w-64 border-r bg-white md:block"
        aria-label="Main navigation"
      >
        <Sidebar />
      </aside>

      <div className="flex flex-1 flex-col md:ml-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-white px-4 py-3 md:hidden">
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

            <SheetContent side="left" className="w-64 p-0 [&>button]:hidden">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>

              <Sidebar
                className="h-full"
                onNavigate={() => setIsMobileNavOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <span className="text-sm font-semibold text-gray-900">
            {currentTitle}
          </span>
        </header>

        <main className="min-w-0 flex-1 p-6 md:p-10 max-w-full overflow-x-hidden">
          {canViewCurrentPath ? children : null}
        </main>
      </div>
    </div>
  );
}