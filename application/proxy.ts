// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth";

// Public routes that don't require authentication
const publicRoutes = [
  "/login",
  "/signup",
  "/api/auth",
  "/forgot-password",
  "/reset-password",
  "/accept-invitation",
];

// Routes that should redirect to app if already authenticated
const authRoutes = ["/login", "/signup"];

// Routes that don't require an organization
const noOrgRequiredRoutes = [
  "/create-organization",
  "/accept-invitation",
  "/api/",
  "/login",
  "/signup",
];

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Check if the route is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isInvitationRoute = pathname.startsWith("/accept-invitation");
  const requiresOrg = !noOrgRequiredRoutes.some((route) =>
    pathname.startsWith(route)
  );

  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // If user is authenticated and trying to access auth pages (without redirect), redirect to home
    if (session && isAuthRoute && !searchParams.get("redirect")) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // If route is public, allow access
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // If user is not authenticated and route is protected, redirect to login
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    // User is authenticated - check organization requirements
    if (requiresOrg) {
      // Use Better Auth's listOrganizations to check if user has any orgs
      const organizations = await auth.api.listOrganizations({
        headers: request.headers,
      });

      // If user has no organization, redirect to create-organization
      if (!organizations || organizations.length === 0) {
        if (pathname !== "/create-organization") {
          return NextResponse.redirect(
            new URL("/create-organization", request.url)
          );
        }
      } else {
        // If user has an org but is on create-organization page, redirect to home
        if (pathname === "/create-organization") {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }
    }

    // User is authenticated and has required org (or doesn't need one)
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);

    // If there's an error checking auth, redirect to login for protected routes
    if (!isPublicRoute) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
