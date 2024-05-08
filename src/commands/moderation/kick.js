import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Wyrzuca osobę')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option
                .setName('osoba')
                .setDescription('Osoba do wyrzucenia')
                .setRequired(true)
        )
        .addStringOption(option => 
            option
                .setName('powod')
                .setDescription('Powód wyrzucenia')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('powiadomienie')
                .setDescription('Powiadom osobę o kicku w prywatnej wiadomości. Domyślne: Tak')
                .setRequired(false)
        ),
    async execute(interaction) {
        const user         = interaction.options.getUser('osoba');
        const reason       = interaction.options.getString('powod');
        const notification = interaction.options.getBoolean('powiadomienie') != null ? interaction.options.getBoolean('powiadomienie') : true;

        console.log(interaction.options.getBoolean('powiadomienie'));

        if (notification) {
            await user.send(`Zostałeś wyrzucony z \`\`${interaction.guild.name}\`\` ${reason ? 'za ``' + reason + '``' : 'bez podanego powodu'}.`);
        }

        await interaction.guild.members.cache.get(user.id).kick(reason);

        await interaction.reply(`Wyrzucono <@${user.id}> ${reason ? `za \`\`${reason}\`\`` : 'bez podanego powodu'}.`);
    }
}