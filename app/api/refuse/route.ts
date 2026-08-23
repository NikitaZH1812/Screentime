import { NextResponse } from "next/server";
import { needsUkrainianAudio, unionSubscriptions } from "@/lib/people";
import { logRefusal } from "@/lib/refusalLog";
import type { Person, RefusalReason } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  people: Person[];
  tmdb_id: number;
  title: string;
  reason: RefusalReason;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const people = body.people ?? [];

  logRefusal({
    timestamp: new Date().toISOString(),
    group: people.map((p) => p.name),
    tmdb_id: body.tmdb_id,
    title: body.title,
    reason: body.reason,
    declared_subscriptions: unionSubscriptions(people),
    requires_ukrainian_audio: needsUkrainianAudio(people),
  });

  return NextResponse.json({ ok: true });
}
