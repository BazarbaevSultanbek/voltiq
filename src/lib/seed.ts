import "server-only";
import { Product } from "@/models/Product";
import { Settings } from "@/models/Settings";
import { CATEGORIES } from "./catalog";
import { priceProduct } from "./pricing";

type Seed = {
  t: string; cat: string; art: string; colors: string[]; cost: number; was?: number;
  d: string; specs: [string, string][]; tags: string[]; featured?: boolean;
};

const HEX: Record<string, string> = {
  black: "#1f2026", white: "#eceae4", orange: "#ff5b14", lime: "#b7e02c", blue: "#3d7bff", pink: "#ff5c8a",
  purple: "#7c5cff", green: "#1fa37a", gray: "#8a8f99", sand: "#d8c3a0", red: "#e8334a", teal: "#18a7b5",
};

const S: Seed[] = [
  // ── Chargers
  { t: "65W GaN 3-Port Fast Charger", cat: "chargers", art: "charger", colors: ["white", "black", "lime"], cost: 11.4, was: 16, featured: true,
    d: "Gallium-nitride charger that powers a laptop, phone and earbuds at once. 65W USB-C PD with smart power distribution, 40% smaller than standard bricks.",
    specs: [["Output", "65W max (USB-C PD 3.0)"], ["Ports", "2× USB-C, 1× USB-A"], ["Tech", "GaN III"], ["Plug", "Foldable US / EU adapters"]], tags: ["charger", "gan", "usb-c", "fast charging", "laptop charger", "iphone charger"] },
  { t: "20W USB-C Mini PD Charger", cat: "chargers", art: "charger", colors: ["white", "pink", "blue"], cost: 3.2, was: 5,
    d: "Pocket-size PD charger that fills an iPhone to 50% in about 30 minutes.", specs: [["Output", "20W PD"], ["Ports", "1× USB-C"], ["Protection", "Over-voltage, over-heat"]], tags: ["charger", "iphone", "20w", "usb-c"] },
  { t: "100W GaN Desktop Charging Station", cat: "chargers", art: "charger", colors: ["black", "gray"], cost: 21.5, was: 30,
    d: "Four-port GaN station for your desk. Charges a MacBook Pro at full speed while topping up your phone and watch.", specs: [["Output", "100W total"], ["Ports", "3× USB-C, 1× USB-A"], ["Cable", "1.5 m detachable"]], tags: ["charger", "gan", "macbook", "desk"] },
  { t: "15W Magnetic Wireless Charging Pad", cat: "chargers", art: "wireless", colors: ["white", "black", "lime"], cost: 6.8, was: 10, featured: true,
    d: "Snap-on magnetic pad with perfect coil alignment for MagSafe-compatible phones. Soft-touch finish and LED status ring.", specs: [["Output", "15W Qi2"], ["Input", "USB-C"], ["Compatible", "iPhone 12+ / Qi phones"]], tags: ["wireless charger", "magsafe", "qi", "magnetic"] },
  { t: "Dual-Port 48W Car Charger", cat: "chargers", art: "carcharger", colors: ["black", "gray"], cost: 4.1, was: 6.5,
    d: "Aluminium car charger with USB-C PD and Quick Charge USB-A. Sits flush in your 12V socket.", specs: [["Output", "30W C + 18W A"], ["Body", "Aluminium alloy"], ["Input", "12-24V"]], tags: ["car charger", "usb-c", "car"] },

  // ── Cables
  { t: "Braided USB-C to USB-C 240W Cable (2 m)", cat: "cables", art: "cable", colors: ["orange", "black", "white", "purple"], cost: 2.6, was: 4.5, featured: true,
    d: "Military-grade nylon braid tested for 30,000 bends. Supports 240W EPR charging and 480 Mbps data.", specs: [["Power", "240W"], ["Length", "2 m"], ["Data", "480 Mbps"], ["Chip", "E-marker"]], tags: ["cable", "usb-c", "braided", "240w", "fast charging"] },
  { t: "USB-C to Lightning MFi Cable (1 m)", cat: "cables", art: "cable", colors: ["white", "black"], cost: 2.4, was: 4,
    d: "Certified fast-charge cable for iPhone 5-14 with reinforced stress points.", specs: [["Power", "27W PD"], ["Length", "1 m"], ["Certification", "MFi"]], tags: ["lightning", "iphone cable", "cable"] },
  { t: "3-in-1 Retractable Charging Cable", cat: "cables", art: "cable", colors: ["black", "blue", "pink"], cost: 3.1,
    d: "One retractable cable with USB-C, Lightning and Micro-USB tips. Perfect for travel bags.", specs: [["Tips", "USB-C / Lightning / Micro-USB"], ["Length", "1.2 m retractable"], ["Power", "60W"]], tags: ["cable", "retractable", "travel"] },
  { t: "Thunderbolt 4 Cable 40 Gbps (0.8 m)", cat: "cables", art: "cable", colors: ["black"], cost: 8.9, was: 13,
    d: "Full-featured Thunderbolt 4 / USB4 cable for docks, 8K displays and external SSDs.", specs: [["Speed", "40 Gbps"], ["Video", "8K@60Hz"], ["Power", "100W"]], tags: ["thunderbolt", "usb4", "cable", "monitor"] },

  // ── Power banks
  { t: "10,000 mAh Magnetic Power Bank", cat: "power-banks", art: "powerbank", colors: ["black", "white", "purple", "lime"], cost: 9.8, was: 14, featured: true,
    d: "Slim magnetic battery that snaps to the back of your phone. 20W wired, 15W wireless, with a fold-out kickstand.", specs: [["Capacity", "10,000 mAh"], ["Wireless", "15W magnetic"], ["Wired", "20W USB-C PD"], ["Weight", "198 g"]], tags: ["power bank", "magsafe", "battery", "portable charger"] },
  { t: "20,000 mAh 65W Laptop Power Bank", cat: "power-banks", art: "powerbank", colors: ["black", "gray"], cost: 17.2, was: 24,
    d: "Enough juice to recharge a MacBook Air once or a phone four times. Smart display shows remaining percentage.", specs: [["Capacity", "20,000 mAh"], ["Output", "65W"], ["Ports", "2× USB-C, 1× USB-A"], ["Display", "Digital %"]], tags: ["power bank", "laptop", "65w", "battery"] },
  { t: "5,000 mAh Mini Pocket Power Bank", cat: "power-banks", art: "powerbank", colors: ["pink", "blue", "white", "orange"], cost: 4.9,
    d: "Lipstick-size backup battery with built-in USB-C plug. No cable needed.", specs: [["Capacity", "5,000 mAh"], ["Output", "20W"], ["Weight", "105 g"]], tags: ["power bank", "mini", "pocket"] },

  // ── Cases
  { t: "Frosted Magnetic Case for iPhone 16 Pro", cat: "cases", art: "case", colors: ["blue", "black", "sand", "green"], cost: 2.9, was: 5, featured: true,
    d: "Matte translucent back that resists fingerprints, with built-in magnets for MagSafe accessories and raised camera lip.", specs: [["Compatible", "iPhone 16 Pro / Pro Max"], ["Drop test", "2 m"], ["Magnets", "N52 ring"]], tags: ["iphone case", "case", "magsafe", "iphone 16"] },
  { t: "Rugged Armor Case for Samsung Galaxy S25", cat: "cases", art: "case", colors: ["black", "gray", "orange"], cost: 3.4,
    d: "Dual-layer TPU + polycarbonate with air-cushion corners and a sliding camera cover.", specs: [["Compatible", "Galaxy S25 / S25+ / Ultra"], ["Drop test", "3 m"], ["Extra", "Camera slider"]], tags: ["samsung case", "galaxy", "rugged", "case"] },
  { t: "Vegan Leather Wallet Case", cat: "cases", art: "case", colors: ["sand", "black", "red"], cost: 4.2, was: 7,
    d: "Premium PU leather folio with three card slots and RFID blocking.", specs: [["Material", "Vegan leather"], ["Slots", "3 cards + cash"], ["RFID", "Blocking"]], tags: ["wallet case", "leather", "case"] },

  // ── Screen protectors
  { t: "9H Tempered Glass Screen Protector (2-Pack)", cat: "screen-protectors", art: "protector", colors: ["blue"], cost: 1.1, was: 2.5,
    d: "Bubble-free glass with oleophobic coating and an alignment frame for a perfect install every time.", specs: [["Hardness", "9H"], ["Thickness", "0.33 mm"], ["Pack", "2 pieces + frame"]], tags: ["screen protector", "tempered glass", "iphone", "samsung"] },
  { t: "Privacy Anti-Spy Glass Protector", cat: "screen-protectors", art: "protector", colors: ["black"], cost: 1.6,
    d: "Darkens the screen from side angles so only you can read it.", specs: [["Viewing angle", "±30°"], ["Hardness", "9H"]], tags: ["privacy", "screen protector", "anti spy"] },

  // ── Audio
  { t: "ANC Wireless Earbuds Pro", cat: "audio", art: "earbuds", colors: ["white", "black", "purple"], cost: 14.5, was: 22, featured: true,
    d: "Hybrid active noise cancelling up to 42 dB, transparency mode and 32 hours total playtime with the case.", specs: [["ANC", "Hybrid, -42 dB"], ["Battery", "8 h + 24 h case"], ["Bluetooth", "5.4"], ["Water", "IPX5"]], tags: ["earbuds", "anc", "wireless earphones", "bluetooth headphones"] },
  { t: "Over-Ear Bluetooth Headphones", cat: "audio", art: "headphones", colors: ["black", "white", "lime", "sand"], cost: 16.8, was: 25,
    d: "Plush memory-foam cushions, 40 mm drivers and 60-hour battery. Folds flat for travel.", specs: [["Driver", "40 mm"], ["Battery", "60 h"], ["Codec", "AAC / SBC"], ["Weight", "245 g"]], tags: ["headphones", "bluetooth", "over ear", "wireless"] },
  { t: "Open-Ear Sport Earbuds", cat: "audio", art: "earbuds", colors: ["lime", "orange", "black"], cost: 9.9,
    d: "Ear-hook design that stays put during runs while keeping you aware of traffic.", specs: [["Type", "Open-ear air conduction"], ["Battery", "10 h"], ["Water", "IPX6"]], tags: ["sport earbuds", "running", "earbuds"] },

  // ── Mounts
  { t: "Magnetic Car Phone Mount", cat: "mounts", art: "mount", colors: ["black", "gray"], cost: 3.8, was: 6,
    d: "Clips to any air vent, holds phones up to 300 g with N52 magnets, 360° rotation.", specs: [["Mount", "Air vent clip"], ["Magnet", "N52"], ["Rotation", "360°"]], tags: ["car mount", "phone holder", "magnetic"] },
  { t: "Adjustable Aluminium Phone & Tablet Stand", cat: "mounts", art: "mount", colors: ["gray", "black", "blue"], cost: 4.6,
    d: "Heavy aluminium stand with two hinges for video calls, recipes and streaming.", specs: [["Material", "Aluminium"], ["Fits", "4-13 inch"], ["Angles", "0-270°"]], tags: ["phone stand", "tablet stand", "desk"] },
  { t: "Selfie Stick Tripod with Remote", cat: "mounts", art: "mount", colors: ["black", "white"], cost: 5.3, was: 8,
    d: "Extends to 1.5 m, converts into a stable tripod, and includes a detachable Bluetooth shutter.", specs: [["Length", "1.5 m max"], ["Remote", "Bluetooth"], ["Weight", "220 g"]], tags: ["tripod", "selfie stick", "vlog"] },

  // ── Wearables
  { t: "Sport Silicone Band for Apple Watch", cat: "wearables", art: "watchband", colors: ["black", "orange", "lime", "blue", "pink"], cost: 1.2, was: 2.5,
    d: "Soft fluoroelastomer band with pin-and-tuck closure. Sweat-proof for workouts.", specs: [["Sizes", "41 / 45 / 49 mm"], ["Material", "Fluoroelastomer"]], tags: ["apple watch band", "strap", "watch"] },
  { t: "Smart Watch AMOLED Fitness Tracker", cat: "wearables", art: "watchband", colors: ["black", "gray", "pink"], cost: 18.5, was: 27, featured: true,
    d: "1.96\" AMOLED, heart-rate, SpO2, sleep tracking, Bluetooth calling and 100+ sport modes.", specs: [["Display", "1.96\" AMOLED"], ["Battery", "7 days"], ["Water", "IP68"], ["Calls", "Bluetooth"]], tags: ["smart watch", "fitness tracker", "watch"] },

  // ── Keyboards
  { t: "75% Hot-Swap Mechanical Keyboard", cat: "keyboards", art: "keyboard", colors: ["white", "blue", "black", "orange"], cost: 24.5, was: 36, featured: true,
    d: "Gasket-mounted 75% board with tri-mode connectivity (USB-C, 2.4G, Bluetooth), RGB and pre-lubed linear switches.", specs: [["Layout", "75% / 82 keys"], ["Switches", "Hot-swap, linear"], ["Connection", "USB-C / 2.4G / BT 5.1"], ["Battery", "4000 mAh"]], tags: ["mechanical keyboard", "keyboard", "wireless keyboard", "rgb", "gaming keyboard"] },
  { t: "Slim Wireless Keyboard & Mouse Combo", cat: "keyboards", art: "keyboard", colors: ["white", "black", "pink"], cost: 12.2,
    d: "Quiet scissor keys and a matching silent mouse, one USB receiver for both.", specs: [["Connection", "2.4G receiver"], ["Battery", "12 months"], ["Layout", "Full size"]], tags: ["keyboard", "mouse", "combo", "office"] },
  { t: "Foldable Bluetooth Travel Keyboard", cat: "keyboards", art: "keyboard", colors: ["black", "gray"], cost: 9.4, was: 14,
    d: "Folds to pocket size, pairs with three devices, works with iPad, phone and laptop.", specs: [["Devices", "3 pairs"], ["Battery", "Rechargeable"], ["Weight", "180 g"]], tags: ["bluetooth keyboard", "foldable", "ipad keyboard"] },

  // ── Mice
  { t: "Ultralight Wireless Gaming Mouse 58 g", cat: "mice", art: "mouse", colors: ["black", "white", "lime"], cost: 13.6, was: 20, featured: true,
    d: "PAW3395 sensor up to 26,000 DPI, 2.4G + Bluetooth + wired, only 58 grams.", specs: [["Sensor", "PAW3395"], ["DPI", "26,000"], ["Weight", "58 g"], ["Polling", "1000 Hz"]], tags: ["gaming mouse", "wireless mouse", "mouse", "lightweight"] },
  { t: "Ergonomic Vertical Mouse", cat: "mice", art: "mouse", colors: ["black", "gray"], cost: 7.5,
    d: "57° handshake grip reduces wrist strain during long workdays.", specs: [["Angle", "57°"], ["DPI", "800-2400"], ["Connection", "2.4G + BT"]], tags: ["vertical mouse", "ergonomic", "office mouse"] },
  { t: "Silent Bluetooth Mouse", cat: "mice", art: "mouse", colors: ["white", "pink", "blue", "purple"], cost: 4.2, was: 6,
    d: "90% quieter clicks, rechargeable battery, multi-device switching.", specs: [["Clicks", "Silent"], ["Battery", "Rechargeable 500 mAh"], ["Devices", "3"]], tags: ["mouse", "silent", "bluetooth mouse"] },

  // ── Mousepads
  { t: "XXL Desk Mat 90×40 cm", cat: "mousepads", art: "mousepad", colors: ["black", "orange", "blue", "green"], cost: 4.4, was: 7,
    d: "Stitched edges, water-resistant surface and non-slip rubber base covering your entire desk.", specs: [["Size", "900 × 400 × 4 mm"], ["Surface", "Micro-weave, water resistant"]], tags: ["mouse pad", "desk mat", "xxl", "gaming"] },
  { t: "RGB Gaming Mouse Pad", cat: "mousepads", art: "mousepad", colors: ["black", "purple"], cost: 6.9,
    d: "14 lighting modes around a speed-type surface, USB powered.", specs: [["Size", "800 × 300 mm"], ["Lighting", "RGB, 14 modes"]], tags: ["rgb mouse pad", "gaming", "mouse pad"] },

  // ── Webcams & mics
  { t: "2K Autofocus Webcam with Mic", cat: "webcams", art: "webcam", colors: ["black", "white"], cost: 12.9, was: 19, featured: true,
    d: "Sharp 2K video with autofocus, low-light correction, dual noise-cancelling microphones and a privacy cover.", specs: [["Resolution", "2560 × 1440 @30fps"], ["Focus", "Auto"], ["Mic", "Dual, noise reduction"], ["Mount", "Clip + tripod thread"]], tags: ["webcam", "camera", "streaming", "zoom"] },
  { t: "USB Condenser Microphone Kit", cat: "webcams", art: "mic", colors: ["black", "white", "pink"], cost: 15.7, was: 23,
    d: "Plug-and-play cardioid mic with boom arm, pop filter and shock mount for podcasting and streaming.", specs: [["Pattern", "Cardioid"], ["Sample rate", "192 kHz / 24-bit"], ["Kit", "Arm, pop filter, shock mount"]], tags: ["microphone", "mic", "podcast", "streaming"] },
  { t: "Wireless Lavalier Microphone (2-Pack)", cat: "webcams", art: "mic", colors: ["black"], cost: 9.8,
    d: "Clip-on mics for phones and cameras with noise reduction and 8-hour battery.", specs: [["Range", "20 m"], ["Battery", "8 h"], ["Output", "USB-C / Lightning"]], tags: ["lavalier", "wireless mic", "vlog"] },

  // ── Hubs
  { t: "8-in-1 USB-C Hub with 4K HDMI", cat: "hubs", art: "hub", colors: ["gray", "black"], cost: 10.6, was: 16, featured: true,
    d: "Turns one USB-C port into HDMI 4K, Ethernet, SD/microSD, 3× USB and 100W pass-through charging.", specs: [["HDMI", "4K@60Hz"], ["Ethernet", "Gigabit"], ["USB", "3× USB 3.0"], ["PD", "100W pass-through"]], tags: ["usb hub", "usb-c hub", "dock", "hdmi adapter", "macbook"] },
  { t: "USB-C to HDMI 2.1 Adapter 8K", cat: "hubs", art: "hub", colors: ["gray"], cost: 4.3,
    d: "Connect your laptop or phone to an 8K TV or 4K 144Hz monitor.", specs: [["Output", "8K@60 / 4K@144"], ["HDR", "Yes"]], tags: ["hdmi adapter", "adapter", "usb-c"] },
  { t: "4-Port USB 3.0 Slim Hub", cat: "hubs", art: "hub", colors: ["black", "white"], cost: 2.8, was: 4.5,
    d: "Ultra-slim aluminium hub with 5 Gbps on each port.", specs: [["Ports", "4× USB-A 3.0"], ["Speed", "5 Gbps"]], tags: ["usb hub", "usb 3.0"] },

  // ── Storage
  { t: "Portable NVMe SSD 1TB 1050 MB/s", cat: "storage", art: "ssd", colors: ["orange", "black", "blue"], cost: 42, was: 58, featured: true,
    d: "Credit-card-size SSD with 1050 MB/s reads, drop resistant up to 2 m. Works with iPhone 15/16 ProRes recording.", specs: [["Capacity", "1 TB"], ["Read", "1050 MB/s"], ["Interface", "USB 3.2 Gen 2"], ["Weight", "52 g"]], tags: ["ssd", "external ssd", "storage", "hard drive"] },
  { t: "128GB Dual USB-C Flash Drive", cat: "storage", art: "flashdrive", colors: ["blue", "black", "gray"], cost: 6.1,
    d: "USB-C and USB-A in one metal drive. Move photos from phone to laptop in seconds.", specs: [["Capacity", "128 GB"], ["Read", "150 MB/s"], ["Connectors", "USB-C + USB-A"]], tags: ["flash drive", "usb drive", "storage"] },
  { t: "M.2 NVMe SSD Enclosure", cat: "storage", art: "ssd", colors: ["gray", "black"], cost: 8.4, was: 12,
    d: "Tool-free aluminium enclosure that turns any M.2 NVMe drive into a 10 Gbps portable SSD.", specs: [["Support", "M.2 2230-2280"], ["Speed", "10 Gbps"]], tags: ["ssd enclosure", "nvme", "storage"] },

  // ── Stands
  { t: "Aluminium Laptop Stand — Adjustable", cat: "stands", art: "laptopstand", colors: ["gray", "black"], cost: 7.9, was: 12,
    d: "Raises your screen to eye level, folds flat, fits 10-17\" laptops.", specs: [["Material", "Aluminium alloy"], ["Fits", "10-17\""], ["Load", "10 kg"]], tags: ["laptop stand", "desk setup", "ergonomic"] },
  { t: "Laptop Cooling Pad with 6 Fans", cat: "stands", art: "laptopstand", colors: ["black"], cost: 11.3,
    d: "Six quiet fans, five height levels and blue LED, drops temps by up to 15 °C.", specs: [["Fans", "6"], ["Heights", "5"], ["Power", "USB"]], tags: ["cooling pad", "laptop cooler", "gaming laptop"] },
  { t: "Monitor Light Bar with Remote", cat: "lighting", art: "lightbar", colors: ["black", "gray"], cost: 13.2, was: 19,
    d: "Asymmetric optics light your desk without screen glare. Auto-dimming and wireless remote.", specs: [["Length", "50 cm"], ["CRI", "Ra 95"], ["Temp", "2700-6500K"]], tags: ["monitor light", "light bar", "desk lamp"] },
  { t: "10\" LED Ring Light with Tripod", cat: "lighting", art: "ringlight", colors: ["black", "white"], cost: 7.6,
    d: "Three colour modes, 10 brightness levels and a phone holder for streaming, makeup and video calls.", specs: [["Size", "10 inch"], ["Modes", "3 colour × 10 levels"], ["Tripod", "Up to 160 cm"]], tags: ["ring light", "lighting", "streaming", "tiktok"] },

  // ── Gaming
  { t: "Wireless Game Controller for PC & Phone", cat: "gaming", art: "controller", colors: ["black", "white", "orange", "blue"], cost: 12.4, was: 18, featured: true,
    d: "Hall-effect sticks (no drift), Bluetooth + 2.4G, works with PC, Android, iOS and Switch.", specs: [["Sticks", "Hall effect"], ["Connection", "BT / 2.4G / USB-C"], ["Battery", "20 h"]], tags: ["controller", "gamepad", "joystick", "gaming"] },
  { t: "7.1 Surround Gaming Headset", cat: "gaming", art: "headset", colors: ["black", "orange", "white"], cost: 11.9, was: 17,
    d: "Virtual 7.1 surround, 50 mm drivers, detachable noise-cancelling mic and RGB lighting.", specs: [["Driver", "50 mm"], ["Surround", "Virtual 7.1"], ["Mic", "Detachable, NC"], ["Connection", "USB + 3.5 mm"]], tags: ["gaming headset", "headset", "headphones with mic"] },
  { t: "Mobile Gaming Finger Sleeves & Triggers Kit", cat: "gaming", art: "controller", colors: ["red", "black"], cost: 2.2,
    d: "Clip-on L1/R1 triggers plus anti-sweat finger sleeves for PUBG, CoD Mobile and more.", specs: [["Includes", "2 triggers + 8 sleeves"], ["Fit", "Phones 4.5-7\""]], tags: ["mobile gaming", "triggers", "pubg"] },
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export async function ensureSeed() {
  const settings = (await Settings.findOne({ key: "global" })) ?? (await Settings.create({ key: "global", marginPct: Number(process.env.DEFAULT_MARGIN_PCT ?? 30) }));
  if ((await Product.estimatedDocumentCount()) > 0) return;
  const docs = S.map((s) => {
    const group = CATEGORIES.find((c) => c.slug === s.cat)!.group;
    const { price, compareAt } = priceProduct({ costPrice: s.cost, supplierCompareAt: s.was ?? 0 }, settings.marginPct);
    return {
      slug: slugify(s.t), title: s.t, description: s.d, category: s.cat, group,
      costPrice: s.cost, supplierCompareAt: s.was ?? 0, price, compareAt,
      images: s.colors.map((c) => `/products/${s.art}-${c}.svg`),
      colors: s.colors.map((c) => ({ name: c, hex: HEX[c] })),
      specs: s.specs.map(([k, v]) => ({ k, v })), tags: s.tags, stock: 200,
      source: "seed" as const, featured: !!s.featured,
    };
  });
  await Product.insertMany(docs);
  console.log(`[seed] inserted ${docs.length} products`);
}
