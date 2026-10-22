import type { MetadataRoute } from "next";

// O AVA é privado e tem alunos menores de idade: nada deve ser indexado.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
