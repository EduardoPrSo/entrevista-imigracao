'use client'

import Image from 'next/image'
import { useEffect } from 'react'

interface CertificateProps {
    isFullscreen: boolean
    certificateColor: string
    emissionDate: string
    certificateNumber: string
    emittedBy: string
    onToggleFullscreen: () => void
}

export default function Certificate({
    isFullscreen,
    certificateColor,
    emissionDate,
    certificateNumber,
    emittedBy,
    onToggleFullscreen
}: CertificateProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                onToggleFullscreen()
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [isFullscreen, onToggleFullscreen])

    return (
        <div
            className={`${isFullscreen ? 'fixed inset-0 z-[9999] w-screen h-screen overflow-hidden' : 'relative'}`}
            onClick={isFullscreen ? onToggleFullscreen : undefined}
            style={isFullscreen ? { cursor: 'pointer' } : undefined}
        >
            {isFullscreen && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleFullscreen()
                    }}
                    className="fixed top-4 right-4 z-[10000] bg-black bg-opacity-70 hover:bg-opacity-90 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 hover:scale-110"
                    aria-label="Fechar fullscreen"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
            <div
                className={`relative ${isFullscreen ? 'w-full h-full' : 'w-[1280px] h-[720px]'} overflow-hidden`}
            >
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'url(/bg.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: 1
                    }}
                />

                <div className="relative z-10 p-8 md:p-12 flex flex-col justify-between h-full">
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="text-center mb-6 w-full flex flex-col items-center gap-2">
                            <div className="flex justify-center mb-8">
                                <Image
                                    src="/logo.png"
                                    alt="CFX.XP Logo"
                                    width={isFullscreen ? 384 : 192}
                                    height={isFullscreen ? 128 : 64}
                                    className={`${isFullscreen ? 'w-64 md:w-96' : 'w-32 md:w-48'} object-contain`}
                                />
                            </div>
                            <div
                                className={`w-11/12 text-black font-bold ${isFullscreen ? 'text-3xl md:text-5xl py-6' : 'text-xl md:text-2xl py-4'} px-8 rounded-lg inline-block`}
                                style={{ backgroundColor: certificateColor }}
                            >
                                SISTEMA DE IMIGRAÇÃO - CPX.XP
                            </div>
                            <div className="w-11/12 flex bg-black bg-opacity-90 text-white px-6 py-3 rounded-lg gap-24 justify-center">
                                <div className="flex flex-col justify-between items-center">
                                    <span className={`text-gray-400 ${isFullscreen ? 'text-xl' : 'text-sm'}`}>Data de Emissão</span>
                                    <span className={`font-bold ${isFullscreen ? 'text-2xl' : 'text-base'}`}>{emissionDate}</span>
                                </div>

                                <div className="flex flex-col justify-between items-center">
                                    <span className={`text-gray-400 ${isFullscreen ? 'text-xl' : 'text-sm'}`}>Emitido Por</span>
                                    <span className={`font-bold ${isFullscreen ? 'text-2xl' : 'text-base'}`}>{emittedBy}</span>
                                </div>

                                <div className="flex flex-col justify-between items-center">
                                    <span className={`text-gray-400 ${isFullscreen ? 'text-xl' : 'text-sm'}`}>Cód. Entrevista</span>
                                    <span className={`font-bold ${isFullscreen ? 'text-2xl' : 'text-base'}`}>{certificateNumber}</span>
                                </div>
                            </div>
                            <div className="w-11/12 flex flex-col gap-3 bg-black bg-opacity-90 text-white px-6 py-3 rounded-lg justify-between">
                                <p>Tire uma foto do seu documento comprovando a idade mínima exigida. Caso a imagem seja falsificada, você será <span className="text-red-400">banido permanentemente</span> de todos os servidores do <span className="text-purple-400">Grupo CPX</span>.</p>
                                <p>Garantia de privacidade: Seu documento será revisado apenas no momento da análise e será <span className="text-green-400">excluído permanentemente</span> pela nossa equipe após a verificação. Não armazenamos nenhuma informação, sendo usadas exclusivamente para comprovação.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
