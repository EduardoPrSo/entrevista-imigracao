'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { DiscordMessage } from '@/types/discord'
import { DISCORD_SERVERS, getDateXDaysAgo } from '@/config/discord'

interface UserData {
  characterName: string
  serverId: string
  realName: string
  birthDate: string
  discordId: string
  serverSet: string
  streamLink: string
  loginTime: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const user = session?.user as { id?: string; discordId?: string; name?: string } | undefined
  const [userData, setUserData] = useState<UserData>({
    characterName: '',
    serverId: '',
    realName: '',
    birthDate: '',
    discordId: user?.discordId || user?.id || '',
    serverSet: '',
    streamLink: '',
    loginTime: ''
  })
  
  const [totalLogins, setTotalLogins] = useState(0)
  const [redencaoMessages, setRedencaoMessages] = useState<DiscordMessage[]>([])
  const [bansCount, setBansCount] = useState(0)
  const [daysSinceCreation, setDaysSinceCreation] = useState(0)
  
  const [allDataLoaded, setAllDataLoaded] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [isFormularyActive, setIsFormularyActive] = useState(true)
  const [checkingFormularyStatus, setCheckingFormularyStatus] = useState(true)
  const [formularyLimit, setFormularyLimit] = useState(0)
  const [sendersCount, setSendersCount] = useState(0)
  const [limitReached, setLimitReached] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [hasAllowlist, setHasAllowlist] = useState(true)
  const [checkingAllowlist, setCheckingAllowlist] = useState(true)

  // Verificar se o formulário está ativo
  useEffect(() => {
    const checkFormularyStatus = async () => {
      try {
        const response = await fetch('/api/formulary-status')
        if (response.ok) {
          const data = await response.json()
          setIsFormularyActive(data.status === 1)
          setFormularyLimit(data.limit || 0)
          setSendersCount(data.senders_count || 0)
          if (data.limit > 0 && data.senders_count >= data.limit) {
            setLimitReached(true)
          } else {
            setLimitReached(false)
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status do formulário:', error)
        setIsFormularyActive(true) // Em caso de erro, considerar ativo
      } finally {
        setCheckingFormularyStatus(false)
      }
    }

    checkFormularyStatus()
  }, [])

  // Verificar se usuário é admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!session) return
      
      try {
        const response = await fetch('/api/admin/check')
        const data = await response.json()
        setIsAdmin(data.isAdmin || false)
      } catch (error) {
        console.error('Erro ao verificar admin:', error)
        setIsAdmin(false)
      }
    }

    checkAdmin()
  }, [session])

  // Verificar allowlist
  useEffect(() => {
    const checkPermission = async () => {
      if (session?.user) {
        const sessionUser = session.user as { id?: string; discordId?: string }
        const discordId = sessionUser.discordId || sessionUser.id
        
        if (discordId) {
          try {
            const response = await fetch('/api/check-allowlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ discordId })
            })
            
            const data = await response.json()
            
            setHasAllowlist(data.allowed)
          } catch (error) {
            console.error('Erro ao verificar permissão:', error)
            setHasAllowlist(false)
          } finally {
            setCheckingAllowlist(false)
          }
        }
      }
    }
    
    checkPermission()
  }, [session])

  // Atualizar o Discord ID quando a sessão carregar
  useEffect(() => {
    const sessionUser = session?.user as { id?: string; discordId?: string } | undefined
    if (sessionUser?.discordId || sessionUser?.id) {
      setUserData(prev => ({
        ...prev,
        discordId: sessionUser.discordId || sessionUser.id || ''
      }))
    }
  }, [session])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  const sessionUser = session?.user as { hasPermission?: boolean } | undefined
  if (!session || !sessionUser?.hasPermission) {
    router.push('/auth/signin')
    return null
  }

  // Verificando allowlist
  if (checkingAllowlist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  // Sem allowlist
  if (!hasAllowlist) {
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
                  {session.user?.image ? (
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
                      {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {session.user?.name}
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

        <div className="flex items-center justify-center px-4 py-20">
          <div className="max-w-2xl w-full bg-card border border-border rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Allowlist Necessária</h1>
            </div>
            
            <p className="text-lg text-muted-foreground mb-6">
              Para preencher o formulário você precisa ter allowlist no Complexo XP.
            </p>
            
            <p className="text-muted-foreground mb-6">
              Entre no Discord para mais informações:
            </p>

            <a 
              href="https://discord.gg/MmVSGBpyJk" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-md transition-colors font-medium mb-8"
            >
              Acessar Discord
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Verificando status do formulário
  if (checkingFormularyStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando disponibilidade...</p>
        </div>
      </div>
    )
  }

  // Formulário desativado
  if (!isFormularyActive) {
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
                  {session.user?.image ? (
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
                      {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {session.user?.name}
                  </span>
                </div>

                {isAdmin && (
                  <Link 
                    href="/admin" 
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium text-sm"
                  >
                    Admin
                  </Link>
                )}

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

        <div className="flex items-center justify-center px-4 py-20">
          <div className="max-w-2xl w-full bg-card border border-border rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Formulário Temporariamente Desativado</h1>
          </div>
          
          <p className="text-lg text-muted-foreground mb-6">
            O envio de formulários está desativado no momento.
          </p>
          
          <p className="text-muted-foreground mb-6">
            Aguarde novas informações da equipe de imigração no Discord do Complexo XP:
          </p>

          <a 
            href="https://discord.gg/MmVSGBpyJk" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-md transition-colors font-medium mb-8"
          >
            Acessar Discord
          </a>
        </div>
        </div>
      </div>
    )
  }

  // Limite de envios atingido
  if (limitReached) {
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

                {isAdmin && (
                  <Link 
                    href="/admin" 
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium text-sm"
                  >
                    Admin
                  </Link>
                )}

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

        <div className="flex items-center justify-center px-4 py-20">
          <div className="max-w-2xl w-full bg-card border border-border rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Formulário Atingiu o Limite</h1>
            </div>
            
            <p className="text-lg text-muted-foreground mb-6">
              Desculpe, o formulário atingiu o limite máximo de envios. Por favor, contacte um administrador.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const handleInputChange = (field: keyof UserData, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getRandomColor = () => {
    const colors = [
      '#8B5CF6', // purple
      '#EC4899', // pink
      '#F59E0B', // amber
      '#10B981', // emerald
      '#3B82F6', // blue
      '#EF4444', // red
      '#14B8A6', // teal
      '#F97316', // orange
      '#A855F7', // purple light
      '#F472B6', // pink light
      '#FB923C', // orange light
      '#FBBF24', // yellow
      '#34D399', // green
      '#60A5FA', // blue light
      '#818CF8', // indigo
      '#C084FC', // violet
      '#F87171', // red light
      '#FB7185', // rose
      '#06B6D4', // cyan
      '#22D3EE', // cyan light
      '#2DD4BF', // teal light
      '#84CC16', // lime
      '#A3E635', // lime light
      '#EAB308', // yellow dark
      '#F59E0B', // amber
      '#DC2626', // red dark
      '#DB2777', // pink dark
      '#9333EA', // purple dark
      '#7C3AED', // violet dark
      '#4F46E5', // indigo dark
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const handleNextStep = async () => {
    // Gerar dados do certificado
    const now = new Date()
    const date = now.toLocaleDateString('pt-BR')
    const number = String(Math.floor(Math.random() * 90000000) + 10000000).padStart(8, '0')
    const color = getRandomColor()
    const by = session.user?.name || 'Sistema'
    
    console.log('📝 Dados do usuário antes de enviar:', userData)
    console.log('📊 Estatísticas:', {
      totalLogins,
      totalBans: bansCount,
      totalRedemptions: redencaoMessages.length,
      daysSinceCreation
    })
    
    try {
      // Enviar para o servidor e obter token seguro (incluindo todos os dados)
      const response = await fetch('/api/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          color, 
          date, 
          number, 
          by,
          userData,
          totalLogins,
          totalBans: bansCount,
          totalRedemptions: redencaoMessages.length,
          daysSinceCreation
        })
      })

      if (response.ok) {
        const { token } = await response.json()
        // Redirecionar com token
        router.push(`/certificate?t=${token}`)
      } else {
        alert('Erro ao gerar certificado. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro ao gerar certificado:', error)
      alert('Erro ao gerar certificado. Tente novamente.')
    }
  }

  const searchDiscordMessages = async (serverConfig: typeof DISCORD_SERVERS.BANS | typeof DISCORD_SERVERS.REDEMPTION, searchTerm: string, setMessages: (msgs: DiscordMessage[]) => void) => {
    if (!userData.discordId) return

    try {
      const dateFrom = getDateXDaysAgo(serverConfig.daysBack)
      
      for (const channelId of serverConfig.channelIds) {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            guildId: serverConfig.guildId,
            channelId: channelId,
            filter: {
              content: userData.discordId,
              dateFrom: dateFrom,
            },
            limit: 5000,
            daysBack: serverConfig.daysBack,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const filteredMessages = data.messages.filter((msg: DiscordMessage) => {
            const content = msg.content?.toLowerCase() || ''
            const embedContent = msg.embeds?.map(e => e.description?.toLowerCase() || '').join(' ') || ''
            const allContent = content + ' ' + embedContent
            
            return allContent.includes(userData.discordId.toLowerCase())
          })
          
          setMessages(filteredMessages)
          break
        }
      }
    } catch (error) {
      console.error(`Erro ao buscar mensagens de ${serverConfig.name}:`, error)
    }
  }

  const loadRedencaoMessages = async () => {
    await searchDiscordMessages(DISCORD_SERVERS.REDEMPTION, 'redencao', setRedencaoMessages)
  }

  const loadLoginHistory = async () => {
    if (!userData.discordId) return

    try {
      const response = await fetch(`/api/logins?discordId=${userData.discordId}`)
      
      if (response.ok) {
        const data = await response.json()
        setTotalLogins(data.totalLogins)
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de logins:', error)
    }
  }

  const loadAccountCreationDate = async () => {
    if (!userData.discordId) return

    try {
      const response = await fetch(`/api/logins?discordId=${userData.discordId}&createdAt=true`)
      
      if (response.ok) {
        const data = await response.json()
        setDaysSinceCreation(data.daysSinceCreation || 0)
      }
    } catch (error) {
      console.error('Erro ao carregar data de criação:', error)
    }
  }

  const loadBansFromDatabase = async () => {
    if (!userData.discordId) return

    try {
      const response = await fetch(`/api/logins?discordId=${userData.discordId}&bans=true`)
      
      if (response.ok) {
        const data = await response.json()
        setBansCount(data.bansCount || 0)
      }
    } catch (error) {
      console.error('Erro ao carregar bans do banco de dados:', error)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userData.characterName.trim()) {
      alert('Por favor, preencha o Nome do Personagem')
      return
    }

    setLoading(true)
    setShowAnalysis(true)
    setAllDataLoaded(false)

    // Carregar todos os dados
    await Promise.all([
      loadLoginHistory(),
      loadAccountCreationDate(),
      loadRedencaoMessages(),
      loadBansFromDatabase()
    ])

    setAllDataLoaded(true)
    setLoading(false)
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
                {session.user?.image ? (
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
                    {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-sm font-medium text-foreground">
                  {session.user?.name}
                </span>
              </div>

              {isAdmin && (
                <Link 
                  href="/admin" 
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium text-sm"
                >
                  Admin
                </Link>
              )}

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

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {!showAnalysis ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-lg shadow-md p-8 border border-border">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Formulário de Imigração CXP XP
                </h2>
                <p className="text-muted-foreground">
                  Preencha suas informações para solicitar a imigração para o servidor
                </p>
              </div>

              <form onSubmit={handleSearch} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Seu Discord ID
                  </label>
                  <div className="w-full px-4 py-3 border border-border rounded-md bg-muted text-muted-foreground font-mono">
                    {userData.discordId || 'Carregando...'}
                  </div>
                </div>

                <div>
                  <label htmlFor="characterName" className="block text-sm font-medium text-foreground mb-2">
                    Nome do Seu Personagem <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="characterName"
                    value={userData.characterName}
                    onChange={(e) => handleInputChange('characterName', e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder-muted-foreground text-foreground bg-input"
                    placeholder="Digite o nome do seu personagem"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="serverId" className="block text-sm font-medium text-foreground mb-2">
                    ID do seu Personagem <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="serverId"
                    value={userData.serverId}
                    onChange={(e) => handleInputChange('serverId', e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder-muted-foreground text-foreground bg-input"
                    placeholder="Digite o ID do seu personagem"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="realName" className="block text-sm font-medium text-foreground mb-2">
                    Seu Nome Real <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="realName"
                    value={userData.realName}
                    onChange={(e) => handleInputChange('realName', e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder-muted-foreground text-foreground bg-input"
                    placeholder="Digite seu nome completo"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="birthDate" className="block text-sm font-medium text-foreground mb-2">
                    Sua Data de Nascimento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="birthDate"
                    value={userData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground bg-input"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="serverSet" className="block text-sm font-medium text-foreground mb-2">
                    Seu Set Atual no Servidor
                  </label>
                  <input
                    type="text"
                    id="serverSet"
                    value={userData.serverSet}
                    onChange={(e) => handleInputChange('serverSet', e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder-muted-foreground text-foreground bg-input"
                    placeholder="Ex: Polícia, Paramédico, Mecânico, etc."
                  />
                </div>

                <div>
                  <label htmlFor="loginTime" className="block text-sm font-medium text-foreground mb-2">
                    Seu Horário Habitual de Jogo
                  </label>
                  <input
                    type="text"
                    id="loginTime"
                    value={userData.loginTime}
                    onChange={(e) => handleInputChange('loginTime', e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder-muted-foreground text-foreground bg-input"
                    placeholder="Ex: 19:00 - 23:00"
                  />
                </div>

                <div>
                  <label htmlFor="streamLink" className="block text-sm font-medium text-foreground mb-2">
                    Link da Sua Stream (Caso faça)
                  </label>
                  <input
                    type="text"
                    id="streamLink"
                    value={userData.streamLink}
                    onChange={(e) => handleInputChange('streamLink', e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder-muted-foreground text-foreground bg-input"
                    placeholder="https://twitch.tv/seu-usuario ou https://youtube.com/..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Carregando dados...
                    </>
                  ) : (
                    'Próxima Etapa'
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <button
              onClick={() => {
                setShowAnalysis(false)
                setAllDataLoaded(false)
              }}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </button>

            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Suas Informações</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Nome do Seu Personagem
                  </label>
                  <input
                    type="text"
                    value={userData.characterName}
                    onChange={(e) => handleInputChange('characterName', e.target.value)}
                    className="w-full text-lg font-semibold bg-input px-3 py-2 rounded text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Seu Nome Real
                  </label>
                  <input
                    type="text"
                    value={userData.realName}
                    onChange={(e) => handleInputChange('realName', e.target.value)}
                    className="w-full text-lg bg-input px-3 py-2 rounded text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Sua Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={userData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    className="w-full text-lg bg-input px-3 py-2 rounded text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Discord ID
                  </label>
                  <div className="text-lg font-mono bg-muted px-3 py-2 rounded text-foreground border border-border">
                    {userData.discordId}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Seu Set Atual
                  </label>
                  <input
                    type="text"
                    value={userData.serverSet}
                    onChange={(e) => handleInputChange('serverSet', e.target.value)}
                    className="w-full text-lg bg-input px-3 py-2 rounded text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Seu Horário de Jogo
                  </label>
                  <input
                    type="text"
                    value={userData.loginTime}
                    onChange={(e) => handleInputChange('loginTime', e.target.value)}
                    className="w-full text-lg bg-input px-3 py-2 rounded text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Link da Sua Stream
                  </label>
                  <input
                    type="text"
                    value={userData.streamLink}
                    onChange={(e) => handleInputChange('streamLink', e.target.value)}
                    className="w-full text-lg bg-input px-3 py-2 rounded text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-ring break-all"
                  />
                </div>
              </div>
            </div>

            {/* Estatísticas Resumidas */}
            {allDataLoaded ? (
              <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <h2 className="text-xl font-semibold mb-6 text-foreground">Estatísticas</h2>
                
                <div className="space-y-4">
                  {/* Logins */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <span className="text-lg font-medium text-foreground">
                        Logins nos últimos 30 dias:
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {totalLogins}
                    </span>
                  </div>

                  {/* Banimentos */}
                  <div className={`flex items-center justify-between p-4 border rounded-lg ${
                    bansCount > 0
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        bansCount > 0
                          ? 'bg-red-100 dark:bg-red-800'
                          : 'bg-green-100 dark:bg-green-800'
                      }`}>
                        <svg className={`w-5 h-5 ${
                          bansCount > 0
                            ? 'text-red-600 dark:text-red-200'
                            : 'text-green-600 dark:text-green-200'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </div>
                      <span className="text-lg font-medium text-foreground">
                        Banimentos nos últimos 45 dias:
                      </span>
                    </div>
                    <span className={`text-2xl font-bold ${
                      bansCount > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {bansCount}
                    </span>
                  </div>

                  {/* Redenção */}
                  <div className={`flex items-center justify-between p-4 border rounded-lg ${
                    redencaoMessages.length > 0 
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
                      : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        redencaoMessages.length > 0 
                          ? 'bg-yellow-100 dark:bg-yellow-800' 
                          : 'bg-green-100 dark:bg-green-800'
                      }`}>
                        <svg className={`w-5 h-5 ${
                          redencaoMessages.length > 0 
                            ? 'text-yellow-600 dark:text-yellow-200' 
                            : 'text-green-600 dark:text-green-200'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-lg font-medium text-foreground">
                        Está no período de redenção:
                      </span>
                    </div>
                    <span className={`text-2xl font-bold ${
                      redencaoMessages.length > 0 
                        ? 'text-yellow-600 dark:text-yellow-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {redencaoMessages.length > 0 ? 'Sim' : 'Não'}
                    </span>
                  </div>

                  {/* Dias desde criação */}
                  <div className={`flex items-center justify-between p-4 border rounded-lg ${
                    daysSinceCreation < 30
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        daysSinceCreation < 30
                          ? 'bg-red-100 dark:bg-red-800'
                          : 'bg-green-100 dark:bg-green-800'
                      }`}>
                        <svg className={`w-5 h-5 ${
                          daysSinceCreation < 30
                            ? 'text-red-600 dark:text-red-200'
                            : 'text-green-600 dark:text-green-200'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-lg font-medium text-foreground">
                        Dias desde a criação:
                      </span>
                    </div>
                    <span className={`text-2xl font-bold ${
                      daysSinceCreation < 30
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {daysSinceCreation}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-lg shadow-sm border border-border p-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                  <p className="text-lg text-muted-foreground">Carregando informações, aguarde...</p>
                </div>
              </div>
            )}

            {/* Botão Próxima Etapa */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Próxima Etapa</h2>
              
              {daysSinceCreation < 30 ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <p className="text-red-800 dark:text-red-200 font-medium">
                    ⚠️ Não é possível prosseguir: A conta precisa ter no mínimo 30 dias. Faltam {30 - daysSinceCreation} dias.
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground mb-6">
                  Todas as verificações foram concluídas com sucesso. Você pode prosseguir para a próxima etapa.
                </p>
              )}
                
                <button
                  onClick={handleNextStep}
                  disabled={!allDataLoaded || daysSinceCreation < 30}
                  className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {!allDataLoaded ? 'Carregando dados...' : 'Próxima Etapa'}
                </button>
              </div>
          </div>
        )}
      </main>
    </div>
  )
}

