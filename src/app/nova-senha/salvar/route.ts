import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NOVA_SENHA, erroDaNovaSenha } from "@/lib/senha";
import { COOKIE_ULTIMO_USO } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";

// Grava a senha escolhida em /nova-senha. É uma rota, e não uma server action,
// porque quem chega pelo link pode ser um pedido ainda não liberado, que não
// passa por exigirAluno(). Quem protege é a sessão aberta pelo link do e-mail
// mais o cookie gravado em /auth/callback.
export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  // 303: o navegador segue com GET, e não reenvia o formulário.
  const voltar = (caminho: string) =>
    NextResponse.redirect(new URL(caminho, origin), 303);

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !request.cookies.has(COOKIE_NOVA_SENHA))
    return voltar("/login?erro=link-senha-vencido");

  const formData = await request.formData();
  const senha = formData.get("senha");
  if (
    erroDaNovaSenha({ senha, confirmacao: formData.get("confirmacao") }) ||
    typeof senha !== "string"
  )
    return voltar("/nova-senha?erro=senha");

  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) {
    const motivo =
      error.code === "same_password"
        ? "igual"
        : error.code === "weak_password"
          ? "senha"
          : "falhou";
    return voltar(`/nova-senha?erro=${motivo}`);
  }

  // Encerra esta sessão e as dos outros aparelhos: quem tinha a senha antiga
  // sai, e a pessoa entra de novo com a senha nova.
  await supabase.auth.signOut({ scope: "global" });
  const resposta = voltar("/login?erro=senha-alterada");
  resposta.cookies.set(COOKIE_NOVA_SENHA, "", {
    path: "/nova-senha",
    maxAge: 0,
  });
  resposta.cookies.delete(COOKIE_ULTIMO_USO);
  return resposta;
}
