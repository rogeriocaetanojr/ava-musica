import { execSync } from "node:child_process";
import { expect, type Page } from "@playwright/test";

// Caixa de e-mail de teste do Supabase local (Mailpit).
const CAIXA_DE_EMAIL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

export const PROFESSOR = "professor@teste.local";
export const ALUNO = "aluno@teste.local";
export const NOME_DO_ALUNO = "Ana Souza";

async function chamarCaixa(caminho: string, metodo = "GET"): Promise<Response> {
  const resposta = await fetch(`${CAIXA_DE_EMAIL}/api/v1${caminho}`, {
    method: metodo,
  });
  if (!resposta.ok) {
    throw new Error(
      `Caixa de e-mail respondeu ${resposta.status} em ${caminho}`,
    );
  }
  return resposta;
}

export async function limparCaixaDeEmail(): Promise<void> {
  await chamarCaixa("/messages", "DELETE");
}

function buscaPorDestinatario(email: string): string {
  return `/search?query=${encodeURIComponent(`to:"${email}"`)}`;
}

// Quantos e-mails chegaram para o endereço com o assunto e o termo no texto.
export async function contarEmails(
  email: string,
  assunto: string,
  termo: string,
): Promise<number> {
  const busca = `/search?query=${encodeURIComponent(`to:"${email}" subject:"${assunto}" "${termo}"`)}`;
  const resposta = await chamarCaixa(busca);
  const { messages } = (await resposta.json()) as { messages: unknown[] };
  return messages.length;
}

// Espera o e-mail chegar e devolve o primeiro link do site que ele traz
// (confirmação de Criar conta ou convite), já apontando para o site dos
// testes.
export async function linkDoEmail(
  email: string,
  caminho: "/auth/confirmar" | "/convite/",
): Promise<string> {
  let id: string | undefined;
  await expect
    .poll(
      async () => {
        const resposta = await chamarCaixa(buscaPorDestinatario(email));
        const { messages } = (await resposta.json()) as {
          messages: { ID: string }[];
        };
        id = messages[0]?.ID;
        return id;
      },
      { message: `o e-mail para ${email} não chegou`, timeout: 20_000 },
    )
    .toBeTruthy();

  const resposta = await chamarCaixa(`/message/${id}`);
  const { Text, HTML } = (await resposta.json()) as {
    Text: string;
    HTML: string;
  };
  const texto = `${Text}\n${HTML}`.replaceAll("&amp;", "&");
  const achado = texto.match(
    new RegExp(`https?://[^\\s"'<>]*${caminho}[^\\s"'<>]*`),
  )?.[0];
  if (!achado) throw new Error(`Link ${caminho} não encontrado no e-mail`);
  const url = new URL(achado);
  return `${url.pathname}${url.search}`;
}

export async function apagarEmailsDe(email: string): Promise<void> {
  await chamarCaixa(buscaPorDestinatario(email), "DELETE");
}

// Senha do professor e do aluno de teste (scripts/seed-dev.ts).
export const SENHA_DE_TESTE = "senha-local-123";

// O captcha usa a chave de teste da Cloudflare, que aprova sozinha; o botão
// só é clicado depois que o token chega.
export async function esperarCaptcha(page: Page): Promise<void> {
  await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue(
    /.+/,
  );
}

// Preenche e envia a tela de login, sem esperar o resultado.
export async function tentarEntrar(
  page: Page,
  email: string,
  senha: string,
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(senha);
  await esperarCaptcha(page);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

// Preenche e envia Criar conta, sem esperar o resultado.
export async function criarConta(
  page: Page,
  dados: { nome: string; email: string; senha: string },
): Promise<void> {
  await page.goto("/criar-conta");
  await page.getByLabel("Nome completo").fill(dados.nome);
  await page.getByLabel("E-mail").fill(dados.email);
  await page.getByLabel("Senha", { exact: true }).fill(dados.senha);
  await esperarCaptcha(page);
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
}

export const AVISO_DE_CONFIRMACAO = "Enviamos um link de confirmação";

// Cria a conta e abre o link de confirmação que chegou por e-mail.
export async function criarEConfirmarConta(
  page: Page,
  dados: { nome: string; email: string; senha: string },
): Promise<void> {
  await apagarEmailsDe(dados.email);
  await criarConta(page, dados);
  await expect(page.getByRole("status")).toContainText(AVISO_DE_CONFIRMACAO);
  await page.goto(await linkDoEmail(dados.email, "/auth/confirmar"));
}

// Conta pendente sem nome, como a de quem entra pelo Google sem nome: criada
// direto no Auth local com a chave de serviço, que o Supabase local informa.
export async function criarContaSemNome(
  email: string,
  senha: string,
): Promise<void> {
  const ambiente = Object.fromEntries(
    execSync("npx supabase status -o env", { encoding: "utf8" })
      .split(/\r?\n/)
      .map((linha) => linha.match(/^(\w+)="?(.*?)"?$/))
      .filter((achado) => achado !== null)
      .map((achado) => [achado[1], achado[2]]),
  );
  const resposta = await fetch(`${ambiente.API_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: ambiente.SERVICE_ROLE_KEY,
      Authorization: `Bearer ${ambiente.SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password: senha, email_confirm: true }),
  });
  if (!resposta.ok)
    throw new Error(`Auth local respondeu ${resposta.status} ao criar conta`);
}

// Quem entra sem nome cai na tela "Como você se chama?" e informa o nome.
export async function informarNome(page: Page, nome: string): Promise<void> {
  await expect(page).toHaveURL(/\/seu-nome$/);
  await page.getByLabel("Nome completo").fill(nome);
  await page.getByRole("button", { name: "Continuar" }).click();
}

// Entra com e-mail e senha, como o aluno e o professor fazem.
export async function entrar(
  page: Page,
  email: string,
  senha = SENHA_DE_TESTE,
): Promise<void> {
  await tentarEntrar(page, email, senha);
  await expect(page).not.toHaveURL(/\/login/);
}
