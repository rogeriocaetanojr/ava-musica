import { expect, type Page, test } from "@playwright/test";
import { clienteAdmin, entrar, PROFESSOR } from "./apoio";

// S1 da auditoria: o link de autorização do responsável fica no banco só
// como hash, vale 7 dias e uma vez só. Na ficha, o professor gera um link
// novo, e o anterior deixa de valer.

const LINK = "Link de autorização do responsável";

// O link aparece num campo só de leitura; o teste segue pelo caminho dele.
async function lerLink(page: Page): Promise<string> {
  const valor = await page.getByRole("textbox", { name: LINK }).inputValue();
  return new URL(valor).pathname;
}

test("aceite do responsável: link novo invalida o anterior, o vencido não vale e o aceite vale uma vez", async ({
  browser,
}, testInfo) => {
  const projeto = testInfo.project.name;
  const id = Date.now();
  const email = `menor-${projeto}-${id}@teste.local`;
  const nome = `Lia Menor ${projeto} ${id}`;

  // O professor cadastra um aluno de 8 anos com o responsável.
  const professor = await browser.newPage();
  await entrar(professor, PROFESSOR);
  await professor.goto("/professor/alunos/convidar");
  await professor.getByLabel("Nome completo").fill(nome);
  const nascimento = new Date();
  nascimento.setFullYear(nascimento.getFullYear() - 8);
  await professor
    .getByLabel("Data de nascimento")
    .fill(nascimento.toISOString().slice(0, 10));
  await professor.getByLabel("E-mail do aluno").fill(email);
  await professor.getByLabel("Nome do responsável").fill("Marta Responsável");
  await professor
    .getByLabel("E-mail do responsável")
    .fill(`responsavel-${projeto}-${id}@teste.local`);
  await professor.getByRole("button", { name: "Enviar convite" }).click();
  const primeiro = await lerLink(professor);
  expect(primeiro).toMatch(/^\/aceite\/[A-Za-z0-9_-]{43}$/);

  // Na ficha, um link novo invalida o primeiro.
  await professor.goto("/professor/alunos");
  await professor.getByRole("link", { name: nome }).first().click();
  await professor
    .getByRole("button", { name: "Gerar link de autorização" })
    .click();
  await expect(
    professor.getByRole("status").filter({ hasText: "deixou de valer" }),
  ).toBeVisible();
  const segundo = await lerLink(professor);
  expect(segundo).not.toBe(primeiro);

  const responsavel = await browser.newPage();
  await responsavel.goto(primeiro);
  await expect(responsavel.getByText("não existe")).toBeVisible();

  // Link vencido: a página avisa e o aceite não é gravado.
  const admin = clienteAdmin();
  const { data: perfil } = await admin
    .from("perfis")
    .select("id")
    .eq("email", email)
    .single();
  await admin
    .from("responsaveis")
    .update({ expira_em: new Date(Date.now() - 60_000).toISOString() })
    .eq("aluno_id", perfil!.id);
  await responsavel.goto(segundo);
  await expect(
    responsavel.getByRole("heading", { name: "Link vencido" }),
  ).toBeVisible();

  // Com um link novo, o responsável autoriza, e o mesmo link não vale de novo.
  await professor.reload();
  await professor
    .getByRole("button", { name: "Gerar link de autorização" })
    .click();
  const terceiro = await lerLink(professor);
  await responsavel.goto(terceiro);
  await responsavel.getByRole("checkbox", { name: /^Autorizo/ }).check();
  await responsavel.getByRole("button", { name: "Autorizar o acesso" }).click();
  await expect(responsavel).toHaveURL(/\/aceite\/concluido$/);
  await responsavel.goto(terceiro);
  await expect(
    responsavel.getByRole("heading", { name: "Link já usado" }),
  ).toBeVisible();

  await professor.reload();
  await expect(professor.getByText("Autorizou o acesso em")).toBeVisible();
});
