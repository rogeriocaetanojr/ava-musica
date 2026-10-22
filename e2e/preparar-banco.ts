import { execSync } from "node:child_process";
import { limparCaixaDeEmail } from "./apoio";

// Antes dos testes: recria o banco local e cria os usuários de teste.
export default async function prepararBanco() {
  execSync("npx supabase db reset", { stdio: "inherit" });
  execSync("npm run seed:dev", { stdio: "inherit" });
  await limparCaixaDeEmail();
}
