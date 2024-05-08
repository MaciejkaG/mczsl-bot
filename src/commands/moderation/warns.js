import { PermissionFlagsBits, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import UserProfile from '#utils/warn-manager.js';

const criticalPenalties = ['kick', 'ban'];

export default {
    data: new SlashCommandBuilder()
        .setName('warns')
        .setDescription('Komendy związane z warnami')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Pobierz listę ostrzeżeń użytkownika')
                .addUserOption(option =>
                    option
                        .setName('uzytkownik')
                        .setDescription('Użytkownik którego ostrzeżenia chcesz pobrać')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Dodaje ostrzeżenie danemu użytkownikowi')
                .addUserOption(option =>
                    option
                        .setName('uzytkownik')
                        .setDescription('Użytkownik któremu chcesz dodać ostrzeżenie')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('powod')
                        .setDescription('Powód warna')
                        .setRequired(false)
                )
        ),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'add') {
            const user = interaction.options.getUser('uzytkownik');
            const reason = interaction.options.getString('powod');

            const userProfile = new UserProfile(user.id);

            await userProfile.addWarn(interaction.user.id, reason);
            const penalties = await userProfile.getPenalties();

            const member = interaction.guild.members.cache.get(user.id);

            for (let i = 0; i < penalties.length; i++) {
                const penalty = penalties[i];

                switch (penalty.type) {
                    case 'kick':
                        member.kick('Kara automatyczna spowodowana osiągnięciem przez użytkownika progu ostrzeżeń.');
                        break;

                    case 'ban':
                        member.ban({ deleteMessageSeconds: penalty.deleteMessageSeconds, reason: "Kara automatyczna spowodowana osiągnięciem przez użytkownika progu ostrzeżeń." });
                        break;

                    case 'timeout':
                        member.timeout(penalty.duration, 'Kara automatyczna spowodowana osiągnięciem przez użytkownika progu ostrzeżeń.');
                        break;
                }

                if (criticalPenalties.includes(penalty.type)) {
                    break;
                }
            }

            const warns = await userProfile.getWarns();
            userProfile.close();

            await interaction.reply({ content: `Dodano ostrzeżenie użytkownikowi <@${user.id}>. Jest to ich ${warns.length} ostrzeżenie.${penalties.length > 0 ? penalties.length == 1 ? ` To ostrzeżenie spowodowało nałożenie jednej kary (${penalties[0].type})` : ` To ostrzeżenie spowodowało nałożenie ${penalties.length} kar.` : ''}` });
        } else if (interaction.options.getSubcommand() === 'list') {
            const user = interaction.options.getUser('uzytkownik');

            const userProfile = new UserProfile(user.id);
            const warns = await userProfile.getWarns();
            userProfile.close();

            var warnsText = '';
            for (let i = 0; i < warns.length; i++) {
                const warn = warns[i];
                warnsText += `**${i + 1}.** Dodano przez: <@${warn.by_user_id}>\nPowód: \`\`${warn.reason}\`\`\nData dodania: \`\`${warn.date}\`\`\n\n`;
            }
            if (warnsText == '') warnsText = 'Brak otrzymanych ostrzeżeń';
            else warnsText = warnsText.substring(0, warnsText.length - 2);

            const embed = new EmbedBuilder()
                .setColor(0x4400FF)
                .setTitle('Lista ostrzeżeń')
                .setDescription(`Lista ostrzeżenia użytkownika <@${user.id}>`)
                .addFields(
                    { name: 'Ostrzeżenia', value: warnsText }
                )
                .setFooter({ text: 'Designed by Maciejka' });

            await interaction.reply({ embeds: [embed] });
        }

    }
}