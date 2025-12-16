import TelegramBot from "node-telegram-bot-api";
import { db } from "./database/db.js";
import { Setupdb } from "./database/setup.js";

const TOKEN = "";
const CHAT_ID = "7682199035"; // wajib untuk notif otomatis

async function start() {
  await Setupdb();

  const bot = new TelegramBot(TOKEN, { polling: true });
  console.log("🤖 Bot NoFap jalan...");

  /* ===============================
     HELPER (ASYNC)
  ================================ */

  async function getStatus() {
    const [rows] = await db.query(`
      SELECT 
        start_date,
        total_days,
        DATEDIFF(CURDATE(), start_date) AS streak
      FROM nofap
      WHERE id = 1
    `);

    if (!rows.length) throw new Error("Data nofap kosong");
    return rows[0];
  }

  async function startNoFap() {
    await db.query(`
      UPDATE nofap 
      SET start_date = CURDATE() 
      WHERE id = 1
    `);
  }

  async function relapse() {
    await db.query(`
      UPDATE nofap
      SET
        total_days = total_days + DATEDIFF(CURDATE(), start_date),
        last_relapse = CURDATE(),
        start_date = CURDATE()
      WHERE id = 1
    `);
  }

  /* ===============================
     COMMAND HANDLER
  ================================ */

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text?.toLowerCase();
    if (!text) return;

    try {
      if (text === "/halo") {
        return bot.sendMessage(chatId, "Halo 👋 Bot NoFap aktif");
      }

      if (text === "/startnofap") {
        await startNoFap();
        return bot.sendMessage(chatId, "🔥 NoFap dimulai hari ini. Tetap kuat 💪");
      }

      if (text === "/status") {
        const data = await getStatus();
        return bot.sendMessage(
          chatId,
          `🔥 *NoFap Status*\n\n` +
          `📆 Streak: *${data.streak} hari*\n` +
          `🧮 Total bersih: *${data.total_days} hari*`,
          { parse_mode: "Markdown" }
        );
      }

      if (text === "/gagal") {
        const data = await getStatus();
        await relapse();

        return bot.sendMessage(
          chatId,
          `❌ *Relapse dicatat*\n\n` +
          `🔥 Streak terakhir: *${data.streak} hari*\n` +
          `🧮 Total sekarang: *${data.total_days + data.streak} hari*\n\n` +
          `Mulai lagi hari ini 💪`,
          { parse_mode: "Markdown" }
        );
      }
    } catch (err) {
      console.error("BOT ERROR:", err.message);
      bot.sendMessage(chatId, "❌ Terjadi error. Cek console.");
    }
  });

  /* ===============================
     NOTIF OTOMATIS (SIANG)
  ================================ */

  setInterval(async () => {
    const now = new Date();
    const hour = now.getHours();

    // kirim jam 12 siang
    if (hour !== 12) return;

    try {
      const data = await getStatus();
      await bot.sendMessage(
        CHAT_ID,
        `⏰ *Daily NoFap Check*\n\n` +
        `🔥 Streak hari ini: *${data.streak} hari*\n` +
        `💪 Tetap kuat, jangan kalah.`,
        { parse_mode: "Markdown" }
      );
    } catch (e) {
      console.error("Notif error:", e.message);
    }
  }, 60 * 60 * 1000); // cek tiap 1 jam
}

start();
