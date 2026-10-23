import { defineConfig, devices } from "@playwright/test";

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
    // O mesmo endereço do site_url do supabase/config.toml, usado nos links dos e-mails.
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  },
  projects: [
    { name: "computador", use: { ...devices["Desktop Chrome"] } },
    { name: "celular", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    // Aviso de pedido novo ao professor pela porta SMTP do Mailpit local.
    env: {
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "54325",
      SMTP_REMETENTE: "AVA de Música <avisos@teste.local>",
      EMAIL_PROFESSOR: "professor@teste.local",
    },
    timeout: 180_000,
  },
});
