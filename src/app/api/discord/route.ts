import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import discordService from '@/services/discordService'

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
    const guildId = searchParams.get('guildId')

    if (!guildId) {
      return NextResponse.json(
        { error: 'Guild ID é obrigatório' },
        { status: 400 }
      )
    }

    const channels = await discordService.getGuildChannels(guildId)
    
    return NextResponse.json({ channels })
  } catch (error) {
    console.error('Erro ao buscar canais:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
