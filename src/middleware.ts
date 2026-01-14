import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { checkAllowlist } from '@/lib/database'

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token
    
    // Verificar se o usuário tem permissão para acessar rotas protegidas
    if (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/analysis')) {
      // Verificar allowlist em tempo real no banco de dados
      const discordId = token?.discordId as string
      
      if (!discordId) {
        return NextResponse.redirect(new URL('/auth/error?error=AccessDenied', req.url))
      }
      
      const hasPermission = await checkAllowlist(discordId)
      
      if (!hasPermission) {
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