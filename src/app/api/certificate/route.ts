import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Armazenar tokens temporários em memória (em produção, use Redis ou DB)
const certificateTokens = new Map<string, {
  data: any
  expiresAt: number
  used: boolean
}>()

// Limpar tokens expirados a cada 1 minuto
setInterval(() => {
  const now = Date.now()
  for (const [token, data] of certificateTokens.entries()) {
    if (data.expiresAt < now || data.used) {
      certificateTokens.delete(token)
    }
  }
}, 60000)

export async function POST(request: NextRequest) {
  try {
    console.log('[Certificate API] POST - Gerando token')
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('[Certificate API] POST - Usuário não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { color, date, number, by, userData, totalLogins, totalBans, totalRedemptions } = await request.json()
    console.log('[Certificate API] POST - Dados recebidos:', { color, date, number, by, userData, totalLogins, totalBans, totalRedemptions })

    // Gerar token único
    const token = `${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    // Armazenar dados com expiração de 5 minutos
    certificateTokens.set(token, {
      data: { color, date, number, by, userData, totalLogins, totalBans, totalRedemptions },
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutos
      used: false
    })

    console.log('[Certificate API] POST - Token gerado:', token)
    console.log('[Certificate API] POST - Total de tokens:', certificateTokens.size)

    return NextResponse.json({ token })
  } catch (error) {
    console.error('[Certificate API] POST - Erro ao gerar token:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('[Certificate API] GET - Validando token')
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('[Certificate API] GET - Usuário não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    console.log('[Certificate API] GET - Token recebido:', token)
    console.log('[Certificate API] GET - Tokens disponíveis:', Array.from(certificateTokens.keys()))

    if (!token) {
      console.log('[Certificate API] GET - Token não fornecido')
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 })
    }

    const tokenData = certificateTokens.get(token)
    console.log('[Certificate API] GET - Token data:', tokenData)

    if (!tokenData) {
      console.log('[Certificate API] GET - Token inválido ou expirado')
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 404 })
    }

    if (tokenData.used) {
      console.log('[Certificate API] GET - Token já usado')
      return NextResponse.json({ error: 'Token já foi usado' }, { status: 400 })
    }

    if (tokenData.expiresAt < Date.now()) {
      console.log('[Certificate API] GET - Token expirado')
      certificateTokens.delete(token)
      return NextResponse.json({ error: 'Token expirado' }, { status: 400 })
    }

    // Marcar como usado (uso único)
    tokenData.used = true
    console.log('[Certificate API] GET - Token validado com sucesso')

    return NextResponse.json({ data: tokenData.data })
  } catch (error) {
    console.error('[Certificate API] GET - Erro ao validar token:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
