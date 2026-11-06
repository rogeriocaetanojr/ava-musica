import { expect, type Page, test } from "@playwright/test";
import {
  AVISO_DE_CONFIRMACAO,
  contarEmails,
  criarConta,
  entrar,
  linkDoEmail,
  PROFESSOR,
  tentarEntrar,
} from "./apoio";

function secao(pagina: Page, titulo: string) {
  return pagina
    .locator("section")
    .filter({ has: pagina.getByRole("heading", { name: titulo }) });
}

// No celular, os pedidos ficam num painel aberto pelo botão com a quantidade.
async function abrirPedidos(pagina: Page, projeto: string) {
  if (projeto !== "celular") return;
  await pagina.getByRole("button", { name: /^Pedidos de acesso/ }).click();
}

test("criar conta, confirmar o e-mail, esperar o professor liberar e entrar com senha", async ({
  browser,
}, testInfo) => {
  const projeto = testInfo.project.name;
  const email = `conta-${projeto}-${Date.now()}@teste.local`;
  const nome = `Bruno Lima ${projeto}`;
  const senha = "minha-senha-1";

  // Senha curta não passa.
  const aluno = await browser.newPage();
  await criarConta(aluno, { nome, email, senha: "1234567" });
  await expect(
    aluno.getByRole("alert").filter({ hasText: "pelo menos 8 caracteres" }),
  ).toBeVisible();

  await criarConta(aluno, { nome, email, senha });
  await expect(aluno.getByRole("status")).toContainText(AVISO_DE_CONFIRMACAO);
  const confirmar = await linkDoEmail(email, "/auth/confirmar");

  // Antes da confirmação, a senha não entra e o pedido não aparece.
  await tentarEntrar(aluno, email, senha);
  await expect(
    aluno.getByRole("alert").filter({ hasText: "E-mail ou senha incorretos." }),
  ).toBeVisible();

  const professor = await browser.newPage();
  await entrar(professor, PROFESSOR);
  await expect(professor).toHaveURL(/\/professor$/);
  await professor.goto("/professor/alunos");
  const pedidos = secao(professor, "Pedidos de acesso");
  await expect(pedidos.getByText(email)).toHaveCount(0);

  // O link do e-mail confirma, abre a sessão e leva à espera, sem pedir o
  // nome de novo.
  await aluno.goto(confirmar);
  await expect(aluno).toHaveURL(/\/aguardando$/);
  await expect(
    aluno.getByRole("heading", { name: "Aguardando liberação do professor" }),
  ).toBeVisible();
  await expect(aluno.getByText(`Olá, ${nome}.`)).toBeVisible();
  await aluno.goto("/cursos");
  await expect(aluno).toHaveURL(/\/aguardando$/);
  await expect
    .poll(() => contarEmails(PROFESSOR, "Novo pedido de acesso", email), {
      message: "o aviso de pedido novo não chegou",
    })
    .toBe(1);

  // O link vale uma vez só.
  await aluno.context().clearCookies();
  await aluno.goto(confirmar);
  await expect(aluno).toHaveURL(/\/login\?erro=link-vencido$/);

  // Entrar de novo com a senha leva à espera, sem outro aviso.
  await entrar(aluno, email, senha);
  await expect(aluno).toHaveURL(/\/aguardando$/);
  expect(await contarEmails(PROFESSOR, "Novo pedido de acesso", email)).toBe(1);

  // O professor libera pelo painel.
  await professor.goto("/professor");
  await professor.getByRole("link", { name: /pedidos? de acesso/ }).click();
  await expect(professor).toHaveURL(/\/professor\/alunos$/);
  await abrirPedidos(professor, projeto);
  const pedido = pedidos.getByRole("listitem").filter({ hasText: email });
  await expect(pedido.getByText(nome)).toBeVisible();
  await pedido.getByRole("button", { name: "Liberar" }).click();
  await pedido.getByLabel("Data de nascimento").fill("2000-01-01");
  await pedido.getByRole("button", { name: "Confirmar liberação" }).click();
  await expect(
    professor.getByRole("status").filter({ hasText: "foi liberado" }),
  ).toBeVisible();

  // Liberado, o aluno entra com a senha e chega aos cursos.
  await aluno.context().clearCookies();
  await entrar(aluno, email, senha);
  await expect(aluno).toHaveURL(/\/cursos$/);
});
