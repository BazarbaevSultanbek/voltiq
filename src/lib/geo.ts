"use client";
import type { Place } from "./store";

/** Browser geolocation + OpenStreetMap reverse geocoding (no API key needed). */
export function detectPlace(lang = "en"): Promise<Place> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("unsupported"));
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&accept-language=${lang}&zoom=18&addressdetails=1`);
          const d = await r.json();
          const a = d.address || {};
          resolve({
            country: String(a.country_code || "").toUpperCase(),
            city: a.city || a.town || a.village || a.county || a.state || "",
            region: a.state || a.region || "",
            postal: a.postcode || "",
            line1: [a.road, a.house_number].filter(Boolean).join(" "),
          });
        } catch (e) { reject(e); }
      },
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 },
    );
  });
}
