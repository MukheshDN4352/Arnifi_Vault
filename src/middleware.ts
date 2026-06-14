import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/auth.config";

// Build an Edge-safe auth instance from the lightweight config only.
// Importing the full `@/lib/auth/auth` here would pull Prisma + bcryptjs into
// the Edge runtime and cause MIDDLEWARE_INVOCATION_FAILED on Vercel.
const { auth } = NextAuth(authConfig);

// Routes accessible without authentication
const PUBLIC_ROUTES = ["/login", "/unauthorized"];

// Authenticated route where users with mustResetPassword are forced to go
const RESET_ROUTE = "/reset-password";

// Routes requiring ADMIN role
const ADMIN_ROUTES = [
  "/users",
  "/companies/new",
  "/clients/new",
  "/documents/new",
  "/checkout-history",
  "/audit-trail",
  "/reports",
];

// Routes available to staff (ADMIN + EMPLOYEE) but not CLIENT. View-only
// directories for companies/clients and their related documents. Note: the
// "/companies/new" and "/clients/new" create routes above are matched first and
// stay ADMIN-only, so employees can browse but not create.
const STAFF_ROUTES = ["/companies", "/clients"];

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const userRole = session?.user?.role;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith(`${route}/`)
  );

  // Allow public routes
  if (isPublicRoute) {
    // Redirect logged-in users away from login page
    if (isLoggedIn && nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Force first-login password reset before anything else
  const mustReset = session?.user?.mustResetPassword;
  const onResetPage = nextUrl.pathname === RESET_ROUTE;
  if (mustReset && !onResetPage) {
    return NextResponse.redirect(new URL(RESET_ROUTE, nextUrl));
  }
  if (!mustReset && onResetPage) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Check admin-only routes
  const isAdminRoute = ADMIN_ROUTES.some(
    (route) =>
      nextUrl.pathname === route || nextUrl.pathname.startsWith(`${route}/`)
  );

  if (isAdminRoute && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", nextUrl));
  }

  // Staff-only (ADMIN + EMPLOYEE) view sections — CLIENT is denied.
  const isStaffRoute = STAFF_ROUTES.some(
    (route) =>
      nextUrl.pathname === route || nextUrl.pathname.startsWith(`${route}/`)
  );
  if (isStaffRoute && userRole !== "ADMIN" && userRole !== "EMPLOYEE") {
    return NextResponse.redirect(new URL("/unauthorized", nextUrl));
  }

  // Document create/edit is admin-only (view is open to all roles)
  if (
    nextUrl.pathname.match(/^\/documents\/[^/]+\/edit$/) &&
    userRole !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     * - api/auth routes (NextAuth handles these)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
