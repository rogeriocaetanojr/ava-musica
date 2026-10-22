import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LOGO_DO_AVA, NOME_DO_AVA } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: NOME_DO_AVA,
  description: "Ambiente virtual de aprendizagem para aulas de música.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="border-b-4 border-secundaria bg-primaria text-white">
          <div className="mx-auto flex w-full max-w-4xl items-center px-4 py-3">
            <Link href="/" className="flex items-center gap-3 font-bold">
              <Image src={LOGO_DO_AVA} alt="" width={36} height={36} priority />
              <span className="text-lg">{NOME_DO_AVA}</span>
            </Link>
          </div>
        </header>
        {children}
        <footer className="border-t-4 border-secundaria bg-primaria text-sm text-white">
          <nav
            aria-label="Rodapé"
            className="mx-auto flex w-full max-w-4xl flex-wrap gap-x-6 gap-y-2 px-4 py-4"
          >
            <Link href="/privacidade" className="underline">
              Política de privacidade
            </Link>
            <Link href="/termos" className="underline">
              Termos de uso
            </Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
