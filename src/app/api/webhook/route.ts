import { NextRequest, NextResponse } from 'next/server'
import { incrementSendersCount, getImmigrationFormularySettings } from '@/lib/database'

export async function POST(request: NextRequest) {
  console.log('🎯 Webhook POST recebido')
  try {
    const contentType = request.headers.get('content-type')
    console.log('📋 Content-Type:', contentType)

    // Processar envio de certificado com imagens
    if (contentType?.includes('multipart/form-data')) {
      console.log('📦 Processando FormData...')
      // Verificar limite antes de aceitar o envio
      try {
        const settings = await getImmigrationFormularySettings()
        if (settings && settings.limit > 0 && settings.senders_count >= settings.limit) {
          console.log('🚫 Limite atingido, bloqueando envio')
          return NextResponse.json(
            { error: 'Formulário atingiu o limite de envios' },
            { status: 429 }
          )
        }
      } catch (err) {
        console.warn('Falha ao verificar limite no servidor, prosseguindo...', err)
      }
      const formData = await request.formData()
      const certificate = formData.get('certificate') as File
      const image1 = formData.get('image1') as File
      const image2 = formData.get('image2') as File
      const dataStr = formData.get('data') as string
      
      console.log('📁 Arquivos recebidos:', {
        certificate: certificate ? `${certificate.name} (${(certificate.size / 1024 / 1024).toFixed(2)} MB)` : 'Ausente',
        image1: image1 ? `${image1.name} (${(image1.size / 1024 / 1024).toFixed(2)} MB)` : 'Ausente',
        image2: image2 ? `${image2.name} (${(image2.size / 1024 / 1024).toFixed(2)} MB)` : 'Ausente',
        totalSize: certificate && image1 && image2 
          ? `${((certificate.size + image1.size + image2.size) / 1024 / 1024).toFixed(2)} MB` 
          : 'N/A'
      })
      
      // Validar que todos os arquivos foram recebidos
      if (!certificate || !image1 || !image2 || !dataStr) {
        console.error('❌ Arquivos ausentes:', {
          certificate: !!certificate,
          image1: !!image1,
          image2: !!image2,
          data: !!dataStr
        })
        return NextResponse.json(
          { error: 'Arquivos ausentes ou inválidos' },
          { status: 400 }
        )
      }
      
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
        console.error('❌ Erro ao enviar webhook:', {
          status: webhookResponse.status,
          statusText: webhookResponse.statusText,
          error: errorText
        })
        
        // Retornar erro mais específico
        let errorMessage = 'Erro ao enviar para Discord'
        if (webhookResponse.status === 413) {
          errorMessage = 'Arquivos muito grandes para o Discord (limite ~8MB)'
        } else if (webhookResponse.status === 400) {
          errorMessage = 'Formato de arquivo inválido'
        }
        
        return NextResponse.json(
          { error: errorMessage, details: errorText },
          { status: webhookResponse.status }
        )
      }

      // ✅ Incrementar senders_count após webhook bem-sucedido
      console.log('🔢 Incrementando senders_count...')
      const incrementSuccess = await incrementSendersCount()
      if (incrementSuccess) {
        console.log('✅ senders_count incrementado com sucesso')
      } else {
        console.error('⚠️ Erro ao incrementar senders_count')
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