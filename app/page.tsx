"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BedDouble, CalendarClock, Receipt } from "lucide-react";

const FEATURES = [
  {
    title: "Every room, one place",
    description:
      "List each room or venue with its price, facilities and a short description — ready to book in seconds.",
    icon: BedDouble,
  },
  {
    title: "Weekly or monthly stays",
    description:
      "Guests book by the week or the month. Once a stay ends, the room frees itself automatically.",
    icon: CalendarClock,
  },
  {
    title: "Know what's owed",
    description:
      "Mark bookings as paid, track cancellations, and see this month's income at a glance.",
    icon: Receipt,
  },
];

export default function Home() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) router.prefetch("/dashboard");
  }, [isSignedIn, router]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-stone-50 px-6 text-center dark:bg-stone-950">
      <div className="relative z-10 max-w-2xl">
        <span className="text-sm font-medium text-teal-600 dark:text-teal-400">
          For hotels, resorts &amp; guesthouses
        </span>
        <h1 className="mt-4 text-5xl font-black tracking-tight text-stone-900 dark:text-stone-50 md:text-6xl">
          Bookings, sorted.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-stone-600 dark:text-stone-300">
          Keep every room, every guest and every payment in one calm, simple
          place — from first booking to check-out.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {isSignedIn ? (
            <Button
              size="lg"
              className="bg-teal-600 px-10 py-6 text-lg text-white shadow-lg hover:bg-teal-500"
              onClick={() => router.push("/dashboard")}
            >
              Go to dashboard →
            </Button>
          ) : (
            <>
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <Button
                  size="lg"
                  className="bg-teal-600 px-10 py-6 text-lg text-white shadow-lg hover:bg-teal-500"
                >
                  Sign in
                </Button>
              </SignInButton>
              <Link href="/sign-up">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-teal-600 px-10 py-6 text-lg text-teal-700 dark:text-teal-400"
                >
                  Create account
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="relative z-10 mt-20 grid max-w-5xl gap-6 md:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-sm dark:border-stone-800 dark:bg-stone-900"
          >
            <feature.icon
              className="text-teal-600 dark:text-teal-400"
              size={28}
            />
            <h3 className="mt-3 text-lg font-semibold text-stone-900 dark:text-stone-50">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
