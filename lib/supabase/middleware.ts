import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { missingSupabaseKeys } from "@/lib/env";

/** Refreshes the auth session cookie on every request so it never silently expires. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Runs on every request — a throw here takes down the whole site, not
  // just one page. Missing config degrades to "no session" instead.
  if (missingSupabaseKeys().length > 0) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Required: touches the session so @supabase/ssr can refresh an expiring token.
  await supabase.auth.getUser();

  return response;
}
