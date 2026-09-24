// app/(public)/amenities/page.tsx
"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import {
  Wifi,
  Waves,
  Flame,
  Car,
  UtensilsCrossed,
  Shirt,
  TreePine,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";

const AMENITIES = [
  {
    icon: Wifi,
    title: "Free Wi‑Fi",
    description:
      "Stay connected throughout the property with complimentary wireless internet.",
  },
  {
    icon: Waves,
    title: "Swimming pool",
    description:
      "Cool off and relax by the pool — perfect for hot afternoons and lazy mornings.",
  },
  {
    icon: Flame,
    title: "Braai facilities",
    description:
      "Outdoor braai areas so you can cook, gather and enjoy the evening air.",
  },
  {
    icon: Car,
    title: "Secure parking",
    description:
      "On-site parking for guests. Safe and close to your room or cottage.",
  },
  {
    icon: UtensilsCrossed,
    title: "Self-catering ready",
    description:
      "Fully equipped kitchens in cottages and kitchenettes where available.",
  },
  {
    icon: Shirt,
    title: "Fresh linen & towels",
    description:
      "Clean linen and towels provided for every stay. Extra sets on request.",
  },
  {
    icon: TreePine,
    title: "Garden & outdoor space",
    description:
      "Open lawns, shaded spots and room to stretch out away from the crowds.",
  },
  {
    icon: ShieldCheck,
    title: "Safe & private",
    description:
      "A peaceful, secure setting so you can switch off and enjoy your break.",
  },
];

export default function AmenitiesPage() {
  const settings = useQuery(api.resortSettings.get);
  const resortName = settings?.name ?? "the resort";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <span className="text-sm font-medium uppercase tracking-wider text-teal-600 dark:text-teal-400">
          What we offer
        </span>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-5xl">
          Amenities at {resortName}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-600 dark:text-stone-300">
          Resort-wide comforts available to every guest — separate from the
          individual features of each room or cottage.
        </p>
      </div>

      {/* Amenities grid */}
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {AMENITIES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-teal-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-teal-700"
          >
            <Icon className="text-teal-600 dark:text-teal-400" size={28} />
            <h2 className="mt-3 text-base font-semibold text-stone-900 dark:text-stone-50">
              {title}
            </h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
              {description}
            </p>
          </div>
        ))}
      </div>

      {/* Note */}
      <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-stone-500 dark:text-stone-400">
        Room-specific amenities (e.g. en-suite bathroom, kitchenette) are listed
        on each room&apos;s page when you browse stays.
      </p>

      {/* CTA */}
      <div className="mt-12 flex flex-wrap justify-center gap-4">
        <Button
          asChild
          size="lg"
          className="bg-teal-600 px-8 text-white hover:bg-teal-500"
        >
          <Link href="/rooms">Browse rooms & cottages</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/activities">Things to do</Link>
        </Button>
      </div>
    </div>
  );
}
