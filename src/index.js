import TelegramBot from "node-telegram-bot-api";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

/* ===============================
   PATH FIX (WAJIB)
================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "nofap.json");

/* ===============================
   CONFIG
================================ */
const TOKEN = ""; // ISI TOKEN BOT
const CHAT_ID = "7682199035"; // chat id lu

const bot = new TelegramBot(TOKEN, { polling: true });
console.log("🤖 Bot NoFap (JSON) jalan...");

/* ===============================
   HELPER JSON
================================ */
async function readData() {
  const data = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(data);
}

async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

function today() {
  return new Date().toISOString().slice(0, 10);
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
   MENU BUTTON
================================ */
function menuKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔥 Start NoFap", callback_data: "startnofap" }],
        [{ text: "📊 Status", callback_data: "status" }],
        [{ text: "❌ Gagal / Relapse", callback_data: "gagal" }],
      ],
    },
  };
}

/* ===============================
   COMMAND HANDLER (TEXT)
================================ */
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.toLowerCase();
  if (!text) return;

  try {
    if (text === "/halo" || text === "/start") {
      return bot.sendMessage(
        chatId,
        "👋 Halo! Bot NoFap aktif.\n\nPilih menu di bawah 👇",
        menuKeyboard()
      );
    }

    if (text === "/menu") {
      return bot.sendMessage(chatId, "📋 *Menu NoFap*", {
        parse_mode: "Markdown",
        ...menuKeyboard(),
      });
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
   CALLBACK BUTTON HANDLER
================================ */
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const action = query.data;

  try {
    if (action === "startnofap") {
      await startNoFap();
      bot.sendMessage(chatId, "🔥 NoFap dimulai hari ini. Tetap kuat 💪");
    }

    if (action === "status") {
      const data = await getStatus();
      bot.sendMessage(
        chatId,
        `🔥 *NoFap Status*\n\n` +
          `📆 Streak: *${data.streak} hari*\n` +
          `🧮 Total bersih: *${data.total_days} hari*`,
        { parse_mode: "Markdown" }
      );
    }

    if (action === "gagal") {
      const streak = await relapse();
      const data = await getStatus();

      bot.sendMessage(
        chatId,
        `❌ *Relapse dicatat*\n\n` +
          `🔥 Streak terakhir: *${streak} hari*\n` +
          `🧮 Total sekarang: *${data.total_days} hari*\n\n` +
          `Mulai lagi hari ini 💪`,
        { parse_mode: "Markdown" }
      );
    }

    // wajib acknowledge callback
    bot.answerCallbackQuery(query.id);
  } catch (e) {
    console.error("CALLBACK ERROR:", e.message);
  }
});

/* ===============================
   NOTIF OTOMATIS (12 SIANG)
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
