import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "urunana_session";

const PROTECTED_PREFIXES = [
  "/kwandika",
  "/ibyo-nabitse",
  "/igenamiterere",
  "/imenyesha",
  "/ubuyobozi",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    const loginUrl = new URL("/kwinjira", request.url);
    const nextTarget = `${pathname}${search}`;
    if (nextTarget && nextTarget !== "/") {
      loginUrl.searchParams.set("next", nextTarget);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/kwandika",
    "/kwandika/:path*",
    "/ibyo-nabitse",
    "/ibyo-nabitse/:path*",
    "/igenamiterere",
    "/igenamiterere/:path*",
    "/imenyesha",
    "/imenyesha/:path*",
    "/ubuyobozi",
    "/ubuyobozi/:path*",
  ],
};
