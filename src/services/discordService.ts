import axios from 'axios'
import { DiscordMessage, DiscordChannel, MessageFilter, MessageSearchParams } from '../types/discord'

const DISCORD_API_BASE = 'https://discord.com/api/v10'

class DiscordService {
  private botToken: string

  constructor() {
    this.botToken = process.env.DISCORD_BOT_TOKEN || ''
    if (!this.botToken) {
      throw new Error('DISCORD_BOT_TOKEN não foi configurado')
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bot ${this.botToken}`,
      'Content-Type': 'application/json',
    }
  }

  async getGuildChannels(guildId: string): Promise<DiscordChannel[]> {
    try {
      const response = await axios.get(
        `${DISCORD_API_BASE}/guilds/${guildId}/channels`,
        { headers: this.getHeaders() }
      )
      
      const textChannels = response.data.filter((channel: DiscordChannel) => 
        channel.type === 0 || channel.type === 5
      )
      
      return textChannels
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; statusText?: string; data?: unknown }; message?: string }
      console.error('Erro ao buscar canais da guilda:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      })
      
      if (err.response?.status === 403) {
        throw new Error('Bot não tem permissões para ver os canais desta guilda')
      }
      
      if (err.response?.status === 404) {
        throw new Error('Guilda não encontrada ou bot não está na guilda')
      }
      
      throw new Error(`Falha ao buscar canais da guilda: ${err.message}`)
    }
  }

  async getChannelMessages(
    channelId: string, 
    limit: number = 50,
    before?: string,
    after?: string
  ): Promise<DiscordMessage[]> {
    try {
      const params: Record<string, string | number> = { limit }
      if (before) params.before = before
      if (after) params.after = after

      const response = await axios.get(
        `${DISCORD_API_BASE}/channels/${channelId}/messages`,
        { 
          headers: this.getHeaders(),
          params 
        }
      )

      return response.data
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; statusText?: string; data?: { retry_after?: number }; }; message?: string }
      console.error('Erro ao buscar mensagens do canal:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      })
      
      if (err.response?.status === 403) {
        throw new Error('Bot não tem permissões para ler mensagens deste canal')
      }
      
      if (err.response?.status === 404) {
        throw new Error('Canal não encontrado')
      }
      
      if (err.response?.status === 429) {
        const retryAfter = err.response?.data?.retry_after || 1
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
        throw new Error(`Rate limited. Tente novamente em ${retryAfter} segundos.`)
      }
      
      throw new Error(`Falha ao buscar mensagens do canal: ${err.message}`)
    }
  }

  async searchMessages(params: MessageSearchParams): Promise<DiscordMessage[]> {
    try {
      let allMessages: DiscordMessage[] = []
      const maxMessages = params.limit || 1000
      
      if (params.channelId) {
        const cutoffDate = params.daysBack 
          ? new Date(Date.now() - params.daysBack * 24 * 60 * 60 * 1000)
          : null
        
        let lastMessageId: string | undefined
        let messagesFound = 0
        const maxIterations = 50
        let iteration = 0

        while (messagesFound < maxMessages && iteration < maxIterations) {
          try {
            const batchMessages = await this.getChannelMessages(
              params.channelId,
              100,
              lastMessageId,
              undefined
            )
            
            if (batchMessages.length === 0) {
              break
            }
            
            if (cutoffDate) {
              const oldestMessage = batchMessages[batchMessages.length - 1]
              const oldestMessageDate = new Date(oldestMessage.timestamp)
              
              if (oldestMessageDate < cutoffDate) {
                const recentMessages = batchMessages.filter(m => 
                  new Date(m.timestamp) >= cutoffDate
                )
                allMessages = allMessages.concat(recentMessages)
                break
              }
            }
            
            allMessages = allMessages.concat(batchMessages)
            messagesFound += batchMessages.length
            lastMessageId = batchMessages[batchMessages.length - 1].id
            iteration++
            
            await new Promise(resolve => setTimeout(resolve, 1500))
            
          } catch (error) {
            console.error(`Erro na página ${iteration + 1}:`, error)
            throw error
          }
        }
        
      } else {
        const channels = await this.getGuildChannels(params.guildId)
        
        for (const channel of channels) {
          try {
            const messages = await this.getChannelMessages(
              channel.id, 
              100,
              params.before,
              params.after
            )
            allMessages = allMessages.concat(messages)
            
            await new Promise(resolve => setTimeout(resolve, 200))
          } catch (error) {
            console.error(`Erro ao buscar mensagens do canal ${channel.name}:`, error)
          }
        }
      }

      const filterToApply = params.daysBack 
        ? { ...params.filter, dateFrom: undefined }
        : params.filter
      
      const filteredMessages = this.filterMessages(allMessages, filterToApply)
      
      return filteredMessages
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error)
      throw new Error('Falha ao buscar mensagens')
    }
  }

  private filterMessages(messages: DiscordMessage[], filter: MessageFilter): DiscordMessage[] {
    return messages.filter(message => {
      if (filter.author && !message.author.username.toLowerCase().includes(filter.author.toLowerCase())) {
        return false
      }

      if (filter.content) {
        const searchTerm = filter.content.toLowerCase()
        let found = false
        
        if (message.content && message.content.toLowerCase().includes(searchTerm)) {
          found = true
        }
        
        if (!found && message.embeds && message.embeds.length > 0) {
          for (const embed of message.embeds) {
            if (embed.title && embed.title.toLowerCase().includes(searchTerm)) {
              found = true
              break
            }
            if (embed.description && embed.description.toLowerCase().includes(searchTerm)) {
              found = true
              break
            }
            
            if (embed.description) {
              const jogadorMatch = embed.description.match(/Jogador:\s*\d+(?:\/\d+)?\s+(.+)/)
              if (jogadorMatch) {
                const playerName = jogadorMatch[1].trim()
                const cleanPlayerName = playerName.replace(/\s*\([^)]*\)\s*$/, '').trim()
                
                if (cleanPlayerName.toLowerCase().includes(searchTerm)) {
                  found = true
                  break
                }
              }
            }
            
            if (embed.fields && embed.fields.length > 0) {
              for (const field of embed.fields) {
                if (field.name.toLowerCase().includes(searchTerm) || 
                    field.value.toLowerCase().includes(searchTerm)) {
                  found = true
                  break
                }
              }
              if (found) break
            }
            
            if (embed.footer && embed.footer.text && embed.footer.text.toLowerCase().includes(searchTerm)) {
              found = true
              break
            }
            
            if (embed.author && embed.author.name && embed.author.name.toLowerCase().includes(searchTerm)) {
              found = true
              break
            }
          }
        }
        
        if (!found) return false
      }

      const messageDate = new Date(message.timestamp)
      if (filter.dateFrom) {
        const fromDate = new Date(filter.dateFrom)
        fromDate.setHours(0, 0, 0, 0)
        const messageDateOnly = new Date(messageDate)
        messageDateOnly.setHours(0, 0, 0, 0)
        
        if (messageDateOnly < fromDate) {
          return false
        }
      }
      if (filter.dateTo) {
        const toDate = new Date(filter.dateTo)
        toDate.setHours(23, 59, 59, 999)
        const messageDateOnly = new Date(messageDate)
        
        if (messageDateOnly > toDate) {
          return false
        }
      }

      if (filter.channelId && message.channel_id !== filter.channelId) {
        return false
      }

      if (filter.hasAttachments !== undefined) {
        const hasAttachments = message.attachments && message.attachments.length > 0
        if (filter.hasAttachments !== hasAttachments) {
          return false
        }
      }

      if (filter.hasEmbeds !== undefined) {
        const hasEmbeds = message.embeds && message.embeds.length > 0
        if (filter.hasEmbeds !== hasEmbeds) {
          return false
        }
      }

      return true
    })
  }

  async testBotToken(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${DISCORD_API_BASE}/users/@me`,
        { headers: this.getHeaders() }
      )
      
      if (response.status === 200) {
        return true
      }
      
      return false
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown }; message?: string }
      console.error('Erro ao testar token do bot:', err.response?.data || err.message)
      return false
    }
  }

  async validateBotPermissions(guildId: string): Promise<boolean> {
    try {
      const tokenValid = await this.testBotToken()
      if (!tokenValid) {
        console.error('Token do bot é inválido')
        return false
      }

      const guildResponse = await axios.get(
        `${DISCORD_API_BASE}/guilds/${guildId}`,
        { headers: this.getHeaders() }
      )
      
      if (guildResponse.status === 200) {
        return true
      }
      
      return false
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; statusText?: string; data?: unknown }; message?: string }
      console.error('Erro ao validar permissões do bot:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      })
      
      if (err.response?.status === 401) {
        console.error('Token do bot é inválido ou expirado')
        return false
      }
      
      if (err.response?.status === 403) {
        console.error('Bot não tem permissões para acessar esta guilda')
        return false
      }
      
      if (err.response?.status === 404) {
        console.error('Guilda não encontrada ou bot não está na guilda')
        return false
      }
      
      return false
    }
  }
}

const discordService = new DiscordService()
export default discordService
