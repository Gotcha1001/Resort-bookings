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
      className={`rounded-2xl border border-border bg-white p-6 dark:bg-surface sm:p-8 ${className}`}
    >
      <h2 className="text-lg font-semibold text-foreground">Get in touch</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {phone && (
          <a
            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
            className="flex items-center gap-3 text-muted-foreground transition hover:text-accent"
          >
            <Phone size={18} className="shrink-0 text-accent" />
            <span>{phone}</span>
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-3 text-muted-foreground transition hover:text-accent"
          >
            <Mail size={18} className="shrink-0 text-accent" />
            <span>{email}</span>
          </a>
        )}
        {address && (
          <div className="flex items-start gap-3 text-muted-foreground">
            <MapPin size={18} className="mt-0.5 shrink-0 text-accent" />
            <span>{address}</span>
          </div>
        )}
      </div>
    </section>
  );
}
