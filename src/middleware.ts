import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes
  if (pathname.startsWith("/admin")) {
    const adminAuth = request.cookies.get("admin_auth")?.value;
    const expectedPassword = process.env.ADMIN_PASSWORD;

    // If no auth cookie or password doesn't match, redirect to login
    if (!adminAuth || adminAuth !== expectedPassword) {
      // Redirect to admin page with login query param
      const loginUrl = new URL("/admin", request.url);
      loginUrl.searchParams.set("login", "1");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
