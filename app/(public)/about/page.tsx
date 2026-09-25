// app/(public)/about/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
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
        <span className="text-sm font-medium uppercase tracking-wider text-accent">
          About us
        </span>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {resortName}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {tagline}
        </p>
      </div>

      {slides.length > 0 && (
        <div className="mt-10">
          <ContentCarousel slides={slides} />
        </div>
      )}

      {/* Story */}
      <section className="mt-14 space-y-5 text-muted-foreground">
        <h2 className="text-2xl font-semibold text-foreground">{heading}</h2>
        {storyParagraphs.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </section>

      {/* Values */}
      <section className="mt-14">
        <h2 className="text-2xl font-semibold text-foreground">
          What we care about
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {values === undefined ? (
            <p className="col-span-full text-sm text-muted-foreground">
              Loading…
            </p>
          ) : values.length === 0 ? (
            <p className="col-span-full text-sm text-muted-foreground">
              More about us coming soon.
            </p>
          ) : (
            values.map((item) => (
              <div
                key={item._id}
                className="overflow-hidden rounded-2xl border border-border bg-white dark:bg-surface"
              >
                {item.imageUrl ? (
                  <div className="relative h-32 w-full">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(min-width: 640px) 33vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-32 w-full items-center justify-center bg-muted/30 text-muted-foreground">
                    <ImageOff size={20} />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
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
      </section>

      {/* Location — same surface treatment as ContactInfo / value cards */}
      <section className="mt-14 rounded-2xl border border-border bg-white p-6 dark:bg-surface sm:p-8">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 shrink-0 text-accent" size={22} />
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Where to find us
            </h2>
            <p className="mt-2 text-muted-foreground">{locationText}</p>
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
        <Button asChild size="lg" className="px-8">
          <Link href="/rooms">Browse rooms &amp; cottages</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/amenities">See amenities</Link>
        </Button>
      </div>
    </div>
  );
}
