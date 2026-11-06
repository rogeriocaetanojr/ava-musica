import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Aviso } from "@/components/aviso";
import { TelaDeEntrada } from "@/components/tela-de-entrada";
import {
  ehCodigoDeConvite,
  hashDoConvite,
  situacaoDoConvite,
} from "@/lib/convites";
import { nomeParaExibir } from "@/lib/nomes";
import { tituloDaPagina } from "@/lib/site";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { FormularioSenha } from "./formulario-senha";

export const metadata: Metadata = {
  title: tituloDaPagina("Seu convite"),
  robots: { index: false },
};

type Parametros = Promise<{ codigo: string }>;
type Busca = Promise<{ erro?: string }>;

const MENSAGENS_DE_ERRO: Record<string, string> = {
  senha:
    "A senha precisa ter pelo menos 8 caracteres e no máximo 72. Tente de novo.",
  falhou: "Não foi possível salvar a senha. Tente de novo.",
};

const link =
  "inline-flex min-h-12 items-center text-sm font-bold text-destaque underline";

function LinkSemValor({ texto }: { texto: string }) {
  return (
    <>
      <Aviso role="alert">
        <p>{texto}</p>
      </Aviso>
      <Link href="/login" className={link}>
        Ir para Entrar
      </Link>
    </>
  );
}

// Página pública: o código do link substitui o login. O convite é lido com o
// cliente admin porque o visitante não tem sessão; a tela mostra só o nome.
async function Convite({
  params,
  searchParams,
}: {
  params: Parametros;
  searchParams: Busca;
}) {
  await connection();
  const [{ codigo }, { erro }] = await Promise.all([params, searchParams]);

  const invalido = (
    <LinkSemValor texto="Este link de convite não existe. Confira se abriu o link inteiro do e-mail ou peça um novo ao professor." />
  );
  if (!ehCodigoDeConvite(codigo)) return invalido;

  const { data } = await criarClienteAdmin()
    .from("convites")
    .select("expira_em, usado_em, perfis (nome, email)")
    .eq("codigo_hash", hashDoConvite(codigo))
    .maybeSingle();
  const aluno = data?.perfis as unknown as {
    nome: string | null;
    email: string;
  } | null;
  if (!data || !aluno) return invalido;

  const situacao = situacaoDoConvite(data, new Date());
  if (situacao === "usado")
    return (
      <LinkSemValor texto="Este convite já foi usado. Entre com o seu e-mail e a senha que você criou." />
    );
  if (situacao === "vencido")
    return (
      <LinkSemValor texto="Este convite venceu. Peça ao professor para reenviar o convite." />
    );

  const mensagem = erro ? MENSAGENS_DE_ERRO[erro] : undefined;
  return (
    <>
      <div className="space-y-2">
        <p className="text-lg font-bold break-words text-texto">
          Olá, {nomeParaExibir(aluno.nome)}!
        </p>
        <p className="leading-relaxed text-texto-secundario">
          O professor criou o seu acesso para{" "}
          <span className="break-all text-texto">{aluno.email}</span>. Crie uma
          senha para entrar.
        </p>
      </div>
      {mensagem && (
        <Aviso role="alert">
          <p>{mensagem}</p>
        </Aviso>
      )}
      <FormularioSenha codigo={codigo} email={aluno.email} />
    </>
  );
}

export default function PaginaConvite({
  params,
  searchParams,
}: {
  params: Parametros;
  searchParams: Busca;
}) {
  return (
    <TelaDeEntrada
      chamada="Bem-vindo à escola."
      destaque="Falta só a sua senha."
      titulo="Seu convite"
    >
      <Suspense>
        <Convite params={params} searchParams={searchParams} />
      </Suspense>
    </TelaDeEntrada>
  );
}
