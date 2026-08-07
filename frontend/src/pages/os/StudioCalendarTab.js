import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, AlertTriangle, Inbox } from "lucide-react";
import { studioApi } from "../../lib/studioApi";
import { artistColor, initials } from "../../lib/artistColors";
import { SLOT_LABEL } from "../../lib/daySlots";
import { Button } from "../../components/ui/button";
import SessionDialog from "./SessionDialog";

/**
 * The studio's day planner: one column per artist, and a rail listing requests
 * that still need an offer. Appointments arrive here on their own — accepting
 * an offer books its time — so dragging a block is rescheduling, not first
 * placement, and clicking one opens the actions for a booked slot.
 *
 * Drag is hand-rolled on pointer events rather than a DnD library: snapping to
 * a time grid, a live time readout and edge-resize on the same blocks are more
 * fighting than reuse with a generic sortable.
 */

const PX_PER_MIN = 1.2;
const SNAP_MIN = 15;
const DEFAULT_DURATION = 90;
const UNASSIGNED = "__none__";
const GRID_MAX_HEIGHT = 560;

const WEEKDAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const TYPE_LABEL = { consultation: "Beratung", project: "Projekt", single_session: "Termin" };

const snap = (m) => Math.round(m / SNAP_MIN) * SNAP_MIN;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const minutesOf = (iso) => {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
};
const atMinutes = (day, minutes) => {
  const d = new Date(day);
  d.setHours(0, minutes, 0, 0);
  return d;
};
const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.round(m) % 60).padStart(2, "0")}`;
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
/** Local YYYY-MM-DD — used as a column id in week view. */
const dateKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

/**
 * Opening hours are free text per weekday ("10:00 - 19:00", "Geschlossen"),
 * so pull the first two clock times out of whatever the studio typed and fall
 * back to a sane window when there aren't any.
 */
function parseOpeningHours(text) {
  const m = (text || "").match(/(\d{1,2}):(\d{2})\D+(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const from = Number(m[1]) * 60 + Number(m[2]);
  const to = Number(m[3]) * 60 + Number(m[4]);
  return to > from ? { from, to } : null;
}

/** Assign overlapping sessions to side-by-side lanes within one artist column. */
function laneLayout(sessions) {
  const sorted = [...sessions].sort((a, b) => a.startMin - b.startMin);
  const laneEnds = [];
  const lanes = new Map();
  for (const s of sorted) {
    let lane = laneEnds.findIndex((end) => end <= s.startMin);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = s.startMin + s.duration;
    lanes.set(s.id, lane);
  }
  return { lanes, laneCount: Math.max(1, laneEnds.length) };
}

export default function StudioCalendarTab({ bookings, artists, studio, onBookingsChange, onCreateOffer, onRefresh }) {
  const [day, setDay] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [view, setView] = useState("tag"); // "tag" | "woche"
  const [dragView, setDragView] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");

  const isWeek = view === "woche";

  const weekDays = useMemo(() => {
    const start = new Date(day);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday first
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [day]);

  const gridRef = useRef(null);
  const dragRef = useRef(null);
  const bookingsRef = useRef(bookings);
  bookingsRef.current = bookings;

  // Grid bounds follow the studio's own opening hours for the shown weekday,
  // rounded out to whole hours — this is what stops the calendar from being a
  // fixed 08–21 wall of empty rows.
  const { dayStartMin, dayEndMin } = useMemo(() => {
    // In week view the grid has to cover every day it shows, so take the
    // widest opening window across the week rather than one day's.
    const days = isWeek ? weekDays : [day];
    const windows = days.map((d) => parseOpeningHours(studio?.opening_hours?.[WEEKDAY_KEYS[d.getDay()]])).filter(Boolean);
    if (!windows.length) return { dayStartMin: 9 * 60, dayEndMin: 20 * 60 };
    return {
      dayStartMin: Math.floor(Math.min(...windows.map((w) => w.from)) / 60) * 60,
      dayEndMin: Math.ceil(Math.max(...windows.map((w) => w.to)) / 60) * 60,
    };
  }, [studio, day, isWeek, weekDays]);

  /**
   * Columns are artists on a day, and days across a week. The drag code only
   * ever asks "which column is the pointer over", so switching what a column
   * means is enough to get a second view out of the same machinery.
   */
  const columns = useMemo(() => {
    if (isWeek) {
      return weekDays.map((d) => ({
        id: dateKey(d),
        name: d.toLocaleDateString("de-DE", { weekday: "short" }),
        sub: d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
        date: d,
        color: "#10b981",
        photo: null,
      }));
    }
    return [
      ...artists.map((a, i) => ({ id: a.id, name: a.name, color: artistColor(i), photo: a.photo_url })),
      // Green, not grey: an appointment with nobody assigned yet is still a
      // confirmed booking, and grey read as "inactive" next to the coloured
      // artist columns.
      { id: UNASSIGNED, name: "Ohne Artist", color: "#10b981", photo: null },
    ];
  }, [artists, isWeek, weekDays]);

  // Blocks keep their artist's colour in both views — in week view the column
  // no longer carries it.
  const colorForArtist = useMemo(() => Object.fromEntries(artists.map((a, i) => [a.id, artistColor(i)])), [artists]);
  const blockColor = (s) => colorForArtist[s.artistId] || "#10b981";

  const allSessions = useMemo(
    () =>
      bookings.flatMap((b) =>
        (b.sessions || []).map((s) => ({
          id: s.id,
          raw: s,
          project: b,
          isQueue: false,
          customerName: b.customers?.name || "—",
          startMin: minutesOf(s.start_time),
          duration: s.estimated_duration_minutes || DEFAULT_DURATION,
          artistId: s.artist_id || b.artist_id || null,
        }))
      ),
    [bookings]
  );

  // Requests still waiting for an offer. Since an accepted offer now creates
  // its own session, nothing arrives on the calendar unplaced — so the rail
  // earns its space by showing what still needs a price and a time.
  const openRequests = useMemo(
    () => bookings.filter((b) => ["anfrage", "abgelehnt"].includes(b.status)),
    [bookings]
  );

  const dayColumns = useMemo(() => {
    const placed = isWeek
      ? allSessions.filter((s) => weekDays.some((d) => sameDay(s.raw.start_time, d)))
      : allSessions.filter((s) => sameDay(s.raw.start_time, day));
    return columns.map((col) => {
      const items = isWeek
        ? placed.filter((s) => dateKey(new Date(s.raw.start_time)) === col.id)
        : placed.filter((s) => (s.artistId || UNASSIGNED) === col.id);
      const { lanes, laneCount } = laneLayout(items);
      const conflicts = new Set();
      for (const a of items) {
        for (const b of items) {
          if (a.id !== b.id && a.startMin < b.startMin + b.duration && b.startMin < a.startMin + a.duration) {
            conflicts.add(a.id);
          }
        }
      }
      return { ...col, items, lanes, laneCount, conflicts };
    });
  }, [allSessions, columns, day, isWeek, weekDays]);

  const selected = useMemo(() => allSessions.find((s) => s.id === selectedId) || null, [allSessions, selectedId]);

  const pointToSlot = useCallback(
    (clientX, clientY) => {
      const el = gridRef.current;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return null;
      const colWidth = r.width / columns.length;
      const idx = clamp(Math.floor((clientX - r.left) / colWidth), 0, columns.length - 1);
      return { columnId: columns[idx].id, minutes: dayStartMin + (clientY - r.top) / PX_PER_MIN };
    },
    [columns, dayStartMin]
  );

  const computePreview = useCallback(
    (drag, clientX, clientY) => {
      const slot = pointToSlot(clientX, clientY);
      if (!slot) return null;
      if (drag.kind === "resize") {
        const duration = clamp(snap(slot.minutes - drag.startMin), SNAP_MIN, dayEndMin - drag.startMin);
        return { columnId: drag.columnId, startMin: drag.startMin, duration };
      }
      const startMin = clamp(snap(slot.minutes - drag.grabOffset), dayStartMin, dayEndMin - drag.duration);
      return { columnId: slot.columnId, startMin, duration: drag.duration };
    },
    [pointToSlot, dayStartMin, dayEndMin]
  );

  async function applySchedule(item, preview) {
    const snapshot = bookingsRef.current;
    // A column means a different thing per view: in week view dropping into
    // one moves the appointment to that day and leaves the artist alone.
    const targetDay = isWeek ? columns.find((c) => c.id === preview.columnId)?.date || day : day;
    const artistId = isWeek ? item.artistId ?? null : preview.columnId === UNASSIGNED ? null : preview.columnId;
    const startTime = atMinutes(targetDay, preview.startMin).toISOString();

    try {
      onBookingsChange((prev) =>
        prev.map((b) =>
          b.id === item.project.id
            ? {
                ...b,
                sessions: (b.sessions || []).map((s) =>
                  s.id === item.id
                    ? { ...s, start_time: startTime, artist_id: artistId, estimated_duration_minutes: preview.duration }
                    : s
                ),
              }
            : b
        )
      );
      await studioApi.patch(`/studios/me/sessions/${item.id}`, {
        startTime,
        artistId,
        estimatedDurationMinutes: preview.duration,
      });
      setError("");
    } catch (err) {
      onBookingsChange(() => snapshot);
      setError(err.response?.data?.error || "Termin konnte nicht gespeichert werden — Änderung zurückgenommen.");
    }
  }

  const startDrag = useCallback((e, item, kind) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragRef.current = {
      kind,
      item,
      columnId: item.artistId || UNASSIGNED,
      startMin: item.startMin,
      duration: item.duration,
      grabOffset: 0,
      moved: false,
      pointer: { x: e.clientX, y: e.clientY },
      preview: null,
    };
    if (kind === "move") {
      const blockTop = e.currentTarget.getBoundingClientRect().top;
      dragRef.current.grabOffset = (e.clientY - blockTop) / PX_PER_MIN;
    }
    setDragView({ ...dragRef.current });
  }, []);

  const dragActive = !!dragView;
  useEffect(() => {
    if (!dragActive) return;

    function onMove(e) {
      const drag = dragRef.current;
      if (!drag) return;
      if (Math.abs(e.clientX - drag.pointer.x) > 4 || Math.abs(e.clientY - drag.pointer.y) > 4) drag.moved = true;
      drag.pointer = { x: e.clientX, y: e.clientY };
      drag.preview = drag.moved ? computePreview(drag, e.clientX, e.clientY) : null;
      setDragView({ ...drag });
    }

    function onUp() {
      const drag = dragRef.current;
      dragRef.current = null;
      setDragView(null);
      if (!drag) return;
      if (!drag.moved) {
        setSelectedId(drag.item.id);
        return;
      }
      if (drag.preview) applySchedule(drag.item, drag.preview);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragActive, computePreview, day]);

  const hours = [];
  for (let m = dayStartMin; m <= dayEndMin; m += 60) hours.push(m);
  const gridHeight = (dayEndMin - dayStartMin) * PX_PER_MIN;
  // "Is now on screen" — which in week view means anywhere in the week.
  const isToday = isWeek ? weekDays.some((d) => sameDay(d, new Date())) : sameDay(day, new Date());
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  function shiftDay(delta) {
    setDay((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + delta * (isWeek ? 7 : 1));
      return next;
    });
  }

  const rangeLabel = isWeek
    ? `${weekDays[0].toLocaleDateString("de-DE", { day: "2-digit", month: "short" })} – ${weekDays[6].toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "short",
      })}`
    : day.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });

  const previewColumnIndex = dragView?.preview ? columns.findIndex((c) => c.id === dragView.preview.columnId) : -1;

  return (
    <div className="flex flex-col lg:flex-row gap-4 select-none">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => shiftDay(-1)} className="p-2 rounded-lg hover:bg-white transition-colors" title="Vorheriger Tag">
              <ChevronLeft size={16} className="text-zinc-500" />
            </button>
            <button type="button" onClick={() => shiftDay(1)} className="p-2 rounded-lg hover:bg-white transition-colors" title="Nächster Tag">
              <ChevronRight size={16} className="text-zinc-500" />
            </button>
            <div className="ml-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${view}-${day.toDateString()}`}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="font-playfair text-base text-zinc-900">{rangeLabel}</div>
                  <div className="text-[11px] font-inter text-zinc-400">
                    {dayColumns.reduce((n, c) => n + c.items.length, 0)} Termine · {fmt(dayStartMin)}–{fmt(dayEndMin)}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isToday && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const d = new Date();
                  d.setHours(0, 0, 0, 0);
                  setDay(d);
                }}
                className="h-8 rounded-lg font-inter text-xs"
              >
                Heute
              </Button>
            )}
            <div className="flex gap-0.5 bg-zinc-100 rounded-lg p-0.5">
              {[
                { id: "tag", label: "Tag" },
                { id: "woche", label: "Woche" },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(v.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-inter font-medium transition-colors ${
                    view === v.id ? "bg-white shadow-soft text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs font-inter text-red-700"
            >
              <AlertTriangle size={13} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="flex border-b border-zinc-100">
            <div className="w-12 flex-shrink-0" />
            {columns.map((c) => (
              <div key={c.id} className="flex-1 min-w-0 px-2 py-2.5 flex items-center gap-1.5 border-l border-zinc-100">
                {isWeek ? (
                  <span className="min-w-0">
                    <span className={`text-[11px] font-inter ${sameDay(c.date, new Date()) ? "text-zinc-900 font-semibold" : "text-zinc-600"}`}>
                      {c.name}
                    </span>
                    <span className="block text-[10px] font-inter text-zinc-400 leading-tight">{c.sub}</span>
                  </span>
                ) : (
                  <>
                    <span
                      className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-inter font-semibold text-white overflow-hidden"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.photo ? <img src={c.photo} alt={c.name} className="w-full h-full object-cover" /> : initials(c.name)}
                    </span>
                    <span className="text-[11px] font-inter text-zinc-600 truncate">{c.name}</span>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Its own scroll container so the page doesn't grow with the day */}
          <div className="flex overflow-y-auto" style={{ maxHeight: GRID_MAX_HEIGHT }}>
            <div className="w-12 flex-shrink-0 relative" style={{ height: gridHeight }}>
              {hours.map((m) => (
                <div
                  key={m}
                  className="absolute right-2 text-[10px] font-inter text-zinc-400 -translate-y-1/2"
                  style={{ top: (m - dayStartMin) * PX_PER_MIN }}
                >
                  {fmt(m)}
                </div>
              ))}
            </div>

            <div ref={gridRef} className="flex-1 relative" style={{ height: gridHeight }}>
              {hours.map((m) => (
                <div key={m} className="absolute left-0 right-0 border-t border-zinc-100" style={{ top: (m - dayStartMin) * PX_PER_MIN }} />
              ))}
              {columns.map((c, i) => (
                <div key={c.id} className="absolute top-0 bottom-0 border-l border-zinc-100" style={{ left: `${(i / columns.length) * 100}%` }} />
              ))}

              {isToday && nowMin >= dayStartMin && nowMin <= dayEndMin && (
                <div className="absolute left-0 right-0 flex items-center pointer-events-none z-20" style={{ top: (nowMin - dayStartMin) * PX_PER_MIN }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 -ml-0.5" />
                  <div className="flex-1 border-t border-red-500/60" />
                </div>
              )}

              {dayColumns.map((col, colIdx) =>
                col.items.map((s) => {
                  const lane = col.lanes.get(s.id) || 0;
                  const colLeft = (colIdx / columns.length) * 100;
                  const colWidth = 100 / columns.length;
                  const isDragging = dragView?.item?.id === s.id && dragView?.moved;
                  const conflict = col.conflicts.has(s.id);
                  return (
                    <motion.div
                      key={s.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: isDragging ? 0.3 : 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      onPointerDown={(e) => startDrag(e, s, "move")}
                      className={`absolute rounded-lg px-2 py-1 overflow-hidden cursor-grab active:cursor-grabbing ${
                        conflict ? "ring-2 ring-red-400" : ""
                      } ${selectedId === s.id ? "ring-2 ring-zinc-900" : ""}`}
                      style={{
                        top: (s.startMin - dayStartMin) * PX_PER_MIN,
                        height: Math.max(22, s.duration * PX_PER_MIN - 2),
                        left: `calc(${colLeft}% + ${(lane * colWidth) / col.laneCount}% + 3px)`,
                        width: `calc(${colWidth / col.laneCount}% - 6px)`,
                        backgroundColor: `${blockColor(s)}1a`,
                        borderLeft: `3px solid ${blockColor(s)}`,
                      }}
                    >
                      <div className="text-[10px] font-inter font-medium text-zinc-900 truncate leading-tight">{s.customerName}</div>
                      <div className="text-[9px] font-inter text-zinc-500 truncate">
                        {fmt(s.startMin)}–{fmt(s.startMin + s.duration)}
                      </div>
                      <div
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          startDrag(e, s, "resize");
                        }}
                        className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize"
                      />
                    </motion.div>
                  );
                })
              )}

              {dragView?.preview && previewColumnIndex >= 0 && (
                <div
                  className="absolute rounded-lg border-2 border-dashed border-zinc-900 bg-zinc-900/5 pointer-events-none z-30 px-2 py-1"
                  style={{
                    top: (dragView.preview.startMin - dayStartMin) * PX_PER_MIN,
                    height: Math.max(22, dragView.preview.duration * PX_PER_MIN - 2),
                    left: `calc(${(previewColumnIndex / columns.length) * 100}% + 3px)`,
                    width: `calc(${100 / columns.length}% - 6px)`,
                  }}
                >
                  <div className="text-[10px] font-inter font-semibold text-zinc-900 leading-tight">
                    {fmt(dragView.preview.startMin)}–{fmt(dragView.preview.startMin + dragView.preview.duration)}
                  </div>
                  <div className="text-[9px] font-inter text-zinc-500 truncate">{dragView.item.customerName}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:w-60 flex-shrink-0 space-y-3">
        <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Inbox size={13} className="text-zinc-400" />
            <span className="text-[11px] font-inter font-medium text-zinc-600 uppercase tracking-wide">Offene Anfragen</span>
            {openRequests.length > 0 && (
              <span className="ml-auto text-[10px] font-inter bg-amber-100 text-amber-700 rounded-full px-1.5">{openRequests.length}</span>
            )}
          </div>
          {openRequests.length === 0 ? (
            <p className="text-[11px] font-inter text-zinc-400 py-4 text-center">
              Keine offenen Anfragen. Zugesagte Angebote stehen direkt im Kalender.
            </p>
          ) : (
            <div className="space-y-1.5">
              <AnimatePresence>
                {openRequests.map((b) => (
                  <motion.button
                    key={b.id}
                    type="button"
                    layout
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.015 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    onClick={() => onCreateOffer?.(b)}
                    className="w-full text-left rounded-xl border border-amber-200 bg-amber-50 hover:border-amber-300 px-2.5 py-2 transition-colors"
                  >
                    <div className="text-[11px] font-inter font-medium text-zinc-900 truncate">{b.customers?.name || "—"}</div>
                    <div className="text-[10px] font-inter text-zinc-500 truncate">
                      {TYPE_LABEL[b.appointment_type]}
                      {b.title && <> · {b.title}</>}
                    </div>
                    {b.preferred_date && (
                      <div className="text-[10px] font-inter text-amber-700 truncate mt-0.5">
                        Wunsch: {new Date(b.preferred_date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                        {b.preferred_slot && <>, {SLOT_LABEL[b.preferred_slot]?.toLowerCase()}</>}
                      </div>
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
          <p className="text-[10px] font-inter text-zinc-400 mt-2 leading-snug">
            Anfrage anklicken, um ein Angebot mit Uhrzeit zu senden. Bestehende Blöcke lassen sich verschieben und an der Unterkante verlängern.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <SessionDialog
            item={selected}
            artistName={columns.find((c) => c.id === (selected.artistId || UNASSIGNED))?.name || "Ohne Artist"}
            onClose={() => setSelectedId(null)}
            onChanged={onRefresh}
          />
        )}
      </AnimatePresence>

      {dragView?.moved && !dragView.preview && (
        <div
          className="fixed z-50 pointer-events-none rounded-xl border border-zinc-300 bg-white shadow-lg px-2.5 py-1.5"
          style={{ left: dragView.pointer.x + 8, top: dragView.pointer.y + 8 }}
        >
          <div className="text-[11px] font-inter font-medium text-zinc-900">{dragView.item.customerName}</div>
          <div className="text-[10px] font-inter text-zinc-400">Über den Kalender ziehen</div>
        </div>
      )}
    </div>
  );
}
