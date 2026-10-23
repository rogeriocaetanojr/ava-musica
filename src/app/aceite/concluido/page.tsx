import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { tituloDaPagina } from "@/lib/site";

export const metadata: Metadata = {
  title: tituloDaPagina("Autorização registrada"),
  robots: { index: false },
};

type Parametros = Promise<{ envio?: string }>;

async function Mensagem({ searchParams }: { searchParams: Parametros }) {
  const { envio } = await searchParams;
  if (envio === "falhou")
    return (
      <p role="alert" className="rounded-md bg-amber-100 p-3 text-amber-900">
        Não conseguimos enviar o e-mail de acesso agora. O aluno pode pedir o
        código na{" "}
        <Link href="/login" className="underline">
          página de entrada
        </Link>
        , usando o próprio e-mail.
      </p>
    );
  return (
    <p role="status" className="rounded-md bg-green-100 p-3 text-green-800">
      Enviamos ao aluno, por e-mail, um código para entrar. Se o código vencer,
      ele pode pedir outro na página de entrada, com o próprio e-mail.
    </p>
  );
}

export default function AceiteConcluido({
  searchParams,
}: {
  searchParams: Parametros;
}) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-bold">Obrigado! Autorização registrada.</h1>
      <Suspense>
        <Mensagem searchParams={searchParams} />
      </Suspense>
      <p className="text-sm">
        Para pedir a exclusão dos dados a qualquer momento, fale com o
        professor.
      </p>
    </main>
  );
}
