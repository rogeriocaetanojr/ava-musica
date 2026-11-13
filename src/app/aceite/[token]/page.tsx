import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { classesDoBotao } from "@/components/botao";
import { Aviso } from "@/components/aviso";
import { BotaoEnviar } from "@/components/botao-enviar";
import { CONTEINER } from "@/components/conteiner";
import { CARTAO_DE_LEITURA, MolduraLegal } from "@/components/texto-legal";
import { NOME_DO_AVA, tituloDaPagina } from "@/lib/site";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { ehTokenDeAceite } from "../validacao";

export const metadata: Metadata = {
  title: tituloDaPagina("Autorização do responsável"),
  robots: { index: false },
};

type Parametros = Promise<{ token: string }>;
type Busca = Promise<{ erro?: string }>;

const MENSAGENS_DE_ERRO: Record<string, string> = {
  "sem-autorizo": "Marque a caixa “Autorizo” para continuar.",
  falhou: "Não foi possível registrar a autorização. Tente de novo.",
};

const MAIN = `${CONTEINER} flex flex-1 flex-col items-center py-6 md:py-10`;

function Mensagem({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <MolduraLegal titulo={titulo}>
      <main className={MAIN}>
        <div className={`${CARTAO_DE_LEITURA} w-full`}>
          <p>{texto}</p>
        </div>
      </main>
    </MolduraLegal>
  );
}

// Página pública: o token do link substitui o login. Os dados do responsável
// são lidos com o cliente admin porque o visitante não tem sessão.
async function Autorizacao({
  params,
  searchParams,
}: {
  params: Parametros;
  searchParams: Busca;
}) {
  const [{ token }, { erro }] = await Promise.all([params, searchParams]);

  const invalido = (
    <Mensagem
      titulo="Link inválido"
      texto="Este link de autorização não existe. Confira se copiou o endereço inteiro ou peça um novo ao professor."
    />
  );
  if (!ehTokenDeAceite(token)) return invalido;

  const { data } = await criarClienteAdmin()
    .from("responsaveis")
    .select("nome, aceito_em, perfis (nome)")
    .eq("token", token)
    .maybeSingle();
  if (!data) return invalido;
  if (data.aceito_em)
    return (
      <Mensagem
        titulo="Link já usado"
        texto="A autorização deste aluno já foi registrada e não é preciso fazer mais nada. O aluno entra com o e-mail e a senha escolhida pelo link do convite."
      />
    );

  const aluno = (data.perfis as unknown as { nome: string } | null)?.nome;
  const mensagem = erro ? MENSAGENS_DE_ERRO[erro] : undefined;

  return (
    <MolduraLegal titulo="Autorização do responsável">
      <main className={MAIN}>
        <div className={`${CARTAO_DE_LEITURA} w-full`}>
          <p className="break-words">
            Olá, {data.nome}. O professor cadastrou <strong>{aluno}</strong> na{" "}
            {NOME_DO_AVA}, o site das aulas de música. Como o aluno tem menos de
            12 anos, o acesso só é liberado com a sua autorização.
          </p>

          <section
            aria-labelledby="quais-dados"
            className="flex flex-col gap-4 pt-2"
          >
            <h2
              id="quais-dados"
              className="font-titulo text-2xl tracking-tight"
            >
              Quais dados guardamos
            </h2>
            <ul>
              <li>Nome e e-mail do aluno, para o acesso e a identificação.</li>
              <li>Data de nascimento, para aplicar a regra de idade.</li>
              <li>
                Progresso nas aulas (aulas concluídas e provas enviadas), para o
                professor acompanhar o estudo.
              </li>
              <li>Seu nome, seu e-mail e a data desta autorização.</li>
            </ul>
            <p>
              Não pedimos CPF, endereço, foto nem telefone, e não usamos
              anúncios. Você pode pedir ao professor a exclusão de todos os
              dados a qualquer momento.
            </p>
            <p>
              Leia a <Link href="/privacidade">política de privacidade</Link> e
              os <Link href="/termos">termos de uso</Link>.
            </p>
          </section>

          {mensagem && (
            <Aviso role="alert">
              <p>{mensagem}</p>
            </Aviso>
          )}

          <form
            action={`/aceite/${token}/autorizar`}
            method="post"
            className="flex flex-col gap-4"
          >
            <label className="flex min-h-12 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="autorizo"
                value="sim"
                required
                className="size-6 shrink-0 cursor-pointer"
              />
              <span>
                Autorizo, como responsável, o uso dos dados de {aluno} descritos
                acima e concordo com a política de privacidade e os termos de
                uso.
              </span>
            </label>
            <BotaoEnviar className={classesDoBotao("primario")}>
              Autorizar o acesso
            </BotaoEnviar>
          </form>
        </div>
      </main>
    </MolduraLegal>
  );
}

export default function Aceite({
  params,
  searchParams,
}: {
  params: Parametros;
  searchParams: Busca;
}) {
  return (
    <Suspense
      fallback={
        <MolduraLegal titulo="Autorização do responsável">
          <main className={MAIN}>
            <p>Carregando…</p>
          </main>
        </MolduraLegal>
      }
    >
      <Autorizacao params={params} searchParams={searchParams} />
    </Suspense>
  );
}
