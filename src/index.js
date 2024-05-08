import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { REST, Routes, Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import { createClient } from 'redis';
import chalk from 'chalk';
import mysql from 'mysql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
const token = process.env.bot_token;
const clientId = process.env.bot_client_id;

const redis = createClient();
redis.on('error', err => console.log('Redis Client Error', err));
await redis.connect();

const mysqlConfig = {
    host: process.env.mysql_host,
    port: process.env.mysql_port ? parseInt(process.env.mysql_port) : 3306,
    user: process.env.mysql_user,
    password: process.env.mysql_pass,
    database: process.env.mysql_db,
    multipleStatements: true
};

const conn = mysql.createConnection(mysqlConfig);
conn.query("CREATE TABLE IF NOT EXISTS ticket_archive (ticket_id VARCHAR(32) PRIMARY KEY, author_id VARCHAR(32) NOT NULL, archive_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(), ticket_data JSON NOT NULL);CREATE TABLE user_profiles(user_id VARCHAR(32) PRIMARY KEY, profile_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP());CREATE TABLE warns();", () => {
    conn.end();
});

client.redis = redis;
client.commands = new Collection();

(async () => {
    console.log(`${chalk.magenta('[COMMANDS]')} Loading command handlers...`);
    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = (await import('file://' + filePath)).default;
            if (command && command.data && command.execute) {
                commands.push(command.data.toJSON());
                client.commands.set(command.data.name, command);
            } else {
                console.log(`${chalk.magenta('[COMMANDS]')} ${chalk.yellow('[WARNING]')} The command at ${filePath} is missing required property(-ies).`);
            }
        }
    }
    console.log(`${chalk.magenta('[COMMANDS]')} All command handlers loaded...`);

    const rest = new REST().setToken(token);

    try {
        console.log(`${chalk.magenta('[COMMANDS]')} Reloading ${commands.length} application (/) commands...`);

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`${chalk.magenta('[COMMANDS]')} Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }

    console.log(`${chalk.cyan('[EVENTS]')} Loading event handlers...`);
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = (await import('file://' + filePath)).default;
        if (event && event.name && event.execute) {
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }
        } else {
            console.log(`${chalk.cyan('[EVENTS]')} ${chalk.yellow('[WARNING]')} The command at ${filePath} is missing required property(-ies).`);
        }
    }
    console.log(`${chalk.cyan('[EVENTS]')} All event handlers loaded...`);
})();

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.log(`${chalk.magenta('[COMMANDS]')} ${chalk.yellow('[WARNING]')} No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Wystąpił błąd w trakcie wykonywania tej komendy!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.login(token);