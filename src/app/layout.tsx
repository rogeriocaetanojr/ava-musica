import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import { Cabecalho, Rodape } from "@/components/moldura-do-site";
import { ReaplicarTema, SCRIPT_DO_TEMA } from "@/components/seletor-de-tema";
import { NOME_CURTO_DO_AVA } from "@/lib/site";
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
        {/* Aplica o tema do cookie antes da primeira pintura, sem piscar claro. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_DO_TEMA }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ReaplicarTema />
        <Cabecalho />
        {children}
        <Rodape />
      </body>
    </html>
  );
}
