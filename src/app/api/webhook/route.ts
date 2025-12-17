import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { DISCORD_SERVERS } from '@/config/discord'
import { getLoginHistory } from '@/lib/database'

interface WebhookData {
  action: 'approve' | 'reject'
  userData: {
    characterName: string
    serverId: string
    realName: string
    birthDate: string
    discordId: string
    serverSet: string
    streamLink: string
    loginTime: string
  }
  analyst: {
    name: string | null | undefined
    id: string | null | undefined
  }
  rejectReason?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user?.hasPermission) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const data: WebhookData = await request.json()
    const { action, userData, analyst, rejectReason } = data

    console.log('Webhook data received:', data)

    const botToken = process.env.DISCORD_BOT_TOKEN
    if (!botToken) {
      console.error('Token do bot não configurado')
      return NextResponse.json(
        { error: 'Token do bot não configurado' },
        { status: 500 }
      )
    }

    // Buscar estatísticas de logins e banimentos
    const { totalLogins } = await getLoginHistory(userData.discordId) || { totalLogins: 0 }
    
    // Buscar banimentos
    let banimentosCount = 0
    try {
      const bansResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guildId: DISCORD_SERVERS.BANS.guildId,
          channelId: DISCORD_SERVERS.BANS.channelIds[0],
          filter: {
            content: userData.discordId,
          },
          limit: 5000,
          daysBack: DISCORD_SERVERS.BANS.daysBack,
        }),
      })
      
      if (bansResponse.ok) {
        const bansData = await bansResponse.json()
        banimentosCount = bansData.messages?.length || 0
      }
    } catch (error) {
      console.error('Erro ao buscar banimentos:', error)
    }

    // Determinar canal
    const channelId = action === 'approve' 
      ? DISCORD_SERVERS.IMMIGRATION.approvalChannelId 
      : DISCORD_SERVERS.IMMIGRATION.rejectionChannelId

    // Criar embed
    const embed = createDiscordEmbed(
      action,
      userData,
      {
        name: analyst.name,
        id: analyst.id,
        image: session.user?.image
      },
      totalLogins,
      banimentosCount,
      rejectReason
    )

    // Enviar mensagem para o Discord
    const discordResponse = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `Analisado por <@${analyst.id || 'Desconhecido'}>`,
          embeds: [embed]
        }),
      }
    )

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text()
      console.error('Erro ao enviar mensagem para o Discord:', errorText)
      return NextResponse.json(
        { error: 'Erro ao enviar mensagem para o Discord' },
        { status: 500 }
      )
    }

    console.log(`Mensagem de ${action === 'approve' ? 'aprovação' : 'rejeição'} enviada com sucesso`)

    return NextResponse.json({
      success: true,
      message: `Notificação de ${action === 'approve' ? 'aprovação' : 'rejeição'} enviada`
    })

  } catch (error) {
    console.error('Erro na API de webhook:', error)
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

function createDiscordEmbed(
  action: 'approve' | 'reject',
  userData: WebhookData['userData'],
  analyst: {
    name: string | null | undefined
    id: string | null | undefined
    image: string | null | undefined
  },
  totalLogins: number,
  banimentosCount: number,
  rejectReason?: string
) {
  const isApproved = action === 'approve'
  const color = isApproved ? 0x00ff00 : 0xff0000
  const status = isApproved ? 'APROVADO' : 'REPROVADO'
  const statusIcon = isApproved ? '✅' : '❌'

  const fields = [
    {
      name: '👤 Nome do Personagem',
      value: userData.characterName || 'Não informado',
      inline: true
    },
    {
      name: '🖥️ ID do Servidor',
      value: userData.serverId || 'Não informado',
      inline: true
    },
    {
      name: '📛 Nome Real',
      value: userData.realName || 'Não informado',
      inline: true
    },
    {
      name: '🎂 Data de Nascimento',
      value: userData.birthDate ? new Date(userData.birthDate).toLocaleDateString('pt-BR') : 'Não informado',
      inline: true
    },
    {
      name: '🆔 ID Discord',
      value: userData.discordId ? `<@${userData.discordId}>` : 'Não informado',
      inline: true
    },
    {
      name: '⚙️ Set no Servidor',
      value: userData.serverSet || 'Não informado',
      inline: true
    },
    {
      name: '📺 Link da Stream',
      value: userData.streamLink || 'Não informado',
      inline: false
    },
    {
      name: '⏰ Horário de Login',
      value: userData.loginTime || 'Não informado',
      inline: true
    },
    {
      name: '📊 Logins nos últimos 30 dias',
      value: totalLogins.toString(),
      inline: true
    },
    {
      name: '⛔ Banimentos nos últimos 45 dias',
      value: banimentosCount.toString(),
      inline: true
    }
  ]

  if (!isApproved && rejectReason) {
    fields.push({
      name: '❌ Motivo da Reprovação',
      value: rejectReason,
      inline: false
    })
  }

  return {
    title: `${statusIcon} Candidato ${status}`,
    description: `Análise do candidato **${userData.characterName}** foi ${isApproved ? 'aprovada' : 'reprovada'}`,
    color: color,
    fields: fields,
    timestamp: new Date().toISOString(),
    footer: {
      text: `Analisado por: ${analyst.name || 'Desconhecido'}`,
      icon_url: analyst.image || undefined
    }
  }
}