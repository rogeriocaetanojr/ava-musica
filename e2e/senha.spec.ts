import { expect, type Page, test } from "@playwright/test";
import {
  ALUNO,
  apagarEmailsDe,
  contarEmails,
  criarContaSemNome,
  definirSenha,
  entrar,
  esperarCaptcha,
  linkDoEmail,
  PROFESSOR,
  SENHA_DE_TESTE,
  tentarEntrar,
} from "./apoio";

const AVISO_DO_LINK = "Se houver uma conta com este e-mail";
const ASSUNTO = "Crie uma senha nova";

// Preenche e envia Esqueci minha senha, sem esperar o resultado.
async function pedirSenhaNova(page: Page, email: string): Promise<void> {
  await page.goto("/esqueci-senha");
  await page.getByLabel("E-mail").fill(email);
  await esperarCaptcha(page);
  await page.getByRole("button", { name: "Enviar link" }).click();
}

function alerta(page: Page, texto: string) {
  // Filtra pelo texto: o Next também põe na página um role="alert" vazio.
  return page.getByRole("alert").filter({ hasText: texto });
}

test("esqueci minha senha: pedir o link, criar a senha nova e entrar com ela", async ({
  page,
}, testInfo) => {
  const projeto = testInfo.project.name;
  const email = `senha-${projeto}-${Date.now()}@teste.local`;
  const semConta = `ninguem-${projeto}-${Date.now()}@teste.local`;
  const antiga = "senha-antiga-1";
  const nova = "senha-nova-22";
  await criarContaSemNome(email, antiga);
  await apagarEmailsDe(email);

  // O link de Entrar leva à tela.
  await page.goto("/login");
  await page.getByRole("link", { name: "Esqueci minha senha" }).click();
  await expect(
    page.getByRole("heading", { name: "Esqueci minha senha" }),
  ).toBeVisible();

  // E-mail sem conta: o mesmo aviso, e nenhum e-mail sai.
  await pedirSenhaNova(page, semConta);
  const aviso = page.getByRole("status").filter({ hasText: AVISO_DO_LINK });
  await expect(aviso).toBeVisible();
  const textoSemConta = await aviso.textContent();

  await pedirSenhaNova(page, email);
  await expect(aviso).toBeVisible();
  expect(await aviso.textContent()).toBe(textoSemConta);

  const link = await linkDoEmail(email, "/auth/callback");
  expect(link).toContain("type=recovery");
  expect(await contarEmails(semConta, ASSUNTO, "senha")).toBe(0);

  // Sem abrir o link, a tela da senha nova não abre.
  await page.goto("/nova-senha");
  await expect(page).toHaveURL(/\/login/);

  // O link abre a tela da senha nova.
  await page.goto(link);
  await expect(page).toHaveURL(/\/nova-senha$/);
  await expect(page.getByRole("heading", { name: "Nova senha" })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
  const campoNova = page.getByLabel("Senha nova", { exact: true });
  const campoRepetida = page.getByLabel("Repita a senha nova");
  const salvar = page.getByRole("button", { name: "Salvar senha nova" });

  // Senha curta e confirmação diferente não passam.
  await campoNova.fill("1234567");
  await campoRepetida.fill("1234567");
  await salvar.click();
  await expect(alerta(page, "pelo menos 8 caracteres")).toBeVisible();
  await campoNova.fill(nova);
  await campoRepetida.fill(`${nova}x`);
  await salvar.click();
  await expect(alerta(page, "não são iguais")).toBeVisible();
  await expect(page).toHaveURL(/\/nova-senha$/);

  // Salvar leva à tela de entrar, com o aviso, e encerra a sessão.
  await campoRepetida.fill(nova);
  await salvar.click();
  await expect(page).toHaveURL(/\/login\?erro=senha-alterada$/);
  await expect(alerta(page, "Senha alterada.")).toBeVisible();
  await page.goto("/cursos");
  await expect(page).toHaveURL(/\/login$/);

  // O link vale uma vez só.
  await page.goto(link);
  await expect(page).toHaveURL(/\/login\?erro=link-senha-vencido$/);
  await expect(
    alerta(page, "O link para criar uma senha nova venceu"),
  ).toBeVisible();

  // A senha antiga não entra mais; a nova entra (a conta do teste não tem
  // nome, então cai na tela do nome).
  await tentarEntrar(page, email, antiga);
  await expect(alerta(page, "E-mail ou senha incorretos.")).toBeVisible();
  await entrar(page, email, nova);
  await expect(page).toHaveURL(/\/seu-nome$/);
});

test("trocar a senha no perfil pede a senha atual", async ({ page }) => {
  const nova = "senha-do-perfil-9";
  try {
    await entrar(page, ALUNO);
    await page.goto("/perfil");
    await expect(
      page.getByRole("heading", { name: "Trocar senha" }),
    ).toBeVisible();
    const atual = page.getByLabel("Senha atual");
    const campoNova = page.getByLabel("Senha nova", { exact: true });
    const campoRepetida = page.getByLabel("Repita a senha nova");
    const trocar = page.getByRole("button", { name: "Trocar senha" });

    // Confirmação diferente: nem chega a conferir a senha atual.
    await atual.fill(SENHA_DE_TESTE);
    await campoNova.fill(nova);
    await campoRepetida.fill(`${nova}x`);
    await trocar.click();
    await expect(alerta(page, "não são iguais")).toBeVisible();

    // Senha atual errada não troca.
    await atual.fill("senha-errada-123");
    await campoRepetida.fill(nova);
    await esperarCaptcha(page);
    await trocar.click();
    await expect(alerta(page, "A senha atual não confere.")).toBeVisible();

    // Com a senha atual certa, troca e continua logado.
    await atual.fill(SENHA_DE_TESTE);
    await esperarCaptcha(page);
    await trocar.click();
    await expect(
      page.getByRole("status").filter({ hasText: "Senha alterada." }),
    ).toBeVisible();
    await expect(atual).toHaveValue("");
    await page.goto("/cursos");
    await expect(page).toHaveURL(/\/cursos$/);

    // Depois de sair, só a senha nova entra.
    await page.context().clearCookies();
    await tentarEntrar(page, ALUNO, SENHA_DE_TESTE);
    await expect(alerta(page, "E-mail ou senha incorretos.")).toBeVisible();
    await entrar(page, ALUNO, nova);
    await expect(page).toHaveURL(/\/cursos$/);
  } finally {
    // Os outros testes entram com a senha de teste.
    await definirSenha(ALUNO, SENHA_DE_TESTE);
  }
});

test("o avatar do professor abre o perfil, com Trocar senha", async ({
  page,
}) => {
  await entrar(page, PROFESSOR);
  await page.getByRole("link", { name: /^Perfil: conectado como/ }).click();
  await expect(page).toHaveURL(/\/professor\/perfil$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Perfil" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Trocar senha" }),
  ).toBeVisible();
  await expect(page.getByLabel("Senha atual")).toHaveAttribute(
    "autocomplete",
    "current-password",
  );
});
