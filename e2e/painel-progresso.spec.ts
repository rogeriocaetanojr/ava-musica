import { expect, test } from "@playwright/test";
import { clienteAdmin, entrar, PROFESSOR } from "./apoio";

// B1 da auditoria: a API do Supabase devolve no máximo 1000 linhas por
// consulta. Com mais de 1000 registros de progresso, o painel do professor
// mostrava percentuais errados sem aviso. Aqui um aluno conclui todas as 1100
// aulas de um curso, e o painel precisa mostrar 100%.

const AULAS = 1100;

test("painel mostra 100% com mais de 1000 registros de progresso", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const sufixo = testInfo.project.name;
  const nome = `Aluno Persistente ${sufixo}`;
  const titulo = `Curso longo (${sufixo})`;
  const admin = clienteAdmin();

  // Aluno maior de idade cadastrado pelo professor: nasce liberado.
  const { data: criado, error: erroUsuario } =
    await admin.auth.admin.createUser({
      email: `persistente-${sufixo}-${Date.now()}@teste.local`,
      email_confirm: true,
      user_metadata: {
        nome,
        data_nascimento: "2000-01-01",
        menor_de_12: false,
      },
      app_metadata: { origem: "professor" },
    });
  expect(erroUsuario).toBeNull();
  const alunoId = criado.user!.id;

  const { data: curso, error: erroCurso } = await admin
    .from("cursos")
    .insert({ titulo, instrumento: "Violão", publicado: true })
    .select("id")
    .single();
  expect(erroCurso).toBeNull();
  const { data: modulo, error: erroModulo } = await admin
    .from("modulos")
    .insert({ curso_id: curso!.id, titulo: "Módulo único", ordem: 1 })
    .select("id")
    .single();
  expect(erroModulo).toBeNull();

  const { data: aulas, error: erroAulas } = await admin
    .from("aulas")
    .insert(
      Array.from({ length: AULAS }, (_, i) => ({
        modulo_id: modulo!.id,
        titulo: `Aula ${i + 1}`,
        ordem: i + 1,
        publicada: true,
      })),
    )
    .select("id");
  expect(erroAulas).toBeNull();
  expect(aulas).toHaveLength(AULAS);

  const { error: erroMatricula } = await admin
    .from("matriculas")
    .insert({ aluno_id: alunoId, curso_id: curso!.id });
  expect(erroMatricula).toBeNull();
  const { error: erroProgresso } = await admin.from("progresso").insert(
    aulas!.map((aula) => ({
      aluno_id: alunoId,
      aula_id: aula.id,
      conteudo_id: null,
    })),
  );
  expect(erroProgresso).toBeNull();

  await entrar(page, PROFESSOR);
  await page.goto("/professor");
  await expect(
    page.getByRole("progressbar", {
      name: `Progresso de ${nome} em ${titulo}`,
    }),
  ).toHaveAttribute("aria-valuenow", "100");

  await page.goto("/professor/alunos");
  await expect(
    page.getByRole("progressbar", {
      name: `Progresso de ${nome} em ${titulo}`,
    }),
  ).toHaveAttribute("aria-valuenow", "100");
});
