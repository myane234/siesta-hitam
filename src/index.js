import TelegramBot from "node-telegram-bot-api";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

/* ===============================
   PATH FIX
================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "nofap.json");

/* ===============================
   CONFIG
================================ */
const TOKEN = "7848366747:AAG2ENj37GzV5S0JzCuup-vAwfbppxxWp1A"; // ISI TOKEN BOT
const CHAT_ID = "7682199035";

process.on("unhandledRejection", (err) => {
  console.error("Unhandled:", err.message);
});

const bot = new TelegramBot(TOKEN, {
  polling: {
    interval: 3000,
    params: { timeout: 10 },
  },
});

console.log("🤖 Bot NoFap (JSON) jalan...");

/* ===============================
   HELPER
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
  if (!start) return 0;
  const startDate = new Date(start);
  const now = new Date();
  return Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
}

/* ===============================
   NOFAP LOGIC (FIXED)
================================ */
async function getStatus() {
  const data = await readData();
  return {
    name: data.name,
    is_active: data.is_active,
    streak: data.is_active ? diffDays(data.start_date) : 0,
    total_days: data.total_days,
  };
}

async function startNoFap(name) {
  const data = await readData();

  if (data.is_active) {
    return { ok: false, name: data.name };
  }

  if (name) data.name = name;

  data.is_active = true;
  data.start_date = today();
  await writeData(data);

  return { ok: true, name: data.name };
}

async function relapse() {
  const data = await readData();

  if (!data.is_active) return null;

  const streak = diffDays(data.start_date);
  data.total_days += streak;
  data.last_relapse = today();
  data.start_date = today();

  await writeData(data);
  return { streak, name: data.name, total: data.total_days };
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
   COMMAND HANDLER
================================ */
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  try {
    if (text === "/start" || text === "/halo") {
      return bot.sendMessage(
        chatId,
        "👋 *Bot NoFap Aktif*\n\nGunakan menu di bawah 👇",
        { parse_mode: "Markdown", ...menuKeyboard() }
      );
    }

    if (text === "/menu") {
      return bot.sendMessage(chatId, "📋 *Menu NoFap*", {
        parse_mode: "Markdown",
        ...menuKeyboard(),
      });
    }

    if (text.startsWith("/startnofap")) {
      const name = text.split(" ")[1];
      const result = await startNoFap(name);

      if (!result.ok) {
        return bot.sendMessage(
          chatId,
          `⚠️ NoFap sudah aktif.\nTetap kuat *${result.name}* 💪`,
          { parse_mode: "Markdown" }
        );
      }

      return bot.sendMessage(
        chatId,
        `🔥 *NoFap dimulai!*\n\n` +
          `👤 Nama: *${result.name}*\n` +
          `📆 Hari pertama dimulai hari ini\n\n` +
          `Tetap kuat 💪`,
        { parse_mode: "Markdown" }
      );
    }

    if (text === "/status") {
      const data = await getStatus();
      return bot.sendMessage(
        chatId,
        `🔥 *Status NoFap*\n\n` +
          `👤 Nama: *${data.name}*\n` +
          `📆 Streak: *${data.streak} hari*\n` +
          `🧮 Total bersih: *${data.total_days} hari*\n\n` +
          `Terus maju ${data.name} 💪`,
        { parse_mode: "Markdown" }
      );
    }

    if (text === "/gagal") {
      const res = await relapse();
      if (!res) {
        return bot.sendMessage(chatId, "⚠️ NoFap belum dimulai.");
      }

      return bot.sendMessage(
        chatId,
        `❌ *Relapse dicatat*\n\n` +
          `🔥 Streak terakhir: *${res.streak} hari*\n` +
          `🧮 Total bersih: *${res.total} hari*\n\n` +
          `Bangkit lagi ${res.name} 💪`,
        { parse_mode: "Markdown" }
      );
    }
  } catch (e) {
    console.error("BOT ERROR:", e.message);
  }
});

/* ===============================
   BUTTON HANDLER
================================ */
bot.on("callback_query", async (q) => {
  const chatId = q.message.chat.id;

  try {
    if (q.data === "startnofap") {
      const res = await startNoFap();
      return bot.sendMessage(
        chatId,
        res.ok
          ? `🔥 NoFap dimulai! Semangat *${res.name}* 💪`
          : `⚠️ NoFap sudah aktif. Tetap kuat *${res.name}* 💪`,
        { parse_mode: "Markdown" }
      );
    }

    if (q.data === "status") {
      const d = await getStatus();
      return bot.sendMessage(
        chatId,
        `🔥 *Status NoFap*\n\n` +
          `👤 ${d.name}\n` +
          `📆 ${d.streak} hari\n` +
          `🧮 Total: ${d.total_days} hari`,
        { parse_mode: "Markdown" }
      );
    }

    if (q.data === "gagal") {
      const r = await relapse();
      if (!r) return;
      return bot.sendMessage(
        chatId,
        `❌ Relapse\n🔥 ${r.streak} hari\n🧮 Total ${r.total} hari\n\nBangkit lagi ${r.name} 💪`
      );
    }

    bot.answerCallbackQuery(q.id);
  } catch (e) {
    console.error("CALLBACK ERROR:", e.message);
  }
});

/* ===============================
   DAILY REMINDER
================================ */
const SEND_HOURS = [6, 10, 14, 18, 20];
let lastSentHour = null;

setInterval(async () => {
  const now = new Date();
  const hour = now.getHours();

  // ❌ blok jam tidur
  if (hour < 6) return;

  // ❌ bukan jam target
  if (!SEND_HOURS.includes(hour)) return;

  // ❌ anti spam dalam jam yang sama
  if (lastSentHour === hour) return;

  try {
    const data = await getStatus();
    await bot.sendMessage(
      CHAT_ID,
      `⏰ *Daily NoFap Check*\n\n` +
      `🔥 Streak hari ini: *${data.streak} hari*\n` +
      `💪 Tetap kuat, jangan kalah.`,
      { parse_mode: "Markdown" }
    );

    lastSentHour = hour;
  } catch (e) {
    console.error("Notif error:", e.message);
  }
}, 60 * 1000); // cek tiap menit
