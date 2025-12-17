import NextAuth from 'next-auth'
import DiscordProvider from 'next-auth/providers/discord'
import { NextAuthOptions } from 'next-auth'
import { DISCORD_SERVERS } from '@/config/discord'

// Discord OAuth2 scopes necessários
const scopes = ['identify', 'guilds', 'guilds.members.read'].join(' ')

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: scopes,
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Salvar access token do Discord no JWT
      if (account) {
        token.accessToken = account.access_token
        token.discordId = account.providerAccountId
        // Verificar permissão apenas uma vez no login
        token.hasPermission = await checkUserPermission(account.access_token!, account.providerAccountId!)
      }
      return token
    },
    async session({ session, token }) {
      // Passar informações para a sessão do cliente
      if (session.user) {
        session.accessToken = token.accessToken as string
        session.user.id = token.discordId as string
        session.user.discordId = token.discordId as string
        session.user.hasPermission = token.hasPermission as boolean
      }
      
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}

// Função para verificar se o usuário tem o cargo necessário no servidor IMMIGRATION
async function checkUserPermission(accessToken: string, discordId: string): Promise<boolean> {
  try {
    const IMMIGRATION_GUILD_ID = DISCORD_SERVERS.IMMIGRATION.guildId
    const REQUIRED_ROLE_ID = DISCORD_SERVERS.IMMIGRATION.requiredRoleId
    
    if (!IMMIGRATION_GUILD_ID || !REQUIRED_ROLE_ID) {
      console.warn('IMMIGRATION guild ID ou required role ID não configurados')
      return false
    }

    // Buscar membro no servidor IMMIGRATION
    const response = await fetch(`https://discord.com/api/v10/guilds/${IMMIGRATION_GUILD_ID}/members/${discordId}`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
    })

    if (!response.ok) {
      console.log(`Usuário ${discordId} não encontrado no servidor IMMIGRATION`)
      return false
    }

    const member = await response.json()
    const hasRequiredRole = member.roles.includes(REQUIRED_ROLE_ID)
    
    console.log(`Usuário ${discordId} tem permissão no servidor IMMIGRATION: ${hasRequiredRole}`)
    return hasRequiredRole
    
  } catch (error) {
    console.error('Erro ao verificar permissões do usuário:', error)
    return false
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }