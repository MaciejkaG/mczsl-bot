import 'dotenv/config';
import { Events, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType } from 'discord.js';
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

        const obj = JSON.parse(fs.readFileSync(path.join(__dirname, '../../ticket-categories.json'), 'utf8')); // Unfortunately there's no simple way to to this in a less ugly manner.
        const ticketCategory = obj.find(category => category.value == val);

        if (category && category.type === 4 && ticketCategory) {
            await interaction.deferReply({ ephemeral: true });

            const channel = await interaction.member.guild.channels.create({ name: `${val}-${interaction.user.id}`, type: ChannelType.GuildText });
            await channel.setParent(category.id);

            const embed = new EmbedBuilder()
                .setColor(0x4400FF)
                .setTitle(`Oto ticket użytkownika ${interaction.user.displayName}`)
                .setDescription(`Kategoria: \`\`${ticketCategory.label}\`\`\nID ticketu: \`\`${channel.id}\`\``)
                .addFields(
                    { name: 'Ważne informacje', value: `Ta konwersacja jest rejestrowana i nawet usunięte wiadomości wraz z załącznikami będą obecne w zapisie ticketa.\n**${ticketCategory.openingMessage}**\nProsimy również o **nie pingowanie administracji serwera** i cierpliwość.`, inline: true }
                )
                .setFooter({ text: 'Designed by Maciejka' });

            const close = new ButtonBuilder()
                .setCustomId('closeTicket')
                .setLabel('Zamknij')
                .setStyle(ButtonStyle.Danger);

            const archive = new ButtonBuilder()
                .setCustomId('downloadTranscript')
                .setLabel('Pobierz zapis konwersacji')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder()
                .addComponents(close, archive);

            await channel.send({ embeds: [embed], components: [row] });

            await interaction.client.redis.json.set(`ticket:${channel.id}`, '$', { authorId: interaction.member.id, openTimestamp: Math.floor(new Date().getTime() / 1000), transcript: [] });

            await interaction.followUp({ content: `Oto nowy kanał specjalnie dla Twojego ticketu: <#${channel.id}>`, ephemeral: true });

            if (process.env.ticket_notification_channel_id) {
                const notificationChannel = await interaction.guild.channels.fetch(process.env.ticket_notification_channel_id);

                const notificationEmbed = new EmbedBuilder()
                    .setColor(0x4400FF)
                    .setTitle(`Otwarto nowy ticket!`)
                    .setDescription(`Kanał: <#${channel.id}>\nTwórca: <@${interaction.member.id}>\nKategoria: \`\`${ticketCategory.label}\`\`\nID ticketu: \`\`${channel.id}\`\``)
                    .setFooter({ text: 'Designed by Maciejka' });

                notificationChannel.send({ embeds: [notificationEmbed] });
            }
            
        }
    },
};