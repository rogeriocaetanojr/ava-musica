import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import { Cabecalho, Rodape } from "@/components/moldura-do-site";
import { NOME_DO_AVA } from "@/lib/site";
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
  title: NOME_DO_AVA,
  description: "Ambiente virtual de aprendizagem para aulas de música.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${bricolage.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Cabecalho />
        {children}
        <Rodape />
      </body>
    </html>
  );
}
