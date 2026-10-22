import { Suspense } from "react";
import { redirect } from "next/navigation";
import { destinoDoPapel, obterSessao } from "@/lib/auth";

async function Redirecionar(): Promise<null> {
  const sessao = await obterSessao();
  redirect(sessao ? destinoDoPapel(sessao.papel) : "/login");
}

export default function Inicio() {
  return (
    <Suspense>
      <Redirecionar />
    </Suspense>
  );
}
