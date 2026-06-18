import { Activity, Cpu, HardDrive, ListTree, MemoryStick } from "lucide-react";
import type { ReactNode } from "react";
import type { ProcessInfo, ServerMetrics } from "../../shared/types";
import type { TFunction } from "../lib/i18n";

type Props = {
  metrics?: ServerMetrics;
  processes: ProcessInfo[];
  t: TFunction;
};

export function MonitorPanel({ metrics, processes, t }: Props) {
  return (
    <aside className="monitor-panel">
      <div className="panel-title">
        <Activity size={18} />
        <span>{t("liveStatus")}</span>
      </div>
      <MetricRow icon={<Cpu size={16} />} label="CPU" percent={metrics?.cpuPercent ?? 0} detail={`${metrics?.cpuPercent ?? 0}%`} />
      <MetricRow icon={<MemoryStick size={16} />} label={t("memory")} percent={metrics?.memory.percent ?? 0} detail={formatUsage(metrics?.memory)} />
      <MetricRow icon={<MemoryStick size={16} />} label="Swap" percent={metrics?.swap.percent ?? 0} detail={formatUsage(metrics?.swap)} />
      <MetricRow icon={<HardDrive size={16} />} label={t("disk")} percent={metrics?.disk.percent ?? 0} detail={formatUsage(metrics?.disk)} />

      <div className="panel-title process-title">
        <ListTree size={18} />
        <span>{t("processes")}</span>
      </div>
      <div className="process-table">
        {processes.map((process) => (
          <div className="process-row" key={process.pid}>
            <span>{process.pid}</span>
            <span>{process.user}</span>
            <span>{process.cpu.toFixed(1)}%</span>
            <span title={process.command}>{process.command}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function MetricRow({ icon, label, percent, detail }: { icon: ReactNode; label: string; percent: number; detail: string }) {
  return (
    <div className="metric-row">
      <div className="metric-head">
        <span>
          {icon}
          {label}
        </span>
        <small>{detail}</small>
      </div>
      <div className="meter">
        <span style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}

function formatUsage(stat?: { used: number; total: number; percent: number }) {
  if (!stat) return "0 / 0 GB";
  return `${stat.used} / ${stat.total} GB`;
}
