import { NextResponse } from "next/server";
import { pickOne } from "@/lib/claude";
import { missingKeys, missingSupabaseKeys } from "@/lib/env";
import { unionGenreExclusions } from "@/lib/people";
import { createClient } from "@/lib/supabase/server";
import { retrieveCandidates } from "@/lib/tmdb";
import type { BrainLevel, CombinationContext, Era, Person, TimeBucket } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  people: Person[];
  time: TimeBucket;
  brain: BrainLevel;
  genreWish: string | null;
  era: Era;
  kidsInRoom: boolean;
  combination: CombinationContext;
  excludeIds?: number[];
  refusedTitles?: string[];
};

export async function POST(req: Request) {
  const missingAuth = missingSupabaseKeys();
  if (missingAuth.length) {
    return NextResponse.json(
      { error: `Не налаштовано: ${missingAuth.join(", ")}` },
      { status: 500 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  }

  const body = (await req.json()) as Body;
  const people = body.people ?? [];

  if (people.length === 0) {
    return NextResponse.json({ error: "Нікого не обрано" }, { status: 400 });
  }

  const missing = missingKeys();
  if (missing.length) {
    return NextResponse.json(
      {
        error: `Не налаштовано: ${missing.join(", ")}. Локально — у .env.local, на Vercel — у Settings → Environment Variables, і потім Redeploy.`,
      },
      { status: 500 },
    );
  }

  try {
    const { candidates, relaxed } = await retrieveCandidates({
      genreExclusions: unionGenreExclusions(people),
      time: body.time,
      genreWish: body.genreWish,
      era: body.era,
      kidsInRoom: body.kidsInRoom,
      excludeIds: body.excludeIds ?? [],
    });

    const pick = await pickOne({
      people,
      candidates,
      time: body.time,
      brain: body.brain,
      genreWish: body.genreWish,
      era: body.era,
      kidsInRoom: body.kidsInRoom,
      combination: body.combination,
      relaxed,
      refusedTitles: body.refusedTitles ?? [],
    });

    return NextResponse.json(pick);
  } catch (err) {
    console.error("[recommend] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Щось пішло не так" },
      { status: 500 },
    );
  }
}
