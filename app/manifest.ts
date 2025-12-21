import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Stylizer",
    short_name: "AI Stylizer",
    description: "Personalize suas imagens com IA",
    start_url: "/app",
    display: "standalone",
    background_color: "#fdfdfd",
    theme_color: "#7033ff",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  }
}
