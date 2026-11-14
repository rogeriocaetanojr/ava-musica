import Link from "next/link";
import { MenuDaConta, PILULA } from "@/components/menu-da-conta";
import { CONTEINER } from "@/components/conteiner";
import { LogoDoAva } from "@/components/logo-do-ava";
import { type Recado, SinoDeRecados } from "@/components/sino-de-recados";

export type SecaoDoAluno = "cursos" | "perfil";

function textoDoSino(naoLidos: number): string {
  if (naoLidos === 0) return "Avisos";
  return naoLidos === 1
    ? "Avisos: 1 aviso não lido"
    : `Avisos: ${naoLidos} avisos não lidos`;
}

// Cabeçalho da área do aluno: o logo solto à esquerda e, à direita, a pílula
// com o sino de recados e o avatar, que abre o menu da conta. A navegação
// fica nas AbasDoAluno, no celular.
export function CabecalhoDoAluno({
  nome,
  atual,
  naoLidos = 0,
  recados,
  professor = false,
}: {
  nome?: string;
  atual?: SecaoDoAluno;
  naoLidos?: number;
  // Sem os recados (enquanto a sessão carrega), o sino leva a Meus cursos.
  recados?: Recado[];
  // Professor na pré-visualização: o menu ganha "Voltar ao painel".
  professor?: boolean;
}) {
  return (
    <header>
      <div
        className={`${CONTEINER} flex max-w-6xl items-center justify-between gap-x-6 py-3`}
      >
        <Link
          href="/cursos"
          className="flex min-h-12 items-center gap-3 font-titulo text-2xl text-texto"
        >
          <LogoDoAva
            semSubtitulo
            className="[--altura:46px] lg:[--altura:60px]"
          />
        </Link>

        <div className={PILULA}>
          {recados ? (
            <SinoDeRecados recados={recados} rotulo={textoDoSino(naoLidos)} />
          ) : (
            <Link
              href="/cursos"
              aria-label={textoDoSino(naoLidos)}
              className="relative inline-flex size-12 items-center justify-center rounded-full text-texto"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
                <path d="M10 20a2 2 0 0 0 4 0" />
              </svg>
              {naoLidos > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute top-2 right-2 size-2.5 rounded-full bg-amarelo"
                />
              )}
            </Link>
          )}

          {nome && (
            <MenuDaConta
              nome={nome}
              perfil="/perfil"
              atual={atual === "perfil"}
              atalho={
                professor
                  ? { href: "/professor", rotulo: "Voltar ao painel" }
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </header>
  );
}
