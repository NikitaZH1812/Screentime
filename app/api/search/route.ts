import { NextResponse } from "next/server";
import { missingKeys, missingSupabaseKeys } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { searchFilms } from "@/lib/tmdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (missingSupabaseKeys().length) {
    return NextResponse.json({ error: "Не налаштовано Supabase" }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  }

  const query = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json([]);

  if (missingKeys().includes("TMDB_API_KEY")) {
    return NextResponse.json(
      { error: "Не налаштовано TMDB_API_KEY" },
      { status: 500 },
    );
  }

  try {
    return NextResponse.json(await searchFilms(query));
  } catch (err) {
    console.error("[search] failed:", err);
    return NextResponse.json({ error: "Пошук не працює" }, { status: 500 });
  }
}
