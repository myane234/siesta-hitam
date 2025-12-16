import mysql from 'mysql2/promise';

export const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123',
    database: 'bot_tele',
    port: 3306,
    waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  socketPath: '/data/data/com.termux/files/usr/tmp/mysql.sock' 
})
