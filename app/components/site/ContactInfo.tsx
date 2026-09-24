// components/site/ContactInfo.tsx
import { Mail, MapPin, Phone } from "lucide-react";

interface ContactInfoProps {
  phone?: string;
  email?: string;
  address?: string;
  className?: string;
}

// Renders nothing if the admin hasn't filled in any contact details yet,
// so an empty settings tab never leaves a half-empty box on the public site.
export function ContactInfo({
  phone,
  email,
  address,
  className = "",
}: ContactInfoProps) {
  if (!phone && !email && !address) return null;

  return (
    <section
      className={`rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 sm:p-8 ${className}`}
    >
      <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
        Get in touch
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {phone && (
          <a
            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
            className="flex items-center gap-3 text-stone-600 transition hover:text-teal-600 dark:text-stone-300 dark:hover:text-teal-400"
          >
            <Phone
              size={18}
              className="shrink-0 text-teal-600 dark:text-teal-400"
            />
            <span>{phone}</span>
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-3 text-stone-600 transition hover:text-teal-600 dark:text-stone-300 dark:hover:text-teal-400"
          >
            <Mail
              size={18}
              className="shrink-0 text-teal-600 dark:text-teal-400"
            />
            <span>{email}</span>
          </a>
        )}
        {address && (
          <div className="flex items-start gap-3 text-stone-600 dark:text-stone-300">
            <MapPin
              size={18}
              className="mt-0.5 shrink-0 text-teal-600 dark:text-teal-400"
            />
            <span>{address}</span>
          </div>
        )}
      </div>
    </section>
  );
}
