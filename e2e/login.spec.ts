import { expect, test } from "@playwright/test";
import {
  ALUNO,
  entrar,
  esperarCaptcha,
  NOME_DO_ALUNO,
  tentarEntrar,
} from "./apoio";

const CREDENCIAIS_INVALIDAS = "E-mail ou senha incorretos.";

test("aluno convidado entra com e-mail e senha", async ({ page }) => {
  await entrar(page, ALUNO);

  await expect(page).toHaveURL(/\/cursos$/);
  await expect(
    page.getByRole("heading", { level: 1, name: NOME_DO_ALUNO }),
  ).toBeVisible();
});

test("a tela de login oferece senha, Criar conta e Esqueci minha senha", async ({
  page,
}) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  const senha = page.getByLabel("Senha", { exact: true });
  await expect(senha).toHaveAttribute("type", "password");
  await expect(senha).toHaveAttribute("autocomplete", "current-password");
  await expect(
    page.getByRole("button", { name: "Entrar", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Entrar com Google" }),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Criar conta" })).toHaveAttribute(
    "href",
    "/criar-conta",
  );
  await expect(
    page.getByRole("link", { name: "Esqueci minha senha" }),
  ).toHaveAttribute("href", "/esqueci-senha");

  // O botão de mostrar a senha troca o tipo do campo e avisa o estado.
  await senha.fill("segredo123");
  const mostrar = page.getByRole("button", { name: "Mostrar senha" });
  await expect(mostrar).toHaveAttribute("aria-pressed", "false");
  await mostrar.click();
  await expect(senha).toHaveAttribute("type", "text");
  await expect(
    page.getByRole("button", { name: "Esconder senha" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("senha errada mostra a mesma mensagem para e-mail com ou sem conta", async ({
  page,
}) => {
  await tentarEntrar(page, ALUNO, "senha-errada-123");
  // Filtra pelo texto: o Next também põe na página um role="alert" vazio
  // (o anunciador de rota).
  const aviso = page
    .getByRole("alert")
    .filter({ hasText: CREDENCIAIS_INVALIDAS });
  await expect(aviso).toBeVisible();
  const comConta = await aviso.textContent();
  await expect(page).toHaveURL(/\/login$/);

  // Segunda tentativa passo a passo: confere que o aviso anterior sumiu antes
  // de enviar, para que o aviso esperado depois seja a resposta nova.
  await page.goto("/login");
  await expect(aviso).toHaveCount(0);
  await page.getByLabel("E-mail").fill("ninguem-tem@teste.local");
  await page.getByLabel("Senha", { exact: true }).fill("senha-errada-123");
  await esperarCaptcha(page);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(aviso).toBeVisible();
  expect(await aviso.textContent()).toBe(comConta);
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
