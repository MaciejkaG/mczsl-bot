import { Events } from 'discord.js';
import colors from 'colors';


export default {
    name: Events.MessageCreate,
    execute: (message) => {
        // console.log(`${'[BOT]'.blue} Logged in as ${client.user.tag}`);
    }
};