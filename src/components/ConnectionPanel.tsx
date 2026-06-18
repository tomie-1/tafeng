import { KeyRound, Plus, Server, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import type { ServerProfile } from "../../shared/types";
import type { TFunction } from "../lib/i18n";
import { emptyProfile } from "../lib/sample";

type Props = {
  profiles: ServerProfile[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onCreate: (profile: Omit<ServerProfile, "id" | "createdAt" | "updatedAt">) => void;
  onDelete: (id: string) => void;
  t: TFunction;
};

export function ConnectionPanel({ profiles, selectedId, onSelect, onCreate, onDelete, t }: Props) {
  const [draft, setDraft] = useState(emptyProfile);

  function submit(event: FormEvent) {
    event.preventDefault();
    onCreate(draft);
    setDraft({ ...emptyProfile, name: t("newVps") });
  }

  return (
    <aside className="side-panel">
      <div className="panel-title">
        <Server size={18} />
        <span>{t("connections")}</span>
      </div>
      <div className="connection-list">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            className={profile.id === selectedId ? "connection-item active" : "connection-item"}
            onClick={() => onSelect(profile.id)}
            type="button"
          >
            <span>{profile.name}</span>
            <small>
              {profile.username}@{profile.host}:{profile.port}
            </small>
            <Trash2
              size={15}
              onClick={(event) => {
                event.stopPropagation();
                onDelete(profile.id);
              }}
            />
          </button>
        ))}
      </div>
      <form className="connection-form" onSubmit={submit}>
        <div className="panel-title compact">
          <Plus size={16} />
          <span>{t("saveVps")}</span>
        </div>
        <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder={t("name")} />
        <input value={draft.host} onChange={(event) => setDraft({ ...draft, host: event.target.value })} placeholder={t("host")} />
        <div className="split-inputs">
          <input
            value={draft.port}
            onChange={(event) => setDraft({ ...draft, port: Number(event.target.value) })}
            type="number"
            min={1}
            max={65535}
          />
          <input value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value })} placeholder={t("username")} />
        </div>
        <select
          value={draft.credentialKind}
          onChange={(event) => setDraft({ ...draft, credentialKind: event.target.value as ServerProfile["credentialKind"] })}
        >
          <option value="password">{t("password")}</option>
          <option value="privateKey">{t("privateKey")}</option>
        </select>
        {draft.credentialKind === "password" ? (
          <input
            value={draft.password ?? ""}
            onChange={(event) => setDraft({ ...draft, password: event.target.value })}
            placeholder={t("sshPassword")}
            type="password"
          />
        ) : (
          <textarea
            value={draft.privateKey ?? ""}
            onChange={(event) => setDraft({ ...draft, privateKey: event.target.value })}
            placeholder={t("pastePrivateKey")}
            rows={5}
          />
        )}
        <button className="secondary-button" type="submit">
          <KeyRound size={16} />
          {t("saveConnection")}
        </button>
      </form>
    </aside>
  );
}
