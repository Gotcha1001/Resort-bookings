// app/(public)/layout.tsx
"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Navbar from "../components/Navbar";
import { PublicSidebar } from "../components/PublicSidebar";

// app/(public)/layout.tsx
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <PublicSidebar />
      <SidebarInset>
        <Navbar homeHref="/" />
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
