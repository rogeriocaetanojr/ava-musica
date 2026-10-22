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

// Espera o e-mail chegar e devolve o link de acesso que ele traz.
async function linkDoEmail(email: string): Promise<string> {
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

// Entra pelo link mágico, como o aluno e o professor fazem.
export async function entrar(page: Page, email: string): Promise<void> {
  // Apaga e-mails antigos para não abrir um link já usado.
  await chamarCaixa(buscaPorDestinatario(email), "DELETE");

  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Enviar link de acesso" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Enviamos um link de acesso",
  );

  await page.goto(await linkDoEmail(email));
}
