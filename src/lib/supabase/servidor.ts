import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { semValidade } from "@/lib/sessao";

// Cliente para Server Components, server actions e rotas, com a sessão nos
// cookies (de sessão, sem data de validade).
export async function criarClienteServidor() {
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
