import { NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth'
  ]

  // Protected routes that require authentication
  const protectedRoutes = [
    '/',
    '/projects',
    '/dashboard',
    '/profile',
    '/settings',
    '/tokens'
  ]

  // API routes that need authentication
  const protectedApiRoutes = [
    '/api/projects',
    '/api/user'
  ]

  // Public API routes (auth endpoints)
  const publicApiRoutes = [
    '/api/auth/signup',
    '/api/auth/login', 
    '/api/auth/verify-otp-simple',
    '/api/auth/verify-login',
    '/api/auth/logout',
    '/api/health'
  ]

  // Check route types
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))
  const isProtectedRoute = protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
  const isProtectedApiRoute = protectedApiRoutes.some(route => pathname.startsWith(route))

  // If it's a public route or public API route, allow access
  if (isPublicRoute || isPublicApiRoute) {
    return response
  }

  // If it's a protected route or protected API route, check authentication
  if (isProtectedRoute || isProtectedApiRoute) {
    try {
      // Get session token from cookies
      const sessionToken = request.cookies.get('session-token')?.value

      if (!sessionToken) {
        // No session token, redirect to auth
        return NextResponse.redirect(new URL('/auth', request.url))
      }

      // For now, just check if session token exists and has reasonable format
      // TODO: Implement proper session validation when Edge Runtime crypto is resolved
      if (sessionToken.length < 10) {
        // Invalid session token format, redirect to auth
        const response = NextResponse.redirect(new URL('/auth', request.url))
        response.cookies.delete('session-token')
        return response
      }

      // Session token exists and has reasonable format, continue
      return response

    } catch (error) {
      console.error('Auth middleware error:', error)
      // On error, redirect to auth
      const response = NextResponse.redirect(new URL('/auth', request.url))
      response.cookies.delete('session-token')
      return response
    }
  }

  // For other routes (static files, etc.), allow access
  return response
}