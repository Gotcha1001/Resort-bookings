// components/PublicNavbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const PUBLIC_LINKS = [
  { href: "/rooms", label: "Rooms" },
  { href: "/amenities", label: "Amenities" },
  { href: "/activities", label: "Activities" },
  { href: "/about", label: "About" },
] as const;

export function PublicNavbar() {
  const pathname = usePathname();
  const settings = useQuery(api.resortSettings.get);

  const resortName = settings?.name ?? "Resort";

  return (
    <motion.nav
      className="sticky top-0 z-40 flex items-center justify-between border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90 sm:px-6"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Brand – resort name from resortSettings */}
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 text-lg font-black tracking-tight text-stone-900 dark:text-stone-50"
      >
        <span className="text-xl">🏝️</span>
        <span>
          <span className="text-teal-600 dark:text-teal-400">{resortName}</span>
        </span>
      </Link>

      {/* Desktop nav links */}
      <div className="hidden items-center gap-1 md:flex">
        {PUBLIC_LINKS.map(({ href, label }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                isActive
                  ? "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-stone-100",
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Auth + theme */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <SignedOut>
          <SignInButton mode="modal">
            <Button
              variant="ghost"
              size="sm"
              className="text-stone-700 dark:text-stone-200"
            >
              Sign in
            </Button>
          </SignInButton>
          <Button
            asChild
            size="sm"
            className="bg-teal-600 text-white hover:bg-teal-500"
          >
            <Link href="/rooms">Book a stay</Link>
          </Button>
        </SignedOut>

        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </motion.nav>
  );
}
