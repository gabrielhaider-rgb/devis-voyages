// N'accepte que des chemins internes au site ("/mes-devis"), jamais une
// adresse externe ("https://…" ou "//…"), pour éviter les redirections piégées.
export function safeNext(next: unknown, fallback = "/mes-devis") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : fallback;
}
