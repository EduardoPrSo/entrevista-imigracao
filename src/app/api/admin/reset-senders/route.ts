import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { isUserAdmin, resetSendersCount } from '@/lib/database'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const discordId = (session.user as { discordId?: string }).discordId

    if (!discordId) {
      return NextResponse.json({ error: 'Discord ID não encontrado' }, { status: 400 })
    }

    const isAdmin = await isUserAdmin(discordId)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const success = await resetSendersCount()

    if (!success) {
      return NextResponse.json({ error: 'Erro ao resetar contagem de envios' }, { status: 500 })
    }

    // Revalidar rotas para sincronizar estado
    revalidatePath('/admin')
    revalidatePath('/certificate')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao resetar senders_count:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
