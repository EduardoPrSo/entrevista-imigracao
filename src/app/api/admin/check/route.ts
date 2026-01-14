import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { isUserAdmin } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }

    const discordId = (session.user as { discordId?: string }).discordId

    if (!discordId) {
      return NextResponse.json({ isAdmin: false }, { status: 400 })
    }

    const isAdmin = await isUserAdmin(discordId)

    return NextResponse.json({ isAdmin })
  } catch (error) {
    console.error('Erro ao verificar admin:', error)
    return NextResponse.json({ isAdmin: false }, { status: 500 })
  }
}
