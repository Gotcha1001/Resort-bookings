// components/site/ContentCarousel.tsx
"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CarouselSlide {
  _id: string;
  title: string;
  imageUrl: string;
}

interface ContentCarouselProps {
  slides: CarouselSlide[];
  /** Tailwind height class(es) for the carousel. */
  heightClass?: string;
  intervalMs?: number;
}

export function ContentCarousel({
  slides,
  heightClass = "h-[38vh] sm:h-[48vh]",
  intervalMs = 5000,
}: ContentCarouselProps) {
  const [rawIndex, setRawIndex] = useState(0);

  // Derived during render: always in range, even if `slides` shrinks.
  // No effect, no extra render.
  const index = slides.length > 0 ? rawIndex % slides.length : 0;

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => {
      setRawIndex((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [slides.length, intervalMs]);

  if (slides.length === 0) return null;

  function go(delta: number) {
    // Base off the derived index so a stale rawIndex can't cause a jump.
    setRawIndex((index + delta + slides.length) % slides.length);
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl ${heightClass}`}
    >
      {slides.map((slide, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL
        <img
          key={slide._id}
          src={slide.imageUrl}
          alt={slide.title}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
        <p className="text-lg font-semibold text-white drop-shadow sm:text-2xl">
          {slides[index].title}
        </p>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide._id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setRawIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
