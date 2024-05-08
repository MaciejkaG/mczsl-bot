import { PermissionFlagsBits, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Penalties from '#utils/penalties-manager.js';

export default {
    data: new SlashCommandBuilder()
        .setName('penalties')
        .setDescription('Komendy związane z ustanawianiem kar od warnów')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Pobierz listę obowiązujących kar')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Anuluje (usuwa) ustanowioną karę. Nie wpłynie to na nałożone już kary.')
                .addIntegerOption(option =>
                    option
                        .setName('id')
                        .setDescription('ID ustanowionej kary do usunięcia')
                        .setRequired(true)
                        .setMinValue(0)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Ustanawia karę wyrzucenia na danym progu ostrzeżeń.')
                .addIntegerOption(option =>
                    option
                        .setName('prog_warnow')
                        .setDescription('Próg ostrzeżeń wymagany do otrzymania kary')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(255)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Ustanawia karę bana na danym progu ostrzeżeń.')
                .addIntegerOption(option =>
                    option
                        .setName('prog_warnow')
                        .setDescription('Próg ostrzeżeń wymagany do otrzymania kary')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(255)
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
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('timeout')
                .setDescription('Ustanawia karę timeouta na danym progu ostrzeżeń.')
                .addIntegerOption(option =>
                    option
                        .setName('prog_warnow')
                        .setDescription('Próg ostrzeżeń wymagany do otrzymania kary')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(255)
                )
                .addIntegerOption(option =>
                    option
                        .setName('dlugosc')
                        .setDescription('Długość timeouta')
                        .setRequired(true)
                        .addChoices(
                            { name: '5 minut', value: 300000 },
                            { name: '15 minut', value: 900000 },
                            { name: '30 minut', value: 1800000 },
                            { name: '1 godzina', value: 3600000 },
                            { name: '3 godziny', value: 10800000 },
                            { name: '6 godzin', value: 21600000 },
                            { name: '12 godzin', value: 43200000 },
                            { name: '1 dzień', value: 86400000 },
                            { name: '3 dni', value: 259200000 },
                            { name: '7 dni', value: 604800000 },
                            { name: '14 dni', value: 1209600000 },
                            { name: '28 dni', value: 2419200000 },
                        )
                )
        ),
    async execute(interaction) {
        const penalties = new Penalties();
        const atWarns = interaction.options.getInteger('prog_warnow');

        switch (interaction.options.getSubcommand()) {
            case 'list': {
                const penaltiesList = await penalties.getPenalties();
                
                let penaltiesText = '';
                for (let i = 0; i < penaltiesList.length; i++) {
                    const penalty = penaltiesList[i];
                    penaltiesText += `**ID: ${penalty.id}** Próg ostrzeżeń: \`\`${penalty.at_warns}\`\`\nKara: \`\`${penalty.penalty}\`\`\n\n`;
                }
                if (penaltiesText == '') penaltiesText = 'Brak aktywnych ustanowionych kar';
                else penaltiesText = penaltiesText.substring(0, penaltiesText.length - 2);

                const embed = new EmbedBuilder()
                    .setColor(0x4400FF)
                    .setTitle('Lista kar')
                    .setDescription(`Lista ustanowionych kar za ostrzeżenia`)
                    .addFields(
                        { name: 'Kary', value: penaltiesText }
                    )
                    .setFooter({ text: 'Designed by Maciejka' });

                await interaction.reply({ embeds: [embed] });
                break;
            }

            case 'kick':
                await penalties.addKickPenalty(atWarns);
                await interaction.reply(`Pomyślnie ustanowiono karę wyrzucenia po osiągnięciu progu liczby ostrzeżeń: \`\`${atWarns}\`\``);
                break;

            case 'ban': {
                const deleteMessagesSeconds = interaction.options.getInteger('usun_wiadomosci');

                await penalties.addBanPenalty(atWarns, deleteMessagesSeconds);
                await interaction.reply(`Pomyślnie ustanowiono karę bana po osiągnięciu progu liczby ostrzeżeń: \`\`${atWarns}\`\``);
                break;
            }

            case 'timeout': {
                const duration = interaction.options.getInteger('dlugosc');

                await penalties.addTimeoutPenalty(atWarns, duration);
                await interaction.reply(`Pomyślnie ustanowiono karę timeoutu po osiągnięciu progu liczby ostrzeżeń: \`\`${atWarns}\`\``);
                break;
            }

            case 'remove': {
                const id = interaction.options.getInteger('id');
                await penalties.removePenalty(id);

                await interaction.reply(`Pomyślnie anulowano ustanowioną karę o ID \`\`${id}\`\` jeżeli taka istniała.`)
            }
        }

        penalties.close();

    }
}