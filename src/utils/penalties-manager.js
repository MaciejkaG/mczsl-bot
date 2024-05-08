import mysql from 'mysql';
import util from 'node:util';

const mysqlConfig = {
    host: process.env.mysql_host,
    port: process.env.mysql_port ? parseInt(process.env.mysql_port) : 3306,
    user: process.env.mysql_user,
    password: process.env.mysql_pass,
    database: process.env.mysql_db
};

export default class Penalties {
    constructor() {
        this.conn = mysqlConn();
    }

    async getPenalties() {
        return await this.conn.query(`SELECT id, at_warns, penalty FROM penalties LIMIT 10;`);
    }

    async addKickPenalty(at_warns) {
        let penalty = JSON.stringify({ type: 'kick' });

        await this.conn.query(`INSERT INTO penalties(at_warns, penalty) VALUES (${at_warns}, ${this.conn.escape(penalty)});`);
    }

    async addBanPenalty(at_warns, deleteMessageSeconds) {
        let penalty = JSON.stringify({ type: 'ban', deleteMessageSeconds: deleteMessageSeconds });

        await this.conn.query(`INSERT INTO penalties(at_warns, penalty) VALUES (${at_warns}, ${this.conn.escape(penalty)});`);
    }

    async addTimeoutPenalty(at_warns, duration) {
        let penalty = JSON.stringify({ type: 'timeout', duration: duration  });

        await this.conn.query(`INSERT INTO penalties(at_warns, penalty) VALUES (${at_warns}, ${this.conn.escape(penalty)});`);
    }

    async removePenalty(id) {
        await this.conn.query(`DELETE FROM penalties WHERE id = ${id};`);
    }

    close() {
        this.conn.end();
    }
}

function mysqlConn() {
    const conn = mysql.createConnection(mysqlConfig);

    conn.query = util.promisify(conn.query).bind(conn);

    return conn;
}