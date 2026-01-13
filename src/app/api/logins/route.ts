import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getTotalLogins, getCreatedAt, getBansCount } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const discordId = searchParams.get('discordId')
    const createdAtParam = searchParams.get('createdAt')
    const bansParam = searchParams.get('bans')

    if (!discordId) {
      return NextResponse.json(
        { error: 'Discord ID é obrigatório' },
        { status: 400 }
      )
    }

    if (createdAtParam === 'true') {
      const daysSinceCreation = await getCreatedAt(discordId)
      return NextResponse.json({ 
        daysSinceCreation,
        discordId
      })
    }

    if (bansParam === 'true') {
      const bansCount = await getBansCount(discordId)
      return NextResponse.json({ 
        bansCount,
        discordId
      })
    }

    const totalLogins = await getTotalLogins(discordId)
    
    return NextResponse.json({ 
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
