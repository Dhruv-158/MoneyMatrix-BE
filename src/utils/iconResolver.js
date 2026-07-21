import { env } from "../config/env.js";

const normalizeTitleToDomain = (title) => {
  if (!title) return "";
  const trimmed = title.trim().toLowerCase();
  if (trimmed.includes(".")) return trimmed;
  const slug = trimmed.replace(/[^a-z0-9]+/g, "").replace(/^\s+|\s+$/g, "");
  if (!slug) return "";
  return `${slug}.com`;
};

export const resolveIconFields = ({ title, iconUrl, imageUrl }) => {
  if (iconUrl || imageUrl) {
    return {
      iconUrl: iconUrl || imageUrl || "",
      imageUrl: imageUrl || iconUrl || ""
    };
  }

  if (env.enableIconFetch) {
    const domain = normalizeTitleToDomain(title);
    if (domain) {
      const url = `https://logo.clearbit.com/${domain}`;
      return { iconUrl: url, imageUrl: url };
    }
  }

  return {
    iconUrl: env.defaultIconUrl || "",
    imageUrl: env.defaultImageUrl || env.defaultIconUrl || ""
  };
};
