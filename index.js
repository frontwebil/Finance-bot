import { Bot, Api } from "node-telegram-bot-api";
import http from "http";
import "dotenv/config";
import prisma from "./lib/prisma.js";

const WEB_APP_URL = "https://finance-site-ashy.vercel.app";
const token = process.env.BOT_TOKEN;

const bot = new Bot(token);
const api = new Api(token);

const start = async () => {
  bot.on("message", async (msg) => {
    const chat_id = msg.update.message.chat.id;
    const text = msg.update.message.text;
    const user_chat = msg.update.message.chat;

    if (text === "/start") {
      const isExist = await prisma.user.findMany({
        where: {
          user_id: chat_id,
        },
      });

      if (isExist.length == 0) {
        console.log("Start Creating");
        const user = await prisma.user.create({
          data: {
            name: user_chat.first_name,
            user_id: user_chat.id,
            userName: user_chat.username ?? "Private profile",
            chat_id: BigInt(chat_id),
          },
        });

        console.log("User Created");
        console.log(user);
      }
      await api.unpinAllChatMessages(chat_id).catch(() => {});

      const offers = await api.sendMessage({
        chat_id,
        text: "🔥 Доступні пропозиції 👇",
        reply_markup: {
          inline_keyboard: [
            [{ text: "ПЕРЕГЛЯНУТИ ✨", web_app: { url: WEB_APP_URL } }],
          ],
        },
      });

      await api.pinChatMessage({
        chat_id,
        message_id: offers.message_id,
        disable_notification: true,
      });

      const WELCOME_PHOTO =
        "https://res.cloudinary.com/dbdmol7cr/image/upload/v1794411246/Gemini_Generated_Image_cn86i1cn86i1cn86_bmfaru.jpg";

      await api.sendPhoto({
        chat_id,
        photo: WELCOME_PHOTO,
        caption: `Привіт, ${user_chat.first_name}! 👋

Я - фінансовий асистент. Допоможу знайти кредитну пропозицію, яка підійде саме тобі.

💸 Позики від 0,01%
⚡️ Швидке оформлення заявки
💳 Можливість отримати кошти на картку
🔒 Простий процес без зайвої бюрократії

Натисни кнопку нижче, щоб обрати суму та переглянути доступні пропозиції 👇`,
        parse_mode: "Markdown",
        reply_markup: {
          keyboard: [
            [
              {
                text: "ОТРИМАТИ КРЕДИТ ✅",
                web_app: { url: WEB_APP_URL },
              },
            ],
          ],
          resize_keyboard: true,
          is_persistent: true,
        },
      });
    }
  });

  await bot.startPolling();
};

const PORT = process.env.PORT || 5000;

http
  .createServer((req, res) => {
    res.writeHead(200);
    res.end("Telegram bot is running");
  })
  .listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

start();
