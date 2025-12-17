'use client'

import { useState } from 'react'
import { MessageFilter } from '@/types/discord'

interface DiscordMessageFilterProps {
  onFilterChange: (filter: MessageFilter) => void
  initialFilter?: MessageFilter
}

export default function DiscordMessageFilter({ 
  onFilterChange, 
  initialFilter 
}: DiscordMessageFilterProps) {
  const [author, setAuthor] = useState(initialFilter?.author || '')
  const [content, setContent] = useState(initialFilter?.content || '')
  const [dateFrom, setDateFrom] = useState(initialFilter?.dateFrom || '')
  const [dateTo, setDateTo] = useState(initialFilter?.dateTo || '')
  const [hasAttachments, setHasAttachments] = useState(initialFilter?.hasAttachments)
  const [hasEmbeds, setHasEmbeds] = useState(initialFilter?.hasEmbeds)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const filter: MessageFilter = {
      author: author || undefined,
      content: content || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      hasAttachments,
      hasEmbeds,
    }
    
    onFilterChange(filter)
  }

  const handleReset = () => {
    setAuthor('')
    setContent('')
    setDateFrom('')
    setDateTo('')
    setHasAttachments(undefined)
    setHasEmbeds(undefined)
    onFilterChange({})
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Autor
          </label>
          <input
            type="text"
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Nome do usuário"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Conteúdo
          </label>
          <input
            type="text"
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Buscar por texto"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Data Inicial
          </label>
          <input
            type="date"
            id="dateFrom"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Data Final
          </label>
          <input
            type="date"
            id="dateTo"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasAttachments === true}
            onChange={(e) => setHasAttachments(e.target.checked ? true : undefined)}
            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Com anexos</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasEmbeds === true}
            onChange={(e) => setHasEmbeds(e.target.checked ? true : undefined)}
            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Com embeds</span>
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Aplicar Filtros
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Limpar
        </button>
      </div>
    </form>
  )
}
