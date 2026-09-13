import { NextResponse } from "next/server";

import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME, hashSessionToken } from "@/lib/auth/session";

import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const cookieStore = await cookies();

  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const supabase = createAdminClient();

    const tokenHash = hashSessionToken(token);

    await supabase.from("app_sessions").delete().eq("token_hash", tokenHash);
  }

  const response = NextResponse.json({
    success: true,
  });

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}
