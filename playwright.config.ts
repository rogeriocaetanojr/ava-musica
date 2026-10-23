import { defineConfig, devices } from "@playwright/test";

// Porta só dos testes: o Playwright sempre sobe o próprio servidor, mesmo com
// o npm run dev aberto na 3000, e o encerra no fim.
const PORTA = 3100;
const ENDERECO = `http://localhost:${PORTA}`;

// Testes de ponta a ponta contra o site local e o Supabase local.
// Uso: npm run test:e2e (o Supabase local precisa estar rodando).
export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/preparar-banco.ts",
  // Um teste por vez: os fluxos dividem o mesmo banco e os limites de login.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: ENDERECO,
    trace: "retain-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  },
  projects: [
    { name: "computador", use: { ...devices["Desktop Chrome"] } },
    { name: "celular", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORTA}`,
    url: `${ENDERECO}/login`,
    reuseExistingServer: false,
    // Aviso de pedido novo ao professor pela porta SMTP do Mailpit local.
    env: {
      NEXT_DIST_DIR: ".next-e2e",
      NEXT_PUBLIC_SITE_URL: ENDERECO,
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "54325",
      SMTP_REMETENTE: "Escola de Música John Meyer <avisos@teste.local>",
      EMAIL_PROFESSOR: "professor@teste.local",
      // Chave de site de teste da Cloudflare: o captcha aprova sozinho.
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
    },
    timeout: 180_000,
  },
});
