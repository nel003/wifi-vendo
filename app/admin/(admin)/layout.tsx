"use client"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useEffect, useState } from "react"
import { adminStore } from "@/store/user"
 
export default function Layout({ children }: { children: React.ReactNode }) {
  const adminUser = adminStore(s => s.adminUser);
  
  useEffect(() => {
    if (!adminUser) {
      window.location.href = '/admin/login';
    }
  }, []);
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