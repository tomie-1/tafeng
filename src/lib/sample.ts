import type { ServerProfile } from "../../shared/types";

export const emptyProfile: Omit<ServerProfile, "id" | "createdAt" | "updatedAt"> = {
  name: "Tafeng VPS",
  host: "127.0.0.1",
  port: 22,
  username: "root",
  credentialKind: "password",
  password: "",
  privateKey: "",
  passphrase: ""
};
