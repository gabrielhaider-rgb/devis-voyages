"use client";

import Link from "next/link";
import { useState } from "react";
import type { Trip, TripOption } from "@/lib/catalogue";
import { computeQuote, formatDate, formatPrice } from "@/lib/price";

const MAX_TRAVELERS = 9;

export function TripConfigurator({ trip }: { trip: Trip }) {
  const [departureId, setDepartureId] = useState(trip.departures[0]?.id);
  const [travelers, setTravelers] = useState(2);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const departure = trip.departures.find((d) => d.id === departureId);
  if (!departure) {
    return <p className="text-foreground/70">Aucun départ n&apos;est prévu pour ce voyage.</p>;
  }

  const standardOptions = trip.options.filter((o) => o.category === "standard");
  const accessibilityOptions = trip.options.filter((o) => o.category === "accessibility");
  const selectedOptions = [...standardOptions, ...accessibilityOptions].filter((o) =>
    selectedIds.includes(o.id),
  );
  const quote = computeQuote({
    pricePerPersonCents: departure.pricePerPersonCents,
    travelers,
    options: selectedOptions,
  });

  const quoteParams = new URLSearchParams({
    voyage: trip.slug,
    depart: departure.id,
    voyageurs: String(travelers),
  });
  if (selectedIds.length > 0) quoteParams.set("options", selectedIds.join(","));

  // Cocher une option décoche celles de son groupe non cumulable (ex. les deux transferts).
  function toggleOption(option: TripOption) {
    setSelectedIds((ids) => {
      if (ids.includes(option.id)) return ids.filter((i) => i !== option.id);
      const conflicting = trip.options
        .filter((o) => option.exclusiveGroup && o.exclusiveGroup === option.exclusiveGroup)
        .map((o) => o.id);
      return [...ids.filter((i) => !conflicting.includes(i)), option.id];
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-8">
        <fieldset>
          <legend className="mb-3 text-lg font-semibold">Date de départ</legend>
          <div className="flex flex-col gap-2">
            {trip.departures.map((d) => (
              <label
                key={d.id}
                className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-foreground/15 p-3 has-checked:border-sky-600 has-checked:bg-sky-600/5"
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="departure"
                    value={d.id}
                    checked={d.id === departure.id}
                    onChange={() => setDepartureId(d.id)}
                    className="accent-sky-600"
                  />
                  <span className="first-letter:uppercase">{formatDate(d.date)}</span>
                </span>
                <span className="text-sm text-foreground/70 whitespace-nowrap">
                  {formatPrice(d.pricePerPersonCents)} / pers.
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="travelers" className="mb-3 block text-lg font-semibold">
            Nombre de voyageurs
          </label>
          <select
            id="travelers"
            value={travelers}
            onChange={(e) => setTravelers(Number(e.target.value))}
            className="rounded-lg border border-foreground/15 bg-background p-3"
          >
            {Array.from({ length: MAX_TRAVELERS }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} voyageur{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>

        <OptionGroup
          title="Options"
          options={standardOptions}
          allOptions={trip.options}
          selectedIds={selectedIds}
          onToggle={toggleOption}
        />

        <OptionGroup
          title="Accessibilité"
          description="Prestations pour les voyageurs en situation de handicap."
          options={accessibilityOptions}
          allOptions={trip.options}
          selectedIds={selectedIds}
          onToggle={toggleOption}
        />
      </div>

      <aside className="h-fit rounded-xl border border-foreground/15 p-5 lg:sticky lg:top-6">
        <h2 className="text-lg font-semibold">Votre prix</h2>
        <ul className="mt-4 flex flex-col gap-3 text-sm">
          {quote.lines.map((line) => (
            <li key={line.label} className="flex justify-between gap-4">
              <span>
                {line.label}
                <span className="block text-foreground/60">{line.detail}</span>
              </span>
              <span className="whitespace-nowrap">
                {line.amountCents === 0 ? "Inclus" : formatPrice(line.amountCents)}
              </span>
            </li>
          ))}
        </ul>
        <p
          className="mt-4 flex justify-between border-t border-foreground/15 pt-4 text-lg font-semibold"
          aria-live="polite"
        >
          <span>Total</span>
          <span>{formatPrice(quote.totalCents)}</span>
        </p>
        <Link
          href={`/devis?${quoteParams}`}
          className="mt-5 block rounded-lg bg-sky-600 px-4 py-3 text-center font-medium text-white hover:bg-sky-700"
        >
          Voir mon devis
        </Link>
      </aside>
    </div>
  );
}

function OptionGroup({
  title,
  description,
  options,
  allOptions,
  selectedIds,
  onToggle,
}: {
  title: string;
  description?: string;
  options: TripOption[];
  allOptions: TripOption[];
  selectedIds: string[];
  onToggle: (option: TripOption) => void;
}) {
  if (options.length === 0) return null;

  // Une option à 0 € est incluse dans le voyage : on l'affiche, sans case à cocher.
  const paidOptions = options.filter((o) => o.priceCents > 0);
  const includedOptions = options.filter((o) => o.priceCents === 0);

  return (
    <fieldset>
      <legend className="mb-1 text-lg font-semibold">{title}</legend>
      {description && <p className="mb-3 text-sm text-foreground/70">{description}</p>}
      <div className="mt-2 flex flex-col gap-2">
        {paidOptions.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-foreground/15 p-3 has-checked:border-sky-600 has-checked:bg-sky-600/5"
          >
            <span className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedIds.includes(option.id)}
                onChange={() => onToggle(option)}
                className="accent-sky-600"
              />
              <span>
                {option.label}
                <NotCumulativeWith option={option} allOptions={allOptions} />
              </span>
            </span>
            <span className="text-sm text-foreground/70 whitespace-nowrap">
              {option.pricingType === "per_person"
                ? `${formatPrice(option.priceCents)} / pers.`
                : formatPrice(option.priceCents)}
            </span>
          </label>
        ))}
      </div>
      {includedOptions.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium">Inclus dans le voyage, sans supplément :</p>
          <ul className="flex flex-col gap-1 text-sm text-foreground/80">
            {includedOptions.map((option) => (
              <li key={option.id} className="flex items-center gap-2">
                <span aria-hidden="true" className="text-sky-600">✓</span>
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </fieldset>
  );
}

function NotCumulativeWith({
  option,
  allOptions,
}: {
  option: TripOption;
  allOptions: TripOption[];
}) {
  const others = allOptions.filter(
    (o) => o.id !== option.id && option.exclusiveGroup && o.exclusiveGroup === option.exclusiveGroup,
  );
  if (others.length === 0) return null;

  return (
    <span className="block text-xs text-foreground/60">
      Non cumulable avec : {others.map((o) => o.label).join(", ")}
    </span>
  );
}
