import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import {
  ALUNO,
  clienteAdmin,
  entrar,
  esconderSeloDoNext,
  PROFESSOR,
} from "./apoio";

// Acessibilidade automática (axe-core, regras WCAG 2.1 A e AA) nas telas
// principais, no computador e no celular, e title em todo iframe (o vídeo
// do YouTube, a prova do Google Forms e, se ligado, o captcha da Cloudflare).

const admin = clienteAdmin();
const REGRAS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function conferir(page: Page, caminho: string) {
  await page.goto(caminho);
  await page.waitForLoadState("load");
  await expect(page.locator("main").first()).toBeVisible();

  const { violations } = await new AxeBuilder({ page })
    .withTags(REGRAS)
    // O selo de desenvolvimento do Next não é parte do site.
    .exclude("nextjs-portal")
    // O conteúdo dos iframes de terceiros (YouTube, Google Forms e, com o
    // captcha ligado, Cloudflare) não é do site; o title deles é conferido logo abaixo.
    .exclude("iframe")
    .analyze();
  const resumo = violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(" "))
        .join("\n    ")}`,
  );
  expect(resumo, `${caminho}\n${resumo.join("\n")}`).toEqual([]);

  // Todo iframe com um título que diga o que ele é.
  for (const iframe of await page.locator("iframe").all()) {
    const titulo = (await iframe.getAttribute("title"))?.trim();
    expect(
      titulo,
      `iframe sem title em ${caminho}: ${await iframe.getAttribute("src")}`,
    ).toBeTruthy();
  }
}

// Ids do curso do seed e da primeira aula dele (vídeo, texto e prova).
async function cursoDoSeed() {
  const { data, error } = await admin
    .from("cursos")
    .select("id, modulos (ordem, aulas (id, ordem))")
    .eq("titulo", "Violão para iniciantes")
    .single();
  if (error) throw error;
  const modulo = [...data.modulos].sort((a, b) => a.ordem - b.ordem)[0];
  const aula = [...modulo.aulas].sort((a, b) => a.ordem - b.ordem)[0];
  return { curso: data.id, aula: aula.id };
}

test.beforeEach(async ({ page }) => {
  await esconderSeloDoNext(page);
});

test("telas públicas sem problemas de acessibilidade", async ({ page }) => {
  for (const caminho of [
    "/login",
    "/criar-conta",
    "/esqueci-senha",
    "/privacidade",
    "/termos",
  ])
    await conferir(page, caminho);
});

test("telas do aluno sem problemas de acessibilidade", async ({ page }) => {
  const { curso, aula } = await cursoDoSeed();
  await entrar(page, ALUNO);
  for (const caminho of [
    "/cursos",
    `/cursos/${curso}`,
    `/aulas/${aula}`,
    "/perfil",
  ])
    await conferir(page, caminho);
});

test("telas do professor sem problemas de acessibilidade", async ({ page }) => {
  const { curso, aula } = await cursoDoSeed();
  await entrar(page, PROFESSOR);
  for (const caminho of [
    "/professor",
    "/professor/cursos",
    `/professor/cursos/${curso}`,
    `/professor/aulas/${aula}`,
    "/professor/alunos",
    "/professor/avisos",
  ])
    await conferir(page, caminho);
});
