import { NextResponse } from 'next/server'
import { getImmigrationFormularySettings } from '@/lib/database'

export async function GET() {
  try {
    const settings = await getImmigrationFormularySettings()

    if (!settings) {
      return NextResponse.json({ error: 'Configurações não encontradas' }, { status: 404 })
    }

    return NextResponse.json({
      status: settings.status,
      limit: settings.limit,
      senders_count: settings.senders_count
    })
  } catch (error) {
    console.error('Erro ao buscar status público do formulário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
