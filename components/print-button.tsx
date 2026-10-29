"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-clay px-4 py-2 font-medium text-cream hover:bg-clay-dark"
    >
      Télécharger le PDF
    </button>
  );
}
