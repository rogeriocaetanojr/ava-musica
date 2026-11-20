// Roda os testes SQL do jeito do CI (.github/workflows/ci.yml, job "banco"):
// um Postgres 17 puro e novo, com supabase/tests/_stubs.sql no lugar do que o
// Supabase já traz, e as migrações aplicadas uma a uma pelo psql. Diferente do
// npm run test:db, que usa o banco do Supabase local. Precisa do Docker.
// Uso: npm run test:db:ci

import { execSync, spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..");
const CONTEINER = "ava-musica-ci-postgres";
// Porta fora das faixas que o Windows costuma reservar (54168 a 54767).
const PORTA = 5433;

function docker(argumentos, entrada) {
  const r = spawnSync("docker", argumentos, {
    input: entrada,
    encoding: "utf8",
  });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
  return r.stdout;
}

function psql(arquivo) {
  console.log(`Aplicando ${path.relative(RAIZ, arquivo)}`);
  docker(
    [
      "exec",
      "-i",
      CONTEINER,
      "psql",
      "-U",
      "postgres",
      "-q",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    readFileSync(arquivo, "utf8"),
  );
}

spawnSync("docker", ["rm", "-f", CONTEINER], { stdio: "ignore" });
docker([
  "run",
  "-d",
  "--name",
  CONTEINER,
  "-e",
  "POSTGRES_PASSWORD=postgres",
  "-p",
  `${PORTA}:5432`,
  "postgres:17",
]);

let codigo = 1;
try {
  // Espera o banco aceitar conexões, como o health-cmd do CI.
  for (let tentativa = 0; ; tentativa++) {
    const r = spawnSync("docker", [
      "exec",
      CONTEINER,
      "pg_isready",
      "-U",
      "postgres",
      "-h",
      "localhost",
    ]);
    if (r.status === 0) break;
    if (tentativa > 60) throw new Error("O Postgres não subiu.");
    await new Promise((ok) => setTimeout(ok, 1000));
  }

  psql(path.join(RAIZ, "supabase", "tests", "_stubs.sql"));
  const pasta = path.join(RAIZ, "supabase", "migrations");
  for (const nome of readdirSync(pasta)
    .filter((n) => n.endsWith(".sql"))
    .sort())
    psql(path.join(pasta, nome));

  execSync("node scripts/test-db.mjs", {
    cwd: RAIZ,
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: `postgresql://postgres:postgres@localhost:${PORTA}/postgres`,
    },
  });
  codigo = 0;
} catch (erro) {
  if (erro.status === undefined) console.error(erro.message);
} finally {
  spawnSync("docker", ["rm", "-f", CONTEINER], { stdio: "ignore" });
}
process.exit(codigo);
