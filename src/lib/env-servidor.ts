import "server-only";

// Valores das variáveis de servidor (as regras estão em src/lib/env.ts). O
// `import "server-only"` faz o build falhar se um componente do navegador
// importar este arquivo, para a service_role nunca sair do servidor.

function exigir(nome: string): string {
  const valor = process.env[nome]?.trim();
  if (!valor)
    throw new Error(
      `${nome} não está definida (de servidor; ver .env.example).`,
    );
  return valor;
}

export function chaveServiceRole(): string {
  return exigir("SUPABASE_SERVICE_ROLE_KEY");
}
