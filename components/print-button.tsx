"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700"
    >
      Télécharger le PDF
    </button>
  );
}
