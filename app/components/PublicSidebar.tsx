// components/PublicSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import {
  Home,
  BedDouble,
  Waves,
  Trees,
  MapPin,
  CalendarCheck,
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
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/rooms", label: "Rooms & cottages", icon: BedDouble },
  { href: "/amenities", label: "Amenities", icon: Waves },
  { href: "/activities", label: "Things to do", icon: Trees },
  { href: "/about", label: "About us", icon: MapPin },
] as const;

export function PublicSidebar() {
  const { user, isSignedIn } = useUser();
  const pathname = usePathname();
  const settings = useQuery(api.resortSettings.get);

  const resortName = settings?.name ?? "Resort";
  const tagline = settings?.tagline ?? "Rooms & bookings";

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-3 py-3">
          {settings?.logoUrl ? (
            <Image
              src={settings.logoUrl}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-cover"
            />
          ) : (
            <span className="text-2xl">🏝️</span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-foreground">
              <span className="text-accent">{resortName}</span>
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {tagline}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Explore</SidebarGroupLabel>
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

            {isSignedIn && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/my-bookings")}
                >
                  <Link href="/my-bookings" className="flex items-center gap-2">
                    <CalendarCheck size={16} />
                    <span>My bookings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {user && (
          <div className="border-t border-border px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground">
                {(user.fullName ?? user.username ?? "?")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">
                  {user.fullName ?? user.username}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
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
