import crypto from "crypto";
import { cookies } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";

export const SESSION_COOKIE_NAME = "cost-calculator-session";

// 랜덤 세션 토큰 생성
export function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

// 토큰을 그대로 DB에 저장하지 않고
// SHA-256 hash로 저장
export function hashSessionToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// 현재 요청의 로그인 여부 확인
export async function requireAuth() {
  const cookieStore = await cookies();

  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const tokenHash = hashSessionToken(token);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("app_sessions")
    .select("id, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    console.error("Session lookup error:", error);

    throw new Error("UNAUTHORIZED");
  }

  if (!data) {
    throw new Error("UNAUTHORIZED");
  }

  const expiresAt = new Date(data.expires_at);

  if (expiresAt.getTime() < Date.now()) {
    // 만료된 세션 삭제
    await supabase.from("app_sessions").delete().eq("id", data.id);

    throw new Error("UNAUTHORIZED");
  }

  return {
    sessionId: data.id,
    expiresAt,
  };
}
