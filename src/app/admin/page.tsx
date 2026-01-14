'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ThemeToggle from '@/components/ThemeToggle'
import { useState, useEffect } from 'react'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formularyStatus, setFormularyStatus] = useState(1) // 1 = ativo, 0 = desativado
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const checkAdminAndLoadStatus = async () => {
      if (status === 'loading') return

      if (!session) {
        router.push('/auth/signin')
        return
      }

      try {
        // Verificar se é admin
        const adminResponse = await fetch('/api/admin/check')
        const adminData = await adminResponse.json()
        
        if (!adminData.isAdmin) {
          router.push('/dashboard')
          return
        }

        setIsAdmin(true)

        // Carregar status do formulário
        const statusResponse = await fetch('/api/admin/formulary-status')
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          setFormularyStatus(statusData.status)
        }
      } catch (error) {
        console.error('Erro ao verificar admin:', error)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    checkAdminAndLoadStatus()
  }, [session, status, router])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  const handleToggle = async () => {
    setUpdating(true)
    try {
      const newStatus = formularyStatus === 1 ? 0 : 1
      
      const response = await fetch('/api/admin/formulary-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setFormularyStatus(newStatus)
      } else {
        alert('Erro ao atualizar status do formulário')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status do formulário')
    } finally {
      setUpdating(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image 
                src="/logo.png"
                alt="Logo" 
                width={150}
                height={50}
                className='invert dark:invert-0'
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user?.name || 'User'}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-sm font-medium text-foreground">
                  {session?.user?.name}
                </span>
              </div>

              <ThemeToggle />

              <button
                onClick={handleSignOut}
                className="text-sm text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 dark:bg-card dark:hover:bg-card/80 dark:text-gray-300 px-3 py-2 rounded-md transition-colors border border-border dark:border-gray-600"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar ao Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-8 text-foreground">Painel Administrativo</h1>
          
          <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2 text-foreground">Status do Formulário de Imigração</h2>
                <p className="text-muted-foreground">
                  {formularyStatus === 1 
                    ? 'O formulário está ativo e os usuários podem enviar suas respostas.' 
                    : 'O formulário está desativado e os usuários não podem enviar respostas.'}
                </p>
              </div>
              
              <button
                onClick={handleToggle}
                disabled={updating}
                className={`
                  relative inline-flex h-12 w-24 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  ${formularyStatus === 1 ? 'bg-green-500' : 'bg-red-500'}
                  ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span
                  className={`
                    inline-block h-10 w-10 transform rounded-full bg-white transition-transform
                    ${formularyStatus === 1 ? 'translate-x-12' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Status atual:</strong> {formularyStatus === 1 ? 'Ativo ✅' : 'Desativado ❌'}
              </p>
            </div>
          </div>

          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              <strong>⚠️ Atenção:</strong> Quando o formulário estiver desativado, os usuários verão uma mensagem 
              informando que o envio de formulários está temporariamente suspenso.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
