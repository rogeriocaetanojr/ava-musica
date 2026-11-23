import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { validarAmbiente } from "./src/env";
import { CABECALHOS_DE_SEGURANCA } from "./src/lib/seguranca";

const nextConfig: NextConfig = {
  // Os testes de ponta a ponta usam uma pasta própria, para o servidor deles
  // rodar ao lado do npm run dev (o Next trava a pasta do servidor aberto).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  // Cabeçalhos fixos em toda resposta, inclusive arquivos estáticos. A CSP
  // muda a cada requisição (nonce) e por isso sai do src/proxy.ts.
  async headers() {
    return [{ source: "/:caminho*", headers: CABECALHOS_DE_SEGURANCA }];
  },
  // O progresso do aluno agora fica na ficha dele.
  async redirects() {
    return [
      {
        source: "/professor/progresso/:id",
        destination: "/professor/alunos/:id",
        permanent: true,
      },
    ];
  },
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
  // No build de produção, todas as variáveis precisam existir (src/env.ts).
  // Sem o endereço do site, por exemplo, os convites e links de aceite
  // apontariam para localhost (ver urlDoSite em src/lib/site.ts).
  if (fase === PHASE_PRODUCTION_BUILD) validarAmbiente();
  return nextConfig;
}
