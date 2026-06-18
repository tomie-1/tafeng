import type { AppSettings, CommandHistoryEntry, ServerProfile } from "../shared/types";

export type Env = {
  ASSETS: Fetcher;
  TAFENG_KV: KVNamespace;
  TAFENG_FILES: R2Bucket;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
};

const SETTINGS_KEY = "settings";
const CONNECTIONS_KEY = "connections";
const SESSION_PREFIX = "session:";
const COMMAND_HISTORY_INDEX_KEY = "command-history:index";
const COMMAND_HISTORY_ITEM_PREFIX = "command-history:item:";
const COMMAND_HISTORY_LIMIT = 100_000;

export const defaultSettings: AppSettings = {
  managementPasswordSet: false,
  twoFactorEnabled: false,
  theme: "dark",
  language: "zh"
};

export async function getSettings(env: Env): Promise<AppSettings> {
  const stored = await env.TAFENG_KV.get<AppSettings>(SETTINGS_KEY, "json");
  return { ...defaultSettings, ...stored, managementPasswordSet: Boolean(env.ADMIN_PASSWORD) || Boolean(stored?.managementPasswordSet) };
}

export async function saveSettings(env: Env, settings: AppSettings) {
  await env.TAFENG_KV.put(SETTINGS_KEY, JSON.stringify(settings));
}

export async function listConnections(env: Env): Promise<ServerProfile[]> {
  return (await env.TAFENG_KV.get<ServerProfile[]>(CONNECTIONS_KEY, "json")) ?? [];
}

export async function saveConnections(env: Env, profiles: ServerProfile[]) {
  await env.TAFENG_KV.put(CONNECTIONS_KEY, JSON.stringify(profiles));
}

export async function createSession(env: Env) {
  const token = crypto.randomUUID() + "." + crypto.randomUUID();
  await env.TAFENG_KV.put(SESSION_PREFIX + token, "1", { expirationTtl: 60 * 60 * 12 });
  return token;
}

export async function isValidSession(env: Env, token: string | null) {
  if (!token) return false;
  return (await env.TAFENG_KV.get(SESSION_PREFIX + token)) === "1";
}

export async function clearSession(env: Env, token: string | null) {
  if (token) await env.TAFENG_KV.delete(SESSION_PREFIX + token);
}

export async function appendCommandHistory(env: Env, entry: Omit<CommandHistoryEntry, "id" | "createdAt">) {
  const id = crypto.randomUUID();
  const item: CommandHistoryEntry = {
    ...entry,
    id,
    createdAt: new Date().toISOString()
  };

  const currentIndex = (await env.TAFENG_KV.get<string[]>(COMMAND_HISTORY_INDEX_KEY, "json")) ?? [];
  const nextIndex = [id, ...currentIndex];
  const staleIds = nextIndex.splice(COMMAND_HISTORY_LIMIT);

  await Promise.all([
    env.TAFENG_KV.put(COMMAND_HISTORY_ITEM_PREFIX + id, JSON.stringify(item)),
    env.TAFENG_KV.put(COMMAND_HISTORY_INDEX_KEY, JSON.stringify(nextIndex))
  ]);

  await Promise.all(staleIds.map((staleId) => env.TAFENG_KV.delete(COMMAND_HISTORY_ITEM_PREFIX + staleId)));
  return item;
}

export async function listCommandHistory(env: Env, limit = 200, offset = 0): Promise<{ items: CommandHistoryEntry[]; total: number }> {
  const index = (await env.TAFENG_KV.get<string[]>(COMMAND_HISTORY_INDEX_KEY, "json")) ?? [];
  const boundedLimit = Math.min(Math.max(limit, 1), 1000);
  const boundedOffset = Math.max(offset, 0);
  const ids = index.slice(boundedOffset, boundedOffset + boundedLimit);
  const items = await Promise.all(ids.map((id) => env.TAFENG_KV.get<CommandHistoryEntry>(COMMAND_HISTORY_ITEM_PREFIX + id, "json")));
  return {
    items: items.filter((item): item is CommandHistoryEntry => Boolean(item)),
    total: index.length
  };
}

export async function clearCommandHistory(env: Env) {
  const index = (await env.TAFENG_KV.get<string[]>(COMMAND_HISTORY_INDEX_KEY, "json")) ?? [];
  await Promise.all(index.map((id) => env.TAFENG_KV.delete(COMMAND_HISTORY_ITEM_PREFIX + id)));
  await env.TAFENG_KV.delete(COMMAND_HISTORY_INDEX_KEY);
}
