import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import { connection } from "next/server";
import { Suspense } from "react";
import { Cabecalho, RodapeDoSite } from "@/components/moldura-do-site";
import { ReaplicarTema } from "@/components/seletor-de-tema";
import { NOME_CURTO_DO_AVA } from "@/lib/site";
import { COR_DA_BARRA, SCRIPT_DO_TEMA } from "@/lib/tema";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: "800",
  variable: "--fonte-bricolage",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--fonte-manrope",
});

export const metadata: Metadata = {
  title: NOME_CURTO_DO_AVA,
  description: "Ambiente virtual de aprendizagem para aulas de música.",
  icons: {
    icon: { url: "/icones/favicon-bordo.png", type: "image/png" },
    apple: "/icones/apple-icon.png",
  },
};

// Cor da barra do navegador e do sistema, uma para cada tema.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: COR_DA_BARRA.claro },
    { media: "(prefers-color-scheme: dark)", color: COR_DA_BARRA.escuro },
  ],
};

// Renderiza o conteúdo a cada requisição, e não no build. O esqueleto
// estático do PPR sai sem o nonce da CSP, e os scripts que o React escreve
// nele para encaixar as partes já prontas ($RC e afins) mudam de página para
// página, então não dá para liberá-los por hash. Com o conteúdo aqui dentro,
// o esqueleto fica só com o <head>, e todo script do corpo leva o nonce.
async function PorRequisicao({ children }: { children: React.ReactNode }) {
  await connection();
  return children;
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${bricolage.variable} ${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Aplica o tema do cookie antes da primeira pintura, sem piscar claro.
            A CSP libera este script pelo hash (ver src/proxy.ts). */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_DO_TEMA }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <Suspense>
          <PorRequisicao>
            <ReaplicarTema />
            <Cabecalho />
            <div className="flex flex-1 flex-col">{children}</div>
            <RodapeDoSite />
          </PorRequisicao>
        </Suspense>
      </body>
    </html>
  );
}
