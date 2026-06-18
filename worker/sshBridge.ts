import type { Language, ProcessInfo, ServerMetrics, TerminalMessage } from "../shared/types";

export type SshBridge = {
  handleClientMessage(message: TerminalMessage): void;
  close(): void;
};

type SshBridgeOptions = {
  profileName: string;
  language: Language;
  onCommand?: (command: string) => void;
};

export function createSshBridge(socket: WebSocket, options: SshBridgeOptions): SshBridge {
  let currentLine = "";
  const encoder = (message: TerminalMessage) => socket.send(JSON.stringify(message));
  const copy = options.language === "en" ? terminalCopy.en : terminalCopy.zh;
  const welcome = [
    `\r\n${copy.title}\r\n`,
    `${copy.selected}${options.profileName}\r\n`,
    `${copy.bridgeMode}\r\n\r\n`,
    "$ "
  ].join("");

  encoder({ type: "output", data: welcome });
  const timer = setInterval(() => {
    encoder({ type: "metrics", metrics: sampleMetrics(), processes: sampleProcesses() });
  }, 2500);

  return {
    handleClientMessage(message) {
      if (message.type === "input") {
        const input = message.data;
        if (input === "\r") {
          const command = currentLine.trim();
          currentLine = "";
          if (command) options.onCommand?.(command);
          encoder({ type: "output", data: "\r\n$ " });
          return;
        }
        if (input === "\u007f") {
          currentLine = currentLine.slice(0, -1);
          encoder({ type: "output", data: "\b \b" });
          return;
        }
        if (input === "\u0003") {
          currentLine = "";
          encoder({ type: "output", data: "^C\r\n$ " });
          return;
        }
        currentLine += input.replace(/\p{C}/gu, "");
        encoder({ type: "output", data: input });
      }
    },
    close() {
      clearInterval(timer);
    }
  };
}

const terminalCopy = {
  zh: {
    title: "踏风 Tafeng WebSSH",
    selected: "已选择连接：",
    bridgeMode: "当前为开发桥接模式。接入真实 SSH 时，请替换 worker/sshBridge.ts。"
  },
  en: {
    title: "Tafeng WebSSH",
    selected: "Selected connection: ",
    bridgeMode: "Development bridge mode is active. Replace worker/sshBridge.ts to connect real SSH."
  }
} as const;

function sampleMetrics(): ServerMetrics {
  const now = Date.now();
  const wave = (seed: number, min: number, max: number) => {
    const value = min + ((Math.sin(now / seed) + 1) / 2) * (max - min);
    return Math.round(value);
  };
  return {
    cpuPercent: wave(1800, 12, 74),
    memory: usage(3.8, 8),
    swap: usage(0.6, 2),
    disk: usage(61, 120),
    updatedAt: new Date().toISOString()
  };
}

function usage(used: number, total: number) {
  return { used, total, percent: Math.round((used / total) * 100) };
}

function sampleProcesses(): ProcessInfo[] {
  return [
    { pid: 1, user: "root", cpu: 0.1, memory: 0.4, command: "systemd" },
    { pid: 814, user: "root", cpu: 2.4, memory: 1.8, command: "sshd: tafeng-session" },
    { pid: 1208, user: "www", cpu: 8.1, memory: 6.3, command: "nginx: worker process" },
    { pid: 1349, user: "app", cpu: 14.2, memory: 18.6, command: "node /srv/app/server.js" }
  ];
}
