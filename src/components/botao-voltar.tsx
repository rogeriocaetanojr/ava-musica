import Link from "next/link";
import { Seta } from "@/components/seta";

// Botão quadrado de voltar, só com a seta; o destino vai no aria-label.
// A seta fina é a do convite de aluno, com traço e ponta um pouco diferentes.
export function BotaoVoltar({
  href,
  rotulo,
  fino = false,
}: {
  href: string;
  rotulo: string;
  fino?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={rotulo}
      className="grid size-12 shrink-0 place-items-center rounded-xl border border-linha bg-superficie text-texto hover:border-borda-campo"
    >
      <Seta fino={fino} />
    </Link>
  );
}
