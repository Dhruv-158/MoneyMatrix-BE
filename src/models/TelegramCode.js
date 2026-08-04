import mongoose from "mongoose";

const telegramCodeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    code: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, expires: 600 } // Auto-delete after 10 minutes (600s)
  },
  { timestamps: true }
);

export const TelegramCode = mongoose.model("TelegramCode", telegramCodeSchema);
