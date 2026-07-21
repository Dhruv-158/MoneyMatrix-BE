import mongoose from "mongoose";

const bankSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    bankName: { type: String, required: true, trim: true },
    accountType: { type: String, required: true, trim: true },
    currentBalance: { type: Number, required: true, default: 0 },
    accountNumberLast4: { type: String, required: true, minlength: 4, maxlength: 4 },
    color: { type: String, default: "#000000" },
    icon: { type: String, default: "" },
    iconUrl: { type: String, default: "" },
    imageUrl: { type: String, default: "" }
  },
  { timestamps: true }
);

export const Bank = mongoose.model("Bank", bankSchema);
