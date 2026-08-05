/**
 * Admin utility routes — not user-facing.
 * GET  /api/admin/webhook-info    → show current Telegram webhook status
 * POST /api/admin/register-webhook → force re-register the webhook
 */
import { Router, type IRouter } from "express";
import { registerWebhook, getWebhookInfo, getWebhookUrl } from "../lib/telegram";

const router: IRouter = Router();

router.get("/admin/webhook-info", async (_req, res): Promise<void> => {
  try {
    const info = await getWebhookInfo();
    res.json({ currentUrl: getWebhookUrl(), telegramInfo: info });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/admin/register-webhook", async (_req, res): Promise<void> => {
  try {
    const result = await registerWebhook();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
