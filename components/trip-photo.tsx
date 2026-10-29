// Photo d'un voyage, ou, tant que l'admin n'en a pas renseigné, un aplat chaud
// avec le nom de la destination : jamais d'image cassée.
const PLACEHOLDER_TONES = ["#D9A876", "#C98A6B", "#9FB7B0", "#D8A27E", "#B9A27E"];

export function TripPhoto({
  src,
  destination,
  className = "",
}: {
  src: string | null;
  destination: string;
  className?: string;
}) {
  if (src) {
    return (
      // Adresse saisie par l'admin, sur n'importe quel site : une <img> simple
      // plutôt que next/image, qui exige de déclarer chaque domaine à l'avance.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={`Photo : ${destination}`} loading="lazy" className={`object-cover ${className}`} />
    );
  }

  const tone = PLACEHOLDER_TONES[[...destination].reduce((sum, c) => sum + c.charCodeAt(0), 0) % PLACEHOLDER_TONES.length];
  return (
    <div
      role="img"
      aria-label={`Photo à venir : ${destination}`}
      className={`flex items-end p-4 ${className}`}
      style={{ backgroundColor: tone }}
    >
      <span className="rounded-full bg-cream/85 px-3 py-1 text-xs font-medium text-ink">{destination}</span>
    </div>
  );
}
