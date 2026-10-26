import { expect, type Page, test } from "@playwright/test";
import {
  codigoDoEmail,
  digitarCodigo,
  entrar,
  informarNome,
  pedirCodigo,
  PROFESSOR,
} from "./apoio";

function secao(pagina: Page, titulo: string) {
  return pagina
    .locator("section")
    .filter({ has: pagina.getByRole("heading", { name: titulo }) });
}

test("sem nome, a tela do nome vem antes de tudo e o pedido só chega ao professor com o nome", async ({
  browser,
}, testInfo) => {
  const projeto = testInfo.project.name;
  const email = `nome-${projeto}-${Date.now()}@teste.local`;
  const nome = `Carla Dias ${projeto}`;
  const nomeCorrigido = `Carla Dias Lima ${projeto}`;

  // Depois do código, quem não tem nome cai na tela do nome.
  const aluno = await browser.newPage();
  await pedirCodigo(aluno, email);
  await digitarCodigo(aluno, await codigoDoEmail(email));
  await expect(aluno).toHaveURL(/\/seu-nome$/);
  await expect(
    aluno.getByRole("heading", { name: "Como você se chama?" }),
  ).toBeVisible();

  // Nenhuma outra tela abre antes do nome.
  await aluno.goto("/cursos");
  await expect(aluno).toHaveURL(/\/seu-nome$/);
  await aluno.goto("/aguardando");
  await expect(aluno).toHaveURL(/\/seu-nome$/);

  // O pedido ainda não aparece para o professor.
  const professor = await browser.newPage();
  await entrar(professor, PROFESSOR);
  await expect(professor).toHaveURL(/\/professor$/);
  await professor.goto("/professor/alunos");
  const pedidos = secao(professor, "Pedidos de acesso");
  await expect(pedidos.getByText(email)).toHaveCount(0);

  // Nome em branco não passa, e o e-mail não serve de nome.
  await aluno.getByLabel("Nome completo").fill("   ");
  await aluno.getByRole("button", { name: "Continuar" }).click();
  await expect(
    aluno.getByRole("alert").filter({ hasText: "Informe o nome completo." }),
  ).toBeVisible();
  await aluno.getByLabel("Nome completo").fill(email);
  await aluno.getByRole("button", { name: "Continuar" }).click();
  await expect(
    aluno.getByRole("alert").filter({ hasText: "não o e-mail" }),
  ).toBeVisible();

  await informarNome(aluno, nome);
  await expect(aluno).toHaveURL(/\/aguardando$/);
  await expect(aluno.getByText(`Olá, ${nome}.`)).toBeVisible();

  // Agora o pedido aparece, com o nome.
  await professor.reload();
  const pedido = pedidos.getByRole("listitem").filter({ hasText: email });
  await expect(pedido.getByText(nome)).toBeVisible();

  // Na ficha, aberta pelo pedido, o professor corrige o nome, e a mudança
  // fica na auditoria.
  await pedido.getByRole("link", { name: `Ver ficha de ${nome}` }).click();
  await expect(professor.getByRole("heading", { name: nome })).toBeVisible();
  await professor.getByLabel("Nome completo").fill(nomeCorrigido);
  await professor.getByRole("button", { name: "Salvar nome" }).click();
  await expect(
    professor.getByRole("status").filter({ hasText: "Nome salvo." }),
  ).toBeVisible();
  await expect(
    professor.getByRole("heading", { name: nomeCorrigido }),
  ).toBeVisible();
  await expect(professor.getByText("Alterou o nome")).toBeVisible();

  // Liberado, o aluno vê o nome no perfil.
  await professor.goto("/professor/alunos");
  const liberar = pedidos.getByRole("listitem").filter({ hasText: email });
  await liberar.getByRole("button", { name: "Liberar" }).click();
  await liberar.getByLabel("Data de nascimento").fill("2000-01-01");
  await liberar.getByRole("button", { name: "Confirmar liberação" }).click();
  await expect(
    professor.getByRole("status").filter({ hasText: "foi liberado" }),
  ).toBeVisible();

  await aluno.goto("/perfil");
  await expect(aluno).toHaveURL(/\/perfil$/);
  await expect(
    aluno.getByRole("main").getByText(nomeCorrigido, { exact: true }),
  ).toBeVisible();
});
