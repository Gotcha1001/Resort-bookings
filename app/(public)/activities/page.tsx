// app/(public)/activities/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { ContentCarousel } from "@/app/components/site/ContentCarousel";
import { ContactInfo } from "@/app/components/site/ContactInfo";

export default function ActivitiesPage() {
  const settings = useQuery(api.resortSettings.get);
  const activities = useQuery(api.siteContent.listPublic, {
    section: "activities",
  });
  const resortName = settings?.name ?? "the resort";

  const slides = (activities ?? [])
    .filter((item) => item.imageUrl)
    .map((item) => ({
      _id: item._id,
      title: item.title,
      imageUrl: item.imageUrl as string,
    }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="text-sm font-medium uppercase tracking-wider text-accent">
          Things to do
        </span>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Activities at {resortName}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Whether you want to explore, unwind or a bit of both — here&apos;s how
          guests typically spend their time.
        </p>
      </div>

      {slides.length > 0 && (
        <div className="mt-10">
          <ContentCarousel slides={slides} />
        </div>
      )}

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {activities === undefined ? (
          <p className="col-span-full text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : activities.length === 0 ? (
          <p className="col-span-full text-center text-sm text-muted-foreground">
            Activities are being added — check back soon.
          </p>
        ) : (
          activities.map((item) => (
            <div
              key={item._id}
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:border-accent hover:shadow-md dark:bg-[var(--surface)]"
            >
              {item.imageUrl ? (
                <div className="relative h-40 w-full">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-40 w-full items-center justify-center bg-muted/30 text-muted-foreground">
                  <ImageOff size={24} />
                </div>
              )}
              <div className="p-6">
                <h2 className="text-lg font-semibold text-foreground">
                  {item.title}
                </h2>
                {item.description && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {settings && (
        <div className="mt-14">
          <ContactInfo
            phone={settings.phone}
            email={settings.email}
            address={settings.address}
          />
        </div>
      )}

      <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
        Activities and surroundings can change with the seasons. Ask us when you
        arrive for the latest tips and recommendations.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Button asChild size="lg" className="px-8">
          <Link href="/rooms">Book a stay</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/amenities">View amenities</Link>
        </Button>
      </div>
    </div>
  );
}
