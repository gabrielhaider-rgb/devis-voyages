import type { ReactNode } from "react";

export const inputClass = "w-full rounded-lg border border-foreground/15 bg-background p-2 text-sm";

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className ?? ""}`}>
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
