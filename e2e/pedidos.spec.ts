import { expect, type Page, test } from "@playwright/test";
import {
  apagarEmailsDe,
  contarEmails,
  entrar,
  linkDoEmail,
  pedirLink,
  PROFESSOR,
} from "./apoio";

const PEDIDO_BARRADO =
  "Não foi possível pedir acesso agora. Fale com o professor.";

function secao(pagina: Page, titulo: string) {
  return pagina
    .locator("section")
    .filter({ has: pagina.getByRole("heading", { name: titulo }) });
}

// Um e-mail novo por execução: o banco só é recriado no início dos testes.
function emailNovo(prefixo: string, projeto: string): string {
  return `${prefixo}-${projeto}-${Date.now()}@teste.local`;
}

test("pedido pelo e-mail só conta depois do clique, avisa uma vez e é liberado", async ({
  browser,
}, testInfo) => {
  const email = emailNovo("pedido", testInfo.project.name);

  // Digitar o e-mail cria a conta, mas o pedido ainda não aparece.
  const aluno = await browser.newPage();
  await pedirLink(aluno, email);
  await expect(aluno.getByRole("status")).toContainText("Enviamos um link");
  const link = await linkDoEmail(email);

  const professor = await browser.newPage();
  await entrar(professor, PROFESSOR);
  await expect(professor).toHaveURL(/\/professor$/);
  const pedidos = secao(professor, "Pedidos de acesso");
  await expect(pedidos.getByText(email)).toHaveCount(0);

  // O clique confirma o pedido e avisa o professor.
  await aluno.goto(link);
  await expect(aluno).toHaveURL(/\/aguardando$/);
  await expect(
    aluno.getByRole("heading", { name: "Aguardando liberação do professor" }),
  ).toBeVisible();
  await aluno.goto("/cursos");
  await expect(aluno).toHaveURL(/\/aguardando$/);
  await expect
    .poll(() => contarEmails(PROFESSOR, "Novo pedido de acesso", email), {
      message: "o aviso de pedido novo não chegou",
    })
    .toBe(1);

  // Pedir de novo e entrar de novo não gera outro aviso nem outro pedido.
  await aluno.context().clearCookies();
  await apagarEmailsDe(email);
  await pedirLink(aluno, email);
  await expect(aluno.getByRole("status")).toContainText("Enviamos um link");
  await aluno.goto(await linkDoEmail(email));
  await expect(aluno).toHaveURL(/\/aguardando$/);
  expect(await contarEmails(PROFESSOR, "Novo pedido de acesso", email)).toBe(1);

  await professor.reload();
  const pedido = pedidos.getByRole("listitem").filter({ hasText: email });
  await expect(pedido).toHaveCount(1);
  await pedido.getByRole("button", { name: "Liberar" }).click();
  await pedido.getByLabel("Data de nascimento").fill("2000-01-01");
  await pedido.getByRole("button", { name: "Confirmar liberação" }).click();
  await expect(
    professor.getByRole("status").filter({ hasText: "foi liberado" }),
  ).toBeVisible();
  await expect(pedido).toHaveCount(0);

  await aluno.goto("/cursos");
  await expect(aluno).toHaveURL(/\/cursos$/);
});

test("recusado não pede de novo até o professor permitir", async ({
  browser,
}, testInfo) => {
  // Os dois fluxos de pedido nos dois perfis passariam do limite de logins
  // por endereço (15 a cada 5 minutos); a recusa roda só no computador.
  test.skip(
    testInfo.project.name !== "computador",
    "roda só no computador por causa do limite de logins",
  );
  const email = emailNovo("recusa", testInfo.project.name);
  const dica = "r***@t***.local";

  const aluno = await browser.newPage();
  await pedirLink(aluno, email);
  await aluno.goto(await linkDoEmail(email));
  await expect(aluno).toHaveURL(/\/aguardando$/);

  const professor = await browser.newPage();
  await entrar(professor, PROFESSOR);
  const pedido = secao(professor, "Pedidos de acesso")
    .getByRole("listitem")
    .filter({ hasText: email });
  await pedido.getByRole("button", { name: "Recusar" }).click();
  await pedido.getByRole("button", { name: "Confirmar recusa" }).click();
  await expect(
    professor.getByRole("status").filter({ hasText: "recusado" }),
  ).toBeVisible();
  const recusa = secao(professor, "Recusados recentemente")
    .getByRole("listitem")
    .filter({ hasText: dica });
  await expect(recusa).toBeVisible();

  // A tela não diz que houve recusa, só que não deu para pedir.
  const outro = await browser.newPage();
  await pedirLink(outro, email);
  await expect(
    outro.getByRole("alert").filter({ hasText: PEDIDO_BARRADO }),
  ).toBeVisible();

  // Pelo e-mail digitado, um e-mail sem recusa só recebe o aviso.
  await professor
    .getByLabel("Permitir novo pedido pelo e-mail")
    .fill("ninguem@teste.local");
  await professor
    .getByRole("button", { name: "Permitir", exact: true })
    .click();
  await expect(
    professor.getByRole("alert").filter({ hasText: "Não há recusa recente" }),
  ).toBeVisible();

  await recusa.getByRole("button", { name: "Permitir novo pedido" }).click();
  await expect(
    professor.getByRole("status").filter({ hasText: "já pode pedir acesso" }),
  ).toBeVisible();
  await expect(recusa).toHaveCount(0);

  await apagarEmailsDe(email);
  await pedirLink(outro, email);
  await expect(outro.getByRole("status")).toContainText("Enviamos um link");
});
