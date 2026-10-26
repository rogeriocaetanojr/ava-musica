import { expect, type Page, test } from "@playwright/test";
import {
  apagarEmailsDe,
  AVISO_DE_ENVIO,
  codigoDoEmail,
  contarEmails,
  digitarCodigo,
  entrar,
  informarNome,
  pedirCodigo,
  PROFESSOR,
} from "./apoio";

const PEDIDO_BARRADO =
  "Não foi possível pedir acesso agora. Fale com o professor.";

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

// Um e-mail novo por execução: o banco só é recriado no início dos testes.
function emailNovo(prefixo: string, projeto: string): string {
  return `${prefixo}-${projeto}-${Date.now()}@teste.local`;
}

test("pedido pelo e-mail só conta depois do código, avisa uma vez e é liberado", async ({
  browser,
}, testInfo) => {
  const email = emailNovo("pedido", testInfo.project.name);
  const nome = `Pedido ${testInfo.project.name} ${Date.now()}`;

  // Digitar o e-mail cria a conta, mas o pedido ainda não aparece.
  const aluno = await browser.newPage();
  await pedirCodigo(aluno, email);
  await expect(aluno.getByRole("status")).toContainText(AVISO_DE_ENVIO);
  const codigo = await codigoDoEmail(email);

  const professor = await browser.newPage();
  await entrar(professor, PROFESSOR);
  await expect(professor).toHaveURL(/\/professor$/);
  await professor.goto("/professor/alunos");
  const pedidos = secao(professor, "Pedidos de acesso");
  await expect(pedidos.getByText(email)).toHaveCount(0);

  // Depois do código vem o nome; só então o pedido conta e o professor é
  // avisado, com o nome.
  await digitarCodigo(aluno, codigo);
  await informarNome(aluno, nome);
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
  expect(await contarEmails(PROFESSOR, "Novo pedido de acesso", nome)).toBe(1);

  // Pedir de novo e entrar de novo não pede o nome de novo nem gera outro
  // aviso ou outro pedido.
  await aluno.context().clearCookies();
  await apagarEmailsDe(email);
  await pedirCodigo(aluno, email);
  await expect(aluno.getByRole("status")).toContainText(AVISO_DE_ENVIO);
  await digitarCodigo(aluno, await codigoDoEmail(email));
  await expect(aluno).toHaveURL(/\/aguardando$/);
  expect(await contarEmails(PROFESSOR, "Novo pedido de acesso", email)).toBe(1);

  // O painel só mostra a faixa com a contagem, que leva à página Alunos.
  await professor.goto("/professor");
  await professor.getByRole("link", { name: /pedidos? de acesso/ }).click();
  await expect(professor).toHaveURL(/\/professor\/alunos$/);
  await abrirPedidos(professor, testInfo.project.name);
  const pedido = pedidos.getByRole("listitem").filter({ hasText: email });
  await expect(pedido).toHaveCount(1);
  await expect(pedido.getByText(nome)).toBeVisible();
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
  await pedirCodigo(aluno, email);
  await digitarCodigo(aluno, await codigoDoEmail(email));
  await informarNome(aluno, "Pessoa Recusada");
  await expect(aluno).toHaveURL(/\/aguardando$/);

  const professor = await browser.newPage();
  await entrar(professor, PROFESSOR);
  await expect(professor).toHaveURL(/\/professor$/);
  await professor.goto("/professor/alunos");
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
  await pedirCodigo(outro, email);
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
  await pedirCodigo(outro, email);
  await expect(outro.getByRole("status")).toContainText(AVISO_DE_ENVIO);
});
