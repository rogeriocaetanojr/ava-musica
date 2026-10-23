import { expect, test } from "@playwright/test";
import { entrar, PROFESSOR, textoDoEmail } from "./apoio";

// O Google não dá para automatizar; o seed cria contas sem a marca do
// professor, que ficam pendentes como quem entra pelo Google sem convite.
test("pedido pendente espera, avisa o professor e é liberado", async ({
  browser,
}, testInfo) => {
  const email = `pendente-${testInfo.project.name}@teste.local`;
  const nome = `Pendente ${testInfo.project.name}`;

  const aluno = await browser.newPage();
  await entrar(aluno, email);
  await expect(aluno).toHaveURL(/\/aguardando$/);
  await expect(
    aluno.getByRole("heading", { name: "Aguardando liberação do professor" }),
  ).toBeVisible();
  await aluno.goto("/cursos");
  await expect(aluno).toHaveURL(/\/aguardando$/);

  const aviso = await textoDoEmail(PROFESSOR, "Novo pedido de acesso");
  expect(aviso).toContain(email);

  const professor = await browser.newPage();
  await entrar(professor, PROFESSOR);
  const pedido = professor
    .getByRole("listitem")
    .filter({ hasText: email })
    .first();
  await pedido.getByRole("button", { name: "Liberar" }).click();
  await pedido.getByLabel("Data de nascimento").fill("2000-01-01");
  await pedido.getByRole("button", { name: "Confirmar liberação" }).click();
  await expect(
    professor.getByRole("status").filter({ hasText: `${nome} foi liberado` }),
  ).toBeVisible();
  await expect(professor.getByText(email)).toHaveCount(0);

  await aluno.goto("/cursos");
  await expect(aluno).toHaveURL(/\/cursos$/);
});
