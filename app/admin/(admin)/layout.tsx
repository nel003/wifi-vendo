"use client"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useEffect, useState } from "react"
import { adminStore } from "@/store/user"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Moon } from "lucide-react"

import { usePathname } from "next/navigation"

const breadcrumbMap: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/rates": "Rates",
  "/admin/vouchers": "Vouchers",
  "/admin/clients": "Clients",
  "/admin/transactions": "Transactions",
  "/admin/settings": "Settings",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const adminUser = adminStore(s => s.adminUser);
  const { refreshSession } = useAdminAuth();
  const [checking, setChecking] = useState(true);
  const pathname = usePathname();
  const title = breadcrumbMap[pathname] || "Dashboard";

  useEffect(() => {
    async function check() {
      if (!adminUser) {
        const success = await refreshSession();
        if (!success) {
          window.location.href = '/admin/login';
        }
      }
      setChecking(false);
    }
    check();
  }, []);

  if (checking) {
    return <div className="flex items-center justify-center w-full h-screen">Loading...</div>
  }

  // If check finished and no user (and redirect handled above), we might render nothing or null
  // But typically the redirect happens. If we are here and have no user, it's safer to not render children.
  if (!adminUser) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4 bg-white">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-slate-500" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href={pathname} className="font-medium">
                    {title}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <Moon className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4 bg-slate-50/50">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}