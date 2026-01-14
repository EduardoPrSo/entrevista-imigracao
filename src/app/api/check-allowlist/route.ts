import { NextRequest, NextResponse } from 'next/server'
import { checkAllowlist } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { discordId } = await request.json()

    if (!discordId) {
      return NextResponse.json({ allowed: false }, { status: 400 })
    }

    const allowed = await checkAllowlist(discordId)

    return NextResponse.json({ allowed })
  } catch (error) {
    console.error('Erro ao verificar allowlist:', error)
    return NextResponse.json({ allowed: false }, { status: 500 })
  }
}
