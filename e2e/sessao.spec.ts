import { type BrowserContext, expect, test } from "@playwright/test";
import {
  clienteAdmin,
  entrar,
  PROFESSOR,
  SENHA_DE_TESTE,
  tentarEntrar,
} from "./apoio";
import { MENSAGEM_BLOQUEADO } from "../src/app/login/mensagens";

// P1: o proxy confere a sessão com getClaims() (validação local do JWT), sem
// ir ao Supabase Auth a cada página. O bloqueio continua valendo: na hora,
// pelo banco (perfil bloqueado → /bloqueado), e na renovação da sessão, pelo
// ban do Auth (cookies apagados e aviso no login).

const admin = clienteAdmin();

async function cookiesDoSupabase(contexto: BrowserContext) {
  return (await contexto.cookies())
    .map(({ name }) => name)
    .filter((nome) => nome.startsWith("sb-"));
}

// Faz a sessão do navegador parecer vencida, para o próximo pedido renová-la
// com o refresh token (o cookie do Supabase guarda a sessão em JSON, em base64,
// às vezes dividida em pedaços .0, .1...).
async function vencerSessao(contexto: BrowserContext): Promise<void> {
  const cookies = (await contexto.cookies()).filter(({ name }) =>
    /^sb-.*-auth-token(\.\d+)?$/.test(name),
  );
  expect(cookies.length).toBeGreaterThan(0);
  const pedaco = (nome: string) => Number(nome.match(/\.(\d+)$/)?.[1] ?? 0);
  cookies.sort((a, b) => pedaco(a.name) - pedaco(b.name));
  const base = cookies[0].name.replace(/\.\d+$/, "");
  const valor = cookies.map((c) => c.value).join("");
  const json = Buffer.from(valor.replace(/^base64-/, ""), "base64url").toString(
    "utf8",
  );
  const sessao = JSON.parse(json) as { expires_at: number };
  sessao.expires_at = Math.floor(Date.now() / 1000) - 60;
  const novo = `base64-${Buffer.from(JSON.stringify(sessao)).toString("base64url")}`;
  await contexto.clearCookies({ name: /^sb-.*-auth-token/ });
  await contexto.addCookies([{ ...cookies[0], name: base, value: novo }]);
}

test("aluno bloqueado com a sessão aberta perde o acesso na hora e, na renovação, volta ao login com o aviso", async ({
  page,
  browser,
}, testInfo) => {
  const email = `bloqueio-${testInfo.project.name}-${Date.now()}@teste.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: SENHA_DE_TESTE,
    email_confirm: true,
    user_metadata: {
      nome: "Aluno Bloqueável",
      data_nascimento: "1990-01-01",
      menor_de_12: false,
    },
    app_metadata: { origem: "professor" },
  });
  if (error) throw error;
  const alunoId = data.user.id;

  try {
    // Duas sessões do aluno: uma segue com o JWT válido, a outra vai precisar
    // de renovação.
    await entrar(page, email);
    await expect(page).toHaveURL(/\/cursos$/);
    const outro = await browser.newContext(testInfo.project.use);
    const outraTela = await outro.newPage();
    await entrar(outraTela, email);

    // O professor bloqueia em outro navegador.
    const professor = await browser.newContext(testInfo.project.use);
    const telaDoProfessor = await professor.newPage();
    await entrar(telaDoProfessor, PROFESSOR);
    await telaDoProfessor.goto(`/professor/alunos/${alunoId}`);
    // Bloquear fica no menu "⋯" da ficha.
    await telaDoProfessor.getByRole("button", { name: "Mais ações" }).click();
    await telaDoProfessor
      .getByRole("button", { name: "Bloquear acesso" })
      .click();
    await telaDoProfessor
      .getByRole("button", { name: "Confirmar: bloquear acesso" })
      .click();
    await expect(telaDoProfessor.getByText("Acesso bloqueado.")).toBeVisible();
    await professor.close();

    // Com o JWT ainda válido, o proxy deixa passar, mas a página pergunta ao
    // Auth (getUser), que recusa: login com o aviso e cookies apagados.
    await page.goto("/cursos");
    await expect(page).toHaveURL(/\/login\?erro=bloqueado$/);
    await expect(page.getByText(MENSAGEM_BLOQUEADO)).toBeVisible();
    expect(await cookiesDoSupabase(page.context())).toEqual([]);

    // Na renovação da sessão, o Auth recusa no próprio proxy: mesmo resultado.
    await vencerSessao(outro);
    await outraTela.goto("/cursos");
    await expect(outraTela).toHaveURL(/\/login\?erro=bloqueado$/);
    await expect(outraTela.getByText(MENSAGEM_BLOQUEADO)).toBeVisible();
    expect(await cookiesDoSupabase(outro)).toEqual([]);
    await outro.close();

    // Um login novo também é recusado.
    await tentarEntrar(page, email, SENHA_DE_TESTE);
    await expect(page.getByText(MENSAGEM_BLOQUEADO)).toBeVisible();
  } finally {
    await admin.auth.admin.deleteUser(alunoId);
  }
});

test("sessão vencida e ainda válida é renovada pelo proxy sem sair da página", async ({
  page,
}) => {
  await entrar(page, "aluno@teste.local");
  await expect(page).toHaveURL(/\/cursos$/);
  await vencerSessao(page.context());
  await page.goto("/perfil");
  await expect(page).toHaveURL(/\/perfil$/);
  // O cookie foi regravado com uma sessão nova, que vence no futuro.
  await page.goto("/cursos");
  await expect(page).toHaveURL(/\/cursos$/);
});
