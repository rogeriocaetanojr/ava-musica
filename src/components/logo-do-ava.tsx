import type { CSSProperties } from "react";
import {
  ALT_DO_LOGO,
  LOGO_DO_AVA,
  RECORTE_DO_LOGO,
  RECORTE_DO_SUBTITULO,
} from "@/lib/site";

const QUADRO = 1024;

// Medida no quadro do logo.svg convertida para a altura mostrada, que vem da
// variável --altura (definida pelas classes de quem usa, por tamanho de tela).
function px(medida: number): string {
  return `calc(var(--altura) * ${medida / RECORTE_DO_LOGO.altura})`;
}

// Logo do AVA na cor do texto (o arquivo é preto): o logo.svg vira máscara
// sobre a cor atual, cortado na margem em volta do desenho. Sem subtítulo,
// uma segunda camada apaga a linha "Escola de Música", ilegível em tamanho
// pequeno.
export function LogoDoAva({
  className,
  semSubtitulo = false,
}: {
  className: string;
  semSubtitulo?: boolean;
}) {
  const s = RECORTE_DO_SUBTITULO;
  const camadas = [
    {
      imagem: `url(${LOGO_DO_AVA})`,
      tamanho: `${px(QUADRO)} ${px(QUADRO)}`,
      posicao: `calc(-1 * ${px(RECORTE_DO_LOGO.x)}) calc(-1 * ${px(RECORTE_DO_LOGO.y)})`,
    },
    ...(semSubtitulo
      ? [
          {
            imagem: "linear-gradient(#000, #000)",
            tamanho: `${px(s.largura)} ${px(s.altura)}`,
            posicao: `${px(s.x - RECORTE_DO_LOGO.x)} ${px(s.y - RECORTE_DO_LOGO.y)}`,
          },
        ]
      : []),
  ];
  const junta = (campo: "imagem" | "tamanho" | "posicao") =>
    camadas.map((c) => c[campo]).join(", ");

  const estilo: CSSProperties = {
    width: px(RECORTE_DO_LOGO.largura),
    height: "var(--altura)",
    maskImage: junta("imagem"),
    WebkitMaskImage: junta("imagem"),
    maskSize: junta("tamanho"),
    WebkitMaskSize: junta("tamanho"),
    maskPosition: junta("posicao"),
    WebkitMaskPosition: junta("posicao"),
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    ...(semSubtitulo && {
      maskComposite: "subtract",
      WebkitMaskComposite: "source-out",
    }),
  };

  return (
    <span
      role="img"
      aria-label={ALT_DO_LOGO}
      className={`inline-block shrink-0 bg-current ${className}`}
      style={estilo}
    />
  );
}
