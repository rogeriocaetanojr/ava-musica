import Link from "next/link";

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
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={fino ? "1.8" : "2"}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <path
          d={fino ? "M19 12H5 M12 19l-7-7 7-7" : "M19 12H5M11 6l-6 6 6 6"}
        />
      </svg>
    </Link>
  );
}
