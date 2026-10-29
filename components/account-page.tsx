import type { ReactNode } from "react";

export function AccountPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:py-14">
      <h1 className="text-4xl tracking-tight">{title}</h1>
      {description && <p className="mt-2 text-foreground/70">{description}</p>}
      <div className="mt-6 rounded-2xl border border-sand-deep bg-cream p-6">{children}</div>
    </main>
  );
}
