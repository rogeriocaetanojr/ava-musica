import { Suspense } from "react";
import { redirect } from "next/navigation";
import { destinoDaSessao, obterSessao } from "@/lib/auth";

async function Redirecionar(): Promise<null> {
  const sessao = await obterSessao();
  redirect(sessao ? destinoDaSessao(sessao) : "/login");
}

export default function Inicio() {
  return (
    <Suspense>
      <Redirecionar />
    </Suspense>
  );
}
