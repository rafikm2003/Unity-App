type Props = {
  completedCount: number;
  total: number;
};

export default function ProgressBar({ completedCount, total }: Props) {
  const pct = total <= 0 ? 0 : Math.round((completedCount / total) * 100);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>Postęp</strong>
        <span>
          {completedCount}/{total} ({pct}%)
        </span>
      </div>
      <div style={{ height: 12, border: "1px solid #999", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%" }} />
      </div>
    </div>
  );
}
