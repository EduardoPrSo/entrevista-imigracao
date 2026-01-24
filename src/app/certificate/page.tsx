'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Certificate from '@/components/Certificate'
import ThemeToggle from '@/components/ThemeToggle'
import html2canvas from 'html2canvas'

function CertificateContent() {
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
    userData?: {
      characterName: string
      serverId: string
      realName: string
      birthDate: string
      discordId: string
    }
    totalLogins?: number
    totalBans?: number
    totalRedemptions?: number
    daysSinceCreation?: number
  } | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const [formularyLimit, setFormularyLimit] = useState(0)
  const [sendersCount, setSendersCount] = useState(0)

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
          
          // Buscar limite e contagem de envios (endpoint público)
          fetch('/api/formulary-status')
            .then(res => res.json())
            .then(data => {
              setFormularyLimit(data.limit || 0)
              setSendersCount(data.senders_count || 0)
              
              // Verificar se limite foi atingido (limit > 0 e senders_count >= limit)
              if (data.limit > 0 && data.senders_count >= data.limit) {
                setLimitReached(true)
              }
            })
            .catch(error => console.error('Erro ao buscar limite:', error))
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
      // Validar tamanho do arquivo (máximo 5 MB para upload)
      const maxSize = 5 * 1024 * 1024 // 5 MB
      if (file.size > maxSize) {
        alert(`A imagem é muito grande (${(file.size / 1024 / 1024).toFixed(2)} MB). Por favor, use uma imagem menor que 5 MB.`)
        event.target.value = '' // Limpar input
        return
      }
      
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

    // Verificar limite atual antes de enviar
    try {
      const statusRes = await fetch('/api/formulary-status')
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        if (statusData.limit > 0 && statusData.senders_count >= statusData.limit) {
          alert('Desculpe, o formulário atingiu o limite máximo de envios. Por favor, contacte um administrador.')
          return
        }
      }
    } catch (e) {
      console.warn('Falha ao verificar limite antes do envio, prosseguindo...', e)
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
      // Converter base64 para blob e comprimir se necessário
      const base64ToBlob = async (base64: string, maxSizeMB: number = 2): Promise<Blob> => {
        const parts = base64.split(';base64,')
        const contentType = parts[0].split(':')[1]
        const raw = window.atob(parts[1])
        const rawLength = raw.length
        const uInt8Array = new Uint8Array(rawLength)
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i)
        }
        const blob = new Blob([uInt8Array], { type: contentType })
        
        // Se o blob já estiver abaixo do limite, retornar
        if (blob.size <= maxSizeMB * 1024 * 1024) {
          console.log('✅ Imagem já está dentro do limite:', (blob.size / 1024 / 1024).toFixed(2), 'MB')
          return blob
        }
        
        console.log('⚠️ Imagem muito grande:', (blob.size / 1024 / 1024).toFixed(2), 'MB - Comprimindo...')
        
        // Comprimir imagem
        return new Promise((resolve) => {
          const img = document.createElement('img')
          img.onload = () => {
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height
            
            // Reduzir dimensões se necessário (máximo 1920px na maior dimensão)
            const maxDimension = 1920
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = (height * maxDimension) / width
                width = maxDimension
              } else {
                width = (width * maxDimension) / height
                height = maxDimension
              }
            }
            
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx?.drawImage(img, 0, 0, width, height)
            
            // Tentar diferentes qualidades até encontrar uma que fique abaixo do limite
            let quality = 0.9
            const tryCompress = () => {
              canvas.toBlob(
                (compressedBlob) => {
                  if (compressedBlob) {
                    if (compressedBlob.size <= maxSizeMB * 1024 * 1024 || quality <= 0.5) {
                      console.log('✅ Imagem comprimida:', (compressedBlob.size / 1024 / 1024).toFixed(2), 'MB com qualidade', quality)
                      resolve(compressedBlob)
                    } else {
                      quality -= 0.1
                      tryCompress()
                    }
                  }
                },
                'image/jpeg', // Usar JPEG para melhor compressão
                quality
              )
            }
            tryCompress()
          }
          img.src = base64
        })
      }

      const image1Blob = await base64ToBlob(uploadedImage1, 2)
      const image2Blob = await base64ToBlob(uploadedImage2, 2)
      
      // Validar tamanho total
      const totalSize = certificateBlob.size + image1Blob.size + image2Blob.size
      console.log('📊 Tamanho total do payload:', (totalSize / 1024 / 1024).toFixed(2), 'MB')
      
      if (totalSize > 8 * 1024 * 1024) { // 8 MB
        alert('As imagens são muito grandes. Por favor, use imagens menores (máximo 2 MB cada).')
        return
      }
      
      console.log('✅ Imagens processadas - Img1:', (image1Blob.size / 1024 / 1024).toFixed(2), 'MB, Img2:', (image2Blob.size / 1024 / 1024).toFixed(2), 'MB')

      // Preparar FormData
      console.log('📦 Preparando FormData...')
      const formData = new FormData()
      formData.append('certificate', certificateBlob, 'certificado.png')
      formData.append('image1', image1Blob, 'documento1.png')
      formData.append('image2', image2Blob, 'documento2.png')
      
      const user = session?.user as { id?: string; name?: string; discordId?: string }
      const dataToSend = {
        discordId: user?.discordId || user?.id,
        username: user?.name,
        certificateNumber: certificateData?.number,
        emissionDate: certificateData?.date,
        userData: certificateData?.userData,
        totalLogins: certificateData?.totalLogins,
        totalBans: certificateData?.totalBans,
        totalRedemptions: certificateData?.totalRedemptions,
        daysSinceCreation: certificateData?.daysSinceCreation
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

  /* Função removida - não está sendo utilizada
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
  */

  if (status === 'loading' || !certificateData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  // Verificar se formulário atingiu o limite
  if (limitReached) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card shadow-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={150}
                  height={50}
                  className='[filter:brightness(0)_saturate(100%)_invert(13%)_sepia(72%)_saturate(4844%)_hue-rotate(324deg)_brightness(88%)_contrast(101%)] dark:filter-none'
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user?.name || 'User'}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png'
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                      {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
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

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar ao Dashboard
            </button>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">❌</div>
              <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">
                Formulário Indisponível
              </h1>
              <p className="text-lg text-red-600 dark:text-red-400 mb-6">
                Desculpe, o formulário atingiu o limite máximo de envios. Aguarde a abertura do próximo período.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image
                src="/logo.png"
                alt="Logo"
                width={150}
                height={50}
                className='[filter:brightness(0)_saturate(100%)_invert(13%)_sepia(72%)_saturate(4844%)_hue-rotate(324deg)_brightness(88%)_contrast(101%)] dark:filter-none'
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Image
                  src={session?.user?.image || ''}
                  alt={session?.user?.name || ''}
                  width={32}
                  height={32}
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
              <p className='text-sm mb-4 text-muted-foreground text-center'>O documento precisa ser oficial e legível para garantir a validade da verificação e após análise será excluído permanentemente pela nossa equipe.</p>
              
              {/* Aviso Importante */}
              <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-500 dark:border-red-600 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-red-900 dark:text-red-100 font-bold text-base mb-3 uppercase">⚠️ LEIA COM ATENÇÃO ⚠️</p>
                    <p className="text-red-800 dark:text-red-200 font-semibold text-sm leading-relaxed mb-2">
                      O <span className="text-red-600 dark:text-red-300 font-extrabold text-base uppercase bg-red-200 dark:bg-red-800/50 px-1.5 py-0.5 rounded">certificado</span> precisa aparecer <span className="text-red-600 dark:text-red-300 font-extrabold text-base uppercase bg-red-200 dark:bg-red-800/50 px-1.5 py-0.5 rounded">no fundo</span> das duas fotos!
                    </p>
                    <p className="text-red-800 dark:text-red-200 font-semibold text-sm leading-relaxed mb-2">
                      O <span className="text-red-600 dark:text-red-300 font-extrabold text-base uppercase bg-red-200 dark:bg-red-800/50 px-1.5 py-0.5 rounded">documento</span> precisa estar <span className="text-red-600 dark:text-red-300 font-extrabold text-base uppercase bg-red-200 dark:bg-red-800/50 px-1.5 py-0.5 rounded">100% legível</span> - conseguimos ler todos os dados!
                    </p>
                    <p className="text-red-900 dark:text-red-100 font-bold text-sm mt-3">
                      ❌ Se o certificado não estiver no fundo OU se o documento não estiver legível = RECUSADO INSTANTANEAMENTE!
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coluna 1 */}
                <div className="flex flex-col space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    <Image
                      src="/ex1.png"
                      alt="Exemplo 1"
                      width={400}
                      height={300}
                      className="w-full h-auto rounded-lg mb-4"
                    />
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Tire uma selfie segurando o documento ao lado do rosto e o certificado no fundo, garantindo que ambos estejam visíveis e em foco.
                    </p>
                  </div>

                  <div className="relative">
                    {uploadedImage1 ? (
                      <div className="relative">
                        <Image
                          src={uploadedImage1}
                          alt="Documento 1"
                          width={400}
                          height={256}
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
                          <p className="text-xs text-muted-foreground">PNG, JPG (MAX. 5MB)</p>
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
                    <Image
                      src="/ex2.png"
                      alt="Exemplo 2"
                      width={400}
                      height={300}
                      className="w-full h-auto rounded-lg mb-4"
                    />
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Tire uma foto do documento de identidade (RG ou CNH) mostrando claramente o documento, o certificado com nome completo e data de nascimento.
                    </p>
                  </div>

                  <div className="relative">
                    {uploadedImage2 ? (
                      <div className="relative">
                        <Image
                          src={uploadedImage2}
                          alt="Documento 2"
                          width={400}
                          height={256}
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
                          <p className="text-xs text-muted-foreground">PNG, JPG (MAX. 5MB)</p>
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

export default function CertificatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="text-muted-foreground">Carregando...</div></div>}>
      <CertificateContent />
    </Suspense>
  )
}
