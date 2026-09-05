import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Keep in sync with ADMIN_AREA_ROLE_NAMES in src/lib/permissions.ts.
// Duplicated (rather than imported) because this runs on the Edge runtime,
// which can't load the Mongoose-backed permissions module.
const ADMIN_AREA_ROLES = ["superadmin", "admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const roles = token?.roles ?? [];

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!token || !roles.some((role) => ADMIN_AREA_ROLES.includes(role))) {
      const url = new URL("/admin/login", req.url);
      url.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
      return NextResponse.redirect(url);
    }
  } else if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
