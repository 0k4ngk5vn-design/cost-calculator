import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "cost-calculator-session";

export function proxy(request) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  /**
   * 1. 인증 관련 API는 항상 허용
   */
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  /**
   * 2. 로그인 페이지는 항상 허용
   *
   * 여기서 sessionToken이 있다고 바로 "/"로 보내지 않는 이유:
   * 쿠키가 존재해도 실제 app_sessions에서
   * 만료되었거나 잘못된 토큰일 수 있기 때문
   */
  if (pathname === "/login") {
    return NextResponse.next();
  }

  /**
   * 3. 세션 쿠키가 없으면 로그인 페이지로 이동
   */
  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);

    return NextResponse.redirect(loginUrl);
  }

  /**
   * 4. 쿠키가 있으면 우선 통과
   *
   * 실제 세션 유효성 검사는
   * 각 API의 requireAuth()에서 수행
   */
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
