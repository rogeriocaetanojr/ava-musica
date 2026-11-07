import { expect, test } from "@playwright/test";
import {
  apagarEmailsDe,
  entrar,
  esperarCaptcha,
  linkDoEmail,
  PROFESSOR,
} from "./apoio";

// Curso publicado criado pelo seed:dev.
const CURSO = "Violão para iniciantes";

test("convite por e-mail: o aluno define a senha e entra matriculado; o link vale uma vez e o reenvio troca o link", async ({
  browser,
}, testInfo) => {
  const projeto = testInfo.project.name;
  const id = Date.now();
  const email = `convite-${projeto}-${id}@teste.local`;
  const nome = `Clara Nunes ${projeto} ${id}`;
  await apagarEmailsDe(email);

  // O professor convida, com o e-mail do aluno e um curso.
  const professor = await browser.newPage();
  await entrar(professor, PROFESSOR);
  await professor.goto("/professor/alunos/convidar");
  await professor.getByLabel("Nome completo").fill(nome);
  await professor.getByLabel("Data de nascimento").fill("2008-05-10");
  await professor.getByLabel("E-mail do aluno").fill(email);
  await professor.getByLabel(CURSO, { exact: true }).check();
  await professor.getByRole("button", { name: "Enviar convite" }).click();
  await expect(
    professor
      .getByRole("status")
      .filter({ hasText: `Convite enviado para ${email}` }),
  ).toBeVisible();
  const primeiro = await linkDoEmail(email, "/convite/");

  // Reenviar pela ficha troca o link: o primeiro deixa de valer.
  await apagarEmailsDe(email);
  await professor.goto("/professor/alunos");
  await professor.getByRole("link", { name: nome }).first().click();
  await professor.getByRole("button", { name: "Reenviar convite" }).click();
  await expect(
    professor
      .getByRole("status")
      .filter({ hasText: "O link anterior deixou de valer" }),
  ).toBeVisible();
  const segundo = await linkDoEmail(email, "/convite/");
  expect(segundo).not.toBe(primeiro);

  const aluno = await browser.newPage();
  await aluno.goto(primeiro);
  await expect(
    aluno.getByRole("alert").filter({ hasText: "não existe" }),
  ).toBeVisible();

  // O link novo mostra o nome; o aluno cria a senha e entra matriculado.
  await aluno.goto(segundo);
  await expect(aluno.getByText(`Olá, ${nome}!`)).toBeVisible();
  const senha = aluno.getByLabel("Crie a sua senha");
  await expect(senha).toHaveAttribute("autocomplete", "new-password");
  await senha.fill("senha-do-convite-1");
  await esperarCaptcha(aluno);
  await aluno.getByRole("button", { name: "Salvar senha e entrar" }).click();
  await expect(aluno).toHaveURL(/\/cursos$/);
  await expect(aluno.getByText(CURSO).first()).toBeVisible();

  // O link vale uma vez só.
  await aluno.context().clearCookies();
  await aluno.goto(segundo);
  await expect(
    aluno.getByRole("alert").filter({ hasText: "já foi usado" }),
  ).toBeVisible();

  // Depois disso, a senha criada entra pela tela de login, e a ficha não
  // oferece mais o reenvio.
  await entrar(aluno, email, "senha-do-convite-1");
  await expect(aluno).toHaveURL(/\/cursos$/);
  await professor.reload();
  await expect(
    professor.getByRole("button", { name: "Reenviar convite" }),
  ).toHaveCount(0);
});
