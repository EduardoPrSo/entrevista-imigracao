'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Certificate from '@/components/Certificate'
import ThemeToggle from '@/components/ThemeToggle'
import html2canvas from 'html2canvas'

export default function CertificatePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const certificateRef = useRef<HTMLDivElement>(null)
  const hiddenCertificateRef = useRef<HTMLDivElement>(null)
  const hasLoadedRef = useRef(false)
  const [uploadedImage1, setUploadedImage1] = useState<string | null>(null)
  const [uploadedImage2, setUploadedImage2] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [certificateData, setCertificateData] = useState<{
    color: string
    date: string
    number: string
    by: string
    userData?: any
    totalLogins?: number
    totalBans?: number
    totalRedemptions?: number
  } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && !certificateData && !hasLoadedRef.current) {
      const token = searchParams.get('t')

      if (!token) {
        router.push('/dashboard')
        return
      }

      hasLoadedRef.current = true

      // Buscar dados do servidor usando o token
      fetch(`/api/certificate?token=${token}`)
        .then(res => {
          if (!res.ok) throw new Error('Token inválido')
          return res.json()
        })
        .then(response => {
          setCertificateData(response.data)
        })
        .catch(error => {
          console.error('Erro ao validar certificado:', error)
          router.push('/dashboard')
        })
    }
  }, [status, router, certificateData, searchParams])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Bloquear scroll quando em fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [isFullscreen])

  const handleBack = () => {
    router.push('/dashboard')
  }

  const handleImageUpload = (imageNumber: 1 | 2, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (imageNumber === 1) {
          setUploadedImage1(reader.result as string)
        } else {
          setUploadedImage2(reader.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = (imageNumber: 1 | 2) => {
    if (imageNumber === 1) {
      setUploadedImage1(null)
    } else {
      setUploadedImage2(null)
    }
  }

  const handleSubmit = async () => {
    console.log('🚀 handleSubmit iniciado')
    
    if (!uploadedImage1 || !uploadedImage2 || !hiddenCertificateRef.current) {
      console.log('❌ Validação falhou:', { uploadedImage1: !!uploadedImage1, uploadedImage2: !!uploadedImage2, ref: !!hiddenCertificateRef.current })
      alert('Por favor, envie ambas as imagens.')
      return
    }

    setIsSubmitting(true)
    console.log('✅ Validação passou, iniciando processamento...')

    try {
      console.log('📸 Gerando imagem do certificado...')
      // Gerar imagem do certificado
      const canvas = await html2canvas(hiddenCertificateRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true
      })
      console.log('✅ Canvas gerado:', canvas.width, 'x', canvas.height)

      console.log('🔄 Convertendo certificado para blob...')
      // Converter certificado para blob
      const certificateBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
        }, 'image/png')
      })
      console.log('✅ Certificado blob criado:', certificateBlob.size, 'bytes')

      console.log('🔄 Convertendo imagens base64 para blob...')
      // Converter base64 para blob
      const base64ToBlob = (base64: string) => {
        const parts = base64.split(';base64,')
        const contentType = parts[0].split(':')[1]
        const raw = window.atob(parts[1])
        const rawLength = raw.length
        const uInt8Array = new Uint8Array(rawLength)
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i)
        }
        return new Blob([uInt8Array], { type: contentType })
      }

      const image1Blob = base64ToBlob(uploadedImage1)
      const image2Blob = base64ToBlob(uploadedImage2)
      console.log('✅ Imagens convertidas:', image1Blob.size, 'bytes e', image2Blob.size, 'bytes')

      // Preparar FormData
      console.log('📦 Preparando FormData...')
      const formData = new FormData()
      formData.append('certificate', certificateBlob, 'certificado.png')
      formData.append('image1', image1Blob, 'documento1.png')
      formData.append('image2', image2Blob, 'documento2.png')
      
      const dataToSend = {
        discordId: session?.user?.id,
        username: session?.user?.name,
        certificateNumber: certificateData?.number,
        emissionDate: certificateData?.date,
        userData: certificateData?.userData,
        totalLogins: certificateData?.totalLogins,
        totalBans: certificateData?.totalBans,
        totalRedemptions: certificateData?.totalRedemptions
      }
      console.log('📋 Dados do formulário:', dataToSend)
      formData.append('data', JSON.stringify(dataToSend))

      console.log('🌐 Enviando para /api/webhook...')
      const response = await fetch('/api/webhook', {
        method: 'POST',
        body: formData
      })
      console.log('📡 Resposta recebida:', response.status, response.statusText)

      if (response.ok) {
        console.log('✅ Formulário enviado com sucesso!')
        alert('Formulário enviado com sucesso! Aguarde a análise da equipe.')
        router.push('/dashboard')
      } else {
        console.log('❌ Erro na resposta:', response.status)
        const errorText = await response.text()
        console.log('❌ Corpo do erro:', errorText)
        try {
          const error = JSON.parse(errorText)
          alert(`Erro ao enviar formulário: ${error.error || 'Tente novamente'}`)
        } catch {
          alert(`Erro ao enviar formulário: ${errorText || 'Tente novamente'}`)
        }
      }
    } catch (error) {
      console.error('💥 Erro crítico ao enviar formulário:', error)
      alert('Erro ao enviar formulário. Tente novamente.')
    } finally {
      setIsSubmitting(false)
      console.log('🏁 handleSubmit finalizado')
    }
  }

  const generateImage = async () => {
    if (!certificateRef.current) return

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true
      })

      // Converter para blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Baixar a imagem
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `certificado-${certificateData?.number}.png`
          link.click()
          URL.revokeObjectURL(url)
        }
      }, 'image/png')
    } catch (error) {
      console.error('Erro ao gerar imagem:', error)
    }
  }

  if (status === 'loading' || !certificateData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img
                src={`${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`}
                alt="Logo"
                width={150}
                className='invert dark:invert-0'
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img
                  src={session?.user?.image || ''}
                  alt={session?.user?.name || ''}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium text-foreground">
                  {session?.user?.name}
                </span>
              </div>

              <ThemeToggle />

              <button
                onClick={handleSignOut}
                className="text-sm text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 dark:bg-card dark:hover:bg-card/80 dark:text-gray-300 px-3 py-2 rounded-md transition-colors border border-border dark:border-gray-600"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {!isFullscreen && (
            <div className="mb-6 flex justify-between items-center">
              <button
                onClick={handleBack}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Voltar ao Dashboard
              </button>
            </div>
          )}

          {!isFullscreen && (
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h1 className="text-2xl font-bold mb-6 text-foreground text-center">
                Certificado de Imigração
              </h1>

              <div className="flex flex-col items-center space-y-4">
                <p className="text-muted-foreground text-center mb-4">
                  Clique no botão abaixo para visualizar seu certificado em tela cheia
                </p>

                <div className="flex gap-4">
                  <button
                    onClick={handleFullscreen}
                    className="px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-lg"
                  >
                    🖥️ Visualizar Certificado
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isFullscreen && (
            <div className="bg-card rounded-lg shadow-sm border border-border p-6 mt-4">
              <h2 className="text-xl font-bold mb-1 text-foreground text-center">
                Documentos de Verificação
              </h2>
              <p className='text-sm mb-6 text-muted-foreground text-center'>O documento precisa ser oficial e legível para garantir a validade da verificação e após análise será excluído permanentemente pela nossa equipe.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coluna 1 */}
                <div className="flex flex-col space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    <img
                      src="/ex1.png"
                      alt="Exemplo 1"
                      className="w-full h-auto rounded-lg mb-4"
                    />
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Tire uma selfie segurando o documento ao lado do rosto e o certificado no fundo, garantindo que ambos estejam visíveis e em foco.
                    </p>
                  </div>

                  <div className="relative">
                    {uploadedImage1 ? (
                      <div className="relative">
                        <img
                          src={uploadedImage1}
                          alt="Documento 1"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleRemoveImage(1)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors h-6 w-6 flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-12 h-12 mb-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Clique para fazer upload</span>
                          </p>
                          <p className="text-xs text-muted-foreground">PNG, JPG (MAX. 10MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(1, e)}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Coluna 2 */}
                <div className="flex flex-col space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    <img
                      src="/ex2.png"
                      alt="Exemplo 2"
                      className="w-full h-auto rounded-lg mb-4"
                    />
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Tire uma foto do documento de identidade (RG ou CNH) mostrando claramente o documento, o certificado com nome completo e data de nascimento.
                    </p>
                  </div>

                  <div className="relative">
                    {uploadedImage2 ? (
                      <div className="relative">
                        <img
                          src={uploadedImage2}
                          alt="Documento 2"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleRemoveImage(2)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors h-6 w-6 flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-12 h-12 mb-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Clique para fazer upload</span>
                          </p>
                          <p className="text-xs text-muted-foreground">PNG, JPG (MAX. 10MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(2, e)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {uploadedImage1 && uploadedImage2 && (
                <div className="mt-6">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>✓ Enviar Formulário para Análise</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {isFullscreen && (
            <div ref={certificateRef}>
              <Certificate
                isFullscreen={isFullscreen}
                certificateColor={certificateData.color}
                emissionDate={certificateData.date}
                certificateNumber={certificateData.number}
                emittedBy={certificateData.by}
                onToggleFullscreen={handleFullscreen}
              />
            </div>
          )}

          {/* Certificado oculto para captura */}
          <div className="fixed left-[-9999px] top-0 pointer-events-none">
            <div ref={hiddenCertificateRef}>
              <Certificate
                isFullscreen={false}
                certificateColor={certificateData.color}
                emissionDate={certificateData.date}
                certificateNumber={certificateData.number}
                emittedBy={certificateData.by}
                onToggleFullscreen={() => {}}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
