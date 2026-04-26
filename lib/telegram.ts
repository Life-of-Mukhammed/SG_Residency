const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null;

type TelegramOptions = {
  reply_markup?: Record<string, unknown>;
  disable_web_page_preview?: boolean;
};

export async function sendTelegram(
  chatId: string | number,
  text: string,
  options?: TelegramOptions
): Promise<void> {
  if (!API) return;
  try {
    await fetch(`${API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options,
      }),
    });
  } catch (err) {
    console.error('[Telegram] sendMessage failed:', err);
  }
}

export async function sendTelegramToMany(
  chatIds: (string | number)[],
  text: string,
  options?: TelegramOptions
): Promise<void> {
  await Promise.allSettled(chatIds.map((id) => sendTelegram(id, text, options)));
}
