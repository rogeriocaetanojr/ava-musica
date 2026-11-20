import { NextResponse, type NextRequest } from "next/server";
import { recusarOutraOrigem } from "@/lib/seguranca";
import { COOKIE_ULTIMO_USO } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";

// Só aceita POST, para um link pré-carregado não deslogar ninguém, e só vindo
// de uma página do site (S7), para outro site não deslogar ninguém.
export async function POST(request: NextRequest) {
  const recusa = recusarOutraOrigem(request);
  if (recusa) return recusa;
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  const resposta = NextResponse.redirect(`${request.nextUrl.origin}/login`, {
    status: 303,
  });
  resposta.cookies.delete(COOKIE_ULTIMO_USO);
  return resposta;
}
