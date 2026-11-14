import { formatarDataHora } from "@/lib/datas";

export type Recado = {
  id: string;
  titulo: string;
  texto: string;
  publicado_em: string;
  cursos: { titulo: string } | null;
};

// Id do painel: outros botões da página (ex.: "Ver todos os recados") abrem o
// mesmo painel com popoverTarget.
export const ID_DOS_RECADOS = "painel-de-recados";

// Sino do cabeçalho do aluno com o painel de recados. Usa o popover nativo do
// navegador: abre no clique, fecha com Esc ou com clique fora. No celular o
// painel ocupa a largura da tela; no computador fica sob o sino, à direita.
export function SinoDeRecados({
  recados,
  rotulo,
}: {
  recados: Recado[];
  rotulo: string;
}) {
  return (
    <>
      <button
        type="button"
        popoverTarget={ID_DOS_RECADOS}
        aria-label={rotulo}
        className="relative inline-flex size-12 cursor-pointer items-center justify-center rounded-full text-texto hover:bg-bloco hover:text-texto-sobre-bloco"
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
      </button>

      <div
        id={ID_DOS_RECADOS}
        popover="auto"
        aria-labelledby="titulo-dos-recados"
        className="fixed inset-x-4 top-20 bottom-auto m-0 max-h-[70dvh] w-auto overflow-y-auto overscroll-contain rounded-3xl border border-linha bg-superficie p-5 text-texto shadow-xl md:left-auto md:right-10 md:top-22 md:w-96"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="titulo-dos-recados" className="text-base font-bold">
            Recados do professor
          </h2>
          <button
            type="button"
            popoverTarget={ID_DOS_RECADOS}
            popoverTargetAction="hide"
            aria-label="Fechar recados"
            className="inline-flex size-12 items-center justify-center rounded-xl text-texto-secundario hover:text-texto"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {recados.length === 0 ? (
          <p className="pt-2 text-base text-texto-secundario">
            Nenhum recado novo por enquanto.
          </p>
        ) : (
          <ul className="space-y-3 pt-2">
            {recados.map((recado) => (
              <li
                key={recado.id}
                className="space-y-1 rounded-2xl bg-bloco p-4 text-texto-sobre-bloco"
              >
                <h3 className="text-base font-bold break-words">
                  {recado.titulo}
                </h3>
                <p className="text-sm">
                  {recado.cursos ? `${recado.cursos.titulo} · ` : ""}
                  {formatarDataHora(recado.publicado_em)}
                </p>
                <p className="text-base break-words whitespace-pre-line">
                  {recado.texto}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
