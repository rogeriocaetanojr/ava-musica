import type { NextRequest } from "next/server";
import { concluirLogin } from "../concluir-login";

// Destino da tela de login depois que o código do e-mail foi confirmado (a
// sessão já está nos cookies). Quem chegar aqui sem sessão volta ao login.
export async function GET(request: NextRequest) {
  return concluirLogin(request.nextUrl.origin);
}
