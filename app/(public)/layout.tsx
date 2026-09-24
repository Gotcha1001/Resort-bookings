// app/(public)/layout.tsx

import { PublicNavbar } from "../components/PublicNavbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-stone-50 dark:bg-stone-950">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
