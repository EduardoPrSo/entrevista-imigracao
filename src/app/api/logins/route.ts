import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getLoginHistory } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const discordId = searchParams.get('discordId')

    if (!discordId) {
      return NextResponse.json(
        { error: 'Discord ID é obrigatório' },
        { status: 400 }
      )
    }

    const { loginsByDay, totalLogins } = await getLoginHistory(discordId)
    
    return NextResponse.json({ 
      loginsByDay,
      totalLogins,
      discordId
    })
  } catch (error) {
    console.error('Erro ao buscar logins:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
