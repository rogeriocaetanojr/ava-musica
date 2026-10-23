import { expect, test } from "@playwright/test";
import { ALUNO, entrar, NOME_DO_ALUNO } from "./apoio";

test("aluno convidado entra pelo link mágico", async ({ page }) => {
  await entrar(page, ALUNO);

  await expect(page).toHaveURL(/\/cursos$/);
  await expect(
    page.getByRole("heading", { name: `Olá, ${NOME_DO_ALUNO}` }),
  ).toBeVisible();
});

test("e-mail não convidado é recusado", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("desconhecido@teste.local");
  await page.getByRole("button", { name: "Enviar link de acesso" }).click();

  // O Next.js tem outro role="alert", vazio, para anunciar a troca de página.
  await expect(
    page.getByRole("alert").filter({
      hasText:
        "Este e-mail ainda não foi convidado. Entre com o Google para pedir acesso ao professor.",
    }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
