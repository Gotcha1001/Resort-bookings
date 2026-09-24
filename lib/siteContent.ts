// lib/siteContent.ts
// Shared between the Convex functions (imported as ../lib/siteContent) and the UI.

export const CONTENT_SECTIONS = [
  "activities",
  "amenities",
  "aboutValues",
] as const;

export type ContentSection = (typeof CONTENT_SECTIONS)[number];

export interface DefaultContentItem {
  title: string;
  description: string;
}

// Starter content = what used to be hard coded in the pages. Admins can load
// it with one click from the settings page and then edit / replace it.
export const DEFAULT_CONTENT: Record<ContentSection, DefaultContentItem[]> = {
  activities: [
    {
      title: "Walking trails",
      description:
        "Easy paths around the property and longer routes into the surrounding countryside. Ideal for morning walks or a sunset stroll.",
    },
    {
      title: "Bird watching",
      description:
        "Quiet corners and open views make this a favourite spot for spotting local birds. Bring binoculars if you have them.",
    },
    {
      title: "Evening braai",
      description:
        "Fire up the braai, share a meal under the stars and settle in for the night. Braai facilities are available for guests.",
    },
    {
      title: "Photography",
      description:
        "Golden-hour light, wide skies and natural textures. A great place to slow down with a camera in hand.",
    },
    {
      title: "Pool & downtime",
      description:
        "Cool off in the pool, read in the shade or simply do nothing. Rest is part of the experience here.",
    },
    {
      title: "Day trips nearby",
      description:
        "Scenic drives, local markets and small towns are within easy reach if you feel like exploring further afield.",
    },
  ],
  amenities: [
    {
      title: "Free Wi-Fi",
      description:
        "Stay connected throughout the property with complimentary wireless internet.",
    },
    {
      title: "Swimming pool",
      description:
        "Cool off and relax by the pool, perfect for hot afternoons and lazy mornings.",
    },
    {
      title: "Braai facilities",
      description:
        "Outdoor braai areas so you can cook, gather and enjoy the evening air.",
    },
    {
      title: "Secure parking",
      description:
        "On-site parking for guests. Safe and close to your room or cottage.",
    },
    {
      title: "Self-catering ready",
      description:
        "Fully equipped kitchens in cottages and kitchenettes where available.",
    },
    {
      title: "Fresh linen & towels",
      description:
        "Clean linen and towels provided for every stay. Extra sets on request.",
    },
    {
      title: "Garden & outdoor space",
      description:
        "Open lawns, shaded spots and room to stretch out away from the crowds.",
    },
    {
      title: "Safe & private",
      description:
        "A peaceful, secure setting so you can switch off and enjoy your break.",
    },
  ],
  aboutValues: [
    {
      title: "Warm hospitality",
      description:
        "Every stay is personal. We look after the small details so you can simply relax.",
    },
    {
      title: "Nature first",
      description:
        "Surrounded by open space, quiet mornings and star-filled skies. The perfect reset.",
    },
    {
      title: "Home away from home",
      description:
        "Comfortable rooms and cottages, thoughtful amenities, and space to unwind at your own pace.",
    },
  ],
};

export const DEFAULT_TAGLINE =
  "A peaceful escape where comfort meets the outdoors.";

export const DEFAULT_ABOUT_HEADING = "Our story";

export function defaultAboutStory(resortName: string): string {
  return (
    `${resortName} was created for people who want more than a quick overnight stop: a place to slow down, reconnect and enjoy the simple things. ` +
    `Whether you're here for a weekend away, a longer break or a special occasion, we aim to make every stay easy and memorable.\n\n` +
    `Our rooms and cottages are designed for comfort: clean, well-equipped and ready for rest. Beyond your door, you'll find space to breathe, paths to explore and the kind of quiet that's hard to find elsewhere.`
  );
}

export const DEFAULT_LOCATION_TEXT =
  "We're set in a peaceful corner of the countryside, easy to reach and hard to leave. Full directions and parking details are shared after you book.";

export const SECTION_TEXT: Record<
  ContentSection,
  { singular: string; plural: string; publicHref: string }
> = {
  activities: {
    singular: "activity",
    plural: "activities",
    publicHref: "/activities",
  },
  amenities: {
    singular: "amenity",
    plural: "amenities",
    publicHref: "/amenities",
  },
  aboutValues: { singular: "value", plural: "values", publicHref: "/about" },
};
