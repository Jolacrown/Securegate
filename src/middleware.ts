import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Admin routes — require ADMIN role
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/403", req.url));
      }
    }

    // Protected routes — require email verification
    const protectedPaths = ["/dashboard", "/settings", "/admin"];
    if (
      token &&
      !token.emailVerified &&
      protectedPaths.some((p) => pathname.startsWith(p))
    ) {
      const url = new URL("/auth", req.url);
      url.searchParams.set("mode", "verify-pending");
      if (token.email) url.searchParams.set("email", token.email);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes — always accessible
        const publicPaths = [
          "/auth",
          "/403",
          "/verify-email",
        ];
        if (publicPaths.some((p) => pathname.startsWith(p))) {
          return true;
        }

        // All other matched routes require a valid token
        return !!token;
      },
    },
    pages: {
      signIn: "/auth",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
