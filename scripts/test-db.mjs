// Roda os testes SQL de supabase/tests contra um Postgres que já tem a migração aplicada.
// Cada arquivo roda numa transação própria, com os dados de _dados.sql, e é desfeito no fim.
// Arquivos que começam com "_" não são testes.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const URL_PADRAO = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const pasta = path.resolve(import.meta.dirname, "..", "supabase", "tests");

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL ?? URL_PADRAO,
});

const dados = await readFile(path.join(pasta, "_dados.sql"), "utf8");
const arquivos = (await readdir(pasta))
  .filter((nome) => nome.endsWith(".sql") && !nome.startsWith("_"))
  .sort();

try {
  await client.connect();
} catch (erro) {
  console.error(`Não foi possível conectar ao Postgres: ${erro.message}`);
  console.error("O Supabase local está rodando? (npx supabase start)");
  process.exit(1);
}

let falhas = 0;

for (const nome of arquivos) {
  const sql = await readFile(path.join(pasta, nome), "utf8");
  try {
    await client.query("begin");
    await client.query(dados);
    await client.query(sql);
    console.log(`ok    ${nome}`);
  } catch (erro) {
    falhas++;
    console.log(`FALHA ${nome}\n      ${erro.message}`);
  } finally {
    await client.query("rollback");
  }
}

await client.end();

console.log(
  `\n${arquivos.length - falhas} de ${arquivos.length} arquivos de teste passaram.`,
);
process.exit(falhas > 0 ? 1 : 0);
