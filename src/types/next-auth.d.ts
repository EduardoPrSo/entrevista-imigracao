import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    user: {
      id: string
      discordId?: string
      hasPermission?: boolean
    } & DefaultSession['user']
  }

  interface User {
    discordId?: string
    hasPermission?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    discordId?: string
    hasPermission?: boolean
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    accessToken?: string
    discordId?: string
    hasPermission?: boolean
  }
}