import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/verify",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/api/auth/register",
  "/api/auth/verify",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/_next",
  "/favicon.ico",
];

const ADMIN_PATHS = ["/admin", "/api/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
  if (isPublic) {
    return NextResponse.next();
  }

  // Allow static assets
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Not authenticated: redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated but onboarding not complete: redirect to onboarding
  // (unless already on onboarding)
  if (!token.onboardingDone && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  // Onboarding complete but visiting onboarding page: redirect to dashboard
  if (token.onboardingDone && pathname === "/onboarding") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Admin routes: check role
  const isAdminPath = ADMIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
  if (isAdminPath && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect authenticated users away from auth pages to dashboard
  const authPaths = ["/login", "/register"];
  if (authPaths.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
