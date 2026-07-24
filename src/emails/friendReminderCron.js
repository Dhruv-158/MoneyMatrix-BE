import { Transaction } from "../models/Transaction.js";
import { sendEmail } from "./emailSender.js";

export const runMonthlyFriendReminderEmails = async () => {
  try {
    // 1. Find all unsettled friend transactions where autoReminder is true
    const pendingTxs = await Transaction.find({
      "friendDetails.status": "pending",
      "friendDetails.autoReminder": { $ne: false },
      "friendDetails.email": { $exists: true, $ne: "" }
    }).populate("userId", "name email");

    if (!pendingTxs.length) return;

    // 2. Group pending transactions by Friend Email + User ID
    const friendMap = {};

    pendingTxs.forEach((tx) => {
      if (!tx.userId || !tx.friendDetails?.email) return;
      const key = `${tx.userId._id}_${tx.friendDetails.email.toLowerCase()}`;
      if (!friendMap[key]) {
        friendMap[key] = {
          userName: tx.userId.name || "A friend",
          friendName: tx.friendDetails.name || "Friend",
          friendEmail: tx.friendDetails.email,
          totalAmount: 0,
          txCount: 0
        };
      }
      friendMap[key].totalAmount += tx.amount || 0;
      friendMap[key].txCount += 1;
    });

    // 3. Send monthly reminder email to each friend with pending balance
    for (const item of Object.values(friendMap)) {
      const formattedAmount = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(item.totalAmount);
      
      const subject = `Monthly Balance Reminder from ${item.userName} via MoneyMatrix`;
      const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px;">
          <h2 style="color: #3b82f6; margin-bottom: 8px;">Hi ${item.friendName},</h2>
          <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">
            This is a friendly automated monthly reminder regarding your pending balance recorded by <strong>${item.userName}</strong>.
          </p>

          <div style="background-color: #1e293b; border: 1px solid rgba(255,255,255,0.1); padding: 18px; border-radius: 10px; margin-bottom: 20px;">
            <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase;">Total Pending Amount</p>
            <p style="font-size: 24px; font-weight: 800; color: #ef4444; margin: 0;">${formattedAmount}</p>
            <p style="font-size: 12px; color: #64748b; margin-top: 8px;">Across ${item.txCount} transaction(s)</p>
          </div>

          <p style="font-size: 13px; color: #94a3b8;">
            If you have already settled this amount with ${item.userName}, please ask them to mark it as <strong>Settled</strong> in MoneyMatrix to stop future automated reminders.
          </p>

          <div style="border-top: 1px solid #334155; padding-top: 12px; margin-top: 24px; font-size: 11px; color: #64748b; text-align: center;">
            Sent automatically by MoneyMatrix Financial Tracker
          </div>
        </div>
      `;

      await sendEmail({
        to: item.friendEmail,
        subject,
        text: `Hi ${item.friendName}, friendly monthly reminder from ${item.userName}. Total pending: ${formattedAmount}.`,
        html
      });
    }
  } catch (error) {
    console.error("Error in runMonthlyFriendReminderEmails:", error);
  }
};
