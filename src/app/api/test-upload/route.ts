import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const certificate = formData.get('certificate') as File
    const image1 = formData.get('image1') as File
    const image2 = formData.get('image2') as File
    
    const info = {
      certificate: certificate ? {
        name: certificate.name,
        size: certificate.size,
        sizeMB: (certificate.size / 1024 / 1024).toFixed(2) + ' MB',
        type: certificate.type
      } : null,
      image1: image1 ? {
        name: image1.name,
        size: image1.size,
        sizeMB: (image1.size / 1024 / 1024).toFixed(2) + ' MB',
        type: image1.type
      } : null,
      image2: image2 ? {
        name: image2.name,
        size: image2.size,
        sizeMB: (image2.size / 1024 / 1024).toFixed(2) + ' MB',
        type: image2.type
      } : null,
      totalSize: certificate && image1 && image2 
        ? ((certificate.size + image1.size + image2.size) / 1024 / 1024).toFixed(2) + ' MB'
        : null,
      environment: process.env.VERCEL ? 'Vercel' : 'Local',
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Arquivos recebidos com sucesso!',
      info 
    })
  } catch (error) {
    console.error('Erro no teste:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao processar upload',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
