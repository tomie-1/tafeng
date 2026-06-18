export type ThemeMode = "dark" | "light";
export type Language = "zh" | "en";

export type AuthState = {
  authenticated: boolean;
  twoFactorRequired: boolean;
};

export type AppSettings = {
  managementPasswordSet: boolean;
  twoFactorEnabled: boolean;
  theme: ThemeMode;
  language: Language;
};

export type CredentialKind = "password" | "privateKey";

export type ServerProfile = {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  credentialKind: CredentialKind;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  createdAt: string;
  updatedAt: string;
};

export type ServerMetrics = {
  cpuPercent: number;
  memory: UsageStat;
  swap: UsageStat;
  disk: UsageStat;
  updatedAt: string;
};

export type UsageStat = {
  used: number;
  total: number;
  percent: number;
};

export type ProcessInfo = {
  pid: number;
  user: string;
  cpu: number;
  memory: number;
  command: string;
};

export type CommandHistoryEntry = {
  id: string;
  command: string;
  profileId: string | null;
  profileName: string;
  host: string | null;
  username: string | null;
  createdAt: string;
};

export type RemoteFile = {
  name: string;
  path: string;
  size: number;
  type: "file" | "directory";
  modifiedAt: string;
};

export type TerminalMessage =
  | { type: "hello"; profileId: string }
  | { type: "input"; data: string }
  | { type: "resize"; cols: number; rows: number }
  | { type: "output"; data: string }
  | { type: "metrics"; metrics: ServerMetrics; processes: ProcessInfo[] }
  | { type: "error"; message: string };
