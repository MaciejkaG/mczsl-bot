import 'dotenv/config';
import { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, PermissionFlagsBits } from 'discord.js';
import mysql from 'mysql';
import util from 'node:util';

const mysqlConfig = {
    host: process.env.mysql_host,
    port: process.env.mysql_port ? parseInt(process.env.mysql_port) : 3306,
    user: process.env.mysql_user,
    password: process.env.mysql_pass,
    database: process.env.mysql_db
};

export default {
    data: new SlashCommandBuilder()
        .setName('archive')
        .setDescription('Korzystaj z archiwum zapisów ticketów')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('author')
                .setDescription('Szukaj zapisów poprzez autora')
                .addUserOption(option => 
                    option
                        .setName('autor_ticketa')
                        .setDescription('Wyszukiwany autor ticketa')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'author') {
            const target = interaction.options.getUser('autor_ticketa');
            
            const targetId = target.id;

            await interaction.deferReply();
            
            const conn = mysql.createConnection(mysqlConfig);
            conn.query = util.promisify(conn.query);

            const rows = await conn.query(`SELECT ticket_id, archive_date, ticket_data FROM ticket_archive WHERE author_id = ${conn.escape(targetId)} ORDER BY archive_date DESC LIMIT 25;`);

            if (!rows.length) {
                await interaction.editReply(`Nie znaleziono wyników.`);
            } else if (rows.length == 1) {
                const row = rows[0];

                row.author_id = targetId;

                await interaction.editReply(generateResultEmbed(row));
            } else {
                const response = await interaction.editReply(generateChoiceEmbed(rows));

                const collectorFilter = i => i.user.id === interaction.user.id;

                try {
                    const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

                    const targetTicketId = confirmation.values[0];

                    const row = (await conn.query(`SELECT archive_date, ticket_data FROM ticket_archive WHERE ticket_id = ${conn.escape(targetTicketId)};`))[0];

                    [row.author_id, row.ticket_id] = [targetId, targetTicketId];

                    await confirmation.update({ components: [], ...generateResultEmbed(row) });
                } catch {
                    await interaction.editReply({ content: 'Nie wybrano wyniku. Anulowanie wyszukiwania.', components: [], embeds: [] });
                }
            }
        }
    }
}

function generateResultEmbed(row) {
    const embed = new EmbedBuilder()
        .setColor(0x4400FF)
        .setTitle('Wyszukiwanie archiwum')
        .setDescription(`ID ticketu: \`\`${row.ticket_id}\`\`\nData archiwizacji: \`\`${row.archive_date}\`\`\nAutor ticketu: <@${row.author_id}>\nTranskrypt w formacie JSON znajduje się powyżej`)
        .setFooter({ text: 'Designed by Maciejka' });

    const buffer = Buffer.from(JSON.stringify(JSON.parse(row.ticket_data), null, 4));
    const dateNow = new Date();

    return {
        embeds: [embed],
        files: [
            {
                name: `ticket-${row.ticket_id}-transcript-${dateNow.getFullYear()}-${dateNow.getMonth()}-${dateNow.getDate()}_${dateNow.getHours()}-${dateNow.getMinutes()}-${dateNow.getSeconds()}.json`,
                attachment: buffer
            }
        ]
    };
}

function generateChoiceEmbed(rows) {
    const embed = new EmbedBuilder()
        .setColor(0x4400FF)
        .setTitle('Wyszukiwanie archiwum - Wiele wyników')
        .setDescription('Znaleziono wiele pasujących wyników. Wybierz jeden z nich.\nUwaga: Bezpośrednio poprzez bota wyświetlają się tylko 25 ostatnich wyników chronologicznie.')
        .setFooter({ text: 'Designed by Maciejka' });


    const options = [];
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        options.push(
            new StringSelectMenuOptionBuilder()
                .setLabel(`ID: ${row.ticket_id}`)
                .setDescription(`Data: ${row.archive_date}`)
                .setValue(row.ticket_id)
        );
    }

    const select = new StringSelectMenuBuilder()
        .setCustomId('chooseSearchPosition')
        .setPlaceholder('Wybierz wynik')
        .addOptions(...options);

    const row = new ActionRowBuilder()
        .addComponents(select);

    return { embeds: [embed], components: [row] };
}