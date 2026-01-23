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
  const [formularyLimit, setFormularyLimit] = useState(0) // 0 = infinito
  const [sendersCount, setSendersCount] = useState(0)
  const [updating, setUpdating] = useState(false)
  const [limitInput, setLimitInput] = useState('0')
  const [resetLoading, setResetLoading] = useState(false)

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
          setFormularyLimit(statusData.limit || 0)
          setSendersCount(statusData.senders_count || 0)
          setLimitInput(String(statusData.limit || 0))
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

  const handleUpdateLimit = async () => {
    setUpdating(true)
    try {
      const newLimit = parseInt(limitInput, 10)
      
      if (isNaN(newLimit) || newLimit < 0) {
        alert('Por favor, insira um número válido (>= 0)')
        setUpdating(false)
        return
      }

      const response = await fetch('/api/admin/formulary-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: newLimit })
      })

      if (response.ok) {
        const data = await response.json()
        setFormularyLimit(data.limit)
        alert('Limite atualizado com sucesso!')
      } else {
        alert('Erro ao atualizar limite')
      }
    } catch (error) {
      console.error('Erro ao atualizar limite:', error)
      alert('Erro ao atualizar limite')
    } finally {
      setUpdating(false)
    }
  }

  const handleResetSendersCount = async () => {
    if (!confirm('Tem certeza que deseja resetar a contagem de envios para 0?')) {
      return
    }

    setResetLoading(true)
    try {
      const response = await fetch('/api/admin/reset-senders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        setSendersCount(0)
      } else {
        alert('Erro ao resetar contagem de envios')
      }
    } catch (error) {
      console.error('Erro ao resetar:', error)
      alert('Erro ao resetar contagem de envios')
    } finally {
      setResetLoading(false)
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
                className='[filter:brightness(0)_saturate(100%)_invert(13%)_sepia(72%)_saturate(4844%)_hue-rotate(324deg)_brightness(88%)_contrast(101%)] dark:filter-none'
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
          
          {/* Status do Formulário */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-lg mb-6">
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

          {/* Limite de Envios */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-lg mb-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Limite de Envios</h2>
            <p className="text-muted-foreground mb-4">
              {formularyLimit === 0 
                ? 'Limite infinito (0 = sem limite)' 
                : `Limite atual: ${formularyLimit} envios`}
            </p>

            <div className="flex gap-4 mb-4">
              <input
                type="number"
                min="0"
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                placeholder="Digite o novo limite (0 = infinito)"
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleUpdateLimit}
                disabled={updating}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {updating ? 'Atualizando...' : 'Atualizar Limite'}
              </button>
            </div>

            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>💡 Dica:</strong> Use 0 para permitir envios infinitos, ou um número maior que 0 para limitar.
              </p>
            </div>
          </div>

          {/* Contagem de Envios */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-2 text-foreground">Contagem de Envios</h2>
                <p className="text-3xl font-bold text-primary">{sendersCount}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Formulários enviados
                  {formularyLimit > 0 && ` (${Math.round((sendersCount / formularyLimit) * 100)}% do limite)`}
                </p>
              </div>
              <button
                onClick={handleResetSendersCount}
                disabled={resetLoading}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {resetLoading ? 'Resetando...' : 'Resetar Contagem'}
              </button>
            </div>

            {formularyLimit > 0 && (
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((sendersCount / formularyLimit) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
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
