import 'dotenv/config';
import { Events, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType } from 'discord.js';
import colors from 'colors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isStringSelectMenu() || interaction.customId != 'ticketcategory' || !interaction.values) return;
        const val = interaction.values[0];

        const category = interaction.member.guild.channels.cache.get(process.env.ticket_category_id);

        if (category && category.type === 4) {
            const channel = await interaction.member.guild.channels.create({ name: `${val}-${interaction.user.id}`, type: ChannelType.GuildText });
            await channel.setParent(category.id);
            
            const obj = JSON.parse(fs.readFileSync(path.join(__dirname, '../ticket-categories.json'), 'utf8'));
            const ticketCategory = obj.find(category => category.value == val);

            const embed = new EmbedBuilder()
                .setColor(0x4400FF)
                .setTitle(`Oto ticket użytkownika <@${interaction.user.id}>`)
                .setDescription(`Kategoria: ${ticketCategory.label}`)
                .addFields(
                    { name: 'Ważne informacje', value: `**${ticketCategory.openingMessage}**\n\nProsimy również o **nie pingowanie administracji serwera** i cierpliwość.`, inline: true }
                )
                .setFooter({ text: 'Designed by Maciejka' });

            const close = new ButtonBuilder()
                .setCustomId('closeticket')
                .setLabel('Zamknij')
                .setStyle(ButtonStyle.Danger);

            const archive = new ButtonBuilder()
                .setCustomId('pushticket')
                .setLabel('Archiwizuj')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder()
                .addComponents(archive, close);

            await channel.send({ embeds: [embed], components: [row] });

            await interaction.reply({ content: `Oto nowy kanał specjalnie dla Twojego ticketu: <#${channel.id}>`, ephemeral: true });
        }
    },
};