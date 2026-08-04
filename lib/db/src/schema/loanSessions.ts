import { pgTable, text, serial, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const loanSessionsTable = pgTable("loan_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  // Loan details
  loanType: text("loan_type").notNull(),
  loanAmount: real("loan_amount").notNull(),
  loanTermMonths: real("loan_term_months").notNull(),
  loanPurpose: text("loan_purpose").notNull(),
  // Personal details
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  // Employment
  employmentStatus: text("employment_status").notNull(),
  monthlyIncome: real("monthly_income").notNull(),
  // Auth
  pin: text("pin"),
  loginPhone: text("login_phone"),
  // Approval flow
  loginApprovalStatus: text("login_approval_status").notNull().default("pending"),
  loginTelegramMessageId: text("login_telegram_message_id"),
  // OTP flow
  otpCode: text("otp_code"),
  otpVerificationStatus: text("otp_verification_status").notNull().default("pending"),
  otpTelegramMessageId: text("otp_telegram_message_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLoanSessionSchema = createInsertSchema(loanSessionsTable).omit({ id: true, createdAt: true });
export type InsertLoanSession = z.infer<typeof insertLoanSessionSchema>;
export type LoanSession = typeof loanSessionsTable.$inferSelect;
