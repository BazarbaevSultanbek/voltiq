export type Group = "phone" | "pc";
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
];
