import { CONTEINER } from "@/components/conteiner";

// Esqueleto das telas logadas enquanto a página carrega: um bloco de título e
// uma grade de cartões na cor da linha. O pulso só aparece para quem não pediu
// menos movimento no sistema.
export function Esqueleto() {
  const bloco = "rounded-lg bg-linha motion-safe:animate-pulse";
  return (
    <main
      role="status"
      className={`${CONTEINER} flex-1 max-w-6xl space-y-6 py-6 md:py-10`}
    >
      <span className="sr-only">Carregando…</span>
      <div aria-hidden="true" className="space-y-3">
        <div className={`${bloco} h-10 w-56 max-w-full`} />
        <div className={`${bloco} h-5 w-80 max-w-full`} />
      </div>
      <ul
        aria-hidden="true"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <li
            key={n}
            className="space-y-4 rounded-2xl border border-linha bg-superficie p-5"
          >
            <div className={`${bloco} h-6 w-3/4`} />
            <div className={`${bloco} h-4 w-full`} />
            <div className={`${bloco} h-4 w-2/3`} />
            <div className={`${bloco} h-12 w-full rounded-xl`} />
          </li>
        ))}
      </ul>
    </main>
  );
}
