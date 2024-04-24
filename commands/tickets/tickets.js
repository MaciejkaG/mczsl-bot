import 'dotenv/config';
import { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    data: new SlashCommandBuilder()
        .setName('tickets')
        .setDescription('Zarządzaj ticketami')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('notice')
                .setDescription('Utwórz/zaktualizuj powiadomienie o Ticketach w odpowiednim kanale.')
    ),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'notice') {
            interaction.client.channels.fetch(process.env.ticket_notice_channel_id)
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

                        let obj = JSON.parse(fs.readFileSync(path.join(__dirname, '../../ticket-categories.json'), 'utf8'));

                        let options = [];

                        obj.forEach(ticketCategory => {
                            const option = new StringSelectMenuOptionBuilder()
                                .setLabel(ticketCategory.label)
                                .setValue(ticketCategory.value);

                            if (ticketCategory.emoji) {
                                option.setEmoji(ticketCategory.emoji);
                            }

                            if (ticketCategory.description) {
                                option.setDescription(ticketCategory.description);
                            }

                            options.push(option);
                        });

                        const createTicket = new StringSelectMenuBuilder()
                            .setCustomId('ticketcategory')
                            .setPlaceholder('Wybierz kategorię ticketa tutaj')
                            .addOptions(...options);

                        const row = new ActionRowBuilder()
                            .addComponents(createTicket);

                        await channel.send({ components: [row], embeds: [embed] });
                        await interaction.reply({ content: `Utworzono nową wiadomość z informacją o ticketach na kanale <#${channel.id}>`, ephemeral: true });
                    } else {
                        await interaction.reply({ content: "Nie udało się wykonać tej komendy! W konsoli bota zostało wyświetlone więcej informacji.", ephemeral: true });

                        console.log(`${'[BOT]'.blue} Ticket notice channel not found! The ticket notice was not sent.`)
                    }
                });
        }
    }
}