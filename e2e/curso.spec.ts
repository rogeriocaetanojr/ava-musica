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
  // O formulário abre no painel do botão "Novo curso".
  await page.getByRole("button", { name: "Novo curso" }).click();
  await page.getByLabel("Título").fill(curso);
  await page.getByLabel("Instrumento").fill("Violão");
  await page.getByLabel("Nível").selectOption("Iniciante");
  await page.getByRole("button", { name: "Criar curso" }).click();
  await expect(page.getByRole("heading", { name: curso })).toBeVisible();

  // Sem módulos, o estado vazio abre o painel do primeiro módulo.
  await page.getByRole("button", { name: "Criar primeiro módulo" }).click();
  const novoModulo = formularioDoCampo(page, "Título do novo módulo");
  await novoModulo.getByLabel("Título do novo módulo").fill(modulo);
  await novoModulo.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByLabel("Título do módulo")).toHaveValue(modulo);

  await page
    .getByRole("button", { name: `Nova aula no módulo ${modulo}` })
    .click();
  const novaAula = formularioDoCampo(page, "Título da nova aula");
  await novaAula.getByLabel("Título da nova aula").fill(aula);
  await novaAula.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByLabel("Título da aula")).toHaveValue(aula);

  await page.getByRole("link", { name: "Conteúdo" }).click();
  await expect(page.getByRole("heading", { name: aula })).toBeVisible();

  // O bloco é escolhido e preenchido no painel lateral.
  const novoBloco = page.getByRole("dialog", { name: "Adicionar bloco" });
  await page.getByRole("button", { name: "Adicionar primeiro bloco" }).click();
  await novoBloco.getByRole("radio", { name: "Texto" }).check({ force: true });
  await novoBloco
    .getByRole("textbox", { name: "Texto", exact: true })
    .fill(TEXTO_DA_AULA);
  await novoBloco.getByRole("button", { name: "Adicionar bloco" }).click();
  await expect(page.getByText("Rascunho · 1 bloco")).toBeVisible();

  await page.getByRole("button", { name: "Adicionar bloco" }).click();
  await novoBloco
    .getByRole("radio", { name: "Vídeo do YouTube" })
    .check({ force: true });
  await novoBloco.getByLabel("Título (opcional)").fill("Vídeo da postura");
  await novoBloco.getByRole("textbox", { name: /^Link/ }).fill(VIDEO);
  await novoBloco.getByRole("button", { name: "Adicionar bloco" }).click();
  await expect(page.getByText("Rascunho · 2 blocos")).toBeVisible();

  await page.getByRole("link", { name: "Voltar ao curso" }).click();
  // No build de produção, a tela da aula continua no DOM depois de voltar
  // (com o botão Publicar dela): vale o botão da linha da aula no curso.
  await page
    .getByRole("listitem")
    .filter({ has: page.getByLabel("Título da aula") })
    .getByRole("button", { name: "Publicar", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Despublicar" })).toBeVisible();

  // O curso é publicado pelo botão do cabeçalho.
  // O selo da lista de cursos também diz "Publicado": vale o do cabeçalho.
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(
    page.getByRole("main").getByText("Publicado", { exact: true }),
  ).toBeVisible();

  // Matricula o aluno de teste no curso novo.
  await page.goto("/professor/alunos");
  await page.getByRole("link", { name: new RegExp(NOME_DO_ALUNO) }).click();
  // Os cursos disponíveis ficam no painel "Matricular em curso".
  await page.getByRole("button", { name: "Matricular em curso" }).click();
  await page
    .getByRole("dialog", { name: "Matricular em curso" })
    .getByRole("listitem")
    .filter({ hasText: curso })
    .getByRole("button", { name: "Matricular" })
    .click();
  const linhaDoCurso = page.getByRole("listitem").filter({ hasText: curso });
  await expect(
    linhaDoCurso.getByRole("button", { name: "Desmatricular" }),
  ).toBeVisible();
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
  await expect(
    page.getByRole("button", { name: /Aula concluída/ }),
  ).toBeVisible();

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
