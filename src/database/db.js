import mysql from 'mysql2/promise';

export const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123',
    database: 'bot_tele',
    port: 3307
})