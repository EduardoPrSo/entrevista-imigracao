import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { isUserAdmin, getImmigrationFormularySettings, updateImmigrationFormularyStatus } from '@/lib/database'

export async function GET(request: NextRequest) {
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

    const settings = await getImmigrationFormularySettings()

    if (!settings) {
      return NextResponse.json({ error: 'Configurações não encontradas' }, { status: 404 })
    }

    return NextResponse.json({ status: settings.status })
  } catch (error) {
    console.error('Erro ao buscar status do formulário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

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

    const body = await request.json()
    const { status } = body

    if (status !== 0 && status !== 1) {
      return NextResponse.json({ error: 'Status inválido. Use 0 ou 1' }, { status: 400 })
    }

    const success = await updateImmigrationFormularyStatus(status)

    if (!success) {
      return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 })
    }

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('Erro ao atualizar status do formulário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
