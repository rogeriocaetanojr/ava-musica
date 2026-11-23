import Link from "next/link";
import { classesDoBotao } from "@/components/botao";
import { CONTEINER } from "@/components/conteiner";
import { NOME_DO_AVA } from "@/lib/site";

// Rodapé único do site: só nas páginas públicas. Dentro do sistema, a
// política e os termos ficam no menu da conta (avatar). No computador,
// o crédito no centro e os links à direita; no celular, tudo centralizado e
// empilhado. Na tela dividida (compacto) fica empilhado na coluna do
// formulário, sem o contêiner, para a tela continuar cabendo sem rolagem.

// Folga no celular para telas com barra de ações fixa embaixo (sem abas),
// para a barra não cobrir o rodapé.
const FOLGAS = {
  barra: "max-md:mb-[calc(5rem+env(safe-area-inset-bottom))]",
  "barra-dupla": "max-md:mb-[calc(9rem+env(safe-area-inset-bottom))]",
} as const;

export type FolgaDoRodape = keyof typeof FOLGAS;

// Alturas da mesma folga, para as telas internas sem rodapé: um espaço vazio
// no fim, para a barra fixa do celular não cobrir o conteúdo.
const ALTURAS_DA_FOLGA = {
  barra: "h-[calc(5rem+env(safe-area-inset-bottom))]",
  "barra-dupla": "h-[calc(9rem+env(safe-area-inset-bottom))]",
} as const;

export function FolgaDaBarra({ folga }: { folga: FolgaDoRodape }) {
  return (
    <div
      aria-hidden="true"
      className={`shrink-0 md:hidden ${ALTURAS_DA_FOLGA[folga]}`}
    />
  );
}

// Mesma cor de destaque dos outros links do site (amarelo no tema escuro).
const LINK = classesDoBotao("link", "font-bold text-destaque no-underline!");

export function Rodape({
  largura = "",
  compacto = false,
  folga,
}: {
  // Largura máxima da área, no celular (ex.: "max-w-6xl").
  largura?: string;
  compacto?: boolean;
  folga?: FolgaDoRodape;
}) {
  const disposicao = compacto
    ? "flex flex-col items-center text-center"
    : `${CONTEINER} ${largura} flex flex-col items-center text-center md:grid md:grid-cols-[1fr_auto_1fr] md:gap-6`;

  return (
    <footer
      className={`border-t border-linha py-2 ${folga ? FOLGAS[folga] : ""}`}
    >
      <nav aria-label="Rodapé" className={disposicao}>
        {/* Coluna vazia que, no computador, deixa o crédito no centro. */}
        {!compacto && <span aria-hidden="true" className="hidden md:block" />}
        <p className="pt-2 text-sm text-texto-secundario md:pt-0">
          © 2026 {NOME_DO_AVA}
        </p>
        <div
          className={`flex flex-wrap items-center justify-center gap-x-6 ${compacto ? "" : "md:justify-end"}`}
        >
          <Link href="/privacidade" className={LINK}>
            Política de privacidade
          </Link>
          <Link href="/termos" className={LINK}>
            Termos de uso
          </Link>
        </div>
      </nav>
    </footer>
  );
}

// Rodapé das telas internas: só o crédito, pequeno, cinza e centralizado, sem
// linha nem fundo. Fica no fim da página: a tela tem min-h-dvh e o conteúdo
// acima cresce (flex-1), então com pouco conteúdo ele encosta no fim da
// janela e, com muito, aparece depois do conteúdo. Nunca flutua por cima.
export function RodapeInterno() {
  return (
    <footer className="py-3 text-center text-xs text-texto-secundario">
      © 2026 {NOME_DO_AVA}
    </footer>
  );
}
