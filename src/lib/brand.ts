/** Single source of truth for site identity. Change here → everywhere. */
export const BRAND_NAME = "OnlineKhiwal";
export const BRAND_DOMAIN = "onlinekhiwal.com";
export const BRAND_SHORT = "OK";
export const BRAND_EMAIL = `support@${BRAND_DOMAIN}`;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || `https://${BRAND_DOMAIN}`
).replace(/\/+$/, "");

export const BRAND_TITLE = `${BRAND_NAME} — Online Khiwal | Live Satta Result & Monthly Charts`;

export const BRAND_DESCRIPTION =
  `${BRAND_NAME} (onlinekhiwal) — daily live satta results and monthly record charts for Gali, ` +
  `Desawar, Faridabad, Haruf King and Ghaziabad, with a complete month-by-month archive from 2015 onwards.`;

/** Covers the spelling variants people actually type. */
export const BRAND_KEYWORDS = [
  "onlinekhiwal", "online khiwal", "online khaiwal", "onlinekhaiwal",
  "khiwal", "khaiwal", "satta khiwal", "online satta khaiwal",
  "ऑनलाइन खाईवाल", "खाईवाल", "सट्टा रिजल्ट",
  "satta result", "satta king result", "gali result", "desawar result",
  "faridabad result", "ghaziabad result", "haruf king result",
  "satta chart", "monthly satta chart", "satta record chart", "live satta result",
];