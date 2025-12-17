export interface DiscordMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
  };
  timestamp: string;
  channel_id: string;
  guild_id?: string;
  attachments?: DiscordAttachment[];
  embeds?: DiscordEmbed[];
}

export interface DiscordAttachment {
  id: string;
  filename: string;
  size: number;
  url: string;
  proxy_url: string;
  content_type?: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
  footer?: {
    text: string;
    icon_url?: string;
  };
  image?: {
    url: string;
    proxy_url?: string;
    width?: number;
    height?: number;
  };
  thumbnail?: {
    url: string;
    proxy_url?: string;
    width?: number;
    height?: number;
  };
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  guild_id?: string;
}

export interface MessageFilter {
  author?: string;
  content?: string;
  dateFrom?: string;
  dateTo?: string;
  channelId?: string;
  hasAttachments?: boolean;
  hasEmbeds?: boolean;
}

export interface MessageSearchParams {
  guildId: string;
  channelId?: string;
  filter: MessageFilter;
  limit?: number;
  before?: string;
  after?: string;
  daysBack?: number;
}