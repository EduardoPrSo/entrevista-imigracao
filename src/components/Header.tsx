'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const { data: session } = useSession()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/admin/check')
        const data = await response.json()
        setIsAdmin(data.isAdmin || false)
      } catch (error) {
        console.error('Erro ao verificar admin:', error)
        setIsAdmin(false)
      }
    }

    if (session) {
      checkAdmin()
    }
  }, [session])

  if (!session) {
    return null
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xl font-bold text-primary hover:opacity-80 transition-opacity">
            Formulário Imigração
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Link 
              href="/admin" 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium"
            >
              Admin
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
