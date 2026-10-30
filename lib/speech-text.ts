// Prépare une réponse de l'assistant pour la lecture à voix haute : on retire ce
// qui ne se dit pas (liens, mise en forme) et on découpe en morceaux courts,
// car Chrome coupe ou n'énonce rien quand le texte est trop long.

const MAX_CHUNK = 180;

export function speechChunks(text: string): string[] {
  const clean = text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // [texte](lien) → texte
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_#`>|]/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return [];

  const sentences = clean.match(/[^.!?…:;]+[.!?…:;]*/g) ?? [clean];
  const chunks: string[] = [];
  let current = "";
  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;
    for (const piece of splitLong(sentence)) {
      if (current && current.length + 1 + piece.length > MAX_CHUNK) {
        chunks.push(current);
        current = piece;
      } else {
        current = current ? `${current} ${piece}` : piece;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// Une phrase trop longue est coupée aux virgules, puis aux espaces.
function splitLong(sentence: string): string[] {
  if (sentence.length <= MAX_CHUNK) return [sentence];
  const pieces: string[] = [];
  let current = "";
  for (const word of sentence.split(" ")) {
    if (current && current.length + 1 + word.length > MAX_CHUNK) {
      pieces.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}
