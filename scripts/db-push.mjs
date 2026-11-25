// Aplica as migrações de supabase/migrations num projeto Supabase da nuvem pela CLI:
// supabase link (liga a pasta ao projeto) e supabase db push (aplica o que falta).
// Uso: node scripts/db-push.mjs staging|prod (pelos scripts npm db:push:staging e db:push:prod).
// O identificador do projeto vem de STAGING_PROJECT_REF ou PROD_PROJECT_REF (ambiente ou .env.local).
// A senha do banco não passa por aqui: a CLI pede no terminal.

import { spawnSync } from "node:child_process";

const AMBIENTES = {
  staging: { variavel: "STAGING_PROJECT_REF", nome: "ava-staging" },
  prod: { variavel: "PROD_PROJECT_REF", nome: "ava-prod" },
};

const ambiente = AMBIENTES[process.argv[2]];
if (!ambiente) {
  console.error("Uso: node scripts/db-push.mjs staging|prod");
  process.exit(1);
}

const ref = process.env[ambiente.variavel]?.trim();
if (!ref) {
  console.error(
    `${ambiente.variavel} não está definida. Ponha o identificador do projeto ${ambiente.nome} ` +
      "(Project Settings → General → Project ID) no .env.local ou no ambiente. Veja guias/deploy.md.",
  );
  process.exit(1);
}
if (!/^[a-z0-9]{20}$/.test(ref)) {
  console.error(
    `${ambiente.variavel} não parece um identificador de projeto (20 letras minúsculas e números): "${ref}".`,
  );
  process.exit(1);
}

function supabase(...args) {
  console.log(`\n> supabase ${args.join(" ")}`);
  const resultado = spawnSync("npx", ["supabase", ...args], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (resultado.status !== 0) {
    console.error(
      `\nO comando "supabase ${args[0]}" falhou em ${ambiente.nome}.`,
    );
    process.exit(resultado.status ?? 1);
  }
}

console.log(`Projeto: ${ambiente.nome} (${ref})`);
supabase("link", "--project-ref", ref);
supabase("db", "push");
