export const DISCORD_SERVERS = {
  BANS: {
    guildId: '1194111907016216657',
    channelIds: ['1194113802141171762'],
    name: 'Banimentos',
    daysBack: 45
  },
  REDEMPTION: {
    guildId: '915810924349231135',
    channelIds: ['1406008778377269248'],
    name: 'Redenção',
    daysBack: 30
  },
  IMMIGRATION: {
    guildId: '1387242219215261798',
    approvalChannelId: '1387245544757264475',
    rejectionChannelId: '1387245634087817296',
    requiredRoleId: '1387242737572774039',
  }
};

export const getDateXDaysAgo = (days: number): string => {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
};