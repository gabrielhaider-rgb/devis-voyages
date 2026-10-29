import type { Dashboard } from "@/lib/admin-stats";

// Nombre de devis par mois : une seule série, barres fines sur une ligne de base,
// infobulle au survol (title) et tableau équivalent pour les lecteurs d'écran.
export function MonthlyChart({ months }: { months: Dashboard["byMonth"] }) {
  const max = Math.max(1, ...months.map((m) => m.count));

  return (
    <figure>
      <div className="flex h-40 items-end gap-[2px] border-b border-foreground/20" aria-hidden="true">
        {months.map((m) => (
          <div key={m.key} className="group relative flex h-full flex-1 flex-col justify-end" title={`${m.label} : ${m.count} devis`}>
            {m.count > 0 && (
              <span className="mb-1 text-center text-[11px] text-foreground/70 opacity-0 group-hover:opacity-100">
                {m.count}
              </span>
            )}
            <div
              className="mx-auto w-3/5 max-w-6 rounded-t-[4px] bg-sky-600 group-hover:bg-sky-700 dark:bg-sky-400 dark:group-hover:bg-sky-300"
              style={{ height: `${(m.count / max) * 85}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-[2px]" aria-hidden="true">
        {months.map((m, i) => (
          <span key={m.key} className="flex-1 text-center text-[10px] text-foreground/60">
            {/* Un mois sur deux sur petit écran, pour éviter les chevauchements. */}
            <span className={i % 2 === 1 ? "hidden sm:inline" : ""}>{m.label}</span>
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Nombre de devis enregistrés par mois</caption>
        <tbody>
          {months.map((m) => (
            <tr key={m.key}>
              <th scope="row">{m.label}</th>
              <td>{m.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
