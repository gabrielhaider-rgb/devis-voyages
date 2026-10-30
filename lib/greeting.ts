// Textes d'accueil de l'espace client.

// « Bonjour Gabriel, » ou « Bonjour, » tant que le prénom n'est pas renseigné.
export function greeting(firstName: string | null) {
  const name = firstName?.trim();
  return name ? `Bonjour ${name},` : "Bonjour,";
}

export function savedQuotesSentence(count: number) {
  if (count === 0) return "Vous n'avez pas encore de devis enregistré.";
  if (count === 1) return "Retrouvez ici votre devis enregistré.";
  return `Retrouvez ici vos ${count} devis enregistrés.`;
}

// Initiale affichée dans la pastille du menu.
export function initial(firstName: string) {
  return firstName.trim().charAt(0).toLocaleUpperCase("fr-FR");
}
