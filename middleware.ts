import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("auth-session")

  // Define protected paths
  const protectedPaths = ["/brands/new", "/brands/[id]/edit", "/admin", "/profile"]

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some((path) => {
    // Convert Next.js dynamic route syntax to regex pattern
    const pattern = path.replace(/\[([^\]]+)\]/g, "([^/]+)")
    const regex = new RegExp(`^${pattern}$`)
    return regex.test(request.nextUrl.pathname)
  })

  // If the path is protected and the user is not authenticated, redirect to login
  if (isProtectedPath && !sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/brands/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico|login|register).*)",
  ],
}
