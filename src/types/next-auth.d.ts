declare module 'next-auth' {
  interface Session {
    accessToken?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      discordId?: string
      hasPermission?: boolean
    }
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