import type { QuoteLine } from "@/lib/price";
import { displayName } from "@/lib/profile-validation";
import { createClient } from "@/lib/supabase/server";

// Lectures du suivi des devis et des clients (V4). Réservé aux admins par la RLS :
// appeler requireAdmin() avant.

export type ClientInfo = { id: string; name: string; email: string; phone: string | null };

export type AdminQuote = {
  id: string;
  createdAt: Date;
  tripTitle: string;
  destination: string;
  durationDays: number;
  departureDate: string;
  travelers: number;
  lines: QuoteLine[];
  includedAccessibility: string[];
  totalCents: number;
  hasAccessibility: boolean;
  client: ClientInfo;
};

type ProfileRow = { id: string; email: string; first_name: string | null; last_name: string | null; phone: string | null };

function toClient(p: ProfileRow): ClientInfo {
  return { id: p.id, name: displayName({ firstName: p.first_name, lastName: p.last_name, email: p.email }), email: p.email, phone: p.phone };
}

const QUOTE_COLUMNS =
  "id, created_at, trip_title, destination, duration_days, departure_date, travelers, lines, included_accessibility, total_cents, has_accessibility, client:profiles!quotes_user_profile_fkey(id, email, first_name, last_name, phone)";

type QuoteRow = {
  id: string;
  created_at: string;
  trip_title: string;
  destination: string;
  duration_days: number;
  departure_date: string;
  travelers: number;
  lines: QuoteLine[];
  included_accessibility: string[];
  total_cents: number;
  has_accessibility: boolean;
  client: ProfileRow;
};

function toQuote(row: QuoteRow): AdminQuote {
  return {
    id: row.id,
    createdAt: new Date(row.created_at),
    tripTitle: row.trip_title,
    destination: row.destination,
    durationDays: row.duration_days,
    departureDate: row.departure_date,
    travelers: row.travelers,
    lines: row.lines,
    includedAccessibility: row.included_accessibility,
    totalCents: row.total_cents,
    hasAccessibility: row.has_accessibility,
    client: toClient(row.client),
  };
}

export async function getAllQuotes(clientId?: string): Promise<AdminQuote[]> {
  const supabase = await createClient();
  let query = supabase.from("quotes").select(QUOTE_COLUMNS).order("created_at", { ascending: false });
  if (clientId) query = query.eq("user_id", clientId);
  const { data, error } = await query;
  if (error) throw new Error(`Lecture des devis impossible : ${error.message}`);
  return (data as unknown as QuoteRow[]).map(toQuote);
}

export async function getAdminQuote(id: string): Promise<AdminQuote | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("quotes").select(QUOTE_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Lecture du devis impossible : ${error.message}`);
  return data ? toQuote(data as unknown as QuoteRow) : null;
}

export type ClientSummary = ClientInfo & { createdAt: Date; quoteCount: number; quoteTotalCents: number };

// Clients (comptes non admin) avec leur nombre de devis et leur montant total.
// search : filtre sur le nom ou l'email, sans tenir compte des majuscules.
export async function getClients(search = ""): Promise<ClientSummary[]> {
  const supabase = await createClient();
  const [{ data: profiles, error }, { data: quotes, error: quotesError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, first_name, last_name, phone, created_at")
      .eq("role", "client")
      .order("created_at", { ascending: false }),
    supabase.from("quotes").select("user_id, total_cents"),
  ]);
  if (error || quotesError) throw new Error(`Lecture des clients impossible : ${(error ?? quotesError)!.message}`);

  const totals = new Map<string, { count: number; cents: number }>();
  for (const q of quotes) {
    const t = totals.get(q.user_id) ?? { count: 0, cents: 0 };
    t.count += 1;
    t.cents += q.total_cents;
    totals.set(q.user_id, t);
  }

  const needle = search.trim().toLowerCase();
  return profiles
    .map((p) => ({
      ...toClient(p),
      createdAt: new Date(p.created_at),
      quoteCount: totals.get(p.id)?.count ?? 0,
      quoteTotalCents: totals.get(p.id)?.cents ?? 0,
    }))
    .filter((c) => !needle || c.name.toLowerCase().includes(needle) || c.email.toLowerCase().includes(needle));
}

export async function getClient(id: string): Promise<(ClientInfo & { createdAt: Date; role: string }) | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, phone, created_at, role")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Lecture du client impossible : ${error.message}`);
  return data ? { ...toClient(data), createdAt: new Date(data.created_at), role: data.role } : null;
}

export type AdminSummary = ClientInfo & { adminSince: Date | null };

export async function getAdmins(): Promise<AdminSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, phone, admin_since")
    .eq("role", "admin")
    .order("admin_since", { ascending: true });
  if (error) throw new Error(`Lecture des admins impossible : ${error.message}`);
  return data.map((p) => ({ ...toClient(p), adminSince: p.admin_since ? new Date(p.admin_since) : null }));
}
