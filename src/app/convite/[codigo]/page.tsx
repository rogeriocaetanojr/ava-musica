import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Aviso } from "@/components/aviso";
import { CONTEINER } from "@/components/conteiner";
import { TelaDeEntrada } from "@/components/tela-de-entrada";
import { CARTAO_DE_LEITURA, MolduraLegal } from "@/components/texto-legal";
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

// Convite sem valor: tela só de aviso, no layout das páginas públicas de texto.
function LinkSemValor({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <MolduraLegal titulo={titulo}>
      <main
        className={`${CONTEINER} flex flex-1 flex-col items-center py-6 md:py-10`}
      >
        <div className={`${CARTAO_DE_LEITURA} w-full`}>
          <Aviso role="alert">
            <p>{texto}</p>
          </Aviso>
          <Link href="/login" className={link}>
            Ir para Entrar
          </Link>
        </div>
      </main>
    </MolduraLegal>
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
    <LinkSemValor
      titulo="Link inválido"
      texto="Este link de convite não existe. Confira se abriu o link inteiro do e-mail ou peça um novo ao professor."
    />
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
      <LinkSemValor
        titulo="Convite já usado"
        texto="Este convite já foi usado. Entre com o seu e-mail e a senha que você criou."
      />
    );
  if (situacao === "vencido")
    return (
      <LinkSemValor
        titulo="Convite vencido"
        texto="Este convite venceu. Peça ao professor para reenviar o convite."
      />
    );

  const mensagem = erro ? MENSAGENS_DE_ERRO[erro] : undefined;
  return (
    <TelaDeEntrada
      chamada="Bem-vindo à escola."
      destaque="Falta só a sua senha."
      titulo="Seu convite"
    >
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
    </TelaDeEntrada>
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
    <Suspense
      fallback={
        <MolduraLegal titulo="Seu convite">
          <main className={`${CONTEINER} flex-1 py-6 md:py-10`}>
            <p>Carregando…</p>
          </main>
        </MolduraLegal>
      }
    >
      <Convite params={params} searchParams={searchParams} />
    </Suspense>
  );
}
