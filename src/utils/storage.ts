import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserData } from "../types/auth";

const TOKEN_KEY = "@frpam_access_token";
const USER_KEY = "@frpam_user_data";

// In-memory fallback in case AsyncStorage native module is null (e.g. Web or dev environment)
const memoryStorage: Record<string, string> = {};

const isWeb = Platform.OS === "web" || (typeof window !== "undefined" && typeof window.localStorage !== "undefined");

async function getItem(key: string): Promise<string | null> {
  if (isWeb && typeof window !== "undefined" && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      // fallback
    }
  }

  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return memoryStorage[key] ?? null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  memoryStorage[key] = value;

  if (isWeb && typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch {
      // fallback
    }
  }

  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // handled by memoryStorage
  }
}

async function removeItem(key: string): Promise<void> {
  delete memoryStorage[key];

  if (isWeb && typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem(key);
      return;
    } catch {
      // fallback
    }
  }

  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // handled by memoryStorage
  }
}

export async function saveToken(token: string): Promise<void> {
  await setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return await getItem(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  await removeItem(TOKEN_KEY);
}

export async function saveUser(user: UserData): Promise<void> {
  await setItem(USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<UserData | null> {
  const data = await getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function clearAuth(): Promise<void> {
  await removeItem(TOKEN_KEY);
  await removeItem(USER_KEY);
}
