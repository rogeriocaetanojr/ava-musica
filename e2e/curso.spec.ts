import { expect, type Page, test } from "@playwright/test";
import { ALUNO, entrar, NOME_DO_ALUNO, PROFESSOR } from "./apoio";

// O professor monta e publica um curso, e o aluno estuda nele.
// Os testes dependem um do outro e rodam na ordem.
test.describe.configure({ mode: "serial" });

const TEXTO_DA_AULA = "Segure o violão com o braço levemente inclinado.";
const VIDEO = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

let curso: string;
let modulo: string;
let aula: string;

test.beforeAll(({}, testInfo) => {
  // Um curso por projeto (computador e celular), no mesmo banco.
  const sufixo = testInfo.project.name;
  curso = `Violão para iniciantes (${sufixo})`;
  modulo = `Primeiros passos (${sufixo})`;
  aula = `Postura (${sufixo})`;
});

function formularioDoCampo(page: Page, rotulo: string) {
  return page.locator("form").filter({ has: page.getByLabel(rotulo) });
}

test("professor cria curso, módulo e aula com texto e YouTube e publica", async ({
  page,
}) => {
  await entrar(page, PROFESSOR);
  await expect(page).toHaveURL(/\/professor$/);

  await page.getByRole("link", { name: "Cursos e aulas" }).click();
  await page.getByLabel("Título").fill(curso);
  await page.getByLabel("Instrumento").fill("Violão");
  await page.getByLabel("Nível").selectOption("Iniciante");
  await page.getByRole("button", { name: "Criar curso" }).click();
  await expect(page.getByRole("heading", { name: curso })).toBeVisible();

  const novoModulo = formularioDoCampo(page, "Novo módulo");
  await novoModulo.getByLabel("Novo módulo").fill(modulo);
  await novoModulo.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByLabel("Título do módulo")).toHaveValue(modulo);

  const novaAula = formularioDoCampo(page, "Nova aula");
  await novaAula.getByLabel("Nova aula").fill(aula);
  await novaAula.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByLabel("Título da aula")).toHaveValue(aula);

  await page.getByRole("link", { name: "Conteúdo" }).click();
  await expect(page.getByRole("heading", { name: aula })).toBeVisible();

  const novoBloco = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Novo bloco" }) });
  await novoBloco.getByLabel("Tipo").selectOption("Texto");
  await novoBloco.getByLabel("Texto", { exact: true }).fill(TEXTO_DA_AULA);
  await novoBloco.getByRole("button", { name: "Adicionar bloco" }).click();
  await expect(page.getByText("Rascunho · 1 bloco")).toBeVisible();

  await novoBloco.getByLabel("Tipo").selectOption("Vídeo do YouTube");
  await novoBloco.getByLabel("Título (opcional)").fill("Vídeo da postura");
  await novoBloco.getByRole("textbox", { name: /^Link/ }).fill(VIDEO);
  await novoBloco.getByRole("button", { name: "Adicionar bloco" }).click();
  await expect(page.getByText("Rascunho · 2 blocos")).toBeVisible();

  await page.getByRole("link", { name: "← Voltar ao curso" }).click();
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Despublicar" })).toBeVisible();

  await page.getByRole("checkbox", { name: /^Publicado/ }).check();
  await page.getByRole("button", { name: "Salvar curso" }).click();
  await expect(page.getByText("Curso salvo.")).toBeVisible();

  // Matricula o aluno de teste no curso novo.
  await page.goto("/professor/alunos");
  await page.getByRole("link", { name: new RegExp(NOME_DO_ALUNO) }).click();
  const linhaDoCurso = page.getByRole("listitem").filter({ hasText: curso });
  await linhaDoCurso.getByRole("button", { name: "Matricular" }).click();
  await expect(linhaDoCurso.getByText("Matriculado")).toBeVisible();
});

test("aluno conclui a aula e o professor vê o progresso", async ({
  page,
  browser,
}, testInfo) => {
  await entrar(page, ALUNO);
  await expect(page).toHaveURL(/\/cursos$/);

  const progressoDoAluno = page.getByRole("progressbar", {
    name: `Progresso em ${curso}`,
  });
  await expect(progressoDoAluno).toHaveAttribute("aria-valuenow", "0");

  await page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: curso }) })
    .getByRole("link")
    .click();
  await page.getByRole("link", { name: "Começar" }).click();

  await expect(page.getByRole("heading", { name: aula })).toBeVisible();
  await expect(page.getByText(TEXTO_DA_AULA)).toBeVisible();
  await expect(
    page.locator('iframe[src*="youtube-nocookie.com"]'),
  ).toBeVisible();

  await page.getByRole("button", { name: "Marcar como concluída" }).click();
  await expect(page.getByText("✓ Aula concluída")).toBeVisible();

  await page.getByRole("link", { name: `Voltar para ${curso}` }).click();
  await expect(progressoDoAluno).toHaveAttribute("aria-valuenow", "100");

  // O professor, em outro navegador, vê o progresso no painel.
  const contextoDoProfessor = await browser.newContext(testInfo.project.use);
  const professor = await contextoDoProfessor.newPage();
  await entrar(professor, PROFESSOR);
  await expect(professor).toHaveURL(/\/professor$/);
  await expect(
    professor.getByRole("progressbar", {
      name: `Progresso de ${NOME_DO_ALUNO} em ${curso}`,
    }),
  ).toHaveAttribute("aria-valuenow", "100");
  await contextoDoProfessor.close();
});
