import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TelaDeEntrada } from "@/components/tela-de-entrada";
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
    <TelaDeEntrada
      chamada="Primeira aula?"
      destaque="Crie a sua conta."
      apoio="Crie a conta, confirme o e-mail e espere o professor liberar o acesso."
      titulo="Criar conta"
      rodape={
        <p className="text-sm text-texto-secundario">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center font-bold text-destaque underline"
          >
            Entrar
          </Link>
        </p>
      }
    >
      <p className="text-sm leading-normal text-texto-secundario">
        Depois de confirmar o e-mail, o professor libera o seu acesso. Para
        menores de 12 anos, o responsável autoriza primeiro.
      </p>
      <Suspense>
        <RedirecionarLogado />
      </Suspense>
      <FormularioCriarConta />
    </TelaDeEntrada>
  );
}
