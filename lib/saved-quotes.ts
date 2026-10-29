import type { QuoteLine } from "@/lib/price";
import { createClient } from "@/lib/supabase/server";

export type SavedQuote = {
  id: string;
  tripTitle: string;
  destination: string;
  durationDays: number;
  departureDate: string;
  travelers: number;
  lines: QuoteLine[];
  includedAccessibility: string[];
  totalCents: number;
  createdAt: Date;
};

const COLUMNS =
  "id, trip_title, destination, duration_days, departure_date, travelers, lines, included_accessibility, total_cents, created_at";

type QuoteRow = {
  id: string;
  trip_title: string;
  destination: string;
  duration_days: number;
  departure_date: string;
  travelers: number;
  lines: QuoteLine[];
  included_accessibility: string[];
  total_cents: number;
  created_at: string;
};

function toSavedQuote(row: QuoteRow): SavedQuote {
  return {
    id: row.id,
    tripTitle: row.trip_title,
    destination: row.destination,
    durationDays: row.duration_days,
    departureDate: row.departure_date,
    travelers: row.travelers,
    lines: row.lines,
    includedAccessibility: row.included_accessibility,
    totalCents: row.total_cents,
    createdAt: new Date(row.created_at),
  };
}

// Filtre explicite sur le compte : un admin peut lire tous les devis (V4),
// mais « Mes devis » ne doit montrer que les siens.
export async function getMyQuotes(userId: string): Promise<SavedQuote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Lecture des devis impossible : ${error.message}`);
  return (data as QuoteRow[]).map(toSavedQuote);
}

export async function getMyQuote(userId: string, id: string): Promise<SavedQuote | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(COLUMNS)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Lecture du devis impossible : ${error.message}`);
  return data ? toSavedQuote(data as QuoteRow) : null;
}
