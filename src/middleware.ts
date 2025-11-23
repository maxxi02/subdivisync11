import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { betterFetch } from "@better-fetch/fetch";

type Session = {
  user: {
    id: string;
    email: string;
    name: string;
    role?: string;
    emailVerified: boolean;
  };
};

// Public paths that don't require authentication
const publicPaths = [
  "/",
  "/login",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/privacy-policy",
  "/terms-of-service",
  "/email-verification",
  "/2fa-verification",
  "/verify-email",
];

// Role-based page access control
const rolePageAccess = {
  admin: [
    "/dashboard",
    "/property",
    "/applications",
    "/services",
    "/homeowners",
    "/announcements",
    "/payments",
    "/admin-profile",
    "/settings",
  ],
  tenant: [
    "/homeowner-dashboard",
    "/browse-property",
    "/my-applications",
    "/service-requests",
    "/transactions",
    "/homeowner-profile",
    "/settings",
  ],
  user: [
    "/homeowner-dashboard",
    "/browse-property",
    "/my-applications",
    "/service-requests",
    "/transactions",
    "/homeowner-profile",
    "/settings",
  ],
};

// Default redirect page for each role
const roleDefaultPage = {
  admin: "/dashboard",
  tenant: "/homeowner-dashboard",
  user: "/homeowner-dashboard",
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public paths without authentication
  if (publicPaths.some((path) => pathname === path || pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow API routes and static files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  try {
    // Get session from better-auth
    const { data: session } = await betterFetch<Session>(
      "/api/auth/get-session",
      {
        baseURL: request.nextUrl.origin,
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      }
    );

    // Redirect to login if not authenticated
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check email verification (if required by your app)
    if (!session.user.emailVerified && pathname !== "/email-verification") {
      return NextResponse.redirect(
        new URL("/email-verification", request.url)
      );
    }

    // Normalize role (handle undefined or unexpected roles)
    const userRole = (session.user.role?.toLowerCase() || "user") as keyof typeof rolePageAccess;

    // Get allowed pages for the user's role
    const allowedPages = rolePageAccess[userRole] || rolePageAccess.user;

    // Check if user has access to the requested path
    const hasAccess = allowedPages.some((page) => pathname.startsWith(page));

    if (!hasAccess) {
      // Redirect to default page for their role
      const defaultPage = roleDefaultPage[userRole] || roleDefaultPage.user;
      
      // Prevent redirect loops
      if (pathname === defaultPage) {
        return NextResponse.next();
      }

      return NextResponse.redirect(new URL(defaultPage, request.url));
    }

    // Special case: Redirect authenticated users away from login/signup
    if (pathname === "/login" || pathname === "/sign-up") {
      const defaultPage = roleDefaultPage[userRole] || roleDefaultPage.user;
      return NextResponse.redirect(new URL(defaultPage, request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    
    // On error, redirect to login for protected routes
    if (!publicPaths.some((path) => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (public files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};