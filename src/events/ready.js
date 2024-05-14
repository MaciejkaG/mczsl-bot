import { Events } from 'discord.js';
import tags from '#utils/tags.js';

export default {
    name: Events.ClientReady,
    once: true,
    execute: (client) => {
        console.log(`${tags.bot} Logged in as ${client.user.tag}`);
    }
};