// Cria os usuários de teste no Supabase local. Uso: npm run seed:dev
import { criarClienteAdmin } from "../src/lib/supabase/admin";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const host = URL.canParse(url) ? new URL(url).hostname : "";
if (host !== "127.0.0.1" && host !== "localhost") {
  console.error(
    `seed:dev só roda no Supabase local; NEXT_PUBLIC_SUPABASE_URL aponta para "${url}".`,
  );
  process.exit(1);
}

function dataHaAnos(anos: number): string {
  const data = new Date();
  data.setFullYear(data.getFullYear() - anos);
  return data.toISOString().slice(0, 10);
}

const supabase = criarClienteAdmin();

const NOME_DO_ALUNO = "Ana Souza";
const TITULO_DO_CURSO = "Violão para iniciantes";

type AulaDeExemplo = {
  titulo: string;
  video: string;
  texto: string;
  prova?: string;
};

// Vídeos e formulário de exemplo, só para ver as telas preenchidas.
const MODULOS_DE_EXEMPLO: { titulo: string; aulas: AulaDeExemplo[] }[] = [
  {
    titulo: "Primeiros passos",
    aulas: [
      {
        titulo: "Conhecendo o violão",
        video: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
        texto:
          "Conheça as partes do violão: corpo, boca, braço, trastes e tarraxas. Repare como as seis cordas vão da mais grossa (Mi grave) à mais fina (Mi agudo).",
      },
      {
        titulo: "Postura e como segurar",
        video: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
        texto:
          "Sente na ponta da cadeira, com as costas retas, e apoie o violão na perna direita. O braço do violão fica um pouco inclinado para cima.",
      },
      {
        titulo: "Afinando as cordas",
        video: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
        texto:
          "Use um afinador no celular e afine corda por corda, da sexta para a primeira. Gire a tarraxa devagar e confira de novo no fim.",
      },
      {
        titulo: "Prova do módulo 1",
        video: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
        texto:
          "Revise as partes do violão e a afinação antes de responder. Você pode consultar as aulas anteriores.",
        prova:
          "https://docs.google.com/forms/d/e/1FAIpQLSf-exemplo-modulo-1/viewform",
      },
    ],
  },
  {
    titulo: "Primeiros acordes",
    aulas: [
      {
        titulo: "Acorde de Mi menor",
        video: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
        texto:
          "O Mi menor usa só dois dedos: médio e anelar na segunda casa da quinta e da quarta corda. Toque todas as cordas e escute se soam limpas.",
      },
      {
        titulo: "Acordes de Ré e Lá",
        video: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
        texto:
          "Posicione os dedos perto do traste e toque corda por corda para ouvir se todas soam limpas. Depois, alterne entre Ré e Lá começando devagar.",
      },
      {
        titulo: "Trocando acordes",
        video: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
        texto:
          "Treine a troca entre Mi menor, Ré e Lá contando até quatro em cada acorde. Mantenha os dedos próximos das cordas durante a troca.",
      },
      {
        titulo: "Prova do módulo 2",
        video: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
        texto:
          "Grave você tocando a sequência Mi menor, Ré e Lá e responda o formulário.",
        prova:
          "https://docs.google.com/forms/d/e/1FAIpQLSf-exemplo-modulo-2/viewform",
      },
    ],
  },
];

// Quantas aulas, na ordem do curso, já aparecem concluídas para o aluno.
const AULAS_CONCLUIDAS = 5;

// Curso publicado com dois módulos, o aluno matriculado e algumas aulas
// concluídas. Não recria o curso se ele já existir.
async function garantirCursoDeExemplo(idAluno: string) {
  const { data: existente } = await supabase
    .from("cursos")
    .select("id")
    .eq("titulo", TITULO_DO_CURSO)
    .maybeSingle();
  if (existente) return;

  const { data: curso, error: erroCurso } = await supabase
    .from("cursos")
    .insert({
      titulo: TITULO_DO_CURSO,
      instrumento: "Violão",
      nivel: "Iniciante",
      descricao:
        "Do primeiro contato com o violão aos primeiros acordes, no seu ritmo.",
      publicado: true,
    })
    .select("id")
    .single();
  if (erroCurso) throw erroCurso;

  const aulasCriadas: string[] = [];
  for (const [ordemModulo, modulo] of MODULOS_DE_EXEMPLO.entries()) {
    const { data: novoModulo, error: erroModulo } = await supabase
      .from("modulos")
      .insert({ curso_id: curso.id, titulo: modulo.titulo, ordem: ordemModulo })
      .select("id")
      .single();
    if (erroModulo) throw erroModulo;

    for (const [ordemAula, aula] of modulo.aulas.entries()) {
      const { data: novaAula, error: erroAula } = await supabase
        .from("aulas")
        .insert({
          modulo_id: novoModulo.id,
          titulo: aula.titulo,
          ordem: ordemAula,
          publicada: true,
        })
        .select("id")
        .single();
      if (erroAula) throw erroAula;
      aulasCriadas.push(novaAula.id);

      const conteudos = [
        { tipo: "youtube", url: aula.video, titulo: aula.titulo },
        { tipo: "texto", texto: aula.texto },
        ...(aula.prova
          ? [{ tipo: "prova", url: aula.prova, titulo: aula.titulo }]
          : []),
      ];
      const { error: erroConteudo } = await supabase.from("conteudos").insert(
        conteudos.map((conteudo, ordem) => ({
          ...conteudo,
          aula_id: novaAula.id,
          ordem,
        })),
      );
      if (erroConteudo) throw erroConteudo;
    }
  }

  const { error: erroMatricula } = await supabase
    .from("matriculas")
    .insert({ aluno_id: idAluno, curso_id: curso.id });
  if (erroMatricula) throw erroMatricula;

  const { error: erroProgresso } = await supabase
    .from("progresso")
    .insert(
      aulasCriadas
        .slice(0, AULAS_CONCLUIDAS)
        .map((aula_id) => ({ aluno_id: idAluno, aula_id })),
    );
  if (erroProgresso) throw erroProgresso;
}

async function garantirUsuario(
  email: string,
  metadados: Record<string, unknown>,
  doProfessor = true,
): Promise<string> {
  const { data: existente } = await supabase
    .from("perfis")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existente) return existente.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: metadados,
    // Como no cadastro feito pelo professor: o gatilho já cria o perfil liberado.
    // Sem a marca, o usuário fica pendente, como quem pede acesso pelo login.
    app_metadata: doProfessor ? { origem: "professor" } : {},
  });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  const idProfessor = await garantirUsuario("professor@teste.local", {
    nome: "Professor de Teste",
  });
  // O gatilho sempre cria aluno; a promoção é feita aqui, como no deploy.
  const { error: erroPromocao } = await supabase
    .from("perfis")
    .update({ papel: "professor" })
    .eq("id", idProfessor);
  if (erroPromocao) throw erroPromocao;

  const idAluno = await garantirUsuario("aluno@teste.local", {
    nome: NOME_DO_ALUNO,
    data_nascimento: dataHaAnos(15),
    menor_de_12: false,
  });

  // O nome dos metadados só vale na criação; aqui ele é acertado sempre.
  const { error: erroNome } = await supabase
    .from("perfis")
    .update({ nome: NOME_DO_ALUNO })
    .eq("id", idAluno);
  if (erroNome) throw erroNome;

  await garantirCursoDeExemplo(idAluno);

  // Pedidos já confirmados, para conferir a seção "Pedidos de acesso" à mão
  // sem precisar entrar com cada um.
  for (const numero of [1, 2]) {
    const id = await garantirUsuario(
      `pedido${numero}@teste.local`,
      { full_name: `Pedido ${numero}` },
      false,
    );
    const { error } = await supabase
      .from("perfis")
      .update({ pedido_em: new Date().toISOString() })
      .eq("id", id)
      .is("pedido_em", null);
    if (error) throw error;
  }

  console.log(
    "Pronto: professor@teste.local (professor), aluno@teste.local (Ana Souza, 15 anos, matriculada em Violão para iniciantes) e pedido1@ / pedido2@teste.local (pedidos para testar à mão).",
  );
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
