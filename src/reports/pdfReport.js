import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

export const buildPdfReport = (report) => {
  const doc = new PDFDocument({ margin: 40 });
  const stream = new PassThrough();
  doc.pipe(stream);

  doc.fontSize(20).text("Personal Expense Tracker Report", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Total Income: ${report.summary?.income || 0}`);
  doc.text(`Total Expense: ${report.summary?.expense || 0}`);
  doc.text(`Net Savings: ${report.netSavings || 0}`);
  doc.moveDown();

  doc.fontSize(14).text("Balances", { underline: true });
  doc.fontSize(12).text(`Cash Balance: ${report.cashBalance || 0}`);
  (report.bankBalances || []).forEach((bank) => {
    doc.text(`${bank.bankName || "Bank"}: ${bank.currentBalance || 0}`);
  });
  doc.moveDown();

  doc.fontSize(14).text("Payment Method Breakdown", { underline: true });
  doc.fontSize(12).text(`Cash Expenses: ${report.cashExpenses || 0}`);
  doc.text(`Bank Transfers: ${report.transfers || 0}`);
  doc.moveDown();

  doc.fontSize(14).text("Bank-wise Expenses", { underline: true });
  (report.bankWiseExpenses || []).forEach((item) => {
    doc.text(`${item.bankName || "Bank"}: ${item.total || 0}`);
  });

  doc.end();
  return stream;
};
