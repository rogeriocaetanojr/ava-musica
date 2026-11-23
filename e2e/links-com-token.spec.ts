import { type APIRequestContext, expect, test } from "@playwright/test";
import { gerarCodigoDeConvite, hashDoConvite } from "../src/lib/convites";
import {
  gerarTokenDeAceite,
  hashDoTokenDeAceite,
} from "../src/app/aceite/validacao";
import { clienteAdmin, entrar, SENHA_DE_TESTE } from "./apoio";

// Rotas públicas que valem por um link (convite, aceite do responsável e
// nova senha): o link vencido é recusado e dois envios seguidos do mesmo
// formulário valem uma vez só. O link já usado e o vencido do aceite ficam em
// convite.spec.ts, aceite.spec.ts e senha.spec.ts.

const admin = clienteAdmin();

// Aluno cadastrado pelo professor, direto no Auth local.
async function criarAluno(
  prefixo: string,
  projeto: string,
  menorDe12 = false,
): Promise<{ id: string; email: string }> {
  const email = `${prefixo}-${projeto}-${Date.now()}@teste.local`;
  const nascimento = menorDe12 ? "2018-01-01" : "1995-01-01";
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      nome: `Aluno ${prefixo}`,
      data_nascimento: nascimento,
      menor_de_12: menorDe12,
    },
    app_metadata: { origem: "professor" },
  });
  if (error) throw error;
  return { id: data.user.id, email };
}

// Envia o mesmo formulário duas vezes ao mesmo tempo, como um clique duplo, e
// devolve para onde cada envio mandou (sem seguir o redirecionamento).
async function enviarDuasVezes(
  request: APIRequestContext,
  caminho: string,
  campos: Record<string, string>,
  origem: string,
): Promise<string[]> {
  const enviar = () =>
    request.post(caminho, {
      form: campos,
      headers: { origin: origem },
      maxRedirects: 0,
    });
  const respostas = await Promise.all([enviar(), enviar()]);
  return respostas.map((r) => {
    expect(r.status()).toBe(303);
    return (
      new URL(r.headers().location, origem).pathname +
      new URL(r.headers().location, origem).search
    );
  });
}

test("convite: o link vencido é recusado e dois envios seguidos usam o link uma vez só", async ({
  page,
  baseURL,
}, testInfo) => {
  const aluno = await criarAluno("convite-token", testInfo.project.name);
  try {
    // Vencido: a página avisa e o envio da senha não grava nada.
    const vencido = gerarCodigoDeConvite();
    await admin.from("convites").insert({
      aluno_id: aluno.id,
      codigo_hash: hashDoConvite(vencido),
      expira_em: new Date(Date.now() - 60_000).toISOString(),
    });
    await page.goto(`/convite/${vencido}`);
    await expect(
      page.getByRole("heading", { name: "Convite vencido" }),
    ).toBeVisible();
    const [destino] = await enviarDuasVezes(
      page.request,
      `/convite/${vencido}/definir`,
      { senha: SENHA_DE_TESTE },
      baseURL!,
    );
    expect(destino).toBe(`/convite/${vencido}`);
    const { data: semUso } = await admin
      .from("convites")
      .select("usado_em")
      .eq("aluno_id", aluno.id)
      .single();
    expect(semUso!.usado_em).toBeNull();

    // Válido: dos dois envios, só um passa; o outro volta para a página do
    // convite, que agora diz que ele já foi usado.
    const valido = gerarCodigoDeConvite();
    await admin
      .from("convites")
      .update({
        codigo_hash: hashDoConvite(valido),
        expira_em: new Date(Date.now() + 60 * 60_000).toISOString(),
      })
      .eq("aluno_id", aluno.id);
    const destinos = await enviarDuasVezes(
      page.request,
      `/convite/${valido}/definir`,
      { senha: SENHA_DE_TESTE },
      baseURL!,
    );
    const devolvidos = destinos.filter((d) => d === `/convite/${valido}`);
    expect(devolvidos, destinos.join(" | ")).toHaveLength(1);
    await page.goto(`/convite/${valido}`);
    await expect(
      page.getByRole("heading", { name: "Convite já usado" }),
    ).toBeVisible();
  } finally {
    await admin.auth.admin.deleteUser(aluno.id);
  }
});

test("aceite do responsável: dois envios seguidos gravam o aceite uma vez só", async ({
  page,
  baseURL,
}, testInfo) => {
  const aluno = await criarAluno("aceite-token", testInfo.project.name, true);
  try {
    const token = gerarTokenDeAceite();
    const { error } = await admin.from("responsaveis").upsert({
      aluno_id: aluno.id,
      nome: "Responsável",
      email: `resp-${aluno.email}`,
      token_hash: hashDoTokenDeAceite(token),
      expira_em: new Date(Date.now() + 60 * 60_000).toISOString(),
    });
    if (error) throw error;

    const destinos = await enviarDuasVezes(
      page.request,
      `/aceite/${token}/autorizar`,
      { autorizo: "sim" },
      baseURL!,
    );
    expect(destinos.sort(), destinos.join(" | ")).toEqual(
      [`/aceite/${token}`, "/aceite/concluido"].sort(),
    );
    await page.goto(`/aceite/${token}`);
    await expect(
      page.getByRole("heading", { name: "Link já usado" }),
    ).toBeVisible();
  } finally {
    await admin.auth.admin.deleteUser(aluno.id);
  }
});

test("nova senha: link inválido ou com a janela vencida é recusado e o envio duplo grava a senha escolhida e encerra o link", async ({
  page,
  baseURL,
}, testInfo) => {
  const aluno = await criarAluno("senha-token", testInfo.project.name);
  const linkDeSenha = async () => {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: aluno.email,
    });
    if (error) throw error;
    return `/auth/callback?token_hash=${data.properties.hashed_token}&type=recovery`;
  };
  try {
    // Link adulterado ou vencido no Auth.
    await page.goto(
      "/auth/callback?token_hash=0000000000000000000000000000000000000000000000000000000a&type=recovery",
    );
    await expect(page).toHaveURL(/\/login\?erro=link-senha-vencido$/);

    // Link aberto, mas a janela de 15 minutos da tela passou (o cookie que
    // marca a vinda pelo link venceu): salvar é recusado.
    await page.goto(await linkDeSenha());
    await expect(page).toHaveURL(/\/nova-senha$/);
    await page.context().clearCookies({ name: "nova-senha" });
    const [semJanela] = await enviarDuasVezes(
      page.request,
      "/nova-senha/salvar",
      { senha: "senha-nova-31", confirmacao: "senha-nova-31" },
      baseURL!,
    );
    expect(semJanela).toBe("/login?erro=link-senha-vencido");

    // Link novo e dois envios seguidos: os dois gravam a mesma senha (a rota
    // não barra o segundo enquanto a sessão do link ainda vale, o que não
    // abre brecha: a senha é a escolhida e a sessão termina). Depois, o link
    // não vale mais e só a senha nova entra.
    await page.context().clearCookies();
    const link = await linkDeSenha();
    await page.goto(link);
    await expect(page).toHaveURL(/\/nova-senha$/);
    const destinos = await enviarDuasVezes(
      page.request,
      "/nova-senha/salvar",
      { senha: "senha-nova-32", confirmacao: "senha-nova-32" },
      baseURL!,
    );
    expect(destinos, destinos.join(" | ")).toContain(
      "/login?erro=senha-alterada",
    );
    for (const destino of destinos)
      expect([
        "/login?erro=senha-alterada",
        "/login?erro=link-senha-vencido",
        "/nova-senha?erro=igual",
      ]).toContain(destino);
    await page.goto("/cursos");
    await expect(page).toHaveURL(/\/login$/);
    await page.goto(link);
    await expect(page).toHaveURL(/\/login\?erro=link-senha-vencido$/);
    await entrar(page, aluno.email, "senha-nova-32");
    await expect(page).toHaveURL(/\/cursos$/);
  } finally {
    await admin.auth.admin.deleteUser(aluno.id);
  }
});
