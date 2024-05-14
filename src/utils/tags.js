import chalk from 'chalk';

export default {
    redis: chalk.hex('#ff4438').bold('[REDIS]'),
    mysql: chalk.bold(chalk.hex('#00758f')('[MY') + chalk.hex('#f29111')('SQL]')),

    commands: chalk.hex('#57F287').bold('[COMMANDS]'),
    events: chalk.hex('#EB459E').bold('[EVENTS]'),
    bot: chalk.hex('#5865F2').bold('[BOT]')
}