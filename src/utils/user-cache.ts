import { logger } from "@/logger";
import { ICachedUser } from "@/types/user.types";

const userCache = new Map<string, ICachedUser>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getUserCache(userId: string): ICachedUser | null {
  const cached = userCache.get(userId);
  if (!cached) return null;

  // Check if expired
  if (cached.expiresAt && Date.now() > cached.expiresAt) {
    userCache.delete(userId);
    return null;
  }

  return cached;
}

export function setUserCache(userId: string, user: ICachedUser) {
  logger.info(`Caching user ${userId}`);
  userCache.set(userId, { ...user, expiresAt: Date.now() + CACHE_TTL });
}

export function deleteUserCache(userId: string) {
  userCache.delete(userId);
}

export function clearUserCache() {
  userCache.clear();
}
