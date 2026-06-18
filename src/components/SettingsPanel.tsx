import { Languages, LogOut, Moon, Shield, Sun } from "lucide-react";
import type { Language } from "../../shared/types";
import type { AppSettings } from "../../shared/types";
import type { TFunction } from "../lib/i18n";

type Props = {
  settings: AppSettings;
  t: TFunction;
  onChange: (settings: AppSettings) => void;
  onLogout: () => void;
};

export function SettingsPanel({ settings, t, onChange, onLogout }: Props) {
  return (
    <section className="settings-strip">
      <div className="settings-group">
        <button
          className={settings.theme === "dark" ? "icon-toggle active" : "icon-toggle"}
          type="button"
          title={t("darkTerminal")}
          onClick={() => onChange({ ...settings, theme: "dark" })}
        >
          <Moon size={16} />
        </button>
        <button
          className={settings.theme === "light" ? "icon-toggle active" : "icon-toggle"}
          type="button"
          title={t("lightTerminal")}
          onClick={() => onChange({ ...settings, theme: "light" })}
        >
          <Sun size={16} />
        </button>
      </div>
      <label className="language-line">
        <Languages size={16} />
        <span>{t("language")}</span>
        <select value={settings.language} onChange={(event) => onChange({ ...settings, language: event.target.value as Language })}>
          <option value="zh">{t("languageZh")}</option>
          <option value="en">{t("languageEn")}</option>
        </select>
      </label>
      <label className="toggle-line">
        <input
          checked={settings.twoFactorEnabled}
          onChange={(event) => onChange({ ...settings, twoFactorEnabled: event.target.checked })}
          type="checkbox"
        />
        <Shield size={16} />
        {t("twoFactor")}
      </label>
      <button className="icon-toggle" type="button" title={t("logout")} onClick={onLogout}>
        <LogOut size={16} />
      </button>
    </section>
  );
}
