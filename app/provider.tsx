// app/provider.tsx
"use client";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { UserContext } from "./context/UserContext";

export default function Provider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const createOrGet = useMutation(api.user.createOrGet);
  const currentUser = useQuery(api.user.getMe, isSignedIn ? {} : "skip");

  useEffect(() => {
    if (isSignedIn) createOrGet().catch(console.error);
  }, [isSignedIn, createOrGet]);

  // Right after sign-in, land admins on the admin dashboard and everyone
  // else on the public site. Only fires once, right at the sign-in gate.
  useEffect(() => {
    if (!currentUser) return;
    if (pathname === "/sign-in" || pathname === "/") {
      router.push(currentUser.role === "admin" ? "/dashboard" : "/rooms");
    }
  }, [currentUser, pathname, router]);

  return (
    <UserContext.Provider value={currentUser ?? null}>
      {children}
    </UserContext.Provider>
  );
}
