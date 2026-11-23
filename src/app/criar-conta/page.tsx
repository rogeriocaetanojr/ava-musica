import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { TelaDeLogin } from "@/components/tela-de-login";
import { destinoDaSessao, obterSessao } from "@/lib/auth";
import { tituloDaPagina } from "@/lib/site";
import { FormularioCriarConta } from "./formulario-criar-conta";

export const metadata: Metadata = { title: tituloDaPagina("Criar conta") };

// Quem já está logado vai direto para a sua área.
async function RedirecionarLogado() {
  const sessao = await obterSessao();
  if (sessao) redirect(destinoDaSessao(sessao));
  return null;
}

export default function PaginaCriarConta() {
  return (
    <TelaDeLogin titulo="Criar conta">
      <p className="text-sm leading-normal text-texto-secundario">
        Confirme o e-mail e espere o professor liberar o acesso. Menores de 12
        anos precisam da autorização do responsável.
      </p>
      <Suspense>
        <RedirecionarLogado />
      </Suspense>
      <FormularioCriarConta />
    </TelaDeLogin>
  );
}
