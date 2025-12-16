import TelegramBot from "node-telegram-bot-api";
import fs from "fs/promises";

const TOKEN = "";
const CHAT_ID = "7682199035";
const DATA_FILE = "./nofap.json";

const bot = new TelegramBot(TOKEN, { polling: true });

console.log("🤖 Bot NoFap (JSON) jalan...");

/* ===============================
   HELPER FUNCTION (JSON)
================================ */

async function readData() {
  const data = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(data);
}

async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

function today() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function diffDays(start) {
  const startDate = new Date(start);
  const now = new Date();
  return Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
}

/* ===============================
   NOFAP LOGIC
================================ */

async function getStatus() {
  const data = await readData();
  return {
    streak: diffDays(data.start_date),
    total_days: data.total_days,
  };
}

async function startNoFap() {
  const data = await readData();
  data.start_date = today();
  await writeData(data);
}

async function relapse() {
  const data = await readData();
  const streak = diffDays(data.start_date);

  data.total_days += streak;
  data.last_relapse = today();
  data.start_date = today();

  await writeData(data);
  return streak;
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
      const streak = await relapse();
      const data = await getStatus();

      return bot.sendMessage(
        chatId,
        `❌ *Relapse dicatat*\n\n` +
        `🔥 Streak terakhir: *${streak} hari*\n` +
        `🧮 Total sekarang: *${data.total_days} hari*\n\n` +
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
  if (now.getHours() !== 12) return;

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
}, 60 * 60 * 1000);
