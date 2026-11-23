"use client";

import { useCallback, useId, useState } from "react";
import { classesDoBotao } from "@/components/botao";
import { FormularioDeAcao } from "@/components/formulario-de-acao";
import { Painel, PainelLateral } from "@/components/painel-lateral";
import { matricular } from "../acoes";
import { ConfirmacaoBloqueio } from "../botao-bloqueio";
import { FormularioExclusao } from "../formulario-exclusao";
import { FormularioNome } from "../formulario-nome";

type Opcao = "nome" | "bloqueio" | "exclusao";

const opcaoDoMenu =
  "flex min-h-12 w-full cursor-pointer items-center rounded-xl px-4 text-left text-base font-bold hover:bg-bloco hover:text-texto-sobre-bloco";

// Menu "⋯" da ficha: Editar nome, Bloquear (ou Desbloquear) acesso e Excluir
// todos os dados. Cada opção abre o painel lateral com o formulário ou a
// confirmação; a exclusão continua pedindo o nome digitado.
export function MenuDaFicha({
  alunoId,
  nome,
  nomeCadastrado,
  bloqueado,
}: {
  alunoId: string;
  // Nome para exibir (ou "Sem nome").
  nome: string;
  // Nome gravado, para o campo de edição.
  nomeCadastrado: string;
  bloqueado: boolean;
}) {
  const idDoMenu = useId();
  const idDoBotao = useId();
  const [aberta, setAberta] = useState<Opcao | null>(null);
  const fechar = useCallback(() => setAberta(null), []);

  function escolher(opcao: Opcao) {
    document.getElementById(idDoMenu)?.hidePopover();
    setAberta(opcao);
  }

  const titulos: Record<Opcao, string> = {
    nome: "Editar nome",
    bloqueio: bloqueado ? "Desbloquear acesso" : "Bloquear acesso",
    exclusao: "Excluir todos os dados",
  };

  return (
    <>
      <button
        id={idDoBotao}
        type="button"
        popoverTarget={idDoMenu}
        aria-label="Mais ações"
        className={classesDoBotao("secundario", "w-12 px-0", "pequeno")}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5"
          fill="currentColor"
        >
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      <div
        id={idDoMenu}
        popover="auto"
        aria-label="Mais ações"
        className="fixed top-36 right-4 bottom-auto left-auto m-0 w-64 rounded-2xl border border-linha bg-superficie p-2 text-texto shadow-xl md:right-10"
      >
        <ul>
          <li>
            <button
              type="button"
              onClick={() => escolher("nome")}
              className={`${opcaoDoMenu} text-texto`}
            >
              Editar nome
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => escolher("bloqueio")}
              className={`${opcaoDoMenu} text-texto`}
            >
              {titulos.bloqueio}
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => escolher("exclusao")}
              className={`${opcaoDoMenu} text-texto-sobre-bloco-perigo`}
            >
              Excluir todos os dados
            </button>
          </li>
        </ul>
      </div>

      <Painel
        aberto={aberta !== null}
        aoFechar={fechar}
        titulo={aberta ? titulos[aberta] : ""}
        idDaOrigem={idDoBotao}
      >
        {aberta === "nome" && (
          <FormularioNome alunoId={alunoId} nome={nomeCadastrado} />
        )}
        {aberta === "bloqueio" && (
          <ConfirmacaoBloqueio
            alunoId={alunoId}
            nome={nome}
            bloqueado={bloqueado}
            aoCancelar={fechar}
          />
        )}
        {aberta === "exclusao" && (
          <FormularioExclusao alunoId={alunoId} nome={nome} />
        )}
      </Painel>
    </>
  );
}

// "Matricular em curso": o painel lista só os cursos em que o aluno ainda
// não está, cada um com o seu botão.
export function MatricularEmCurso({
  alunoId,
  cursos,
}: {
  alunoId: string;
  cursos: { id: string; titulo: string; publicado: boolean }[];
}) {
  return (
    <PainelLateral
      rotulo="Matricular em curso"
      tamanho="pequeno"
      classeDoBotao=""
    >
      {() =>
        cursos.length === 0 ? (
          <p className="text-sm text-texto-secundario">
            O aluno já está em todos os cursos.
          </p>
        ) : (
          <ul className="divide-y divide-linha rounded-2xl border border-linha">
            {cursos.map((curso) => (
              <li
                key={curso.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <span className="min-w-0 break-words text-texto">
                  {curso.titulo}
                  {!curso.publicado && (
                    <span className="text-sm text-texto-secundario">
                      {" "}
                      (rascunho)
                    </span>
                  )}
                </span>
                <FormularioDeAcao
                  acao={matricular.bind(null, alunoId, curso.id)}
                >
                  <button
                    type="submit"
                    className={classesDoBotao("secundario", "", "pequeno")}
                  >
                    Matricular
                  </button>
                </FormularioDeAcao>
              </li>
            ))}
          </ul>
        )
      }
    </PainelLateral>
  );
}
