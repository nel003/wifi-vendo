"use client"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useEffect, useState } from "react"
import { adminStore } from "@/store/user"
import { useAdminAuth } from "@/hooks/use-admin-auth"

export default function Layout({ children }: { children: React.ReactNode }) {
  const adminUser = adminStore(s => s.adminUser);
  const { refreshSession } = useAdminAuth();
  const [checking, setChecking] = useState(true);

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
      <main className="p-3 w-full">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}