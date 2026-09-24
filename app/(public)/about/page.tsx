// app/(public)/about/page.tsx
"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { MapPin, Heart, Leaf, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";

const VALUES = [
  {
    icon: Heart,
    title: "Warm hospitality",
    description:
      "Every stay is personal. We look after the small details so you can simply relax.",
  },
  {
    icon: Leaf,
    title: "Nature first",
    description:
      "Surrounded by open space, quiet mornings and star-filled skies — the perfect reset.",
  },
  {
    icon: Coffee,
    title: "Home away from home",
    description:
      "Comfortable rooms and cottages, thoughtful amenities, and space to unwind at your own pace.",
  },
];

export default function AboutPage() {
  const settings = useQuery(api.resortSettings.get);

  const resortName = settings?.name ?? "Our Resort";
  const tagline =
    settings?.tagline ?? "A peaceful escape where comfort meets the outdoors.";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="text-center">
        <span className="text-sm font-medium uppercase tracking-wider text-teal-600 dark:text-teal-400">
          About us
        </span>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-5xl">
          {resortName}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-600 dark:text-stone-300">
          {tagline}
        </p>
      </div>

      {/* Story */}
      <section className="mt-14 space-y-5 text-stone-600 dark:text-stone-300">
        <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
          Our story
        </h2>
        <p>
          {resortName} was created for people who want more than a quick
          overnight stop — a place to slow down, reconnect and enjoy the simple
          things. Whether you&apos;re here for a weekend away, a longer break or
          a special occasion, we aim to make every stay easy and memorable.
        </p>
        <p>
          Our rooms and cottages are designed for comfort: clean, well-equipped
          and ready for rest. Beyond your door, you&apos;ll find space to
          breathe, paths to explore and the kind of quiet that&apos;s hard to
          find elsewhere.
        </p>
      </section>

      {/* Values */}
      <section className="mt-14">
        <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
          What we care about
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {VALUES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900"
            >
              <Icon className="text-teal-600 dark:text-teal-400" size={28} />
              <h3 className="mt-3 text-lg font-semibold text-stone-900 dark:text-stone-50">
                {title}
              </h3>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Location placeholder */}
      <section className="mt-14 rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 sm:p-8">
        <div className="flex items-start gap-3">
          <MapPin
            className="mt-0.5 shrink-0 text-teal-600 dark:text-teal-400"
            size={22}
          />
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              Where to find us
            </h2>
            <p className="mt-2 text-stone-600 dark:text-stone-300">
              {/* Replace with your real address / directions */}
              We&apos;re set in a peaceful corner of the countryside — easy to
              reach, hard to leave. Full directions and parking details are
              shared after you book.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="mt-14 flex flex-wrap justify-center gap-4 text-center">
        <Button
          asChild
          size="lg"
          className="bg-teal-600 px-8 text-white hover:bg-teal-500"
        >
          <Link href="/rooms">Browse rooms & cottages</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/amenities">See amenities</Link>
        </Button>
      </div>
    </div>
  );
}
