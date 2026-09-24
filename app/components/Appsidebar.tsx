// components/Appsidebar.tsx  (or AppSidebar.tsx)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  Settings,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
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

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/rooms", label: "Rooms", icon: BedDouble },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar() {
  const { user } = useUser();
  const pathname = usePathname();
  const settings = useQuery(api.resortSettings.get);

  const resortName = settings?.name ?? "Resort";
  const tagline = settings?.tagline ?? "Rooms & bookings";

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-3 py-3">
          {settings?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logoUrl}
              alt=""
              className="h-8 w-8 rounded-lg object-cover"
            />
          ) : (
            <span className="text-2xl">🏝️</span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-stone-900 dark:text-stone-50">
              <span className="text-teal-600 dark:text-teal-400">
                {resortName}
              </span>
            </p>
            <p className="truncate text-[10px] text-stone-400">{tagline}</p>
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
          <div className="border-t border-stone-200 px-3 py-2 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-xs text-white">
                {(user.fullName ?? user.username ?? "?")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-stone-900 dark:text-stone-50">
                  {user.fullName ?? user.username}
                </p>
                <p className="truncate text-[10px] text-stone-400">
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
