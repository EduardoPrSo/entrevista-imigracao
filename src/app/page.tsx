'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Ainda carregando

    if (!session) {
      // Não logado, redirecionar para login
      router.push('/auth/signin')
    } else {
      const user = session.user as { hasPermission?: boolean } | undefined
      if (user?.hasPermission) {
        // Logado e com permissão, redirecionar para dashboard
        router.push('/dashboard')
      } else {
        // Logado mas sem permissão, redirecionar para erro
        router.push('/auth/error?error=AccessDenied')
      }
    }
  }, [session, status, router])

  // Mostrar loading enquanto verifica autenticação
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Verificando autenticação...</p>
      </div>
    </div>
  )
}
