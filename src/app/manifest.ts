import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "VOLTIQ", short_name: "VOLTIQ", start_url: "/", display: "standalone", background_color: "#fbfaf7", theme_color: "#ff5b14", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] };
}
