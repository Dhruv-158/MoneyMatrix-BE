import mongoose from "mongoose";

const cashWalletSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    balance: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
);

export const CashWallet = mongoose.model("CashWallet", cashWalletSchema);
