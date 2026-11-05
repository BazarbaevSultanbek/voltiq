export type Group = "phone" | "pc";
export type Category = { slug: string; group: Group; art: string; color: string };

export const CATEGORIES: Category[] = [
  { slug: "chargers", group: "phone", art: "charger", color: "lime" },
  { slug: "cables", group: "phone", art: "cable", color: "orange" },
  { slug: "power-banks", group: "phone", art: "powerbank", color: "black" },
  { slug: "cases", group: "phone", art: "case", color: "blue" },
  { slug: "screen-protectors", group: "phone", art: "protector", color: "blue" },
  { slug: "audio", group: "phone", art: "earbuds", color: "white" },
  { slug: "mounts", group: "phone", art: "mount", color: "blue" },
  { slug: "wearables", group: "phone", art: "watchband", color: "black" },
  { slug: "keyboards", group: "pc", art: "keyboard", color: "blue" },
  { slug: "mice", group: "pc", art: "mouse", color: "lime" },
  { slug: "mousepads", group: "pc", art: "mousepad", color: "orange" },
  { slug: "webcams", group: "pc", art: "webcam", color: "blue" },
  { slug: "hubs", group: "pc", art: "hub", color: "black" },
  { slug: "storage", group: "pc", art: "ssd", color: "orange" },
  { slug: "stands", group: "pc", art: "laptopstand", color: "lime" },
  { slug: "gaming", group: "pc", art: "controller", color: "orange" },
  { slug: "lighting", group: "pc", art: "ringlight", color: "lime" },
];

export const categoryArt = (slug: string) => {
  const c = CATEGORIES.find((x) => x.slug === slug);
  return c ? `/products/${c.art}-${c.color}.svg` : "/products/charger-orange.svg";
};
