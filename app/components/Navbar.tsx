// components/Navbar.tsx
"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
import Image from "next/image";

interface NavbarProps {
  // Where the logo/name should link to. Admin layout keeps "/dashboard",
  // the public layout should pass "/" so signed-out visitors land on the
  // marketing home page instead of being redirected away from /dashboard.
  homeHref?: string;
}

export default function Navbar({ homeHref = "/dashboard" }: NavbarProps) {
  const settings = useQuery(api.resortSettings.get);
  const resortName = settings?.name ?? "Resort";

  return (
    <motion.nav
      className="flex items-center justify-between border-b border-border bg-white px-4 py-3 shadow-sm dark:bg-surface sm:px-6"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Link
          href={homeHref}
          className="text-lg font-black tracking-tight text-foreground"
        >
          {settings?.logoUrl ? (
            <Image
              src={settings.logoUrl}
              alt={resortName}
              width={28}
              height={28}
              className="h-7 w-7 rounded object-cover"
            />
          ) : (
            <span className="text-accent">{resortName}</span>
          )}
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <SignedOut>
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
        </SignedOut>
        <SignedIn>
          <ThemeToggle />
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </motion.nav>
  );
}
