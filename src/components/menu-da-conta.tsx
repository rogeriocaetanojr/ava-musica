import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { BotaoDoTema } from "@/components/seletor-de-tema";
import { obterSessao } from "@/lib/auth";
import { fotoDe } from "@/lib/fotos";

// Pílula arredondada que agrupa os ícones do cabeçalho (sino e avatar) e a
// navegação do professor.
export const PILULA =
  "flex items-center gap-1 rounded-full border border-linha bg-superficie p-1 shadow-sm";

const opcao =
  "flex min-h-12 w-full items-center rounded-xl px-4 text-left text-base font-bold text-texto hover:bg-bloco hover:text-texto-sobre-bloco";

// Avatar (foto de perfil ou silhueta) que abre um menu pequeno da conta (botão de tema,
// perfil e sair; e o atalho de troca de área do professor), no mesmo estilo do painel de recados: popover nativo, que fecha com
// Esc ou com clique fora. Igual nas áreas do aluno e do professor.
// Foto de quem está logado; a sessão e a foto são memoizadas por requisição.
async function FotoDaSessao({ classes }: { classes: string }) {
  const sessao = await obterSessao();
  const foto = sessao ? await fotoDe(sessao.id) : null;
  return <Avatar foto={foto} className={classes} />;
}

export function MenuDaConta({
  nome,
  perfil,
  atual = false,
  cores = "bg-bordo text-sobre-bordo",
  id = "menu-da-conta",
  atalho,
}: {
  nome: string;
  // Endereço do perfil da área.
  perfil: string;
  atual?: boolean;
  // Cores do avatar de cada área.
  cores?: string;
  // Id do menu, único na página (o professor tem um avatar por tamanho de tela).
  id?: string;
  // Só para a conta do professor: "Ver como aluno" ou "Voltar ao painel".
  atalho?: { href: string; rotulo: string };
}) {
  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        title={nome}
        className="inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full"
      >
        <Suspense fallback={<Avatar className={`size-12 ${cores}`} />}>
          <FotoDaSessao classes={`size-12 ${cores}`} />
        </Suspense>
        <span className="sr-only">Menu da conta: conectado como {nome}</span>
      </button>

      <div
        id={id}
        popover="auto"
        aria-label="Menu da conta"
        className="fixed top-20 right-4 bottom-auto left-auto m-0 w-64 rounded-2xl border border-linha bg-superficie p-2 text-texto shadow-xl md:top-22 md:right-10"
      >
        <ul>
          {/* O botão de tema fica na linha do perfil, à direita. */}
          <li className="flex items-center gap-1">
            <Link
              href={perfil}
              aria-current={atual ? "page" : undefined}
              className={`${opcao} flex-1`}
            >
              Meu perfil
            </Link>
            <BotaoDoTema />
          </li>
          {atalho && (
            <li>
              <Link href={atalho.href} className={opcao}>
                {atalho.rotulo}
              </Link>
            </li>
          )}
          <li>
            <form action="/auth/sair" method="post">
              <button type="submit" className={`${opcao} cursor-pointer`}>
                Sair
              </button>
            </form>
          </li>
          {/* Política e termos acessíveis de qualquer tela (LGPD), já que o
              rodapé fica só nas telas públicas. */}
          <li className="mt-1 flex flex-wrap gap-x-3 border-t border-linha px-4 pt-1">
            <Link
              href="/privacidade"
              className="inline-flex min-h-10 items-center text-xs text-texto-secundario hover:text-texto"
            >
              Privacidade
            </Link>
            <Link
              href="/termos"
              className="inline-flex min-h-10 items-center text-xs text-texto-secundario hover:text-texto"
            >
              Termos de uso
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}
