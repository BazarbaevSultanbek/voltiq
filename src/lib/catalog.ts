export const GROUPS = ["phone", "pc", "fashion", "home", "lifestyle"] as const;
export type Group = (typeof GROUPS)[number];
export type Category = { slug: string; group: Group };

export const CATEGORIES: Category[] = [
  { slug: "chargers", group: "phone" },
  { slug: "cables", group: "phone" },
  { slug: "power-banks", group: "phone" },
  { slug: "cases", group: "phone" },
  { slug: "screen-protectors", group: "phone" },
  { slug: "audio", group: "phone" },
  { slug: "mounts", group: "phone" },
  { slug: "wearables", group: "phone" },
  { slug: "keyboards", group: "pc" },
  { slug: "mice", group: "pc" },
  { slug: "mousepads", group: "pc" },
  { slug: "webcams", group: "pc" },
  { slug: "hubs", group: "pc" },
  { slug: "storage", group: "pc" },
  { slug: "stands", group: "pc" },
  { slug: "gaming", group: "pc" },
  { slug: "lighting", group: "pc" },
  { slug: "winter-wear", group: "fashion" },
  { slug: "hoodies", group: "fashion" },
  { slug: "socks", group: "fashion" },
  { slug: "bags", group: "fashion" },
  { slug: "jewelry", group: "fashion" },
  { slug: "holiday", group: "home" },
  { slug: "kitchen", group: "home" },
  { slug: "decor", group: "home" },
  { slug: "blankets", group: "home" },
  { slug: "organizers", group: "home" },
  { slug: "bathroom", group: "home" },
  { slug: "beauty", group: "lifestyle" },
  { slug: "toys", group: "lifestyle" },
  { slug: "pets", group: "lifestyle" },
  { slug: "sports", group: "lifestyle" },
  { slug: "car", group: "lifestyle" },
];

export const isGroup = (v: unknown): v is Group => (GROUPS as readonly string[]).includes(v as string);
