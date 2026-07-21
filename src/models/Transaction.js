import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true, enum: ["income", "expense", "transfer"] },
    paymentMethod: { type: String, enum: ["bank", "cash"] },
    bankId: { type: mongoose.Schema.Types.ObjectId, ref: "Bank" },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    amount: { type: Number, required: true },
    note: { type: String, trim: true },
    sourceType: { type: String, enum: ["subscription", "emi"] },
    sourceId: { type: mongoose.Schema.Types.ObjectId },
    transferType: { type: String, enum: ["bank_to_cash", "cash_to_bank", "bank_to_bank"] },
    fromBankId: { type: mongoose.Schema.Types.ObjectId, ref: "Bank" },
    toBankId: { type: mongoose.Schema.Types.ObjectId, ref: "Bank" },
    date: { type: Date, required: true, default: Date.now }
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, date: -1 });

export const Transaction = mongoose.model("Transaction", transactionSchema);
