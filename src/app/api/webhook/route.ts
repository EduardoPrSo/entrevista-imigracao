import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🎯 Webhook POST recebido')
  try {
    const contentType = request.headers.get('content-type')
    console.log('📋 Content-Type:', contentType)

    // Processar envio de certificado com imagens
    if (contentType?.includes('multipart/form-data')) {
      console.log('📦 Processando FormData...')
      const formData = await request.formData()
      const certificate = formData.get('certificate') as File
      const image1 = formData.get('image1') as File
      const image2 = formData.get('image2') as File
      const dataStr = formData.get('data') as string
      console.log('📁 Arquivos recebidos:', {
        certificate: certificate?.size,
        image1: image1?.size,
        image2: image2?.size,
        data: dataStr?.substring(0, 100)
      })
      const data = JSON.parse(dataStr)

      const webhookUrl = process.env.DISCORD_WEBHOOK_APROVADOS
      console.log('🔑 Configurações:', {
        hasWebhookUrl: !!webhookUrl,
        webhookUrl: webhookUrl?.substring(0, 50) + '...'
      })

      if (!webhookUrl) {
        console.log('❌ Configuração ausente')
        return NextResponse.json(
          { error: 'Configuração do Discord não encontrada' },
          { status: 500 }
        )
      }

      // Criar embed
      console.log('📝 Criando embed...')
      const userData = data.userData || {}
      const embed = {
        title: '📋 Novo Formulário de Imigração',
        color: 0xFFB6C1, // Rosa pastel
        fields: [
          {
            name: '👤 Usuário Discord',
            value: `<@${data.discordId}> (${data.username})`,
            inline: false
          },
          {
            name: '🆔 ID do Discord',
            value: data.discordId,
            inline: false
          },
          {
            name: '📄 Certificado Nº',
            value: data.certificateNumber || 'N/A',
            inline: false
          },
          {
            name: '📅 Data de Emissão',
            value: data.emissionDate || 'N/A',
            inline: false
          },
          {
            name: '🎮 Nome do Personagem',
            value: userData.characterName || 'Não informado',
            inline: false
          },
          {
            name: '🌐 ID no Servidor',
            value: userData.serverId || 'Não informado',
            inline: false
          },
          {
            name: '👨 Nome Real',
            value: userData.realName || 'Não informado',
            inline: false
          },
          {
            name: '🎂 Data de Nascimento',
            value: userData.birthDate ? new Date(userData.birthDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado',
            inline: false
          },
          {
            name: '🖥️ Set de Servidor',
            value: userData.serverSet || 'Não informado',
            inline: false
          },
          {
            name: '📺 Link de Stream',
            value: userData.streamLink || 'Não informado',
            inline: false
          },
          {
            name: '⏰ Horário de Login',
            value: userData.loginTime || 'Não informado',
            inline: false
          },
          {
            name: '📊 Estatísticas',
            value: `🔐 Logins: **${data.totalLogins || 0}**\n⛔ Banimentos: **${data.totalBans || 0}**\n✨ Redenção: **${data.totalRedemptions > 0 ? 'Sim' : 'Não'}**`,
            inline: false
          },
          {
            name: '📅 Dias desde a criação da conta',
            value: data.daysSinceCreation !== undefined && data.daysSinceCreation !== null 
              ? `**${data.daysSinceCreation}** dias ${data.daysSinceCreation < 30 ? '⚠️' : '✅'}`
              : 'Não informado',
            inline: false
          }
        ],
        image: {
          url: 'attachment://certificado.png'
        },
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Sistema de Imigração - CPX.XP'
        }
      }

      // Enviar para Discord
      console.log('🌐 Enviando para Discord webhook...')
      const webhookFormData = new FormData()
      webhookFormData.append('payload_json', JSON.stringify({
        embeds: [embed]
      }))
      webhookFormData.append('file1', certificate, 'certificado.png')
      webhookFormData.append('file2', image1, 'documento1.png')
      webhookFormData.append('file3', image2, 'documento2.png')

      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        body: webhookFormData
      })
      console.log('📡 Resposta do Discord:', webhookResponse.status, webhookResponse.statusText)

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text()
        console.error('❌ Erro ao enviar webhook:', errorText)
        return NextResponse.json(
          { error: 'Erro ao enviar para Discord' },
          { status: 500 }
        )
      }

      console.log('✅ Webhook enviado com sucesso!')
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Tipo de conteúdo não suportado' },
      { status: 400 }
    )

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