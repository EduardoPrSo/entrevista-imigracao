import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    
    // Verificar se o usuário tem permissão para acessar rotas protegidas
    if (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/analysis')) {
      if (!token?.hasPermission) {
        return NextResponse.redirect(new URL('/auth/error?error=AccessDenied', req.url))
      }
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/analysis/:path*']
}