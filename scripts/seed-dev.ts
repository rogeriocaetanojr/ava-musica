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

  await garantirUsuario("aluno@teste.local", {
    nome: "Aluno de Teste",
    data_nascimento: dataHaAnos(15),
    menor_de_12: false,
  });

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
    "Pronto: professor@teste.local (professor), aluno@teste.local (aluno, 15 anos) e pedido1@ / pedido2@teste.local (pedidos para testar à mão).",
  );
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
