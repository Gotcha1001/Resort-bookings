// app/(public)/about/page.tsx
"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { ImageOff, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import {
  DEFAULT_ABOUT_HEADING,
  DEFAULT_LOCATION_TEXT,
  defaultAboutStory,
} from "@/lib/siteContent";
import { ContentCarousel } from "@/app/components/site/ContentCarousel";
import { ContactInfo } from "@/app/components/site/ContactInfo";

export default function AboutPage() {
  const settings = useQuery(api.resortSettings.get);
  const values = useQuery(api.siteContent.listPublic, {
    section: "aboutValues",
  });

  const resortName = settings?.name ?? "Our Resort";
  const tagline =
    settings?.tagline ?? "A peaceful escape where comfort meets the outdoors.";
  const heading = settings?.aboutHeading || DEFAULT_ABOUT_HEADING;
  const story = settings?.aboutStory || defaultAboutStory(resortName);
  const locationText = settings?.aboutLocationText || DEFAULT_LOCATION_TEXT;
  // aboutStory paragraphs are separated by a blank line (see AboutSettingsForm).
  const storyParagraphs = story.split(/\n\s*\n/).filter(Boolean);

  const slides = (values ?? [])
    .filter((item) => item.imageUrl)
    .map((item) => ({
      _id: item._id,
      title: item.title,
      imageUrl: item.imageUrl as string,
    }));

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

      {slides.length > 0 && (
        <div className="mt-10">
          <ContentCarousel slides={slides} />
        </div>
      )}

      {/* Story */}
      <section className="mt-14 space-y-5 text-stone-600 dark:text-stone-300">
        <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
          {heading}
        </h2>
        {storyParagraphs.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </section>

      {/* Values */}
      <section className="mt-14">
        <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
          What we care about
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {values === undefined ? (
            <p className="col-span-full text-sm text-stone-500">Loading…</p>
          ) : values.length === 0 ? (
            <p className="col-span-full text-sm text-stone-500">
              More about us coming soon.
            </p>
          ) : (
            values.map((item) => (
              <div
                key={item._id}
                className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900"
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-32 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center bg-stone-100 text-stone-300 dark:bg-stone-800 dark:text-stone-600">
                    <ImageOff size={20} />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                    {item.title}
                  </h3>
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
      </section>

      {/* Location */}
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
              {locationText}
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      {settings && (
        <div className="mt-8">
          <ContactInfo
            phone={settings.phone}
            email={settings.email}
            address={settings.address}
          />
        </div>
      )}

      {/* CTA */}
      <div className="mt-14 flex flex-wrap justify-center gap-4 text-center">
        <Button
          asChild
          size="lg"
          className="bg-teal-600 px-8 text-white hover:bg-teal-500"
        >
          <Link href="/rooms">Browse rooms &amp; cottages</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/amenities">See amenities</Link>
        </Button>
      </div>
    </div>
  );
}
