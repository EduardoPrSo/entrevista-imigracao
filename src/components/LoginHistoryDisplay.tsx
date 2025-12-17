'use client'

import { LoginsByDay } from '@/lib/database'

interface LoginHistoryDisplayProps {
  loginsByDay: LoginsByDay[]
  totalLogins: number
  loading?: boolean
}

export default function LoginHistoryDisplay({ 
  loginsByDay, 
  totalLogins,
  loading 
}: LoginHistoryDisplayProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (loginsByDay.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 dark:text-gray-400">
        Nenhum login encontrado para este Discord ID
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      {/* Total de Logins */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Total de Logins
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Histórico completo de conexões
            </p>
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {totalLogins}
          </div>
        </div>
      </div>

      {/* Logins por Dia */}
      <div className="space-y-3">
        {loginsByDay.map((day) => (
          <div
            key={day.date}
            className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header do Dia */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(day.date)}
                </h4>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
                  {day.count} {day.count === 1 ? 'login' : 'logins'}
                </span>
              </div>
            </div>

            {/* Lista de Logins */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {day.logins.map((login, index) => (
                <div
                  key={login.id}
                  className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-green-600 dark:text-green-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Login #{day.count - index}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {login.id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatTime(login.loginAt)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(login.loginAt * 1000).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
