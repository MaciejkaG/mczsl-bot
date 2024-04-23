import { Events } from 'discord.js';
import colors from 'colors';

export default {
    name: Events.ClientReady,
    once: true,
    execute: (client) => {
        console.log(`${'[BOT]'.blue} Logged in as ${client.user.tag}`);
    }
};