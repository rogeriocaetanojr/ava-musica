import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { botaoPrincipal } from "@/app/(aluno)/estilos";
import { BotaoEnviar } from "@/components/botao-enviar";
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

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <>
      <h1 className="text-2xl font-bold">{titulo}</h1>
      <p>{texto}</p>
    </>
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
    <Aviso
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
      <Aviso
        titulo="Link já usado"
        texto="A autorização deste aluno já foi registrada e não é preciso fazer mais nada. Se o aluno não recebeu o e-mail de acesso, ele pode pedir o link na página de entrada."
      />
    );

  const aluno = (data.perfis as unknown as { nome: string } | null)?.nome;
  const mensagem = erro ? MENSAGENS_DE_ERRO[erro] : undefined;

  return (
    <>
      <h1 className="text-2xl font-bold">Autorização do responsável</h1>
      <p className="break-words">
        Olá, {data.nome}. O professor cadastrou <strong>{aluno}</strong> na{" "}
        {NOME_DO_AVA}, o site das aulas de música. Como o aluno tem menos de 12
        anos, o acesso só é liberado com a sua autorização.
      </p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Quais dados guardamos</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Nome e e-mail do aluno, para o acesso e a identificação.</li>
          <li>Data de nascimento, para aplicar a regra de idade.</li>
          <li>
            Progresso nas aulas (aulas concluídas e provas enviadas), para o
            professor acompanhar o estudo.
          </li>
          <li>Seu nome, seu e-mail e a data desta autorização.</li>
        </ul>
        <p className="text-sm">
          Não pedimos CPF, endereço, foto nem telefone, e não usamos anúncios.
          Você pode pedir ao professor a exclusão de todos os dados a qualquer
          momento.
        </p>
        <p className="text-sm">
          Leia a{" "}
          <Link href="/privacidade" className="underline">
            política de privacidade
          </Link>{" "}
          e os{" "}
          <Link href="/termos" className="underline">
            termos de uso
          </Link>
          .
        </p>
      </section>

      {mensagem && (
        <p role="alert" className="rounded-md bg-red-100 p-3 text-red-800">
          {mensagem}
        </p>
      )}

      <form
        action={`/aceite/${token}/autorizar`}
        method="post"
        className="space-y-4"
      >
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="autorizo"
            value="sim"
            required
            className="mt-1 size-5 shrink-0"
          />
          <span>
            Autorizo, como responsável, o uso dos dados de {aluno} descritos
            acima e concordo com a política de privacidade e os termos de uso.
          </span>
        </label>
        <BotaoEnviar className={botaoPrincipal}>Autorizar o acesso</BotaoEnviar>
      </form>
    </>
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
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 py-8">
      <Suspense fallback={<p>Carregando…</p>}>
        <Autorizacao params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
