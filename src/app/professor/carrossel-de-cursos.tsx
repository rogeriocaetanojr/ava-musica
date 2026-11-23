"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

const seta =
  "grid size-10 cursor-pointer place-items-center rounded-full border border-linha bg-superficie text-texto hover:border-borda-campo disabled:cursor-not-allowed disabled:opacity-40";

// Faixa de cursos com rolagem lateral e snap. Cada card tem uma fração fixa
// da largura (flex: 0 0 …), sem esticar e alinhado à esquerda: 1/3 a partir
// de 1024 px, 1/2 de 768 a 1023 px e a largura toda abaixo disso, já
// descontado o gap-4 entre os cards. A barra nativa fica escondida, mas a rolagem
// continua pelo touchpad, pelo arrasto e pelas setas do teclado (a faixa
// recebe foco). As setas ‹ › ao lado do título e os pontinhos embaixo mostram
// e mudam a página; cada seta se desativa no começo ou no fim.
export function CarrosselDeCursos({
  titulo,
  children,
}: {
  // Título da seção, que já vem com o id usado no aria-labelledby.
  titulo: ReactNode;
  children: ReactNode;
}) {
  const faixa = useRef<HTMLDivElement>(null);
  const [pagina, setPagina] = useState(0);
  const [paginas, setPaginas] = useState(1);
  const [noComeco, setNoComeco] = useState(true);
  const [noFim, setNoFim] = useState(true);

  useEffect(() => {
    const el = faixa.current;
    if (!el) return;
    // Folga de 2 px para arredondamentos do navegador.
    const medir = () => {
      const largura = el.clientWidth || 1;
      const sobra = el.scrollWidth - largura;
      const inicio = el.scrollLeft <= 2;
      const fim = el.scrollLeft >= sobra - 2;
      // Páginas pela parte que passa da tela: 4 cursos de 1/3 dão 2 páginas.
      const total = sobra <= 2 ? 1 : 1 + Math.ceil((sobra - 2) / largura);
      setPaginas(total);
      setPagina(fim ? total - 1 : Math.round(el.scrollLeft / largura));
      setNoComeco(inicio);
      setNoFim(fim);
    };
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => {
      el.removeEventListener("scroll", medir);
      observador.disconnect();
    };
  }, []);

  function irPara(destino: number) {
    const el = faixa.current;
    if (!el) return;
    el.scrollTo({
      left: Math.max(0, destino) * el.clientWidth,
      behavior: "smooth",
    });
  }

  // Com todos os cursos na tela, setas e pontinhos somem.
  const cabeTudo = noComeco && noFim;

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        {titulo}
        {!cabeTudo && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              aria-label="Cursos anteriores"
              disabled={noComeco}
              onClick={() => irPara(pagina - 1)}
              className={seta}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              aria-label="Próximos cursos"
              disabled={noFim}
              onClick={() => irPara(pagina + 1)}
              className={seta}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        )}
      </div>

      <div
        ref={faixa}
        tabIndex={0}
        role="region"
        aria-label="Cursos (role para o lado ou use as setas)"
        className="flex snap-x snap-mandatory items-start gap-4 sem-barra-de-rolagem overflow-x-auto justify-start [&>*]:shrink-0 [&>*]:grow-0 [&>*]:basis-full [&>*]:snap-start md:[&>*]:basis-[calc((100%-1rem)/2)] lg:[&>*]:basis-[calc((100%-2rem)/3)]"
      >
        {children}
      </div>

      {!cabeTudo && (
        <div className="flex justify-center gap-1" aria-hidden="true">
          {Array.from({ length: paginas }, (_, i) => (
            <span
              key={i}
              className={`size-2 rounded-full ${i === pagina ? "bg-destaque" : "bg-linha"}`}
            />
          ))}
        </div>
      )}
    </>
  );
}
