import { BatteryCharging, Cable, Car, Gamepad2, HardDrive, Headphones, Keyboard, Laptop, Lightbulb, Mouse, PlugZap, RectangleHorizontal, ShieldCheck, Smartphone, Usb, Watch, Webcam, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

const ICONS: Record<string, LucideIcon> = {
  chargers: PlugZap, cables: Cable, "power-banks": BatteryCharging, cases: Smartphone, "screen-protectors": ShieldCheck,
  audio: Headphones, mounts: Car, wearables: Watch, keyboards: Keyboard, mice: Mouse, mousepads: RectangleHorizontal,
  webcams: Webcam, hubs: Usb, storage: HardDrive, stands: Laptop, gaming: Gamepad2, lighting: Lightbulb,
};

/** Simple line icon for a category (used in menus and filters). */
export function CategoryIcon({ slug, className, size = 18 }: { slug: string; className?: string; size?: number }) {
  const Icon = ICONS[slug] ?? Smartphone;
  return <span className={cn("grid shrink-0 place-items-center rounded-lg bg-cream text-volt", className)}><Icon size={size} strokeWidth={2} /></span>;
}
