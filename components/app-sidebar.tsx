"use client"

import * as React from "react"
import {
  DollarSign,
  GalleryVerticalEnd,
  LayoutDashboard,
  ReceiptText,
  Tickets,
  Users,
  Settings,
  Router,
} from "lucide-react"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useRouter, usePathname } from "next/navigation";

import { useSettingsStore } from "@/store/settings-store";

const data = {
  user: {
    name: "Arnel",
    email: "alopena55555@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  items: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: LayoutDashboard
    },
    {
      title: "Rates",
      url: "/admin/rates",
      icon: DollarSign
    },
    {
      title: "Vouchers",
      url: "/admin/vouchers",
      icon: Tickets
    },
    {
      title: "Clients",
      url: "/admin/clients",
      icon: Users
    }, {
      title: "Transactions",
      url: "/admin/transactions",
      icon: ReceiptText
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings
    }
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const pathname = usePathname();
  const { appName, version, fetchSettings } = useSettingsStore();

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <Sidebar collapsible="icon" {...props} className="border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <Router className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-bold text-base text-slate-900">{appName}</span>
                  <span className="text-xs text-slate-400">v{version}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase text-xs font-bold text-slate-400 mt-4 mb-2 px-4">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2">
              {data.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={`mb-1 ${pathname === item.url ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>
                    <div className="cursor-pointer" onClick={() => router.push(item.url)}>
                      <item.icon className={pathname === item.url ? "text-emerald-600" : "text-slate-400"} />
                      <span>{item.title}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
