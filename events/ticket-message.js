import { Events } from 'discord.js';
import colors from 'colors';


export default {
    name: Events.MessageCreate,
    async execute (message) {
        if (await message.client.redis.json.get(`ticket:${message.channel.id}`)) {
            console.log("Its a ticket channel!");
        }
        // console.log(`${'[BOT]'.blue} Logged in as ${client.user.tag}`);
    }
};