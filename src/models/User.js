import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    settings: {
      type: {
        currency: { type: String, default: "INR" },
        language: { type: String, default: "en" },
        theme: { type: String, default: "dark" },
        aiProvider: { type: String, default: "groq" },
        aiApiKey: { type: String, default: "" },
        aiModel: { type: String, default: "" },
        notifications: {
          type: {
            transactions: { type: Boolean, default: true },
            budgetAlerts: { type: Boolean, default: true },
            billReminders: { type: Boolean, default: true },
            security: { type: Boolean, default: true }
          },
          default: {
            transactions: true,
            budgetAlerts: true,
            billReminders: true,
            security: true
          }
        }
      },
      default: {
        currency: "INR",
        language: "en",
        theme: "dark",
        aiProvider: "groq",
        aiApiKey: "",
        aiModel: "",
        notifications: {
          transactions: true,
          budgetAlerts: true,
          billReminders: true,
          security: true
        }
      }
    }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
