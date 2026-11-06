import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Aviso } from "@/components/aviso";
import { TelaDeEntrada } from "@/components/tela-de-entrada";
import { destinoDaSessao, obterSessao } from "@/lib/auth";
import { tituloDaPagina } from "@/lib/site";
import { FormularioLogin } from "./formulario-login";
import {
  MENSAGEM_BLOQUEADO,
  MENSAGEM_LINK_VENCIDO,
  MENSAGEM_MUITAS_TENTATIVAS,
  MENSAGEM_NAO_CONVIDADO,
  MENSAGEM_PEDIDO_BARRADO,
  MENSAGEM_SESSAO_EXPIRADA,
} from "./mensagens";

export const metadata: Metadata = { title: tituloDaPagina() };

const MENSAGENS_DE_ERRO: Record<string, string> = {
  "nao-convidado": MENSAGEM_NAO_CONVIDADO,
  "muitas-tentativas": MENSAGEM_MUITAS_TENTATIVAS,
  bloqueado: MENSAGEM_BLOQUEADO,
  "pedido-barrado": MENSAGEM_PEDIDO_BARRADO,
  "sessao-expirada": MENSAGEM_SESSAO_EXPIRADA,
  "link-vencido": MENSAGEM_LINK_VENCIDO,
  "senha-definida":
    "Sua senha foi salva. Entre com o seu e-mail e a senha que você criou.",
  google:
    "Não foi possível entrar com o Google. Tente de novo ou entre com e-mail e senha.",
};

type Parametros = Promise<{ erro?: string }>;

// Quem já está logado vai direto para a sua área.
async function RedirecionarLogado() {
  const sessao = await obterSessao();
  if (sessao) redirect(destinoDaSessao(sessao));
  return null;
}

async function AvisoDeErro({ searchParams }: { searchParams: Parametros }) {
  const { erro } = await searchParams;
  const mensagem = erro ? MENSAGENS_DE_ERRO[erro] : undefined;
  if (!mensagem) return null;

  return (
    <Aviso role="alert">
      <p>{mensagem}</p>
    </Aviso>
  );
}

export default function PaginaLogin({
  searchParams,
}: {
  searchParams: Parametros;
}) {
  return (
    <TelaDeEntrada
      chamada="Afine e entre."
      destaque="A aula de hoje te espera."
      apoio="Vídeos, cifras, playbacks e provas das suas aulas de música, num só lugar."
      titulo="Entrar"
      subtitulo="Entre com o seu e-mail e a sua senha."
      nota="Acesso liberado pelo professor. Para menores de 12 anos, o responsável autoriza primeiro."
      semPrivacidade
    >
      <Suspense>
        <RedirecionarLogado />
        <AvisoDeErro searchParams={searchParams} />
      </Suspense>
      <FormularioLogin />
    </TelaDeEntrada>
  );
}
