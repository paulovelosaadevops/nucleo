import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Núcleo | Central Familiar",
    short_name: "Núcleo",
    description:
      "Central familiar privada para agenda, compras, finanças e rotina.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#050505",
    theme_color: "#050505",
    lang: "pt-BR",
    categories: [
      "productivity",
      "finance",
      "lifestyle",
    ],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Agenda",
        short_name: "Agenda",
        description: "Abrir a agenda familiar.",
        url: "/agenda",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
          },
        ],
      },
      {
        name: "Compras",
        short_name: "Compras",
        description: "Abrir listas de compras.",
        url: "/compras",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
          },
        ],
      },
      {
        name: "Finanças",
        short_name: "Finanças",
        description: "Abrir o módulo financeiro.",
        url: "/financas",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
          },
        ],
      },
    ],
  };
}
