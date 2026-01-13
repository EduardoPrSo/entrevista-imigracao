'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import ThemeToggle from '@/components/ThemeToggle'
import MessageList from '@/components/MessageList'
import LoginHistoryDisplay from '@/components/LoginHistoryDisplay'
import { DiscordMessage, DiscordChannel } from '@/types/discord'
import { LoginsByDay } from '@/lib/database'
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

function AnalysisContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [userData, setUserData] = useState<UserData>({
    characterName: searchParams.get('characterName') || '',
    serverId: searchParams.get('serverId') || '',
    realName: searchParams.get('realName') || '',
    birthDate: searchParams.get('birthDate') || '',
    discordId: searchParams.get('discordId') || '',
    serverSet: searchParams.get('serverSet') || '',
    streamLink: searchParams.get('streamLink') || '',
    loginTime: searchParams.get('loginTime') || ''
  })

  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null)
  const [activeTab, setActiveTab] = useState<'logins' | 'redencao' | 'banimentos'>('logins')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  
  const [loginsByDay, setLoginsByDay] = useState<LoginsByDay[]>([])
  const [totalLogins, setTotalLogins] = useState(0)
  const [loginsLoading, setLoginsLoading] = useState(false)
  
  const [redencaoMessages, setRedencaoMessages] = useState<DiscordMessage[]>([])
  const [redencaoLoading, setRedencaoLoading] = useState(false)
  
  const [banimentosMessages, setBanimentosMessages] = useState<DiscordMessage[]>([])
  const [banimentosLoading, setBanimentosLoading] = useState(false)
  
  const [allDataLoaded, setAllDataLoaded] = useState(false)

  const handleInputChange = (field: keyof UserData, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Verificar se usuário está logado
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">Carregando...</div>
      </div>
    )
  }

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  const handleAction = async (action: 'approve' | 'reject', reason?: string) => {
    setActionLoading(action)
    
    try {
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userData,
          analyst: {
            name: session.user?.name,
            id: session.user?.id
          },
          rejectReason: action === 'reject' ? reason : undefined
        }),
      })

      if (response.ok) {
        alert(`Candidato ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso!`)
        setShowRejectModal(false)
        setRejectReason('')
        router.push('/dashboard')
      } else {
        throw new Error('Erro na resposta do servidor')
      }
    } catch (error) {
      console.error(`Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'}:`, error)
      alert(`Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} candidato`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectClick = () => {
    setShowRejectModal(true)
  }

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      alert('Por favor, informe o motivo da rejeição')
      return
    }
    handleAction('reject', rejectReason)
  }

  const handleCancelReject = () => {
    setShowRejectModal(false)
    setRejectReason('')
  }

  const searchDiscordMessages = async (serverConfig: typeof DISCORD_SERVERS.BANS | typeof DISCORD_SERVERS.REDEMPTION, searchTerm: string, setMessages: (msgs: DiscordMessage[]) => void, setLoading: (loading: boolean) => void) => {
    if (!userData.discordId) return

    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  const loadRedencaoMessages = async () => {
    await searchDiscordMessages(DISCORD_SERVERS.REDEMPTION, 'redencao', setRedencaoMessages, setRedencaoLoading)
  }

  const loadBanimentosMessages = async () => {
    await searchDiscordMessages(DISCORD_SERVERS.BANS, 'ban', setBanimentosMessages, setBanimentosLoading)
  }

  const loadLoginHistory = async () => {
    if (!userData.discordId) return

    setLoginsLoading(true)
    try {
      const response = await fetch(`/api/logins?discordId=${userData.discordId}`)
      
      if (response.ok) {
        const data = await response.json()
        setLoginsByDay(data.loginsByDay)
        setTotalLogins(data.totalLogins)
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de logins:', error)
    } finally {
      setLoginsLoading(false)
    }
  }

  // Carregar todos os dados automaticamente ao montar o componente
  useEffect(() => {
    if (userData.discordId) {
      loadLoginHistory()
      loadRedencaoMessages()
      loadBanimentosMessages()
    }
  }, [userData.discordId])

  // Verificar se todos os dados foram carregados
  useEffect(() => {
    if (!loginsLoading && !redencaoLoading && !banimentosLoading) {
      setAllDataLoaded(true)
    }
  }, [loginsLoading, redencaoLoading, banimentosLoading])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 space-y-10">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image 
                src={`${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`}
                alt="Logo" 
                width={150}
                height={50}
                className='invert dark:invert-0'
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Image
                  src={session.user?.image || ''}
                  alt={session.user?.name || ''}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {session.user?.name}
                </span>
              </div>

              <ThemeToggle />

              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded-md transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        {/* Informações do Candidato */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Informações do Candidato</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Nome do Personagem
              </label>
              <div className="text-lg font-semibold bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">{userData.characterName}</div>
            </div>
            <div>
              <label htmlFor="realName" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Nome Real
              </label>
              <input
                type="text"
                id="realName"
                value={userData.realName}
                onChange={(e) => handleInputChange('realName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                placeholder="Nome real da pessoa"
              />
            </div>
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Data de Nascimento
              </label>
              <input
                type="date"
                id="birthDate"
                value={userData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 dark:text-white bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Discord ID
              </label>
              <div className="text-lg font-mono bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">{userData.discordId}</div>
            </div>
            <div>
              <label htmlFor="serverSet" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Set do Servidor
              </label>
              <input
                type="text"
                id="serverSet"
                value={userData.serverSet}
                onChange={(e) => handleInputChange('serverSet', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                placeholder="Set do personagem no servidor"
              />
            </div>
            <div>
              <label htmlFor="loginTime" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Horário de Login
              </label>
              <input
                type="text"
                id="loginTime"
                value={userData.loginTime}
                onChange={(e) => handleInputChange('loginTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                placeholder="Ex: 19:00 - 23:00"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="streamLink" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Link da Stream
              </label>
              <input
                type="text"
                id="streamLink"
                value={userData.streamLink}
                onChange={(e) => handleInputChange('streamLink', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                placeholder="https://twitch.tv/usuario ou https://youtube.com/..."
              />
            </div>
          </div>
        </div>

        {/* Tabs para diferentes tipos de logs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('logins')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'logins'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Histórico de Logins
              </button>
              <button
                onClick={() => setActiveTab('redencao')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'redencao'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Redenção
              </button>
              <button
                onClick={() => setActiveTab('banimentos')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'banimentos'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Banimentos
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'logins' && (
              <div className="space-y-4">
                {loginsByDay.length > 0 ? (
                  <LoginHistoryDisplay 
                    loginsByDay={loginsByDay} 
                    totalLogins={totalLogins}
                    loading={loginsLoading}
                  />
                ) : loginsLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                    Nenhum login encontrado
                  </div>
                )}
              </div>
            )}

            {activeTab === 'redencao' && (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                        Logs de Redenção
                      </h3>
                      <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                        <p>
                          Histórico de redenção dos últimos {DISCORD_SERVERS.REDEMPTION.daysBack} dias, carregadas automaticamente.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <MessageList messages={redencaoMessages} loading={redencaoLoading} />
              </div>
            )}

            {activeTab === 'banimentos' && (
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                        Logs de Banimentos
                      </h3>
                      <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                        <p>
                          Histórico de banimentos dos últimos {DISCORD_SERVERS.BANS.daysBack} dias, carregado automaticamente.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <MessageList messages={banimentosMessages} loading={banimentosLoading} />
              </div>
            )}
          </div>
        </div>

        {/* Ações de Aprovação/Rejeição */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-4">Decisão Final</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Após analisar os logs do candidato, tome sua decisão:
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={() => handleAction('approve')}
              disabled={actionLoading !== null || !allDataLoaded}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {actionLoading === 'approve' ? 'Aprovando...' : allDataLoaded ? 'Aprovar Candidato' : 'Carregando dados...'}
            </button>
            
            <button
              onClick={handleRejectClick}
              disabled={actionLoading !== null || !allDataLoaded}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {allDataLoaded ? 'Rejeitar Candidato' : 'Carregando dados...'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Rejeição */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Motivo da Rejeição
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Por favor, explique o motivo da rejeição deste candidato:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Digite o motivo da rejeição..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 dark:text-white bg-white dark:bg-gray-700 resize-none"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelReject}
                disabled={actionLoading !== null}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading !== null}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {actionLoading === 'reject' ? 'Rejeitando...' : 'Confirmar Rejeição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Analysis() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">Carregando...</div>
      </div>
    }>
      <AnalysisContent />
    </Suspense>
  )
}