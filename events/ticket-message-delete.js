import { Events } from 'discord.js';

export default {
    name: Events.MessageDelete,
    async execute(message) {
        const ticketData = await message.client.redis.json.get(`ticket:${message.channel.id}`);
        if (ticketData) {
            let transcript = ticketData.transcript;
            let messageIndex = transcript.findIndex(elem => elem.messageId == message.id);

            transcript[messageIndex].deletionTimestamp = Math.floor(new Date().getTime() / 1000);

            await message.client.redis.json.set(`ticket:${message.channel.id}`, `.transcript[${messageIndex}]`, transcript[messageIndex]);
        }
    }
};