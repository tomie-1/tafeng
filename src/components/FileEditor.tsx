import { Download, FileText, FolderOpen, Save, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import type { RemoteFile } from "../../shared/types";
import { api } from "../lib/api";
import type { TFunction } from "../lib/i18n";

type Props = {
  t: TFunction;
};

export function FileEditor({ t }: Props) {
  const [path, setPath] = useState("/etc/nginx");
  const [files, setFiles] = useState<RemoteFile[]>([]);
  const [activeFile, setActiveFile] = useState("/etc/nginx/nginx.conf");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.files(path).then(setFiles).catch((error: Error) => setStatus(error.message));
  }, [path]);

  useEffect(() => {
    api.readFile(activeFile).then((file) => setContent(file.content)).catch((error: Error) => setStatus(error.message));
  }, [activeFile]);

  async function save() {
    const result = await api.writeFile(activeFile, content);
    setStatus(`${t("savedAt")} ${new Date(result.savedAt).toLocaleTimeString()}`);
  }

  return (
    <section className="file-editor">
      <div className="file-browser">
        <div className="panel-title">
          <FolderOpen size={18} />
          <input value={path} onChange={(event) => setPath(event.target.value)} />
        </div>
        <div className="file-list">
          {files.map((file) => (
            <button key={file.path} type="button" onClick={() => (file.type === "file" ? setActiveFile(file.path) : setPath(file.path))}>
              <FileText size={15} />
              <span>{file.name}</span>
              <small>{file.type === "file" ? `${file.size} B` : t("directory")}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="editor-pane">
        <div className="editor-toolbar">
          <span>{activeFile}</span>
          <div>
            <button type="button" title={t("uploadFile")}>
              <Upload size={16} />
            </button>
            <button type="button" title={t("downloadFile")}>
              <Download size={16} />
            </button>
            <button type="button" title={t("save")} onClick={save}>
              <Save size={16} />
            </button>
          </div>
        </div>
        <textarea value={content} onChange={(event) => setContent(event.target.value)} spellCheck={false} />
        <small className="editor-status">{status}</small>
      </div>
    </section>
  );
}
