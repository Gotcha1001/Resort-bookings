// app/(admin)/layout.tsx  (you already have this pattern)
"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Navbar from "../components/Navbar";
import { AppSidebar } from "../components/Appsidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn, isLoaded } = useUser();
  const currentUser = useQuery(api.user.getMe, isSignedIn ? {} : "skip");

  if (!isLoaded || (isSignedIn && currentUser === undefined)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-stone-500">
        Loading…
      </div>
    );
  }

  if (!isSignedIn) redirect("/sign-in");
  if (currentUser && currentUser.role !== "admin") redirect("/rooms");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Navbar />
        <main className="p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
