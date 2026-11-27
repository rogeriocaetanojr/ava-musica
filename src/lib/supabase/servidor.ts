import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { semValidade } from "@/lib/sessao";

// Cliente para Server Components, server actions e rotas, com a sessão nos
// cookies (de sessão, sem data de validade).
// O connection() garante que o cliente só nasce na hora da requisição: o
// Supabase lê o relógio (Date.now()) ao conferir a sessão, o que não pode
// acontecer na pré-renderização, nem quando a leitura corre em paralelo com
// a conferência da sessão (Promise.all).
export async function criarClienteServidor() {
  await connection();
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesParaGravar) {
          try {
            cookiesParaGravar.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, semValidade(options)),
            );
          } catch {
            // Em Server Components os cookies são só leitura; o proxy renova a sessão.
          }
        },
      },
    },
  );
}
