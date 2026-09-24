// app/(public)/activities/page.tsx
"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import {
  Footprints,
  Binoculars,
  Flame,
  Camera,
  Waves,
  Mountain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";

const ACTIVITIES = [
  {
    icon: Footprints,
    title: "Walking trails",
    description:
      "Easy paths around the property and longer routes into the surrounding countryside. Ideal for morning walks or a sunset stroll.",
  },
  {
    icon: Binoculars,
    title: "Bird watching",
    description:
      "Quiet corners and open views make this a favourite spot for spotting local birds — bring binoculars if you have them.",
  },
  {
    icon: Flame,
    title: "Evening braai",
    description:
      "Fire up the braai, share a meal under the stars and settle in for the night. Braai facilities are available for guests.",
  },
  {
    icon: Camera,
    title: "Photography",
    description:
      "Golden-hour light, wide skies and natural textures — a great place to slow down with a camera in hand.",
  },
  {
    icon: Waves,
    title: "Pool & downtime",
    description:
      "Cool off in the pool, read in the shade or simply do nothing. Rest is part of the experience here.",
  },
  {
    icon: Mountain,
    title: "Day trips nearby",
    description:
      "Scenic drives, local markets and small towns are within easy reach if you feel like exploring further afield.",
  },
];

export default function ActivitiesPage() {
  const settings = useQuery(api.resortSettings.get);
  const resortName = settings?.name ?? "the resort";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <span className="text-sm font-medium uppercase tracking-wider text-teal-600 dark:text-teal-400">
          Things to do
        </span>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-5xl">
          Activities at {resortName}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-600 dark:text-stone-300">
          Whether you want to explore, unwind or a bit of both — here&apos;s how
          guests typically spend their time.
        </p>
      </div>

      {/* Activity grid */}
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ACTIVITIES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-teal-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-teal-700"
          >
            <Icon className="text-teal-600 dark:text-teal-400" size={28} />
            <h2 className="mt-3 text-lg font-semibold text-stone-900 dark:text-stone-50">
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
        Activities and surroundings can change with the seasons. Ask us when you
        arrive for the latest tips and recommendations.
      </p>

      {/* CTA */}
      <div className="mt-12 flex flex-wrap justify-center gap-4">
        <Button
          asChild
          size="lg"
          className="bg-teal-600 px-8 text-white hover:bg-teal-500"
        >
          <Link href="/rooms">Book a stay</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/amenities">View amenities</Link>
        </Button>
      </div>
    </div>
  );
}
