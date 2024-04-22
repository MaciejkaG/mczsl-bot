import { Events, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import colors from 'colors';

export default {
    name: Events.ClientReady,
    once: true,
    execute: (client) => {
        console.log(`${'[BOT]'.blue} Logged in as ${client.user.tag}`);

        client.channels.fetch(process.env.ticket_notice_channel_id)
            .then(async channel => {
                if (channel) {
                    const messages = await channel.messages.fetch({ limit: 100 });
                    const botMessages = messages.filter(message => message.author.bot);

                    await channel.bulkDelete(botMessages);

                    const embed = new EmbedBuilder()
                        .setColor(0x4400FF)
                        .setTitle('Tickety')
                        .setDescription(process.env.ticket_notice_text ? process.env.ticket_notice_text : 'Kliknij poniższy przycisk aby otworzyć nowego ticketa.')
                        .setFooter({ text: 'Designed by Maciejka' });

                    const createTicket = new ButtonBuilder()
                        .setCustomId('createTicket')
                        .setLabel('Otwórz nowego ticketa')
                        .setStyle(ButtonStyle.Primary);

                    const row = new ActionRowBuilder()
                        .addComponents(createTicket);

                    channel.send({ components: [row], embeds: [embed] });
                } else {
                    console.log(`${'[BOT]'.blue} Ticket notice channel not found! The ticket notice was not sent.`)
                }
            });
    }
};