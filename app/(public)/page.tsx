// app/(public)/page.tsx
"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { BedDouble, Waves, MapPin, Trees } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { PublicRoomCard } from "@/app/components/PublicRoomCard";

const HIGHLIGHTS = [
  {
    title: "Rooms & cottages",
    description:
      "Browse every available room and cottage with real-time availability.",
    icon: BedDouble,
    href: "/rooms",
  },
  {
    title: "Resort amenities",
    description:
      "Pool, braai, wifi and everything else that makes a stay comfortable.",
    icon: Waves,
    href: "/amenities",
  },
  {
    title: "Things to do",
    description: "Local activities, trails and experiences around the resort.",
    icon: Trees,
    href: "/activities",
  },
  {
    title: "About us",
    description: "Our story, location and what makes this place special.",
    icon: MapPin,
    href: "/about",
  },
];

export default function PublicHomePage() {
  const settings = useQuery(api.resortSettings.get);
  const rooms = useQuery(api.rooms.list, { includeArchived: false });

  const resortName = settings?.name ?? "Our Resort";
  const tagline =
    settings?.tagline ??
    "A peaceful escape. Book your room or cottage and start relaxing.";

  // Show up to 3 featured rooms on the landing page
  const featuredRooms = rooms?.slice(0, 3) ?? [];

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-24 text-center">
        <div className="relative z-10 max-w-3xl">
          <span className="text-sm font-medium uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Welcome
          </span>

          <h1 className="mt-4 text-5xl font-black tracking-tight text-stone-900 dark:text-stone-50 md:text-6xl">
            {resortName}
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg text-stone-600 dark:text-stone-300">
            {tagline}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-teal-600 px-10 py-6 text-lg text-white shadow-lg hover:bg-teal-500"
            >
              <Link href="/rooms">Browse rooms & cottages →</Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-stone-300 px-8 py-6 text-lg dark:border-stone-700"
            >
              <Link href="/about">About the resort</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick links / highlights */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-sm transition hover:border-teal-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-teal-700"
            >
              <item.icon
                className="text-teal-600 transition group-hover:scale-110 dark:text-teal-400"
                size={28}
              />
              <h3 className="mt-3 text-lg font-semibold text-stone-900 dark:text-stone-50">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured rooms */}
      {featuredRooms.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
                Featured stays
              </h2>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                A few of our rooms and cottages available to book.
              </p>
            </div>
            <Button
              asChild
              variant="ghost"
              className="text-teal-700 dark:text-teal-400"
            >
              <Link href="/rooms">View all →</Link>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredRooms.map((room) => (
              <PublicRoomCard key={room._id} room={room} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state when no rooms exist yet */}
      {rooms !== undefined && rooms.length === 0 && (
        <section className="mx-auto max-w-xl px-6 pb-24 text-center">
          <div className="rounded-2xl border border-dashed border-stone-300 p-10 dark:border-stone-700">
            <p className="text-stone-600 dark:text-stone-300">
              Rooms and cottages will appear here once the resort has added
              them.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
