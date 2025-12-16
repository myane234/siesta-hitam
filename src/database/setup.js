import mysql from 'mysql2/promise';

export const data = {
    database: 'bot_tele',
}

const db = await mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123',
    port: 3306
})

export async function Setupdb() {
    await db.query(`CREATE DATABASE IF NOT EXISTS ${data.database}`)
    await db.query(`USE ${data.database}`);
    console.log(`DATABASE ${data.database} aman`);

    await db.query(`CREATE TABLE IF NOT EXISTS nofap (
        id INT PRIMARY KEY AUTO_INCREMENT,
        start_date DATE NOT NULL,
        last_relapse DATE,
        total_days INT DEFAULT 0,
        note TEXT
        )`)

    console.log('table nofap aman')

    const [checkNofap] = await db.query(`SELECT * FROM nofap`);

    if(checkNofap.length === 0) {
    await db.query(`INSERT INTO nofap(id, start_date, total_days) VALUES
        (1, CURDATE(), 0)`)
    }

    console.log(`SEED nofap aman`)


}
