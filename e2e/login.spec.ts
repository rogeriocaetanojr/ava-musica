import { expect, test } from "@playwright/test";
import {
  ALUNO,
  apagarEmailsDe,
  AVISO_DE_ENVIO,
  digitarCodigo,
  entrar,
  NOME_DO_ALUNO,
  pedirCodigo,
} from "./apoio";

test("aluno convidado entra com o código do e-mail", async ({ page }) => {
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
    page.getByRole("button", { name: "Entrar", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Entrar com Google" }),
  ).toBeVisible();
});

test("código errado mostra o erro e dá para usar outro e-mail", async ({
  page,
}) => {
  await apagarEmailsDe(ALUNO);
  await pedirCodigo(page, ALUNO);
  await expect(
    page.getByRole("heading", { name: "Digite o código" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText(AVISO_DE_ENVIO);
  await expect(
    page.getByRole("button", { name: "Reenviar código" }),
  ).toBeVisible();

  await digitarCodigo(page, "000000");
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "O código está errado ou expirou" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByRole("button", { name: "Usar outro e-mail" }).click();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Código")).toHaveCount(0);
});

test("a sessão não fica salva e termina depois de 2 horas sem uso", async ({
  page,
}) => {
  await entrar(page, ALUNO);
  await expect(page).toHaveURL(/\/cursos$/);

  // Cookies de sessão: sem data de validade (expires -1 no Playwright).
  const cookies = (await page.context().cookies()).filter(
    ({ name }) => name.startsWith("sb-") || name === "ultimo-uso",
  );
  expect(cookies.some(({ name }) => name === "ultimo-uso")).toBe(true);
  expect(cookies.some(({ name }) => name.startsWith("sb-"))).toBe(true);
  for (const cookie of cookies) expect(cookie.expires, cookie.name).toBe(-1);

  // Último uso há mais de 2 horas.
  const ultimoUso = cookies.find(({ name }) => name === "ultimo-uso")!;
  await page
    .context()
    .addCookies([
      { ...ultimoUso, value: String(Date.now() - 2 * 60 * 60 * 1000 - 60_000) },
    ]);
  await page.goto("/cursos");
  await expect(page).toHaveURL(/\/login\?erro=sessao-expirada$/);
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Sua sessão terminou depois de 2 horas sem uso" }),
  ).toBeVisible();

  await page.goto("/cursos");
  await expect(page).toHaveURL(/\/login$/);
});
