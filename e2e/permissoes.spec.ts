import { expect, test } from "@playwright/test";
import {
  ALUNO,
  clienteAdmin,
  entrar,
  esconderSeloDoNext,
  PROFESSOR,
} from "./apoio";

// Uma server action de professor chamada pelo aluno, com o mesmo pedido que a
// tela do professor envia (id da ação e argumentos), é recusada: a ação começa
// com exigirProfessor() e, por baixo, a RLS também barra.

const admin = clienteAdmin();

test("aluno que reenvia a ação de publicar aula do professor não publica nada", async ({
  page,
  browser,
}, testInfo) => {
  const sufixo = `${testInfo.project.name}-${Date.now()}`;
  const { data: curso, error } = await admin
    .from("cursos")
    .insert({ titulo: `Curso de permissão ${sufixo}`, instrumento: "Piano" })
    .select("id")
    .single();
  if (error) throw error;
  try {
    const { data: modulo } = await admin
      .from("modulos")
      .insert({ curso_id: curso.id, titulo: `Módulo ${sufixo}` })
      .select("id")
      .single();
    const { data: aula } = await admin
      .from("aulas")
      .insert({ modulo_id: modulo!.id, titulo: `Aula ${sufixo}` })
      .select("id")
      .single();
    const publicada = async () =>
      (
        await admin
          .from("aulas")
          .select("publicada")
          .eq("id", aula!.id)
          .single()
      ).data!.publicada;

    // O professor publica e o teste guarda o pedido da ação.
    await esconderSeloDoNext(page);
    await entrar(page, PROFESSOR);
    await page.goto(`/professor/cursos/${curso.id}`);
    const pedido = page.waitForRequest(
      (r) => r.method() === "POST" && !!r.headers()["next-action"],
    );
    // O cabeçalho tem o Publicar do curso; aqui vale o da linha da aula.
    await page
      .getByRole("listitem")
      .filter({ hasText: `Aula ${sufixo}` })
      .getByRole("button", { name: "Publicar", exact: true })
      .click();
    const acao = await pedido;
    await expect.poll(publicada).toBe(true);
    await admin.from("aulas").update({ publicada: false }).eq("id", aula!.id);

    // O aluno manda o mesmo pedido com a sessão dele.
    const contexto = await browser.newContext(testInfo.project.use);
    const aluno = await contexto.newPage();
    await entrar(aluno, ALUNO);
    const cabecalhos = acao.headers();
    const resposta = await contexto.request.post(acao.url(), {
      headers: {
        "next-action": cabecalhos["next-action"],
        "content-type": cabecalhos["content-type"],
        accept: cabecalhos["accept"] ?? "text/x-component",
        origin: new URL(acao.url()).origin,
      },
      data: acao.postDataBuffer() ?? "",
      maxRedirects: 0,
    });
    // exigirProfessor() manda o aluno para a área dele em vez de executar:
    // a resposta da ação é um redirecionamento para /cursos.
    expect(resposta.headers()["x-action-redirect"]).toMatch(/^\/cursos/);
    expect(await publicada()).toBe(false);
    await contexto.close();
  } finally {
    await admin.from("cursos").delete().eq("id", curso.id);
  }
});
