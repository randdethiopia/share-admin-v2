"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { Sidebar, dashboardMenuItems } from "@/components/sidebar";
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

function resolveDashboardTitle(pathname: string): string {
  const exactMatch = dashboardMenuItems.find(
    (item) => item.href === pathname
  );
  if (exactMatch) return exactMatch.label;

  const nestedMatch = dashboardMenuItems
    .filter((item) => item.href !== "/dashboard")
    .find((item) => pathname.startsWith(`${item.href}/`));

  return nestedMatch?.label ?? "Dashboard";
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const pathname = usePathname();

  const currentTitle = React.useMemo(
    () => resolveDashboardTitle(pathname),
    [pathname]
  );

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
          {children}
        </main>
      </div>
    </div>
  );
}
