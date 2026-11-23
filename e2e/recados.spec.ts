import { expect, type Page, test } from "@playwright/test";
import {
  ALUNO,
  clienteAdmin,
  entrar,
  esconderSeloDoNext,
  PROFESSOR,
} from "./apoio";

// Recados: o professor publica um recado para todos e outro só para um curso
// em que o aluno não está; o aluno vê só o primeiro. O professor edita e
// apaga, e o aluno deixa de ver.

const admin = clienteAdmin();

async function publicar(
  page: Page,
  titulo: string,
  texto: string,
  paraQuem: string,
) {
  await page.getByRole("button", { name: "Novo recado" }).click();
  const painel = page.getByRole("dialog");
  await painel.getByLabel("Título").fill(titulo);
  await painel.getByLabel("Mensagem").fill(texto);
  await painel.getByLabel("Para quem").selectOption({ label: paraQuem });
  await painel.getByRole("button", { name: "Publicar recado" }).click();
  await expect(
    page.getByRole("heading", { name: titulo, level: 3 }),
  ).toBeVisible();
}

// O sino do cabeçalho abre o painel de recados do aluno.
async function recadosDoAluno(page: Page) {
  await page.goto("/cursos");
  await page
    .getByRole("banner")
    .getByRole("button", { name: "Avisos" })
    .click();
  const painel = page.locator("#painel-de-recados");
  await expect(painel).toBeVisible();
  return painel;
}

test("recado para todos chega ao aluno, o de outro curso não; editar e apagar valem para o aluno", async ({
  page,
  browser,
}, testInfo) => {
  const sufixo = `${testInfo.project.name}-${Date.now()}`;
  const paraTodos = `Ensaio geral ${sufixo}`;
  const editado = `Ensaio geral adiado ${sufixo}`;
  const deOutroCurso = `Só para o piano ${sufixo}`;
  const { data: curso, error } = await admin
    .from("cursos")
    .insert({
      titulo: `Piano de recados ${sufixo}`,
      instrumento: "Piano",
      publicado: true,
    })
    .select("id, titulo")
    .single();
  if (error) throw error;

  try {
    await esconderSeloDoNext(page);
    await entrar(page, PROFESSOR);
    await page.goto("/professor/avisos");
    await publicar(page, paraTodos, "Sábado às 10h.", "Todos os alunos");
    await publicar(
      page,
      deOutroCurso,
      "Tragam a partitura.",
      `Alunos de ${curso.titulo}`,
    );

    const contexto = await browser.newContext(testInfo.project.use);
    const aluno = await contexto.newPage();
    await esconderSeloDoNext(aluno);
    await entrar(aluno, ALUNO);
    let painel = await recadosDoAluno(aluno);
    await expect(painel.getByText(paraTodos)).toBeVisible();
    await expect(painel.getByText(deOutroCurso)).toHaveCount(0);

    // Editar muda o que o aluno vê.
    await page.getByRole("button", { name: `Editar ${paraTodos}` }).click();
    const dialogo = page.getByRole("dialog");
    await dialogo.getByLabel("Título").fill(editado);
    await dialogo.getByRole("button", { name: "Salvar recado" }).click();
    await expect(
      page.getByRole("heading", { name: editado, level: 3 }),
    ).toBeVisible();
    painel = await recadosDoAluno(aluno);
    await expect(painel.getByText(editado)).toBeVisible();

    // Apagar (com confirmação) tira o recado do aluno.
    const cartao = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { name: editado }) });
    page.once("dialog", (d) => void d.accept());
    await cartao.getByRole("button", { name: "Apagar" }).click();
    await expect(
      page.getByRole("heading", { name: editado, level: 3 }),
    ).toHaveCount(0);
    painel = await recadosDoAluno(aluno);
    await expect(painel.getByText(editado)).toHaveCount(0);
    await contexto.close();
  } finally {
    await admin.from("avisos").delete().like("titulo", `%${sufixo}`);
    await admin.from("cursos").delete().eq("id", curso.id);
  }
});
