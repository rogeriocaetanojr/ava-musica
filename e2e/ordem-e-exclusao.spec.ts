import { expect, type Page, test } from "@playwright/test";
import { clienteAdmin, entrar, esconderSeloDoNext, PROFESSOR } from "./apoio";

// B3: a troca de ordem de módulos, aulas e blocos é feita pelo banco numa
// transação só; dois cliques rápidos seguidos não embaralham a lista.
// B8: o professor exclui curso, módulo e aula; a confirmação diz o que vai
// junto e a exclusão fica na auditoria.

type Ids = {
  curso: string;
  modulos: string[];
  aulas: string[];
  blocos: string[];
};

const admin = clienteAdmin();

async function obrigatorio<T>(
  consulta: PromiseLike<{ data: T; error: { message: string } | null }>,
): Promise<NonNullable<T>> {
  const { data, error } = await consulta;
  if (error || data === null) throw new Error(error?.message ?? "sem dados");
  return data as NonNullable<T>;
}

// Curso com 3 módulos (o primeiro com 3 aulas, a primeira aula com 3 blocos).
async function criarCurso(sufixo: string): Promise<Ids> {
  const curso = await obrigatorio(
    admin
      .from("cursos")
      .insert({ titulo: `Curso de ordem ${sufixo}`, instrumento: "Violão" })
      .select("id")
      .single(),
  );
  const modulos = await obrigatorio(
    admin
      .from("modulos")
      .insert(
        ["A", "B", "C"].map((letra, ordem) => ({
          curso_id: curso.id,
          titulo: `Módulo ${letra} ${sufixo}`,
          ordem,
        })),
      )
      .select("id, ordem")
      .order("ordem"),
  );
  const aulas = await obrigatorio(
    admin
      .from("aulas")
      .insert(
        ["1", "2", "3"].map((n, ordem) => ({
          modulo_id: modulos[0].id,
          titulo: `Aula ${n} ${sufixo}`,
          ordem,
        })),
      )
      .select("id, ordem")
      .order("ordem"),
  );
  const blocos = await obrigatorio(
    admin
      .from("conteudos")
      .insert(
        ["um", "dois", "três"].map((texto, ordem) => ({
          aula_id: aulas[0].id,
          tipo: "texto",
          titulo: `Bloco ${texto}`,
          texto,
          ordem,
        })),
      )
      .select("id, ordem")
      .order("ordem"),
  );
  return {
    curso: curso.id,
    modulos: modulos.map((m) => m.id),
    aulas: aulas.map((a) => a.id),
    blocos: blocos.map((b) => b.id),
  };
}

// Ids na ordem gravada no banco; a ordem precisa ser 0, 1, 2... sem repetir.
async function ordemNoBanco(
  tabela: "modulos" | "aulas" | "conteudos",
  pai: "curso_id" | "modulo_id" | "aula_id",
  id: string,
): Promise<string[]> {
  const itens = await obrigatorio(
    admin.from(tabela).select("id, ordem").eq(pai, id).order("ordem"),
  );
  expect(itens.map((i) => i.ordem)).toEqual(itens.map((_, n) => n));
  return itens.map((i) => i.id);
}

// No celular, os módulos ficam recolhidos; abre todos (repete até a página
// hidratar e o clique valer).
async function abrirModulos(page: Page, alvo: string) {
  const fechados = page.getByRole("button", {
    name: /^Módulo \d+ ·/,
    expanded: false,
  });
  await expect(async () => {
    const alvoVisivel = page.getByRole("button", { name: alvo });
    if (await alvoVisivel.isVisible()) return;
    for (const botao of await fechados.all())
      await botao.click({ timeout: 2000 }).catch(() => {});
    await expect(alvoVisivel).toBeVisible({
      timeout: 1000,
    });
  }).toPass();
}

// Dois cliques seguidos no mesmo botão, sem esperar a resposta do primeiro.
async function cliqueDuplo(page: Page, rotulo: string) {
  const botao = await page
    .getByRole("button", { name: rotulo })
    .elementHandle();
  if (!botao) throw new Error(`botão ${rotulo} não encontrado`);
  await Promise.all([botao.click(), botao.click({ delay: 0 })]);
}

test.beforeEach(async ({ page }) => {
  await esconderSeloDoNext(page);
  await entrar(page, PROFESSOR);
});

test("dois cliques rápidos em descer movem o módulo, a aula e o bloco sem embaralhar", async ({
  page,
}, testInfo) => {
  const sufixo = `${testInfo.project.name}-${Date.now()}`;
  const ids = await criarCurso(sufixo);
  const [a, b, c] = ids.modulos;

  await page.goto(`/professor/cursos/${ids.curso}`);
  await abrirModulos(page, `Descer o módulo Módulo A ${sufixo}`);
  await cliqueDuplo(page, `Descer o módulo Módulo A ${sufixo}`);
  await expect
    .poll(() => ordemNoBanco("modulos", "curso_id", ids.curso))
    .toEqual([b, c, a]);
  await expect(
    page.getByRole("button", { name: `Descer o módulo Módulo A ${sufixo}` }),
  ).toBeDisabled();

  await page.reload();
  await abrirModulos(page, `Descer a aula Aula 1 ${sufixo}`);
  const [a1, a2, a3] = ids.aulas;
  await cliqueDuplo(page, `Descer a aula Aula 1 ${sufixo}`);
  await expect
    .poll(() => ordemNoBanco("aulas", "modulo_id", ids.modulos[0]))
    .toEqual([a2, a3, a1]);
  await page
    .getByRole("button", { name: `Subir a aula Aula 3 ${sufixo}` })
    .click();
  await expect
    .poll(() => ordemNoBanco("aulas", "modulo_id", ids.modulos[0]))
    .toEqual([a3, a2, a1]);

  await page.goto(`/professor/aulas/${ids.aulas[0]}`);
  const [b1, b2, b3] = ids.blocos;
  await cliqueDuplo(page, "Descer o bloco 1, Bloco um");
  await expect
    .poll(() => ordemNoBanco("conteudos", "aula_id", ids.aulas[0]))
    .toEqual([b2, b3, b1]);
  await expect(
    page.getByRole("button", { name: /^Descer o bloco 3/ }),
  ).toBeDisabled();

  await admin.from("cursos").delete().eq("id", ids.curso);
});

test("excluir aula, módulo e curso pede confirmação com o que vai junto e grava a auditoria", async ({
  page,
}, testInfo) => {
  const sufixo = `${testInfo.project.name}-${Date.now()}`;
  const ids = await criarCurso(sufixo);

  // Um aluno matriculado com progresso na primeira aula.
  const aluno = await obrigatorio(
    admin.from("perfis").select("id").eq("email", "aluno@teste.local").single(),
  );
  await obrigatorio(
    admin
      .from("matriculas")
      .insert({ aluno_id: aluno.id, curso_id: ids.curso })
      .select(),
  );
  await obrigatorio(
    admin
      .from("progresso")
      .insert({ aluno_id: aluno.id, aula_id: ids.aulas[0] })
      .select(),
  );

  await page.goto(`/professor/cursos/${ids.curso}`);
  await abrirModulos(page, `Excluir a aula Aula 1 ${sufixo}`);

  // Cancelar a confirmação não apaga nada.
  const aula1 = `Excluir a aula Aula 1 ${sufixo}`;
  let mensagem = "";
  page.once("dialog", (d) => {
    mensagem = d.message();
    void d.dismiss();
  });
  await page.getByRole("button", { name: aula1 }).click();
  expect(mensagem).toBe(
    `Excluir a aula "Aula 1 ${sufixo}"? Vão junto: 3 blocos de conteúdo e o progresso de 1 aluno. Isso não pode ser desfeito.`,
  );
  await expect(page.getByRole("button", { name: aula1 })).toBeVisible();

  // Confirmar apaga a aula, os blocos e o progresso.
  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: aula1 }).click();
  await expect(page.getByRole("button", { name: aula1 })).toHaveCount(0);
  expect(
    (await admin.from("progresso").select("id").eq("aula_id", ids.aulas[0]))
      .data,
  ).toEqual([]);

  // Módulo A, com as 2 aulas que sobraram.
  const moduloA = `Excluir o módulo Módulo A ${sufixo}`;
  page.once("dialog", (d) => {
    mensagem = d.message();
    void d.accept();
  });
  await page.getByRole("button", { name: moduloA }).click();
  await expect(page.getByRole("button", { name: moduloA })).toHaveCount(0);
  expect(mensagem).toBe(
    `Excluir o módulo "Módulo A ${sufixo}"? Vão junto: 2 aulas. Isso não pode ser desfeito.`,
  );

  // O curso, com os 2 módulos vazios e a matrícula; volta para a lista.
  page.once("dialog", (d) => {
    mensagem = d.message();
    void d.accept();
  });
  // O Excluir curso fica no painel do Editar curso.
  await page.getByRole("button", { name: "Editar curso" }).click();
  await page.getByRole("button", { name: "Excluir curso" }).click();
  await expect(page).toHaveURL(/\/professor\/cursos$/);
  expect(mensagem).toBe(
    `Excluir o curso "Curso de ordem ${sufixo}"? Vão junto: 2 módulos e 1 matrícula. Isso não pode ser desfeito.`,
  );
  await expect(
    page.getByRole("link", { name: new RegExp(`Curso de ordem ${sufixo}`) }),
  ).toHaveCount(0);

  const { data: registros } = await admin
    .from("auditoria")
    .select("acao, item_id, item_titulo, aluno_id")
    .in("item_id", [ids.curso, ids.modulos[0], ids.aulas[0]])
    .order("id");
  expect(registros).toEqual([
    {
      acao: "excluir_aula",
      item_id: ids.aulas[0],
      item_titulo: `Aula 1 ${sufixo}`,
      aluno_id: null,
    },
    {
      acao: "excluir_modulo",
      item_id: ids.modulos[0],
      item_titulo: `Módulo A ${sufixo}`,
      aluno_id: null,
    },
    {
      acao: "excluir_curso",
      item_id: ids.curso,
      item_titulo: `Curso de ordem ${sufixo}`,
      aluno_id: null,
    },
  ]);
});
