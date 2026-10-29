// Adresse de la photo d'un voyage : l'admin colle souvent l'adresse de la PAGE
// d'une photo Unsplash (unsplash.com/fr/photos/…), pas celle de l'image.
// On la convertit une fois, à l'enregistrement, en adresse d'image directe.

// "https://unsplash.com/fr/photos/un-couple-de-chariots-jaunes-oiVvB-A7XDM" → "oiVvB-A7XDM"
// (les identifiants Unsplash font 11 caractères, tirets compris).
export function unsplashPhotoId(url: string): string | null {
  const match = url.match(/^https:\/\/unsplash\.com\/(?:[a-z]{2}(?:-[A-Z]{2})?\/)?photos\/([A-Za-z0-9_-]+)\/?(?:[?#].*)?$/);
  if (!match) return null;
  const slug = match[1];
  return slug.length >= 11 ? slug.slice(-11) : null;
}

// Renvoie une adresse qui affiche bien une image, ou un message d'erreur pour l'admin.
export async function resolveTripImage(url: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const id = unsplashPhotoId(url);
  const candidate = id ? `https://unsplash.com/photos/${id}/download?w=1600` : url;

  try {
    const response = await fetch(candidate, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(8000) });
    const type = response.headers.get("content-type") ?? "";
    if (response.ok && type.startsWith("image/")) {
      // Pour Unsplash, on garde l'adresse finale de l'image (images.unsplash.com),
      // pas le lien de téléchargement, qui compterait un téléchargement à chaque affichage.
      return { ok: true, url: id ? response.url : url };
    }
  } catch {
    // Réseau ou délai dépassé : même message ci-dessous.
  }
  return {
    ok: false,
    error:
      "Cette adresse n'affiche pas une image. Collez l'adresse d'une page Unsplash, ou faites un clic droit sur la photo puis « Copier l'adresse de l'image ».",
  };
}
