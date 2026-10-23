import { test } from "@playwright/test";
import { ALUNO, entrar } from "./apoio";
test("repro", async ({ page }) => {
  const log: string[] = [];
  page.on("response", (r) => {
    if (r.request().resourceType() === "document" || r.status() === 307 || r.request().isNavigationRequest())
      log.push(`${r.status()} ${r.request().method()} ${r.url()} -> ${r.headers()["location"] ?? ""}`);
  });
  page.on("framenavigated", (f) => { if (f === page.mainFrame()) log.push(`NAV ${f.url()}`); });
  await entrar(page, ALUNO);
  await page.waitForTimeout(8000);
  console.log(log.slice(0, 60).join("\n"));
  console.log("TOTAL", log.length, "URL", page.url());
  console.log((await page.locator("body").innerText()).slice(0, 300));
});
