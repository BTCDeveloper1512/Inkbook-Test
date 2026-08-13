import React, { useMemo, useState } from "react";
import { Table2, BarChart3 } from "lucide-react";

/**
 * The Pro-plan half of the Übersicht: everything above this block answers
 * "what is true right now", this block answers "how is the studio doing over
 * time". One period control scopes every number below it, so the KPIs, the
 * revenue columns and the funnel always describe the same slice — a per-chart
 * range would let two cards disagree and neither would be wrong.
 */

export const PERIODS = [
  { key: "30d", label: "30 Tage", days: 30 },
  { key: "90d", label: "90 Tage", days: 90 },
  { key: "12m", label: "12 Monate", days: 365 },
  { key: "all", label: "Gesamt", days: null },
];

const eur = (n) => Number(n || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const pct = (n) => `${Math.round(n * 100)} %`;

/**
 * There is no completed_at on a booking, so revenue is dated by the last
 * session actually worked, falling back to when the request came in. Using
 * created_at alone would book a tattoo finished in March against January,
 * which is exactly the distortion a monthly revenue chart must not have.
 */
function revenueDate(b) {
  const sessions = (b.sessions || []).filter((s) => !["storniert", "no_show"].includes(s.status));
  const last = sessions.map((s) => new Date(s.start_time).getTime()).sort((a, c) => c - a)[0];
  return last ? new Date(last) : b.created_at ? new Date(b.created_at) : null;
}

function startOfWeek(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // Monday-based, matching how a studio thinks about its week.
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

/**
 * Weekly buckets for short ranges, monthly for long ones — a 12-month view in
 * weeks is 52 unreadable slivers, a 30-day view in months is one bar.
 */
function buildBuckets(days, from, now) {
  const weekly = days !== null && days <= 90;
  const buckets = [];
  if (weekly) {
    for (let cur = startOfWeek(from); cur <= now; cur.setDate(cur.getDate() + 7)) {
      const start = new Date(cur);
      const end = new Date(cur);
      end.setDate(end.getDate() + 7);
      buckets.push({ start, end, label: start.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) });
    }
  } else {
    const cur = new Date(from.getFullYear(), from.getMonth(), 1);
    while (cur <= now) {
      const start = new Date(cur);
      const end = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      buckets.push({ start, end, label: start.toLocaleDateString("de-DE", { month: "short", year: "2-digit" }) });
      cur.setMonth(cur.getMonth() + 1);
    }
  }
  return buckets;
}

function niceCeil(n) {
  if (n <= 0) return 100;
  const mag = 10 ** Math.floor(Math.log10(n));
  return Math.ceil(n / mag) * mag;
}

function Card({ title, subtitle, action, children }) {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="font-playfair text-base text-zinc-900">{title}</h3>
          {subtitle && <p className="text-[11px] font-inter text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/** Diagramm ⇄ Tabelle. Every value in a chart stays reachable without hovering. */
function ViewToggle({ table, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!table)}
      className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-zinc-200 text-[11px] font-inter text-zinc-500 hover:border-zinc-400 transition-colors flex-shrink-0"
    >
      {table ? <BarChart3 size={12} /> : <Table2 size={12} />}
      {table ? "Diagramm" : "Tabelle"}
    </button>
  );
}

function KpiTile({ label, value, hint }) {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-4">
      <div className="text-[10px] font-inter uppercase tracking-widest text-zinc-400">{label}</div>
      <div className="font-inter font-semibold text-xl text-zinc-900 mt-1.5">{value}</div>
      {hint && <div className="text-[10px] font-inter text-zinc-400 mt-0.5">{hint}</div>}
    </div>
  );
}

/**
 * Single series, so one hue and no legend — the card title says what's
 * plotted. Only the peak carries a direct label; the axis and the per-column
 * tooltip carry everything else, and the table view carries all of it for
 * anyone not using a pointer.
 */
function RevenueColumns({ buckets, values }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(...values, 0);
  const top = niceCeil(max);
  const peak = values.indexOf(max);

  return (
    <div>
      <div className="flex gap-3">
        <div className="flex flex-col justify-between text-[10px] font-inter text-zinc-400 tabular-nums py-0.5 flex-shrink-0">
          <span>{eur(top)}</span>
          <span>{eur(top / 2)}</span>
          <span>0</span>
        </div>
        <div className="relative flex-1 min-w-0 h-40">
          {[0, 0.5, 1].map((t) => (
            <div key={t} className="absolute inset-x-0 h-px bg-zinc-100" style={{ bottom: `${t * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {buckets.map((b, i) => {
              const h = top ? (values[i] / top) * 100 : 0;
              const active = hover === i;
              return (
                <button
                  key={b.label + i}
                  type="button"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  // The whole column is the hit target, not just the painted bar.
                  className="flex-1 min-w-0 h-full flex items-end justify-center group"
                  aria-label={`${b.label}: ${eur(values[i])}`}
                >
                  <span
                    className={`w-full max-w-[24px] rounded-t transition-colors ${active ? "bg-zinc-600" : "bg-zinc-900"}`}
                    style={{ height: `${Math.max(h, values[i] > 0 ? 1.5 : 0)}%` }}
                  />
                </button>
              );
            })}
          </div>
          {/* Hidden while its own column is hovered — the tooltip is already
              showing that exact number two lines above it. */}
          {peak >= 0 && max > 0 && hover !== peak && (
            <span
              className="absolute text-[10px] font-inter text-zinc-500 -translate-x-1/2 pointer-events-none"
              style={{ left: `${((peak + 0.5) / buckets.length) * 100}%`, bottom: `calc(${(max / top) * 100}% + 4px)` }}
            >
              {eur(max)}
            </span>
          )}
          {hover !== null && (
            <div
              className="absolute z-10 -translate-x-1/2 -top-1 pointer-events-none bg-zinc-900 text-white rounded-lg px-2 py-1 whitespace-nowrap"
              style={{ left: `${((hover + 0.5) / buckets.length) * 100}%` }}
            >
              <div className="text-[11px] font-inter font-semibold tabular-nums">{eur(values[hover])}</div>
              <div className="text-[10px] font-inter text-zinc-400">{buckets[hover].label}</div>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-3 mt-1.5">
        <div className="invisible text-[10px] font-inter tabular-nums flex-shrink-0">{eur(top)}</div>
        <div className="flex-1 min-w-0 flex gap-[2px]">
          {buckets.map((b, i) => (
            <div key={b.label + i} className="flex-1 min-w-0 text-center text-[9px] font-inter text-zinc-400 truncate">
              {/* Every label only fits on short ranges; otherwise thin them out. */}
              {buckets.length <= 13 || i % 3 === 0 ? b.label : ""}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DataTable({ head, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-inter">
        <thead>
          <tr className="text-left text-[10px] font-inter uppercase tracking-widest text-zinc-400">
            {head.map((h, i) => (
              <th key={h} className={`pb-2 font-normal ${i > 0 ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((r) => (
            <tr key={r[0]}>
              {r.map((cell, i) => (
                <td key={i} className={`py-1.5 tabular-nums ${i > 0 ? "text-right text-zinc-900" : "text-zinc-500"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Ordered stages, so the bars share one hue against a lighter track of the
 * same ramp — the track is what makes the drop-off between stages visible at
 * all. Four rows only, so every value is directly labelled.
 */
function Funnel({ stages }) {
  const first = stages[0]?.count || 0;
  return (
    <div className="space-y-3.5">
      {stages.map((s, i) => {
        const share = first ? s.count / first : 0;
        const prev = i > 0 ? stages[i - 1].count : null;
        return (
          <div key={s.label}>
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="text-xs font-inter text-zinc-600 truncate">{s.label}</span>
              <span className="text-xs font-inter font-semibold text-zinc-900 tabular-nums flex-shrink-0">{s.count}</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full rounded-full bg-zinc-900" style={{ width: `${share * 100}%` }} />
            </div>
            <div className="text-[10px] font-inter text-zinc-400 mt-1">
              {i === 0 ? "Basis" : `${pct(prev ? s.count / prev : 0)} von „${stages[i - 1].label}“ · ${pct(share)} gesamt`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StudioAnalytics({ bookings, period }) {
  const [revenueTable, setRevenueTable] = useState(false);
  const [funnelTable, setFunnelTable] = useState(false);

  const data = useMemo(() => {
    const now = new Date();
    const days = PERIODS.find((p) => p.key === period)?.days ?? null;

    const allDates = bookings.map((b) => (b.created_at ? new Date(b.created_at) : null)).filter(Boolean);
    const earliest = allDates.length ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : now;
    const from = days === null ? earliest : new Date(now.getTime() - days * 86400000);

    const inPeriod = (d) => d && d >= from && d <= now;
    // Requests are counted by when they arrived, revenue by when the work
    // happened — the same booking can therefore sit in the funnel of one
    // period and the revenue of the next, which is correct.
    const requested = bookings.filter((b) => inPeriod(b.created_at ? new Date(b.created_at) : null));
    const earned = bookings.filter((b) => b.status === "abgeschlossen" && b.price_final && inPeriod(revenueDate(b)));

    const buckets = buildBuckets(days, from, now);
    const values = buckets.map((bk) =>
      earned.reduce((sum, b) => {
        const d = revenueDate(b);
        return d >= bk.start && d < bk.end ? sum + Number(b.price_final || 0) : sum;
      }, 0)
    );

    const revenue = earned.reduce((sum, b) => sum + Number(b.price_final || 0), 0);
    const ACCEPTED = ["angenommen", "anzahlung_ausstehend", "in_planung", "laufend", "abgeschlossen"];
    const stages = [
      { label: "Anfragen", count: requested.length },
      { label: "Angebot gesendet", count: requested.filter((b) => (b.offers || []).length > 0).length },
      { label: "Angenommen", count: requested.filter((b) => ACCEPTED.includes(b.status)).length },
      { label: "Abgeschlossen", count: requested.filter((b) => b.status === "abgeschlossen").length },
    ];

    const offers = requested.flatMap((b) => b.offers || []);
    const decided = offers.filter((o) => ["angenommen", "abgelehnt"].includes(o.status));
    const acceptRate = decided.length ? decided.filter((o) => o.status === "angenommen").length / decided.length : null;

    // How long a customer waits for a first answer — the number a studio can
    // actually act on, and the one most likely to explain a weak funnel.
    const responseHours = requested
      .map((b) => {
        const firstOffer = [...(b.offers || [])].sort((x, y) => new Date(x.created_at) - new Date(y.created_at))[0];
        if (!firstOffer || !b.created_at) return null;
        return (new Date(firstOffer.created_at) - new Date(b.created_at)) / 3600000;
      })
      .filter((h) => h !== null && h >= 0);
    const avgResponse = responseHours.length ? responseHours.reduce((a, c) => a + c, 0) / responseHours.length : null;

    const periodSessions = bookings.flatMap((b) => (b.sessions || []).filter((s) => inPeriod(new Date(s.start_time))));
    const dropped = periodSessions.filter((s) => ["storniert", "no_show"].includes(s.status)).length;

    return {
      buckets,
      values,
      revenue,
      completed: earned.length,
      avgOrder: earned.length ? revenue / earned.length : 0,
      stages,
      acceptRate,
      avgResponse,
      sessionCount: periodSessions.length,
      dropRate: periodSessions.length ? dropped / periodSessions.length : null,
      weekly: days !== null && days <= 90,
    };
  }, [bookings, period]);

  const responseLabel =
    data.avgResponse === null ? "—" : data.avgResponse < 24 ? `${Math.round(data.avgResponse)} h` : `${(data.avgResponse / 24).toFixed(1)} Tage`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile label="Umsatz im Zeitraum" value={eur(data.revenue)} hint={`${data.completed} abgeschlossen`} />
        <KpiTile label="Ø Auftragswert" value={eur(data.avgOrder)} hint="pro abgeschlossener Buchung" />
        <KpiTile
          label="Annahmequote"
          value={data.acceptRate === null ? "—" : pct(data.acceptRate)}
          hint={data.acceptRate === null ? "noch keine Entscheidung" : "der beantworteten Angebote"}
        />
        <KpiTile label="Ø Reaktionszeit" value={responseLabel} hint="Anfrage bis erstes Angebot" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <Card
            title="Umsatzverlauf"
            subtitle={`Abgeschlossene Buchungen, ${data.weekly ? "je Woche" : "je Monat"}`}
            action={<ViewToggle table={revenueTable} onChange={setRevenueTable} />}
          >
            {data.buckets.length === 0 || data.values.every((v) => v === 0) ? (
              <p className="text-xs font-inter text-zinc-400 py-10 text-center">In diesem Zeitraum kein Umsatz erfasst.</p>
            ) : revenueTable ? (
              <DataTable head={[data.weekly ? "Woche ab" : "Monat", "Umsatz"]} rows={data.buckets.map((b, i) => [b.label, eur(data.values[i])])} />
            ) : (
              <RevenueColumns buckets={data.buckets} values={data.values} />
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card
            title="Von der Anfrage zum Abschluss"
            subtitle="Anfragen aus diesem Zeitraum"
            action={<ViewToggle table={funnelTable} onChange={setFunnelTable} />}
          >
            {data.stages[0].count === 0 ? (
              <p className="text-xs font-inter text-zinc-400 py-10 text-center">In diesem Zeitraum keine Anfragen.</p>
            ) : funnelTable ? (
              <DataTable
                head={["Stufe", "Anzahl", "Anteil"]}
                rows={data.stages.map((s) => [s.label, String(s.count), pct(data.stages[0].count ? s.count / data.stages[0].count : 0)])}
              />
            ) : (
              <Funnel stages={data.stages} />
            )}
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiTile label="Termine im Zeitraum" value={String(data.sessionCount)} hint="inkl. abgesagter" />
        <KpiTile
          label="Ausfallquote"
          value={data.dropRate === null ? "—" : pct(data.dropRate)}
          hint="storniert oder nicht erschienen"
        />
        <KpiTile label="Anfragen im Zeitraum" value={String(data.stages[0].count)} hint="neu eingegangen" />
        <KpiTile
          label="Abschlussquote"
          value={data.stages[0].count ? pct(data.stages[3].count / data.stages[0].count) : "—"}
          hint="Anfrage bis abgeschlossen"
        />
      </div>
    </div>
  );
}
