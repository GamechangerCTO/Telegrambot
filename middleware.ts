/**
 * 🛡️ Authentication Middleware
 * Protects routes and handles authentication redirects
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get the pathname from the request URL
  const pathname = request.nextUrl.pathname

  // Check for internal server-to-server calls
  const isInternalCall = request.headers.get('x-internal-automation') === 'true' ||
                        request.headers.get('x-server-call') === 'true';

  // Debug logging for API calls
  if (pathname.startsWith('/api/')) {
    console.log(`🔍 MIDDLEWARE: ${pathname}`);
    console.log(`🔍 Headers check: x-internal-automation = ${request.headers.get('x-internal-automation')}`);
    console.log(`🔍 Is internal call: ${isInternalCall}`);
  }

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register', 
    '/auth/forgot-password',
    '/auth/reset-password',
    '/about',
    '/contact',
    '/privacy',
    '/terms'
  ]

  // Define public API routes
  const publicApiRoutes = [
    '/api/health',
    '/api/public'
  ]

  // Define internal API routes that can be called server-to-server
  const internalApiRoutes = [
    '/api/unified-content',
    '/api/automation',
    '/api/smart-push'
  ]

  const isPublicRoute = publicRoutes.includes(pathname)
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))
  const isInternalApiRoute = internalApiRoutes.some(route => pathname.startsWith(route))

  // If it's a public route or public API, allow access
  if (isPublicRoute || isPublicApiRoute) {
    return response
  }

  // If it's an internal API call with proper headers, allow access
  if (isInternalApiRoute && isInternalCall) {
    console.log(`🔧 Internal API call allowed: ${pathname}`);
    return response
  }

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      console.log(`❌ MIDDLEWARE: 401 Unauthorized for ${pathname} - user: ${!!user}, internal: ${isInternalCall}`);
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // For web routes, redirect to login
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated but trying to access auth pages, redirect to appropriate dashboard
  if (user && pathname.startsWith('/auth/')) {
    // Get user role to determine redirect
    try {
      const { data: manager } = await supabase
        .from('managers')
        .select('role')
        .eq('user_id', user?.id)
        .single()

      const roleBasedRedirect = manager?.role === 'super_admin' ? '/super-admin' : '/dashboard'
      return NextResponse.redirect(new URL(roleBasedRedirect, request.url))
    } catch (error) {
      // Fallback to regular dashboard if role check fails
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Role-based access control for protected routes
  if (user) {
    try {
      const { data: manager } = await supabase
        .from('managers')
        .select('role')
        .eq('user_id', user?.id)
        .single()

      // Super admin routes - only super_admin can access
      if (pathname.startsWith('/super-admin')) {
        if (!manager || manager.role !== 'super_admin') {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }

      // Admin routes - super_admin and manager can access
      if (pathname.startsWith('/admin')) {
        if (!manager || !['super_admin', 'manager'].includes(manager.role)) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }

      // Bot manager routes - all authenticated users can access
      if (pathname.startsWith('/dashboard')) {
        // All authenticated users with any role can access dashboard
        // Role-specific content will be handled in the components
      }

      // API role-based access control
      if (pathname.startsWith('/api/admin/')) {
        if (!manager || !['super_admin', 'manager'].includes(manager.role)) {
          return new NextResponse(
            JSON.stringify({ error: 'Insufficient permissions' }),
            { 
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
      }

      if (pathname.startsWith('/api/super-admin/')) {
        if (!manager || manager.role !== 'super_admin') {
          return new NextResponse(
            JSON.stringify({ error: 'Super admin access required' }),
            { 
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
      }

      // Auto-redirect based on role if accessing root dashboard
      if (pathname === '/dashboard' && manager?.role === 'super_admin') {
        // Super admins can choose to stay on regular dashboard or go to super-admin
        // Let them access regular dashboard but provide navigation to super-admin
      }

    } catch (error) {
      console.error('Error checking user role:', error)
      // Continue with normal flow if role check fails
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 