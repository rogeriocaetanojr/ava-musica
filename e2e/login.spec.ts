import { expect, test } from "@playwright/test";
import { ALUNO, entrar, NOME_DO_ALUNO } from "./apoio";

test("aluno convidado entra pelo link mágico", async ({ page }) => {
  await entrar(page, ALUNO);

  await expect(page).toHaveURL(/\/cursos$/);
  await expect(
    page.getByRole("heading", { name: `Olá, ${NOME_DO_ALUNO}` }),
  ).toBeVisible();
});

test("a tela de login oferece o e-mail e o Google", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Entrar com e-mail" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Entrar com Google" }),
  ).toBeVisible();
});
