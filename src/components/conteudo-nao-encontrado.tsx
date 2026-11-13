import Link from "next/link";
import { classesDoBotao } from "@/components/botao";
import { CONTEINER } from "@/components/conteiner";

// Conteúdo da página não encontrada dentro das áreas com login, abaixo do
// cabeçalho do aluno ou do professor.
export function ConteudoNaoEncontrado({
  href,
  rotulo,
}: {
  href: string;
  rotulo: string;
}) {
  return (
    <main
      className={`${CONTEINER} flex max-w-6xl flex-1 flex-col py-10 md:py-16`}
    >
      <section className="max-w-2xl space-y-4 rounded-3xl border border-linha bg-superficie p-6 md:p-8">
        <p className="text-sm font-bold text-destaque">
          Esta página saiu do tom.
        </p>
        <h1 className="font-titulo text-3xl break-words text-texto md:text-5xl">
          Página não encontrada
        </h1>
        <p className="leading-normal text-texto-secundario">
          O endereço pode ter mudado ou a página foi removida.
        </p>
        <Link href={href} className={classesDoBotao("primario", "sm:w-auto")}>
          {rotulo}
        </Link>
      </section>
    </main>
  );
}
