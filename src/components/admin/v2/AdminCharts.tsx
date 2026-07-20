"use client";

type BarChartProps = {
  data: Array<{ label: string; value: number; color?: string }>;
  height?: number;
};

export function AdminBarChart({ data, height = 160 }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-lg transition-all duration-500"
              style={{
                height: `${Math.max((item.value / max) * 100, 4)}%`,
                backgroundColor: item.color ?? "#FF6B6B",
              }}
              title={`${item.label}: ${item.value}`}
            />
          </div>
          <span className="truncate text-[10px] font-medium text-foreground-secondary">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

type LineChartProps = {
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string;
};

export function AdminLineChart({ data, height = 140, color = "#FF6B6B" }: LineChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-background text-sm text-foreground-muted"
        style={{ height }}
      >
        尚無資料
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const width = 100;
  const points = data.map((d, i) => {
    const x = data.length === 1 ? 50 : (i / (data.length - 1)) * width;
    const y = 100 - (d.value / max) * 80 - 10;
    return `${x},${y}`;
  });

  return (
    <div style={{ height }}>
      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          points={points.join(" ")}
        />
        <polygon
          fill={color}
          fillOpacity="0.12"
          points={`0,100 ${points.join(" ")} 100,100`}
        />
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-foreground-muted">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

type DonutChartProps = {
  segments: Array<{ label: string; value: number; color: string }>;
  size?: number;
};

export function AdminDonutChart({ segments, size = 120 }: DonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let offset = 0;
  const r = 40;
  const c = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#EEF1F8" strokeWidth="12" />
        {segments.map((seg) => {
          const dash = (seg.value / total) * c;
          const el = (
            <circle
              key={seg.label}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="space-y-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-xs text-foreground-secondary">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span>{seg.label}</span>
            <span className="font-semibold">{Math.round((seg.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
