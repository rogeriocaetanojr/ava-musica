import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_ULTIMO_USO } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";

// Só aceita POST, para um link pré-carregado não deslogar ninguém.
export async function POST(request: NextRequest) {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  const resposta = NextResponse.redirect(`${request.nextUrl.origin}/login`, {
    status: 303,
  });
  resposta.cookies.delete(COOKIE_ULTIMO_USO);
  return resposta;
}
