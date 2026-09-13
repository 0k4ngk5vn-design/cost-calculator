import crypto from "crypto";
import { NextResponse } from "next/server";

import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  hashSessionToken,
} from "@/lib/auth/session";

import { createAdminClient } from "@/lib/supabase/admin";

function hashPin(pin) {
  return crypto.createHash("sha256").update(pin).digest("hex");
}

export async function POST(request) {
  try {
    const body = await request.json();

    const pin = body?.pin?.trim();

    // 정확히 숫자 6자리만 허용
    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        {
          success: false,
          message: "6자리 숫자를 입력해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    const supabase = createAdminClient();

    const pinHash = hashPin(pin);

    // PIN 확인
    const { data: accessCode, error: accessCodeError } = await supabase
      .from("access_codes")
      .select("id")
      .eq("pin_hash", pinHash)
      .eq("active", true)
      .maybeSingle();

    if (accessCodeError) {
      console.error(accessCodeError);

      return NextResponse.json(
        {
          success: false,
          message: "로그인 처리 중 오류가 발생했습니다.",
        },
        {
          status: 500,
        },
      );
    }

    if (!accessCode) {
      return NextResponse.json(
        {
          success: false,
          message: "PIN 번호가 올바르지 않습니다.",
        },
        {
          status: 401,
        },
      );
    }

    // 로그인 성공
    // 랜덤 세션 토큰 생성
    const sessionToken = createSessionToken();

    const tokenHash = hashSessionToken(sessionToken);

    // 30일 유지
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    const { error: sessionError } = await supabase.from("app_sessions").insert({
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    });

    if (sessionError) {
      console.error(sessionError);

      return NextResponse.json(
        {
          success: false,
          message: "세션 생성에 실패했습니다.",
        },
        {
          status: 500,
        },
      );
    }

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,

      secure: process.env.NODE_ENV === "production",

      sameSite: "lax",

      path: "/",

      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "로그인 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}
