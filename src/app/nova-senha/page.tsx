import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Aviso } from "@/components/aviso";
import { TelaDeEntrada } from "@/components/tela-de-entrada";
import { obterSessao } from "@/lib/auth";
import { COOKIE_NOVA_SENHA } from "@/lib/senha";
import { tituloDaPagina } from "@/lib/site";
import { FormularioNovaSenha } from "./formulario-nova-senha";

export const metadata: Metadata = {
  title: tituloDaPagina("Nova senha"),
  robots: { index: false },
};

type Busca = Promise<{ erro?: string }>;

const MENSAGENS_DE_ERRO: Record<string, string> = {
  senha:
    "A senha precisa ter pelo menos 8 caracteres e no máximo 72, e ser igual nos dois campos. Tente de novo.",
  igual: "A senha nova precisa ser diferente da senha atual.",
  falhou: "Não foi possível salvar a senha. Tente de novo.",
};

// Só abre para quem acabou de chegar pelo link do e-mail: a sessão vem do
// link e o cookie marca a chegada (ver /auth/callback). Quem está logado de
// outro jeito troca a senha no perfil, informando a atual.
async function NovaSenha({ searchParams }: { searchParams: Busca }) {
  const sessao = await obterSessao();
  const veioDoLink = (await cookies()).has(COOKIE_NOVA_SENHA);
  if (!sessao || !veioDoLink) redirect("/login?erro=link-senha-vencido");

  const { erro } = await searchParams;
  const mensagem = erro ? MENSAGENS_DE_ERRO[erro] : undefined;
  return (
    <>
      <p className="leading-relaxed text-texto-secundario">
        Crie uma senha nova para{" "}
        <span className="break-all text-texto">{sessao.email}</span>.
      </p>
      {mensagem && (
        <Aviso role="alert">
          <p>{mensagem}</p>
        </Aviso>
      )}
      <FormularioNovaSenha email={sessao.email} />
    </>
  );
}

export default function PaginaNovaSenha({
  searchParams,
}: {
  searchParams: Busca;
}) {
  return (
    <TelaDeEntrada
      chamada="Senha nova,"
      destaque="mesma música."
      apoio="Depois de salvar, entre com o seu e-mail e a senha nova."
      titulo="Nova senha"
      semPrivacidade
    >
      <Suspense>
        <NovaSenha searchParams={searchParams} />
      </Suspense>
    </TelaDeEntrada>
  );
}
