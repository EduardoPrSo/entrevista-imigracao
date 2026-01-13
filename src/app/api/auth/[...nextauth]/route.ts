import NextAuth from 'next-auth/next'
import DiscordProvider from 'next-auth/providers/discord'
import { checkAllowlist } from '@/lib/database'

// Discord OAuth2 scopes necessários
const scopes = ['identify'].join(' ')

export const authOptions = {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, account }: { token: any; account: any }) {
      // Salvar access token do Discord no JWT
      if (account) {
        token.accessToken = account.access_token
        token.discordId = account.providerAccountId
        // Verificar permissão no banco de dados
        token.hasPermission = await checkAllowlist(account.providerAccountId!)
      }
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: any }) {
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

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }