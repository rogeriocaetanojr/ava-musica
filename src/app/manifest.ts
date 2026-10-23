import type { MetadataRoute } from "next";
import { NOME_CURTO_DO_AVA, NOME_DO_AVA } from "@/lib/site";

// Ícone e cores do app quando o aluno adiciona o site à tela inicial.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: NOME_DO_AVA,
    short_name: NOME_CURTO_DO_AVA,
    start_url: "/",
    display: "standalone",
    background_color: "#fbf5ea",
    theme_color: "#6e1a2d",
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
