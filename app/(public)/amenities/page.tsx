// app/(public)/amenities/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { ContentCarousel } from "@/app/components/site/ContentCarousel";
import { ContactInfo } from "@/app/components/site/ContactInfo";

export default function AmenitiesPage() {
  const settings = useQuery(api.resortSettings.get);
  const amenities = useQuery(api.siteContent.listPublic, {
    section: "amenities",
  });
  const resortName = settings?.name ?? "the resort";

  const slides = (amenities ?? [])
    .filter((item) => item.imageUrl)
    .map((item) => ({
      _id: item._id,
      title: item.title,
      imageUrl: item.imageUrl as string,
    }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <span className="text-sm font-medium uppercase tracking-wider text-teal-600 dark:text-teal-400">
          What&apos;s included
        </span>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-5xl">
          Amenities at {resortName}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-600 dark:text-stone-300">
          Everything you need for a comfortable stay, right on the property.
        </p>
      </div>

      {slides.length > 0 && (
        <div className="mt-10">
          <ContentCarousel slides={slides} />
        </div>
      )}

      {/* Amenities grid */}
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {amenities === undefined ? (
          <p className="col-span-full text-center text-sm text-stone-500">
            Loading…
          </p>
        ) : amenities.length === 0 ? (
          <p className="col-span-full text-center text-sm text-stone-500">
            Amenities are being added — check back soon.
          </p>
        ) : (
          amenities.map((item) => (
            <div
              key={item._id}
              className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:border-teal-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-teal-700"
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
                <div className="flex h-40 w-full items-center justify-center bg-stone-100 text-stone-300 dark:bg-stone-800 dark:text-stone-600">
                  <ImageOff size={24} />
                </div>
              )}
              <div className="p-6">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                  {item.title}
                </h2>
                {item.description && (
                  <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Contact */}
      {settings && (
        <div className="mt-14">
          <ContactInfo
            phone={settings.phone}
            email={settings.email}
            address={settings.address}
          />
        </div>
      )}

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
          <Link href="/activities">See activities</Link>
        </Button>
      </div>
    </div>
  );
}
