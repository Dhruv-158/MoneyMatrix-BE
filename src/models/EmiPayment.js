import mongoose from "mongoose";

const emiPaymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    frequency: { type: String, required: true, enum: ["monthly", "yearly", "weekly"] },
    startDate: { type: Date, required: true },
    nextDueDate: { type: Date, required: true },
    paymentMethod: { type: String, required: true, enum: ["bank", "cash"] },
    bankId: { type: mongoose.Schema.Types.ObjectId, ref: "Bank" },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    iconUrl: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    lastProcessedAt: { type: Date },
    note: { type: String, trim: true }
  },
  { timestamps: true }
);

emiPaymentSchema.index({ userId: 1, nextDueDate: 1, isActive: 1 });

export const EmiPayment = mongoose.model("EmiPayment", emiPaymentSchema);
