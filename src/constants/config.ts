const rawApiUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://forestryresourceplanning.runasp.net/api";

export const API_BASE_URL = rawApiUrl.replace(/\/+$/, "");
export const ALLOWED_MOBILE_ROLES = [
  "Technician",
  "Seasonal",
  "Student",
  "Researcher",
  "Manager",
  "Admin",
  "SystemAdmin",
];
