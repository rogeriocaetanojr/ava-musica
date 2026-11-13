"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Botao, classesDoBotao } from "@/components/botao";
import { TelaDeEntrada } from "@/components/tela-de-entrada";

// Erro inesperado numa página. A mensagem técnica não aparece na tela; só o
// código do erro vai para o console, para achar o registro no servidor.
export default function Erro({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro na página", error.digest);
  }, [error]);

  return (
    <TelaDeEntrada
      chamada="Uma nota saiu errada."
      destaque="Vamos tentar de novo."
      titulo="Algo deu errado"
      subtitulo="Não foi possível abrir esta página agora."
    >
      <p className="leading-normal text-texto-secundario md:hidden">
        Não foi possível abrir esta página agora.
      </p>
      <div className="space-y-3">
        <Botao onClick={reset}>Tentar de novo</Botao>
        <Link href="/" className={classesDoBotao("secundario")}>
          Voltar ao início
        </Link>
      </div>
    </TelaDeEntrada>
  );
}
