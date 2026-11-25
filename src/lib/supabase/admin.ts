import "server-only";
import { chaveServiceRole } from "@/lib/env-servidor";
import { createClient } from "@supabase/supabase-js";

// Cliente com a chave service_role: ignora a RLS. Usar só no servidor.
export function criarClienteAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    chaveServiceRole(),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
