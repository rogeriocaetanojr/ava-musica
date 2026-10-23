import { expect, type Page } from "@playwright/test";

// Caixa de e-mail de teste do Supabase local (Mailpit).
const CAIXA_DE_EMAIL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

export const PROFESSOR = "professor@teste.local";
export const ALUNO = "aluno@teste.local";
export const NOME_DO_ALUNO = "Aluno de Teste";

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

// Espera o e-mail chegar e devolve o link de acesso que ele traz.
export async function linkDoEmail(email: string): Promise<string> {
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
  const { HTML } = (await resposta.json()) as { HTML: string };
  const href = HTML.match(/href="([^"]*\/auth\/callback[^"]*)"/)?.[1];
  if (!href) throw new Error(`Link de acesso não encontrado no e-mail`);
  return href.replaceAll("&amp;", "&");
}

export async function apagarEmailsDe(email: string): Promise<void> {
  await chamarCaixa(buscaPorDestinatario(email), "DELETE");
}

// Pede o link na tela de login. O captcha usa a chave de teste da Cloudflare,
// que aprova sozinha; o botão só é clicado depois que o token chega.
export async function pedirLink(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue(
    /.+/,
  );
  await page.getByRole("button", { name: "Entrar com e-mail" }).click();
}

// Entra pelo link mágico, como o aluno e o professor fazem.
export async function entrar(page: Page, email: string): Promise<void> {
  // Apaga e-mails antigos para não abrir um link já usado.
  await apagarEmailsDe(email);

  await pedirLink(page, email);
  await expect(page.getByRole("status")).toContainText("Enviamos um link");

  await page.goto(await linkDoEmail(email));
}
