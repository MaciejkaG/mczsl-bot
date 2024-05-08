import mysql from 'mysql';
import util from 'node:util';

const mysqlConfig = {
    host: process.env.mysql_host,
    port: process.env.mysql_port ? parseInt(process.env.mysql_port) : 3306,
    user: process.env.mysql_user,
    password: process.env.mysql_pass,
    database: process.env.mysql_db
};

export default class UserProfile {
    constructor(user_id) {
        this.user_id = user_id;
        this.conn = mysqlConn();

        createProfileIfMissing(user_id);
    }

    async getWarns() {
        return await this.conn.query(`SELECT by_user_id, reason, date FROM warns WHERE user_id = ${this.conn.escape(this.user_id)} ORDER BY date ASC;`);
    }

    async addWarn(by, reason = null) {
        await this.conn.query(`INSERT INTO warns(user_id, by_user_id, reason) VALUES (${this.conn.escape(this.user_id)}, ${this.conn.escape(by)}, ${reason ? this.conn.escape(reason) : 'DEFAULT'});`);
    }

    async getPenalties() {
        return (await this.conn.query(`SELECT at_warns, penalty FROM penalties, warns WHERE user_id = ${this.conn.escape(this.user_id)} HAVING COUNT(warns.id) = at_warns;`)).map(row => {
            return JSON.parse(row.penalty);
        });
    }

    close() {
        this.conn.end();
    }
}

function createProfileIfMissing(uid) {
    const conn = mysqlConn();

    conn.query(`INSERT IGNORE INTO user_profiles(user_id) VALUES (${conn.escape(uid)});`);
    conn.end();
}

function mysqlConn() {
    const conn = mysql.createConnection(mysqlConfig);

    conn.query = util.promisify(conn.query).bind(conn);

    return conn;
}