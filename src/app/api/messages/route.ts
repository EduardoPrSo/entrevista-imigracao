import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import discordService from '@/services/discordService'
import { MessageFilter } from '@/types/discord'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { guildId, channelId, filter, limit, daysBack } = body

    if (!guildId) {
      return NextResponse.json(
        { error: 'Guild ID é obrigatório' },
        { status: 400 }
      )
    }

    const messageFilter: MessageFilter = {
      author: filter?.author,
      content: filter?.content,
      dateFrom: filter?.dateFrom,
      dateTo: filter?.dateTo,
      channelId: filter?.channelId || channelId,
      hasAttachments: filter?.hasAttachments,
      hasEmbeds: filter?.hasEmbeds,
    }

    const messages = await discordService.searchMessages({
      guildId,
      channelId: channelId || undefined,
      filter: messageFilter,
      limit: limit || 1000,
      daysBack: daysBack !== undefined ? daysBack : undefined,
    })
    
    return NextResponse.json({ 
      messages,
      count: messages.length 
    })
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
