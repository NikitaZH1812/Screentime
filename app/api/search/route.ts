import { NextResponse } from "next/server";
import { missingKeys } from "@/lib/env";
import { searchFilms } from "@/lib/tmdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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
