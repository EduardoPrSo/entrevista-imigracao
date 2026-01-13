'use client'

import Image from 'next/image'
import { DiscordMessage } from '@/types/discord'

interface MessageListProps {
  messages: DiscordMessage[]
  loading?: boolean
}

export default function MessageList({ messages, loading }: MessageListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 dark:text-gray-400">
        Nenhuma mensagem encontrada
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-start gap-3">
            <Image
              src={message.author.avatar 
                ? `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png`
                : 'https://cdn.discordapp.com/embed/avatars/0.png'
              }
              alt={message.author.username}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {message.author.username}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(message.timestamp).toLocaleString('pt-BR')}
                </span>
              </div>
              
              {message.content && (
                <p className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {message.content.replaceAll("**", " ")}
                </p>
              )}

              {message.embeds && message.embeds.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.embeds.map((embed, idx) => (
                    <div
                      key={idx}
                      className="border-l-4 pl-3 py-2"
                      style={{ borderColor: embed.color ? `#${embed.color.toString(16).padStart(6, '0')}` : '#5865F2' }}
                    >
                      {embed.author && (
                        <div className="flex items-center gap-2 mb-2">
                          {embed.author.icon_url && (
                            <Image
                              src={embed.author.icon_url}
                              alt={embed.author.name}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {embed.author.name}
                          </span>
                        </div>
                      )}

                      {embed.title && (
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {embed.title}
                        </h3>
                      )}

                      {embed.description && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {embed.description}
                        </p>
                      )}

                      {embed.fields && embed.fields.length > 0 && (
                        <div className="mt-2 grid grid-cols-1 gap-2">
                          {embed.fields.map((field, fieldIdx) => (
                            <div key={fieldIdx}>
                              <div className="font-semibold text-sm text-gray-900 dark:text-white">
                                {field.name}
                              </div>
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                {field.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {embed.image && (
                        <Image
                          src={embed.image.url}
                          alt="Embed image"
                          width={500}
                          height={300}
                          className="mt-2 rounded max-w-full"
                        />
                      )}

                      {embed.thumbnail && (
                        <Image
                          src={embed.thumbnail.url}
                          alt="Embed thumbnail"
                          width={80}
                          height={80}
                          className="mt-2 rounded w-20 h-20 float-right"
                        />
                      )}

                      {embed.footer && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {embed.footer.icon_url && (
                            <Image
                              src={embed.footer.icon_url}
                              alt="Footer icon"
                              width={16}
                              height={16}
                              className="w-4 h-4 rounded-full"
                            />
                          )}
                          <span>{embed.footer.text}</span>
                          {embed.timestamp && (
                            <span>• {new Date(embed.timestamp).toLocaleString('pt-BR')}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.attachments.map((attachment) => (
                    <div key={attachment.id}>
                      {attachment.content_type?.startsWith('image/') ? (
                        <Image
                          src={attachment.url}
                          alt={attachment.filename}
                          width={500}
                          height={300}
                          className="rounded max-w-full"
                        />
                      ) : (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          📎 {attachment.filename}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
