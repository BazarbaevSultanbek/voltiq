import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "KAUP", short_name: "KAUP", start_url: "/", display: "standalone", background_color: "#fbfaf7", theme_color: "#ff5b14", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] };
}
