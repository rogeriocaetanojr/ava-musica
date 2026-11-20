import { expect, type Page, test } from "@playwright/test";
import { ALUNO, clienteAdmin, entrar } from "./apoio";

// S2, S4, S5 e S7 da auditoria: cabeçalhos de segurança, CSP ativa no uso
// real do site, áudio só do Storage, código do aluno no Forms e recusa de
// POST vindo de outro site.

// Guarda as violações da CSP das páginas do site (não as dos iframes do
// YouTube e do captcha, que têm a CSP deles). Vale para toda navegação.
async function vigiarCsp(page: Page): Promise<string[]> {
  const violacoes: string[] = [];
  await page.exposeFunction("registrarViolacao", (texto: string) =>
    violacoes.push(texto),
  );
  const origem = new URL(test.info().project.use.baseURL!).origin;
  await page.addInitScript((origemDoSite) => {
    if (location.origin !== origemDoSite) return;
    document.addEventListener("securitypolicyviolation", (evento) => {
      const registrar = (
        window as unknown as { registrarViolacao: (texto: string) => void }
      ).registrarViolacao;
      registrar(
        `${evento.effectiveDirective} bloqueou ${evento.blockedURI || "inline"} em ${location.pathname}`,
      );
    });
  }, origem);
  return violacoes;
}

test("toda página sai com os cabeçalhos de segurança", async ({ request }) => {
  const resposta = await request.get("/login");
  expect(resposta.ok()).toBe(true);
  const cabecalhos = resposta.headers();

  expect(cabecalhos["x-content-type-options"]).toBe("nosniff");
  expect(cabecalhos["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(cabecalhos["x-frame-options"]).toBe("DENY");
  expect(cabecalhos["permissions-policy"]).toContain("camera=()");
  expect(cabecalhos["strict-transport-security"]).toContain("max-age=");

  const csp = cabecalhos["content-security-policy"];
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toMatch(/script-src [^;]*'nonce-[A-Za-z0-9+/=]+'/);
  expect(csp).not.toMatch(/script-src [^;]*'unsafe-inline'/);
  expect(csp).toContain("frame-src https://www.youtube-nocookie.com");
  expect(csp).toMatch(/media-src 'self' http:\/\/127\.0\.0\.1:54321/);

  // O nonce muda a cada requisição.
  const outra = await request.get("/login");
  expect(outra.headers()["content-security-policy"]).not.toBe(csp);

  // Os arquivos estáticos também levam os cabeçalhos fixos.
  const logo = await request.get("/logo.svg");
  expect(logo.headers()["x-content-type-options"]).toBe("nosniff");
});

const ROTAS_POST = [
  "/auth/sair",
  "/convite/codigo-qualquer/definir",
  "/aceite/token-qualquer/autorizar",
  "/nova-senha/salvar",
];

// O CSRF de verdade usa a sessão de quem está logado: o aluno entra, e outro
// site tenta enviar os formulários com o cookie dele.
test("POST vindo de outro site é recusado, mesmo com a sessão aberta", async ({
  page,
}) => {
  await entrar(page, ALUNO);
  for (const rota of ROTAS_POST) {
    const resposta = await page.request.post(rota, {
      headers: { origin: "https://golpe.exemplo.com" },
      form: { senha: "qualquer-coisa-123", autorizo: "sim" },
      maxRedirects: 0,
    });
    expect(resposta.status(), rota).toBe(403);
  }
  // O POST em /auth/sair recusado não deslogou o aluno.
  await page.goto("/cursos");
  await expect(page).toHaveURL(/\/cursos$/);
});

test("POST vindo do próprio site segue normalmente", async ({
  request,
  baseURL,
}) => {
  const origem = new URL(baseURL!).origin;
  const sair = await request.post("/auth/sair", {
    headers: { origin: origem },
    maxRedirects: 0,
  });
  expect(sair.status()).toBe(303);
  expect(sair.headers().location).toMatch(/\/login$/);

  // Token inválido: passa pela origem e cai na validação da rota.
  const aceite = await request.post("/aceite/token-qualquer/autorizar", {
    headers: { origin: origem },
    form: { autorizo: "sim" },
    maxRedirects: 0,
  });
  expect(aceite.status()).toBe(303);
  expect(aceite.headers().location).toMatch(/\/aceite\/invalido$/);
});

// Um segundo de silêncio em WAV (8 kHz, 8 bits, mono).
function audioDeSilencio(): Buffer {
  const amostras = 8000;
  const cabecalho = Buffer.alloc(44);
  cabecalho.write("RIFF", 0);
  cabecalho.writeUInt32LE(36 + amostras, 4);
  cabecalho.write("WAVEfmt ", 8);
  cabecalho.writeUInt32LE(16, 16);
  cabecalho.writeUInt16LE(1, 20);
  cabecalho.writeUInt16LE(1, 22);
  cabecalho.writeUInt32LE(8000, 24);
  cabecalho.writeUInt32LE(8000, 28);
  cabecalho.writeUInt16LE(1, 32);
  cabecalho.writeUInt16LE(8, 34);
  cabecalho.write("data", 36);
  cabecalho.writeUInt32LE(amostras, 40);
  return Buffer.concat([cabecalho, Buffer.alloc(amostras, 128)]);
}

// O que o teste da aula criou, para apagar no fim, mesmo se ele falhar.
let cursoId: string | undefined;
let balde: string | undefined;

test.afterEach(async () => {
  const admin = clienteAdmin();
  if (cursoId) {
    // Apaga módulo, aula, blocos e matrícula junto (on delete cascade).
    const { error } = await admin.from("cursos").delete().eq("id", cursoId);
    expect(error).toBeNull();
    cursoId = undefined;
  }
  if (balde) {
    await admin.storage.emptyBucket(balde);
    const { error } = await admin.storage.deleteBucket(balde);
    expect(error).toBeNull();
    balde = undefined;
  }
});

test("com a CSP ativa: login com captcha, tema escuro, YouTube, áudio e Forms", async ({
  page,
  context,
  baseURL,
}, testInfo) => {
  const sufixo = testInfo.project.name;
  const admin = clienteAdmin();

  // Áudio no Storage do Supabase local, num balde público só deste teste.
  balde = `e2e-playbacks-${sufixo}`;
  const { error: erroBalde } = await admin.storage.createBucket(balde, {
    public: true,
  });
  expect(erroBalde).toBeNull();
  const { error: erroEnvio } = await admin.storage
    .from(balde)
    .upload("silencio.wav", audioDeSilencio(), { contentType: "audio/wav" });
  expect(erroEnvio).toBeNull();
  const audio = admin.storage.from(balde).getPublicUrl("silencio.wav")
    .data.publicUrl;

  const { data: aluno } = await admin
    .from("perfis")
    .select("id")
    .eq("email", ALUNO)
    .single();
  const codigo = aluno!.id.replaceAll("-", "").slice(0, 8).toUpperCase();

  const { data: curso, error: erroCurso } = await admin
    .from("cursos")
    .insert({
      titulo: `Curso da CSP (${sufixo})`,
      instrumento: "Violão",
      publicado: true,
    })
    .select("id")
    .single();
  expect(erroCurso).toBeNull();
  cursoId = curso!.id;
  const { data: modulo } = await admin
    .from("modulos")
    .insert({ curso_id: cursoId, titulo: "Módulo", ordem: 1 })
    .select("id")
    .single();
  const { data: aula } = await admin
    .from("aulas")
    .insert({
      modulo_id: modulo!.id,
      titulo: `Aula da CSP (${sufixo})`,
      ordem: 1,
      publicada: true,
    })
    .select("id")
    .single();
  const { error: erroBlocos } = await admin.from("conteudos").insert([
    {
      aula_id: aula!.id,
      ordem: 0,
      tipo: "youtube",
      url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
      titulo: "Vídeo",
    },
    {
      aula_id: aula!.id,
      ordem: 1,
      tipo: "audio",
      url: audio,
      titulo: "Playback de teste",
    },
    {
      aula_id: aula!.id,
      ordem: 2,
      tipo: "prova",
      url: "https://docs.google.com/forms/d/e/1FAIpQLSf-teste/viewform?entry.1=CODIGO_DO_ALUNO",
      titulo: "Prova de teste",
    },
  ]);
  expect(erroBlocos).toBeNull();
  const { error: erroMatricula } = await admin
    .from("matriculas")
    .insert({ aluno_id: aluno!.id, curso_id: cursoId });
  expect(erroMatricula).toBeNull();

  const violacoes = await vigiarCsp(page);
  // Tema escuro escolhido antes: o script do tema (liberado pelo hash) aplica
  // o tema antes da primeira pintura.
  await context.addCookies([
    { name: "tema", value: "escuro", url: new URL(baseURL!).origin },
  ]);

  // Login por senha com o captcha da Cloudflare carregado.
  await entrar(page, ALUNO);
  await expect(page.locator("html")).toHaveAttribute("data-tema", "escuro");

  await page.goto(`/aulas/${aula!.id}`);
  await expect(page.locator("html")).toHaveAttribute("data-tema", "escuro");

  // Vídeo: o iframe do YouTube sem cookies abre.
  await expect(
    page.locator('iframe[src^="https://www.youtube-nocookie.com/embed/"]'),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .frames()
        .some((frame) =>
          frame.url().startsWith("https://www.youtube-nocookie.com/"),
        ),
    )
    .toBe(true);

  // Áudio do Storage: o tocador lê a duração do arquivo.
  // Pergunta ao próprio elemento: com a CSP barrando, ele fica com erro.
  const estado = () =>
    page.locator("audio").evaluate((elemento: HTMLAudioElement) => ({
      erro: elemento.error?.code ?? null,
      pronto: elemento.readyState,
      duracao: Math.round(elemento.duration || 0),
    }));
  await expect.poll(estado).toMatchObject({ erro: null, duracao: 1 });

  // Prova: o link leva o código do aluno, e não o e-mail.
  const prova = page.getByRole("link", { name: /Abrir a prova/ });
  await expect(prova).toHaveAttribute(
    "href",
    new RegExp(`entry\\.1=${codigo}`),
  );
  expect(await prova.getAttribute("href")).not.toContain("teste.local");

  expect(violacoes).toEqual([]);
});
