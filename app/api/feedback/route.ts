import { NextResponse } from "next/server";
import { getPeople } from "@/lib/people";
import { logFeedback } from "@/lib/refusalLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  personIds: string[];
  tmdb_id: number;
  title: string;
  watched: boolean;
  liked: boolean | null;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const people = getPeople(body.personIds);

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
