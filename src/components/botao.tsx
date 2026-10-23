import type { ButtonHTMLAttributes } from "react";

export type VarianteDoBotao = "primario" | "destaque" | "secundario";

const VARIANTES: Record<VarianteDoBotao, string> = {
  primario: "bg-bordo text-superficie hover:bg-vinho",
  destaque: "bg-amarelo text-texto-sobre-amarelo hover:bg-amarelo-claro",
  secundario:
    "border border-linha bg-superficie text-texto hover:border-borda-campo",
};

// Classes do botão, para usar também em links com cara de botão.
export function classesDoBotao(
  variante: VarianteDoBotao = "primario",
  extra = "",
): string {
  return `inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl px-5 py-3 text-base font-bold transition-colors disabled:opacity-60 ${VARIANTES[variante]} ${extra}`;
}

export function Botao({
  variante = "primario",
  className,
  type = "button",
  ...resto
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: VarianteDoBotao }) {
  return (
    <button
      type={type}
      className={classesDoBotao(variante, className)}
      {...resto}
    />
  );
}
