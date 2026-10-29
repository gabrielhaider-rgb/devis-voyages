import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { answer } from "@/lib/assistant/agent";
import { parseConversation } from "@/lib/assistant/limits";

// Plafonds de messages (migration 006) : par adresse IP et pour tout le site.
// Sans réponse claire de la base, on refuse : mieux vaut un assistant muet qu'une facture.
async function takeSlot(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnue";
  const ipHash = createHash("sha256").update(`devis-voyages:${ip}`).digest("hex");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  const { data, error } = await supabase.rpc("assistant_take_slot", { p_ip_hash: ipHash });
  return !error && data === true;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const conversation = parseConversation(body);
  if (!conversation.ok) {
    return NextResponse.json({ error: conversation.error }, { status: 400 });
  }

  if (!(await takeSlot(request))) {
    return NextResponse.json(
      { error: "L'assistant est très sollicité en ce moment. Réessayez un peu plus tard." },
      { status: 429 },
    );
  }

  try {
    return NextResponse.json(await answer(conversation.messages));
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "L'assistant est très sollicité. Réessayez dans un instant." }, { status: 429 });
    }
    console.error("Assistant :", error instanceof Anthropic.APIError ? `${error.status} ${error.message}` : error);
    return NextResponse.json({ error: "L'assistant est indisponible pour le moment." }, { status: 503 });
  }
}
