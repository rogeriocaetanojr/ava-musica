import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { TelaDeEntrada } from "@/components/tela-de-entrada";
import { destinoDaSessao, obterSessao } from "@/lib/auth";
import { tituloDaPagina } from "@/lib/site";
import { FormularioEsqueciSenha } from "./formulario-esqueci-senha";

export const metadata: Metadata = {
  title: tituloDaPagina("Esqueci minha senha"),
};

// Quem já está logado vai direto para a sua área (a troca fica no perfil).
async function RedirecionarLogado() {
  const sessao = await obterSessao();
  if (sessao) redirect(destinoDaSessao(sessao));
  return null;
}

export default function PaginaEsqueciSenha() {
  return (
    <TelaDeEntrada
      chamada="Esqueceu a senha?"
      destaque="A gente resolve."
      apoio="Informe o seu e-mail e abra o link que enviamos para criar uma senha nova."
      titulo="Esqueci minha senha"
      semPrivacidade
    >
      <p className="text-sm leading-normal text-texto-secundario">
        Informe o e-mail da sua conta. Enviamos um link para você criar uma
        senha nova.
      </p>
      <Suspense>
        <RedirecionarLogado />
      </Suspense>
      <FormularioEsqueciSenha />
    </TelaDeEntrada>
  );
}
