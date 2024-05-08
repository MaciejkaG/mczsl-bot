import { Events } from 'discord.js';

export default {
    name: Events.ChannelDelete,
    async execute(channel) {
        await channel.client.redis.del(`ticket:${channel.id}`);
    }
};