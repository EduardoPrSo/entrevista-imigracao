import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const token = req.auth

  // Verificar se o usuário está autenticado
  if (!token) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  // Verificar se o usuário tem permissão para acessar rotas protegidas
  if (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/analysis')) {
    if (!token?.hasPermission) {
      return NextResponse.redirect(new URL('/auth/error?error=AccessDenied', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/analysis/:path*']
}