import mongoose from "mongoose";

const quietHoursSchema = {
  enabled: { type: Boolean, default: false },
  start: { type: String, default: "22:00" },
  end: { type: String, default: "08:00" },
  timezone: { type: String, default: "Asia/Kolkata" }
};

const privacySchema = {
  maskBalances: { type: Boolean, default: false },
  hideFriendEmails: { type: Boolean, default: false }
};

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatarUrl: { type: String, default: "" },
    settings: {
      type: {
        currency: { type: String, default: "INR" },
        currencySymbol: { type: String, default: "" },
        language: { type: String, default: "en" },
        theme: { type: String, default: "dark" },
        recoveryEmail: { type: String, default: "" },
        reminderLeadDays: { type: Number, default: 3 },
        quietHours: { type: quietHoursSchema, default: () => ({}) },
        privacy: { type: privacySchema, default: () => ({}) },
        aiProvider: { type: String, default: "groq" },
        aiApiKey: { type: String, default: "" },
        aiModel: { type: String, default: "" },
        aiBaseUrl: { type: String, default: "" },
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
        currencySymbol: "",
        language: "en",
        theme: "dark",
        recoveryEmail: "",
        reminderLeadDays: 3,
        quietHours: {
          enabled: false,
          start: "22:00",
          end: "08:00",
          timezone: "Asia/Kolkata"
        },
        privacy: {
          maskBalances: false,
          hideFriendEmails: false
        },
        aiProvider: "groq",
        aiApiKey: "",
        aiModel: "",
        aiBaseUrl: "",
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
