import 'dotenv/config';
import { Events, PermissionsBitField, EmbedBuilder } from 'discord.js';
import mysql from 'mysql';

const mysqlData = {
    host: process.env.mysql_host,
    port: process.env.mysql_port ? parseInt(process.env.mysql_port) : 3306,
    user: process.env.mysql_user,
    password: process.env.mysql_pass,
    database: process.env.mysql_db
};

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Get ticket data from Redis
        const ticketData = await interaction.client.redis.json.get(`ticket:${interaction.channel.id}`);
        // Check whether the interaction is a button press, whether the channel is an active ticket and if the interaction author has permissions to manage the ticket
        if (!interaction.isButton() || !ticketData || (ticketData.authorId != interaction.user.id && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))) return;

        switch (interaction.customId) {
            case 'downloadTranscript':
                // Check if the interaction author has administrator permissions
                if (interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    // Create a buffer from the ticketData (and format it with pretty indentation)
                    const buffer = Buffer.from(JSON.stringify(ticketData, null, 4));
                    const dateNow = new Date();

                    // Send the ticket data to the user in ephemeral message
                    interaction.reply({
                        content: `Poniżej znajduje się zapis ticketu o ID \`\`${interaction.channel.id}\`\` w formacie JSON`,
                        ephemeral: true,
                        files: [
                            {
                                name: `ticket-${interaction.channel.id}-transcript-${dateNow.getFullYear()}-${dateNow.getMonth()}-${dateNow.getDate()}_${dateNow.getHours()}-${dateNow.getMinutes()}-${dateNow.getSeconds()}.json`,
                                attachment: buffer
                            }
                        ]
                    });
                } else {
                    // If the user is not an admin, tell them that this option is only for the administrators
                    interaction.reply({ content: "Tylko administratorzy mogą używać tej opcji!", ephemeral: true });
                }
                
                break;

            case 'closeTicket': {
                // Removing @everyone view permissions (so only administrators can view the ticket channel) and removing the ticket from Redis
                await interaction.client.redis.del(`ticket:${interaction.channel.id}`);
                await interaction.channel.permissionOverwrites.create(interaction.guild.roles.everyone, { deny: PermissionsBitField.Flags.ViewChannel });

                if (process.env.closed_ticket_category_id) {
                    await interaction.channel.setParent(process.env.closed_ticket_category_id);
                }

                // Archiving the ticket
                const conn = mysql.createConnection(mysqlData);
                conn.query(`INSERT INTO ticket_archive(ticket_id, author_id, ticket_data) VALUES (${conn.escape(interaction.channel.id)}, ${conn.escape(ticketData.authorId)}, ${conn.escape(JSON.stringify(ticketData))})`, () => {
                    conn.end();
                });

                // Sending a ticket channel notification
                const embed = new EmbedBuilder()
                    .setColor(0xFF002B)
                    .setTitle(`Ticket zamknięty`)
                    .setDescription(`Ten ticket został zamknięty przez użytkownika <@${interaction.member.id}>\nZapis ticketu wraz z usuniętymi wiadomościami i załącznikami został zarchiwizowany, a przyszłe wiadomości nie będą rejestrowane. **Administratorzy mogą bezpiecznie usunąć ten kanał.**`)
                    .setFooter({ text: 'Designed by Maciejka' });

                await interaction.reply({ embeds: [embed] });

                // If the ticket author was not the one closing the ticket, notify them about the closure
                if (ticketData.authorId != interaction.user.id) {
                    interaction.user.send(`Ticket (ID: \`\`${interaction.channel.id}\`\`) utworzony przez Ciebie na serwerze \`\`${interaction.guild.name}\`\` został usunięty przez administratora.`);
                }
                break;
            }
        }
    },
};