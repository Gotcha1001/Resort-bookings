"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LayoutDashboard, BedDouble, CalendarCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/venues", label: "Rooms & Venues", icon: BedDouble },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
] as const;

export function AppSidebar() {
  const { user } = useUser();
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-3 py-3">
          <span className="text-2xl">🏝️</span>
          <div>
            <p className="text-sm font-black text-black dark:text-white">
              <span className="text-teal-600 dark:text-teal-400">STAY</span>{" "}
              <span className="text-stone-500">BOOK</span>
            </p>
            <p className="text-[10px] text-gray-400">Rooms &amp; bookings</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  asChild
                  isActive={
                    pathname === href || pathname.startsWith(`${href}/`)
                  }
                >
                  <Link href={href} className="flex items-center gap-2">
                    <Icon size={16} />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {user && (
          <div className="border-t border-gray-200 px-3 py-2 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-sm">
                🏝️
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-black dark:text-white">
                  {user.fullName ?? user.username}
                </p>
                <p className="truncate text-[10px] text-gray-400">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
