import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Banuje osobę')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option
                .setName('osoba')
                .setDescription('Osoba do zbanowania')
                .setRequired(true)
        )
        .addStringOption(option => 
            option
                .setName('powod')
                .setDescription('Powód bana')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('powiadomienie')
                .setDescription('Powiadom osobę o banie w prywatnej wiadomości. Domyślne: Tak')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option
                .setName('usun_wiadomosci')
                .setDescription('Zakres czasowy wiadomości wysłanych przez użytkownika do usunięcia. Domyślne: Nie usuwaj')
                .setRequired(false)
                .addChoices(
                    { name: 'Nie usuwaj', value: 0 },
                    { name: '3 godziny', value: 10800 },
                    { name: '6 godzin', value: 21600 },
                    { name: '12 godzin', value: 43200 },
                    { name: '1 dzień', value: 86400 },
                    { name: '3 dni', value: 259200 },
                    { name: '7 dni', value: 604800 }
                )
        ),
    async execute(interaction) {
        const user           = interaction.options.getUser('osoba');

        if (interaction.guild.members.cache.get(user.id) == undefined) {
            interaction.reply({ content: 'Tej osoby nie ma na serwerze!', ephemeral: true });
            return;
        }
        const reason         = interaction.options.getString('powod');
        const notification   = interaction.options.getBoolean('powiadomienie') != null ? interaction.options.getBoolean('powiadomienie') : true;
        const deleteMessages = interaction.options.getInteger('usun_wiadomosci') != null ? interaction.options.getInteger('usun_wiadomosci') : 0;

        console.log(interaction.options.getBoolean('powiadomienie'));

        if (notification) {
            await user.send(`Zostałeś zbanowany w \`\`${interaction.guild.name}\`\` ${reason ? 'za ``' + reason + '``' : 'bez podanego powodu'}.`);
        }

        let options = {
            reason: reason,
            deleteMessageSeconds: deleteMessages
        };

        const optionNames = {
            10800: 'ostatnich 3 godzin',
            21600: 'ostatnich 6 godzin',
            43200: 'ostatnich 12 godzin',
            86400: 'ostatniego dnia',
            259200: 'ostatnich 3 dni',
            604800: 'ostatnich 7 dni'
        }

        await interaction.guild.members.cache.get(user.id).ban(options);

        await interaction.reply(`Zbanowano <@${user.id}> ${reason ? `za \`\`${reason}\`\`` : 'bez podanego powodu'}${deleteMessages ? ' oraz usunięto ich wiadomości z ' + optionNames[deleteMessages] : ''}.`);
    }
}