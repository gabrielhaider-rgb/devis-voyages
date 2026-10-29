import Anthropic from "@anthropic-ai/sdk";
import { priceConfiguration, type Proposal } from "@/lib/assistant/configuration";
import { getTrip, getTrips } from "@/lib/catalogue";
import { centsToInput } from "@/lib/admin-validation";

const MODEL = "claude-haiku-5-5";
// Garde-fou : nombre maximal d'allers-retours avec les outils pour un seul message.
const MAX_TOOL_ROUNDS = 5;

const SYSTEM_PROMPT = `Tu es l'assistant de « Devis voyages », un tour-opérateur. Tu aides les visiteurs du site à choisir un voyage du catalogue et à le configurer pour obtenir un devis.

Règles :
- Réponds en français, de façon chaleureuse et brève (3 à 5 phrases au plus), en texte simple, sans Markdown ni listes à puces.
- Tu ne parles que des voyages du catalogue. Consulte-le avec les outils : n'invente jamais un voyage, une date, une option ou un prix.
- Pour donner un prix, utilise toujours l'outil chiffrer_configuration : ne calcule jamais un prix toi-même.
- Pour chiffrer, il te faut le voyage, une date de départ existante et le nombre de voyageurs (1 à 9). Demande ce qui manque, une ou deux questions à la fois.
- Demande avec tact si un voyageur a des besoins d'accessibilité (mobilité réduite, fauteuil roulant…). Si oui, propose les options d'accessibilité du voyage et signale les prestations incluses sans supplément.
- Certaines options ne se cumulent pas (même « groupe non cumulable ») : n'en propose qu'une à la fois.
- Quand une configuration est chiffrée, résume-la en une phrase et invite le visiteur à cliquer sur « Voir et ajuster » pour vérifier avant d'ouvrir son devis. Tu ne réserves rien et ne prends aucun paiement : le devis est indicatif.
- Si la demande sort du sujet des voyages du catalogue, ramène poliment la conversation vers eux.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "lister_voyages",
    description:
      "Liste les voyages en ligne du catalogue : adresse (slug), titre, destination, durée, prochain départ et son prix par personne.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
    strict: true,
  },
  {
    name: "detailler_voyage",
    description:
      "Donne le détail d'un voyage : description, départs (date et prix par personne), options payantes (prix, forfait ou par personne, catégorie, groupe non cumulable) et prestations d'accessibilité incluses.",
    input_schema: {
      type: "object",
      properties: { slug: { type: "string", description: "Adresse du voyage, par ex. lisbonne-5-jours" } },
      required: ["slug"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "chiffrer_configuration",
    description:
      "Calcule le prix exact d'une configuration avec les règles du site et prépare le lien « Voir et ajuster ». Les options sont désignées par leur libellé exact.",
    input_schema: {
      type: "object",
      properties: {
        slug: { type: "string" },
        departure_date: { type: "string", description: "Date de départ au format AAAA-MM-JJ, parmi les départs du voyage" },
        travelers: { type: "integer", description: "Nombre de voyageurs, de 1 à 9" },
        option_labels: { type: "array", items: { type: "string" }, description: "Libellés des options payantes choisies" },
      },
      required: ["slug", "departure_date", "travelers", "option_labels"],
      additionalProperties: false,
    },
    strict: true,
  },
];

const euros = (cents: number) => `${centsToInput(cents)} €`;

// Exécute un outil. Les erreurs sont renvoyées à l'agent pour qu'il corrige ou demande.
async function runTool(
  name: string,
  input: Record<string, unknown>,
): Promise<{ content: string; isError?: boolean; proposal?: Proposal }> {
  if (name === "lister_voyages") {
    const trips = await getTrips();
    return {
      content: JSON.stringify(
        trips.map((t) => ({
          slug: t.slug,
          titre: t.title,
          destination: t.destination,
          duree_jours: t.durationDays,
          prochain_depart: t.nextDeparture
            ? { date: t.nextDeparture.date, prix_par_personne: euros(t.nextDeparture.pricePerPersonCents) }
            : null,
        })),
      ),
    };
  }

  const slug = typeof input.slug === "string" ? input.slug : "";
  const trip = slug ? await getTrip(slug) : null;
  if (!trip) return { content: `Aucun voyage en ligne avec l'adresse « ${slug} ».`, isError: true };

  if (name === "detailler_voyage") {
    return {
      content: JSON.stringify({
        slug: trip.slug,
        titre: trip.title,
        destination: trip.destination,
        duree_jours: trip.durationDays,
        description: trip.description,
        departs: trip.departures.map((d) => ({ date: d.date, prix_par_personne: euros(d.pricePerPersonCents) })),
        options: trip.options
          .filter((o) => o.priceCents > 0)
          .map((o) => ({
            libelle: o.label,
            prix: euros(o.priceCents),
            type: o.pricingType === "per_person" ? "par personne" : "forfait",
            categorie: o.category === "accessibility" ? "accessibilité" : "option",
            groupe_non_cumulable: o.exclusiveGroup,
          })),
        accessibilite_incluse: trip.options.filter((o) => o.priceCents === 0).map((o) => o.label),
      }),
    };
  }

  if (name === "chiffrer_configuration") {
    const result = priceConfiguration(trip, {
      departure_date: String(input.departure_date ?? ""),
      travelers: Number(input.travelers),
      option_labels: Array.isArray(input.option_labels) ? input.option_labels.map(String) : [],
    });
    if (!result.ok) return { content: result.error, isError: true };
    return {
      content: JSON.stringify({ lignes: result.lines, total: euros(result.proposal.totalCents) }),
      proposal: result.proposal,
    };
  }

  return { content: `Outil inconnu : ${name}`, isError: true };
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

// Une réponse de l'agent au dernier message du visiteur, avec la dernière
// configuration chiffrée pendant ce tour (pour afficher le bouton « Voir et ajuster »).
export async function answer(history: ChatMessage[]): Promise<{ reply: string; proposal: Proposal | null }> {
  const client = new Anthropic();
  const messages: Anthropic.MessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));
  let proposal: Proposal | null = null;

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      cache_control: { type: "ephemeral" },
      output_config: { effort: "medium" },
      messages,
    });

    if (response.stop_reason === "refusal") {
      return { reply: "Je ne peux pas répondre à cette demande. Parlons plutôt de votre prochain voyage !", proposal };
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (response.stop_reason !== "tool_use") {
      return { reply: text || "Pouvez-vous reformuler votre demande ?", proposal };
    }

    messages.push({ role: "assistant", content: response.content });
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const result = await runTool(block.name, block.input as Record<string, unknown>);
      if (result.proposal) proposal = result.proposal;
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result.content,
        is_error: result.isError,
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  return { reply: "Je n'ai pas réussi à finaliser la réponse. Pouvez-vous préciser votre demande ?", proposal };
}
