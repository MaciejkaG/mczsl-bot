import { Events } from 'discord.js';

export default {
    name: Events.MessageCreate,
    async execute(message) {
        if (await message.client.redis.json.get(`ticket:${message.channel.id}`)) {
            await message.client.redis.json.arrAppend(`ticket:${message.channel.id}`, '.transcript', {
                messageId: message.id,
                createTimestamp: Math.floor(new Date().getTime() / 1000),
                authorName: message.author.username,
                authorId: message.author.id,
                content: message.content,
                attachments: message.attachments.map(attachment => attachment.url),
                deletionTimestamp: null,
            });
        }
    }
};