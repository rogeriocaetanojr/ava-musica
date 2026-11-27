"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ReactNode, useState } from "react";
import { Avatar } from "@/components/avatar";
import { BarraProgresso } from "@/components/barra-progresso";
import { classesDoBotao } from "@/components/botao";
import { classesDoCampo } from "@/components/campo";
import { PainelLateral } from "@/components/painel-lateral";
import type { StatusDoAluno } from "./validacao";

export type LinhaDaTurma = {
  id: string;
  nome: string;
  email: string;
  // Link assinado da foto de perfil; sem foto, a silhueta.
  foto: string | null;
  status: StatusDoAluno;
  // Vai para "Precisam de atenção" (convidado, aguardando aceite, sem curso
  // ou parado).
  atencao: boolean;
  // Posição do motivo principal na ordem de prioridade (0 sem motivo).
  prioridade: number;
  // Ícone (caminho SVG) só nos selos de motivo de "Precisam de atenção".
  etiquetas: { texto: string; classe: string; icone?: string }[];
  cursos: { id: string; titulo: string; percentual: number | null }[];
};

type Filtro = "todos" | "ativo" | "convidado" | "bloqueado";

const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "ativo", rotulo: "Ativos" },
  { valor: "convidado", rotulo: "Convidados" },
  { valor: "bloqueado", rotulo: "Bloqueados" },
];

// Tira acentos e caixa para a busca achar "joao" em "João".
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

// Um curso: o título; vários: "3 cursos". O progresso é a média dos cursos
// com progresso; o detalhe por curso fica na ficha.
function resumoDosCursos(cursos: LinhaDaTurma["cursos"]): {
  texto: string | null;
  percentual: number | null;
} {
  if (cursos.length === 0) return { texto: null, percentual: null };
  const texto =
    cursos.length === 1 ? cursos[0].titulo : `${cursos.length} cursos`;
  const comProgresso = cursos.flatMap((c) =>
    c.percentual === null ? [] : [c.percentual],
  );
  const percentual =
    comProgresso.length === 0
      ? null
      : Math.round(
          comProgresso.reduce((soma, p) => soma + p, 0) / comProgresso.length,
        );
  return { texto, percentual };
}

// Cinza secundário (sem opacidade, pelo contraste) para "Sem matrículas".
const apagado = "text-texto-secundario";
// Avatar sem foto: todos na mesma cor neutra.
const AVATAR_NEUTRO = "bg-linha text-texto-secundario";

function Selo({ etiqueta }: { etiqueta: LinhaDaTurma["etiquetas"][number] }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${etiqueta.classe}`}
    >
      {etiqueta.icone && (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-3.5 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={etiqueta.icone} />
        </svg>
      )}
      {etiqueta.texto}
    </span>
  );
}

// Cursos e progresso numa coluna só: o curso (ou "3 cursos") em cima e a
// barra fina com a % embaixo. Sem matrícula, só "Sem matrículas".
function CursosEProgresso({ linha }: { linha: LinhaDaTurma }) {
  const resumo = resumoDosCursos(linha.cursos);
  if (!resumo.texto)
    return <span className={`text-sm ${apagado}`}>Sem matrículas</span>;
  return (
    <span className="block min-w-0 space-y-1">
      <span
        className="block truncate text-sm text-texto"
        title={
          linha.cursos.length > 1
            ? linha.cursos.map((c) => c.titulo).join(", ")
            : undefined
        }
      >
        {resumo.texto}
      </span>
      {resumo.percentual !== null && (
        <span className="flex items-center gap-2">
          <span className="flex-1">
            <BarraProgresso
              percentual={resumo.percentual}
              rotulo={
                linha.cursos.length > 1
                  ? `Progresso médio de ${linha.nome}`
                  : `Progresso de ${linha.nome}`
              }
              cor="bordo"
              comTexto={false}
              fina
            />
          </span>
          <span className="w-9 text-right text-xs text-texto-secundario">
            {resumo.percentual}%
          </span>
        </span>
      )}
    </span>
  );
}

function NomeEEmail({ linha }: { linha: LinhaDaTurma }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar foto={linha.foto} className={`size-9 ${AVATAR_NEUTRO}`} />
      <span className="min-w-0">
        <span
          className="block truncate font-medium text-texto"
          title={linha.nome}
        >
          {linha.nome}
        </span>
        <span
          className="block truncate text-xs text-texto-secundario"
          title={linha.email}
        >
          {linha.email}
        </span>
      </span>
    </span>
  );
}

// Seções da turma, nesta ordem; a de quem precisa de atenção vem primeiro,
// e quem está nela não se repete em Ativos.
const GRUPOS: {
  id: string;
  titulo: string;
  pertence: (linha: LinhaDaTurma) => boolean;
}[] = [
  { id: "atencao", titulo: "Precisam de atenção", pertence: (l) => l.atencao },
  {
    id: "ativos",
    titulo: "Ativos",
    pertence: (l) => !l.atencao && l.status === "ativo",
  },
  {
    id: "bloqueados",
    titulo: "Bloqueados",
    pertence: (l) => l.status === "bloqueado",
  },
];

// Card compacto do aluno, todo clicável: avatar e nome, com o e-mail
// cortado embaixo; o curso e o progresso no meio; o selo no fim.
function CartaoDoAluno({ linha }: { linha: LinhaDaTurma }) {
  return (
    <Link
      href={`/professor/alunos/${linha.id}`}
      className="flex h-full flex-col gap-3 rounded-2xl border border-linha bg-superficie p-3 transition-colors hover:border-borda-campo hover:bg-fundo"
    >
      <NomeEEmail linha={linha} />
      <span className="block flex-1">
        <CursosEProgresso linha={linha} />
      </span>
      <span className="flex flex-wrap gap-1.5">
        {linha.etiquetas.map((etiqueta) => (
          <Selo key={etiqueta.texto} etiqueta={etiqueta} />
        ))}
      </span>
    </Link>
  );
}

// Tela de Alunos: no cabeçalho, o título, a busca, o filtro por situação e
// os botões dos painéis laterais (Pedidos de acesso, com a contagem, e
// Recusados) e o Convidar aluno; embaixo, a turma na largura toda, filtrada
// no navegador sobre a lista já carregada.
export function TabelaDeAlunos({
  linhas,
  quantidadeDePedidos,
  pedidos,
  recusados,
}: {
  linhas: LinhaDaTurma[];
  // Nula quando os pedidos não carregaram.
  quantidadeDePedidos: number | null;
  pedidos: ReactNode;
  recusados: ReactNode;
}) {
  // A ficha de um pedido pendente manda para cá com ?pedidos=abrir.
  const parametros = useSearchParams();
  const abrirPedidos = parametros.get("pedidos") === "abrir";
  // O "Ver todos" de uma coluna do painel chega com ?curso=<id>.
  const cursoId = parametros.get("curso");
  const cursoFiltrado = cursoId
    ? (linhas.flatMap((l) => l.cursos).find((c) => c.id === cursoId)?.titulo ??
      null)
    : null;
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const termo = normalizar(busca.trim());
  const visiveis = linhas.filter(
    (l) =>
      (filtro === "todos" || l.status === filtro) &&
      (!termo || normalizar(l.nome).includes(termo)) &&
      (!cursoId || l.cursos.some((c) => c.id === cursoId)),
  );
  const comPedidos = (quantidadeDePedidos ?? 0) > 0;

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="font-titulo text-4xl text-texto">Alunos</h1>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <PainelLateral
            rotulo="Pedidos de acesso"
            abertoNoInicio={abrirPedidos}
            botaoProprio={{
              className: classesDoBotao(
                comPedidos ? "destaque" : "secundario",
                "w-auto",
                "pequeno",
              ),
              conteudo: (
                <>
                  Pedidos de acesso
                  {comPedidos && (
                    <span className="ml-1 inline-grid min-w-6 place-items-center rounded-full bg-bordo px-1.5 text-xs font-bold text-sobre-bordo">
                      {quantidadeDePedidos}
                    </span>
                  )}
                </>
              ),
            }}
          >
            {() => pedidos}
          </PainelLateral>
          <PainelLateral
            rotulo="Recusados"
            titulo="Recusados recentemente"
            variante="secundario"
            tamanho="pequeno"
            classeDoBotao="w-auto"
          >
            {() => recusados}
          </PainelLateral>
          <Link
            href="/professor/alunos/convidar"
            className={classesDoBotao("primario", "w-auto", "pequeno")}
          >
            Convidar aluno
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <BuscaDeAlunos valor={busca} aoMudar={setBusca} />
        <div
          role="group"
          aria-label="Filtrar por situação"
          className="flex max-w-full gap-1 self-start overflow-x-auto rounded-full border border-linha bg-superficie p-1 [scrollbar-width:none] md:self-auto [&::-webkit-scrollbar]:hidden"
        >
          {FILTROS.map(({ valor, rotulo }) => (
            <button
              key={valor}
              type="button"
              aria-pressed={filtro === valor}
              onClick={() => setFiltro(valor)}
              className={`min-h-10 shrink-0 cursor-pointer whitespace-nowrap rounded-full px-3 text-sm font-bold sm:px-4 ${
                filtro === valor
                  ? "bg-bloco text-texto-sobre-bloco"
                  : "text-texto-secundario hover:text-texto"
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>
        {cursoId && (
          <p className="flex items-center gap-2 text-sm text-texto">
            <span>
              Curso:{" "}
              <strong className="break-words">
                {cursoFiltrado ?? "curso sem alunos"}
              </strong>
            </span>
            <Link
              href="/professor/alunos"
              className="inline-flex min-h-10 items-center font-bold text-destaque underline"
            >
              Limpar
            </Link>
          </p>
        )}
      </div>

      <section aria-labelledby="turma" className="min-w-0 space-y-5">
        <h2 id="turma" className="sr-only">
          Turma
        </h2>
        <p role="status" className="sr-only">
          {termo || filtro !== "todos" || cursoId
            ? `${visiveis.length} ${visiveis.length === 1 ? "aluno encontrado" : "alunos encontrados"}`
            : ""}
        </p>
        {linhas.length === 0 ? (
          <p className="text-texto-secundario">
            Nenhum aluno cadastrado ainda.
          </p>
        ) : visiveis.length === 0 ? (
          <p className="text-texto-secundario">Nenhum aluno com esse filtro.</p>
        ) : (
          GRUPOS.map((grupo) => {
            const doGrupo = visiveis.filter(grupo.pertence);
            // A seção vazia não aparece.
            if (doGrupo.length === 0) return null;
            return (
              <section
                key={grupo.id}
                aria-labelledby={`grupo-${grupo.id}`}
                className="space-y-2"
              >
                <h3
                  id={`grupo-${grupo.id}`}
                  className="text-sm font-bold text-texto-secundario"
                >
                  {grupo.titulo}{" "}
                  <span className="font-normal">({doGrupo.length})</span>
                </h3>
                <ul
                  aria-label={grupo.titulo}
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                  {doGrupo.map((linha) => (
                    <li key={linha.id}>
                      <CartaoDoAluno linha={linha} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </section>
    </>
  );
}

function BuscaDeAlunos({
  valor,
  aoMudar,
}: {
  valor: string;
  aoMudar: (valor: string) => void;
}) {
  return (
    <div className="w-full md:w-72">
      <label htmlFor="busca-de-alunos" className="sr-only">
        Buscar aluno pelo nome
      </label>
      <div className="relative">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-texto-secundario"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id="busca-de-alunos"
          type="search"
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          placeholder="Buscar pelo nome"
          autoComplete="off"
          className={classesDoCampo("pr-4 pl-12")}
        />
      </div>
    </div>
  );
}
