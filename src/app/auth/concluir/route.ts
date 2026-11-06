import type { NextRequest } from "next/server";
import { concluirLogin } from "../concluir-login";

// Destino da tela de login depois de entrar com e-mail e senha (a sessão já
// está nos cookies). Quem chegar aqui sem sessão volta ao login.
export async function GET(request: NextRequest) {
  return concluirLogin(request.nextUrl.origin);
}
