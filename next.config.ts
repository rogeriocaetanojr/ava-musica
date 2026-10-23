import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const nextConfig: NextConfig = {
  // Os testes de ponta a ponta usam uma pasta própria, para o servidor deles
  // rodar ao lado do npm run dev (o Next trava a pasta do servidor aberto).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default function config(fase: string): NextConfig {
  // Sem o endereço do site, os convites e links de aceite apontariam para
  // localhost (ver urlDoSite em src/lib/site.ts).
  if (fase === PHASE_PRODUCTION_BUILD && !process.env.NEXT_PUBLIC_SITE_URL) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL não está definida. Configure o endereço do site antes do build (ver guias/deploy.md).",
    );
  }
  return nextConfig;
}
