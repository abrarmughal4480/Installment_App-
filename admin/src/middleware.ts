import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname
  const pathname = request.nextUrl.pathname

  // Check if the route is an admin route
  if (pathname.startsWith('/dashboard/admin-dashboard')) {
    // Get the token from cookies (we'll set this in the login)
    const token = request.cookies.get('authToken')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '')

    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // For now, let the component handle role verification
    // In production, you could verify the token with the backend here
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/admin-dashboard/:path*',
  ]
}
