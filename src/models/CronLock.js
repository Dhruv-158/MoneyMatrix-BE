import mongoose from "mongoose";

const cronLockSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    owner: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true }
  },
  { timestamps: true }
);

cronLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const CronLock = mongoose.model("CronLock", cronLockSchema);
