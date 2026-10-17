import { money } from "@/lib/format";
export function RevenueChart({
  groups,
}: {
  groups: { label: string; revenueCents: number }[];
}) {
  const max = Math.max(...groups.map((g) => g.revenueCents), 1);
  const w = 740,
    h = 205;
  const points = groups.map(
    (g, i) =>
      `${groups.length > 1 ? (i / (groups.length - 1)) * w : w / 2},${h - 18 - (g.revenueCents / max) * (h - 40)}`,
  );
  const line = "M" + points.join(" L");
  const area = points.length
    ? `${line} L${groups.length > 1 ? w : w / 2},${h} L${groups.length > 1 ? 0 : w / 2},${h} Z`
    : "";
  return (
    <div className="revenue-chart">
      <div className="chart-scale">
        {[1, 0.75, 0.5, 0.25, 0].map((v) => (
          <span key={v}>{money(Math.round(max * v), true)}</span>
        ))}
      </div>
      <div className="chart-plot">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label="Monthly completed order revenue in USD"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7867df" stopOpacity=".22" />
              <stop offset="100%" stopColor="#7867df" stopOpacity=".01" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <line
              key={v}
              x1="0"
              x2={w}
              y1={h * v}
              y2={h * v}
              stroke="#ececf3"
              strokeDasharray="4 5"
            />
          ))}
          {points.length > 0 && (
            <>
              <path d={area} fill="url(#revenue-fill)" />
              <path
                d={line}
                fill="none"
                stroke="#7867df"
                strokeWidth="3"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {groups.map((g, i) => (
                <circle
                  key={g.label}
                  cx={groups.length > 1 ? (i / (groups.length - 1)) * w : w / 2}
                  cy={h - 18 - (g.revenueCents / max) * (h - 40)}
                  r="4"
                  fill="#fff"
                  stroke="#7867df"
                  strokeWidth="2"
                >
                  <title>{`${g.label}: ${money(g.revenueCents)}`}</title>
                </circle>
              ))}
            </>
          )}
        </svg>
        <div className="chart-months">
          {groups.map((g) => (
            <span key={g.label}>
              {new Date(`${g.label}-01T00:00:00Z`).toLocaleDateString("en-US", {
                month: "short",
                timeZone: "UTC",
              })}
            </span>
          ))}
        </div>
      </div>
      <details className="chart-details">
        <summary>View chart data</summary>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Revenue (USD)</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.label}>
                <td>{g.label}</td>
                <td>{money(g.revenueCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
