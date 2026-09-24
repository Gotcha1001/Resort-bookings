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

export default function Navbar() {
  const settings = useQuery(api.resortSettings.get);
  const resortName = settings?.name ?? "Resort";

  return (
    <motion.nav
      className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 shadow-sm dark:border-stone-800 dark:bg-stone-950 sm:px-6"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <Link
          href="/dashboard"
          className="text-lg font-black tracking-tight text-stone-900 dark:text-stone-50"
        >
          {settings?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logoUrl}
              alt={resortName}
              className="h-7 w-7 rounded object-cover"
            />
          ) : (
            <span className="text-teal-600 dark:text-teal-400">
              {resortName}
            </span>
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
