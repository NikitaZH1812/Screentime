import { NextResponse } from "next/server";
import { logFeedback } from "@/lib/refusalLog";
import type { Person } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  people: Person[];
  tmdb_id: number;
  title: string;
  watched: boolean;
  liked: boolean | null;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const people = body.people ?? [];

  logFeedback({
    timestamp: new Date().toISOString(),
    group: people.map((p) => p.name),
    tmdb_id: body.tmdb_id,
    title: body.title,
    watched: body.watched,
    liked: body.liked,
  });

  return NextResponse.json({ ok: true });
}
