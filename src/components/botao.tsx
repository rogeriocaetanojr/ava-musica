import type { ComponentProps } from "react";

export type VarianteDoBotao = "primario" | "destaque" | "secundario" | "link";
export type TamanhoDoBotao = "normal" | "pequeno";

const VARIANTES: Record<VarianteDoBotao, string> = {
  primario: "bg-bordo text-sobre-bordo hover:bg-vinho",
  destaque: "bg-amarelo text-texto-sobre-amarelo hover:bg-amarelo-claro",
  secundario:
    "border border-linha bg-superficie text-texto hover:border-borda-campo",
  link: "",
};

const TAMANHOS: Record<TamanhoDoBotao, string> = {
  normal:
    "min-h-13 w-full gap-3 rounded-xl px-5 py-3 text-base font-bold transition-colors",
  pequeno:
    "min-h-12 gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors",
};

// Botão de texto sublinhado: 48 px de alvo, sem fundo. A cor e o peso
// do texto vêm em "extra" (ex.: "font-bold text-destaque").
const LINK =
  "inline-flex min-h-12 min-w-12 items-center justify-center text-sm underline";

// Classes do botão, para usar também em links com cara de botão.
export function classesDoBotao(
  variante: VarianteDoBotao = "primario",
  extra = "",
  tamanho: TamanhoDoBotao = "normal",
): string {
  if (variante === "link") return `${LINK} disabled:opacity-60 ${extra}`;
  return `inline-flex items-center justify-center disabled:opacity-60 ${TAMANHOS[tamanho]} ${VARIANTES[variante]} ${extra}`;
}

export function Botao({
  variante = "primario",
  tamanho = "normal",
  className,
  type = "button",
  ...resto
}: ComponentProps<"button"> & {
  variante?: VarianteDoBotao;
  tamanho?: TamanhoDoBotao;
}) {
  return (
    <button
      type={type}
      className={classesDoBotao(variante, className, tamanho)}
      {...resto}
    />
  );
}
