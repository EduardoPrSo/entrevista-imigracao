'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'

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
  const [userData, setUserData] = useState<UserData>({
    characterName: '',
    serverId: '',
    realName: '',
    birthDate: '',
    discordId: '',
    serverSet: '',
    streamLink: '',
    loginTime: ''
  })

  // Verificar autenticação
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session || !session.user?.hasPermission) {
    router.push('/auth/signin')
    return null
  }

  const handleInputChange = (field: keyof UserData, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar campos obrigatórios
    if (!userData.discordId.trim() || !userData.characterName.trim()) {
      alert('Por favor, preencha pelo menos o Discord ID e o Nome do Personagem')
      return
    }

    setLoading(true)

    // Redirecionar para página de resultados com todos os dados
    const params = new URLSearchParams({
      ...userData,
      // Garantir que campos vazios não quebrem a URL
      characterName: userData.characterName.trim(),
      discordId: userData.discordId.trim()
    })

    router.push(`/analysis?${params.toString()}`)
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src={`${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`}
                alt="Logo" 
                width={150}
                className='invert dark:invert-0'
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img
                  src={session.user.image || ''}
                  alt={session.user.name || ''}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {session.user.name}
                </span>
              </div>

              <ThemeToggle />

              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded-md transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Nova Análise de Candidato
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Preencha as informações do candidato para iniciar a análise completa
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-6">
              {/* Discord ID */}
              <div>
                <label htmlFor="discordId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID Discord <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="discordId"
                  value={userData.discordId}
                  onChange={(e) => handleInputChange('discordId', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-800/70 dark:placeholder-gray-400 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                  placeholder="123456789012345678"
                  required
                />
              </div>

              {/* Nome do Personagem */}
              <div>
                <label htmlFor="characterName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Personagem <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="characterName"
                  value={userData.characterName}
                  onChange={(e) => handleInputChange('characterName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-800/70 dark:placeholder-gray-400 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                  placeholder="Nome do personagem no jogo"
                  required
                />
              </div>

              {/* ID do Servidor */}
              <div>
                <label htmlFor="serverId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID do Servidor
                </label>
                <input
                  type="text"
                  id="serverId"
                  value={userData.serverId}
                  onChange={(e) => handleInputChange('serverId', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-800/70 dark:placeholder-gray-400 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                  placeholder="ID do servidor"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Iniciando análise...
                  </>
                ) : (
                  'Iniciar Análise'
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
