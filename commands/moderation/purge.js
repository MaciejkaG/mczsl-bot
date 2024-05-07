import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Czyści kanał')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option =>
            option
                .setName('ilosc_wiadomosci')
                .setDescription('Ilość wiadomości do usunięcia.')
                .setMinValue(1)
                .setMaxValue(500)
                .setRequired(true)
        ),
    async execute(interaction) {
        const messageCount = interaction.options.getInteger('ilosc_wiadomosci');

        await interaction.deferReply();
        const reply = await interaction.fetchReply();

        const allMessages = await interaction.channel.messages.fetch({ limit: messageCount+1 });

        const messagesToDelete = allMessages.filter(message => message.id != reply.id);

        await interaction.channel.bulkDelete(messagesToDelete);

        await interaction.followUp(`Usunięto ${messagesToDelete.size} wiadomości z kanału <#${interaction.channel.id}>`);
    }
}