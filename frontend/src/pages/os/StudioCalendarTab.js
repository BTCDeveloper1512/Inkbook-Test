import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, AlertTriangle, Inbox, X } from "lucide-react";
import { studioApi } from "../../lib/studioApi";
import { artistColor, initials } from "../../lib/artistColors";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

/**
 * Drag-to-schedule day planner. The left rail holds every booking the studio
 * hasn't placed yet ("Anfragen"); the grid is one column per artist. Dragging
 * a queue card onto the grid is what turns a request into a plan — it sets the
 * session's time and artist and flips the project from "anfrage" to
 * "in_planung" in one gesture, which is the whole point of the view.
 *
 * Drag is hand-rolled on pointer events rather than a DnD library: we need
 * snapping to a time grid, a live time readout, and edge-resize on the same
 * blocks, which is more fighting than reuse with a generic sortable lib.
 */

const DAY_START_MIN = 8 * 60;
const DAY_END_MIN = 21 * 60;
const PX_PER_MIN = 1.2;
const SNAP_MIN = 15;
const DEFAULT_DURATION = 90;
const UNASSIGNED = "__none__";

const SESSION_STATUS_LABEL = {
  geplant: "Geplant",
  bestaetigt: "Bestätigt",
  abgeschlossen: "Abgeschlossen",
  no_show: "No-Show",
  storniert: "Storniert",
};
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

export default function StudioCalendarTab({ bookings, artists, onBookingsChange }) {
  const [day, setDay] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [dragView, setDragView] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [durationDraft, setDurationDraft] = useState("");
  const [error, setError] = useState("");

  const gridRef = useRef(null);
  const dragRef = useRef(null);
  const bookingsRef = useRef(bookings);
  bookingsRef.current = bookings;

  const columns = useMemo(
    () => [
      ...artists.map((a, i) => ({ id: a.id, name: a.name, color: artistColor(i), photo: a.photo_url })),
      { id: UNASSIGNED, name: "Ohne Artist", color: "#a1a1aa", photo: null },
    ],
    [artists]
  );

  const allSessions = useMemo(
    () =>
      bookings.flatMap((b) =>
        (b.sessions || []).map((s) => ({
          id: s.id,
          raw: s,
          project: b,
          customerName: b.customers?.name || "—",
          startMin: minutesOf(s.start_time),
          duration: s.estimated_duration_minutes || DEFAULT_DURATION,
          artistId: s.artist_id || b.artist_id || null,
        }))
      ),
    [bookings]
  );

  // A booking still in "anfrage" is a request the studio hasn't placed yet —
  // it keeps the time the customer asked for, shown on the card as a hint.
  const queue = useMemo(
    () => allSessions.filter((s) => s.project.status === "anfrage").sort((a, b) => new Date(a.raw.start_time) - new Date(b.raw.start_time)),
    [allSessions]
  );

  const dayColumns = useMemo(() => {
    const placed = allSessions.filter((s) => s.project.status !== "anfrage" && sameDay(s.raw.start_time, day));
    return columns.map((col) => {
      const items = placed.filter((s) => (s.artistId || UNASSIGNED) === col.id);
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
  }, [allSessions, columns, day]);

  const selected = useMemo(() => allSessions.find((s) => s.id === selectedId) || null, [allSessions, selectedId]);

  /** Map a screen point onto {columnId, minutes} inside the grid, or null if outside. */
  const pointToSlot = useCallback(
    (clientX, clientY) => {
      const el = gridRef.current;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return null;
      const colWidth = r.width / columns.length;
      const idx = clamp(Math.floor((clientX - r.left) / colWidth), 0, columns.length - 1);
      return { columnId: columns[idx].id, minutes: DAY_START_MIN + (clientY - r.top) / PX_PER_MIN };
    },
    [columns]
  );

  const computePreview = useCallback(
    (drag, clientX, clientY) => {
      const slot = pointToSlot(clientX, clientY);
      if (!slot) return null;
      if (drag.kind === "resize") {
        const duration = clamp(snap(slot.minutes - drag.startMin), SNAP_MIN, DAY_END_MIN - drag.startMin);
        return { columnId: drag.columnId, startMin: drag.startMin, duration };
      }
      const startMin = clamp(snap(slot.minutes - drag.grabOffset), DAY_START_MIN, DAY_END_MIN - drag.duration);
      return { columnId: slot.columnId, startMin, duration: drag.duration };
    },
    [pointToSlot]
  );

  async function applySchedule(session, preview) {
    const snapshot = bookingsRef.current;
    const startTime = atMinutes(day, preview.startMin).toISOString();
    const artistId = preview.columnId === UNASSIGNED ? null : preview.columnId;
    const wasQueued = session.project.status === "anfrage";

    onBookingsChange((prev) =>
      prev.map((b) =>
        b.id === session.project.id
          ? {
              ...b,
              status: wasQueued ? "in_planung" : b.status,
              sessions: (b.sessions || []).map((s) =>
                s.id === session.id
                  ? {
                      ...s,
                      start_time: startTime,
                      artist_id: artistId,
                      estimated_duration_minutes: preview.duration,
                      status: wasQueued ? "bestaetigt" : s.status,
                    }
                  : s
              ),
            }
          : b
      )
    );

    try {
      await studioApi.patch(`/studios/me/sessions/${session.id}`, {
        startTime,
        artistId,
        estimatedDurationMinutes: preview.duration,
        ...(wasQueued ? { status: "bestaetigt" } : {}),
      });
      if (wasQueued) {
        await studioApi.patch(`/studios/me/bookings/${session.project.id}`, { status: "in_planung" });
      }
      setError("");
    } catch {
      onBookingsChange(() => snapshot);
      setError("Termin konnte nicht gespeichert werden — Änderung zurückgenommen.");
    }
  }

  const startDrag = useCallback(
    (e, session, kind) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const columnId = session.artistId || UNASSIGNED;
      dragRef.current = {
        kind,
        session,
        columnId,
        startMin: session.startMin,
        duration: session.duration,
        // Where inside the block the pointer grabbed it, so the block doesn't
        // jump its top edge to the cursor on the first move.
        grabOffset: kind === "queue" ? session.duration / 2 : session.startMin === null ? 0 : 0,
        moved: false,
        pointer: { x: e.clientX, y: e.clientY },
        preview: null,
      };
      if (kind === "move") {
        const blockTop = e.currentTarget.getBoundingClientRect().top;
        dragRef.current.grabOffset = (e.clientY - blockTop) / PX_PER_MIN;
      }
      setDragView({ ...dragRef.current });
    },
    []
  );

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
        setSelectedId(drag.session.id);
        setDurationDraft("");
        return;
      }
      if (drag.preview) applySchedule(drag.session, drag.preview);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragActive, computePreview, day]);

  async function updateSessionStatus(session, patch) {
    onBookingsChange((prev) =>
      prev.map((b) =>
        b.id === session.project.id
          ? { ...b, sessions: (b.sessions || []).map((s) => (s.id === session.id ? { ...s, ...patch } : s)) }
          : b
      )
    );
    const body = {};
    if (patch.status) body.status = patch.status;
    if (patch.actual_duration_minutes) body.actualDurationMinutes = patch.actual_duration_minutes;
    await studioApi.patch(`/studios/me/sessions/${session.id}`, body);
  }

  const hours = [];
  for (let m = DAY_START_MIN; m <= DAY_END_MIN; m += 60) hours.push(m);
  const gridHeight = (DAY_END_MIN - DAY_START_MIN) * PX_PER_MIN;
  const isToday = sameDay(day, new Date());
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  function shiftDay(delta) {
    setDay((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + delta);
      return next;
    });
  }

  const previewColumnIndex = dragView?.preview ? columns.findIndex((c) => c.id === dragView.preview.columnId) : -1;

  return (
    <div className="flex flex-col lg:flex-row gap-4 select-none">
      {/* Planner */}
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
              <div className="font-playfair text-base text-zinc-900">
                {day.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" })}
              </div>
              <div className="text-[11px] font-inter text-zinc-400">
                {dayColumns.reduce((n, c) => n + c.items.length, 0)} Termine geplant
              </div>
            </div>
          </div>
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
        </div>

        {error && (
          <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs font-inter text-red-700">
            <AlertTriangle size={13} /> {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden">
          {/* Column headers */}
          <div className="flex border-b border-zinc-100">
            <div className="w-12 flex-shrink-0" />
            {columns.map((c) => (
              <div key={c.id} className="flex-1 min-w-0 px-2 py-2.5 flex items-center gap-1.5 border-l border-zinc-100">
                <span
                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-inter font-semibold text-white overflow-hidden"
                  style={{ backgroundColor: c.color }}
                >
                  {c.photo ? <img src={c.photo} alt={c.name} className="w-full h-full object-cover" /> : initials(c.name)}
                </span>
                <span className="text-[11px] font-inter text-zinc-600 truncate">{c.name}</span>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="flex">
            <div className="w-12 flex-shrink-0 relative" style={{ height: gridHeight }}>
              {hours.map((m) => (
                <div
                  key={m}
                  className="absolute right-2 text-[10px] font-inter text-zinc-400 -translate-y-1/2"
                  style={{ top: (m - DAY_START_MIN) * PX_PER_MIN }}
                >
                  {fmt(m)}
                </div>
              ))}
            </div>

            <div ref={gridRef} className="flex-1 relative" style={{ height: gridHeight }}>
              {/* Hour lines */}
              {hours.map((m) => (
                <div
                  key={m}
                  className="absolute left-0 right-0 border-t border-zinc-100"
                  style={{ top: (m - DAY_START_MIN) * PX_PER_MIN }}
                />
              ))}
              {/* Column separators */}
              {columns.map((c, i) => (
                <div
                  key={c.id}
                  className="absolute top-0 bottom-0 border-l border-zinc-100"
                  style={{ left: `${(i / columns.length) * 100}%` }}
                />
              ))}
              {/* Now line */}
              {isToday && nowMin >= DAY_START_MIN && nowMin <= DAY_END_MIN && (
                <div className="absolute left-0 right-0 flex items-center pointer-events-none z-20" style={{ top: (nowMin - DAY_START_MIN) * PX_PER_MIN }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 -ml-0.5" />
                  <div className="flex-1 border-t border-red-500/60" />
                </div>
              )}

              {/* Placed sessions */}
              {dayColumns.map((col, colIdx) =>
                col.items.map((s) => {
                  const lane = col.lanes.get(s.id) || 0;
                  const colLeft = (colIdx / columns.length) * 100;
                  const colWidth = 100 / columns.length;
                  const isDragging = dragView?.session?.id === s.id && dragView?.moved;
                  const conflict = col.conflicts.has(s.id);
                  return (
                    <div
                      key={s.id}
                      onPointerDown={(e) => startDrag(e, s, "move")}
                      className={`absolute rounded-lg px-2 py-1 overflow-hidden cursor-grab active:cursor-grabbing transition-opacity ${
                        isDragging ? "opacity-30" : ""
                      } ${conflict ? "ring-2 ring-red-400" : ""} ${selectedId === s.id ? "ring-2 ring-zinc-900" : ""}`}
                      style={{
                        top: (s.startMin - DAY_START_MIN) * PX_PER_MIN,
                        height: Math.max(22, s.duration * PX_PER_MIN - 2),
                        left: `calc(${colLeft}% + ${(lane * colWidth) / col.laneCount}% + 3px)`,
                        width: `calc(${colWidth / col.laneCount}% - 6px)`,
                        backgroundColor: `${col.color}1a`,
                        borderLeft: `3px solid ${col.color}`,
                      }}
                    >
                      <div className="text-[10px] font-inter font-medium text-zinc-900 truncate leading-tight">{s.customerName}</div>
                      <div className="text-[9px] font-inter text-zinc-500 truncate">
                        {fmt(s.startMin)}–{fmt(s.startMin + s.duration)}
                      </div>
                      {/* Resize handle */}
                      <div
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          startDrag(e, s, "resize");
                        }}
                        className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize"
                      />
                    </div>
                  );
                })
              )}

              {/* Live drop preview */}
              {dragView?.preview && previewColumnIndex >= 0 && (
                <div
                  className="absolute rounded-lg border-2 border-dashed border-zinc-900 bg-zinc-900/5 pointer-events-none z-30 px-2 py-1"
                  style={{
                    top: (dragView.preview.startMin - DAY_START_MIN) * PX_PER_MIN,
                    height: Math.max(22, dragView.preview.duration * PX_PER_MIN - 2),
                    left: `calc(${(previewColumnIndex / columns.length) * 100}% + 3px)`,
                    width: `calc(${100 / columns.length}% - 6px)`,
                  }}
                >
                  <div className="text-[10px] font-inter font-semibold text-zinc-900 leading-tight">
                    {fmt(dragView.preview.startMin)}–{fmt(dragView.preview.startMin + dragView.preview.duration)}
                  </div>
                  <div className="text-[9px] font-inter text-zinc-500 truncate">{dragView.session.customerName}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Queue + detail rail */}
      <div className="lg:w-60 flex-shrink-0 space-y-3">
        {selected && (
          <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <div className="font-inter text-sm text-zinc-900 truncate">{selected.customerName}</div>
                <div className="text-[10px] font-inter text-zinc-400">
                  {TYPE_LABEL[selected.project.appointment_type]} · {SESSION_STATUS_LABEL[selected.raw.status]}
                </div>
              </div>
              <button type="button" onClick={() => setSelectedId(null)} className="p-1 rounded hover:bg-zinc-100">
                <X size={12} className="text-zinc-400" />
              </button>
            </div>
            <div className="text-[11px] font-inter text-zinc-500 mb-2 flex items-center gap-1">
              <Clock size={11} /> {fmt(selected.startMin)}–{fmt(selected.startMin + selected.duration)} · {selected.duration} Min.
            </div>
            {selected.raw.status !== "abgeschlossen" && (
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min="1"
                  value={durationDraft}
                  onChange={(e) => setDurationDraft(e.target.value)}
                  placeholder="Ist-Dauer"
                  className="h-8 rounded-lg text-xs"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    const minutes = parseInt(durationDraft, 10);
                    updateSessionStatus(selected, {
                      status: "abgeschlossen",
                      ...(minutes > 0 ? { actual_duration_minutes: minutes } : {}),
                    });
                    setDurationDraft("");
                  }}
                  className="h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-inter text-xs flex-shrink-0"
                >
                  Fertig
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Inbox size={13} className="text-zinc-400" />
            <span className="text-[11px] font-inter font-medium text-zinc-600 uppercase tracking-wide">Anfragen</span>
            {queue.length > 0 && (
              <span className="ml-auto text-[10px] font-inter bg-amber-100 text-amber-700 rounded-full px-1.5">{queue.length}</span>
            )}
          </div>
          {queue.length === 0 ? (
            <p className="text-[11px] font-inter text-zinc-400 py-4 text-center">Keine offenen Anfragen.</p>
          ) : (
            <div className="space-y-1.5">
              {queue.map((s) => (
                <div
                  key={s.id}
                  onPointerDown={(e) => startDrag(e, s, "queue")}
                  className={`rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 cursor-grab active:cursor-grabbing ${
                    dragView?.session?.id === s.id && dragView?.moved ? "opacity-30" : ""
                  }`}
                >
                  <div className="text-[11px] font-inter font-medium text-zinc-900 truncate">{s.customerName}</div>
                  <div className="text-[10px] font-inter text-zinc-500 truncate">
                    {TYPE_LABEL[s.project.appointment_type]} · {s.duration} Min.
                  </div>
                  <div className="text-[10px] font-inter text-amber-700 truncate mt-0.5">
                    Wunsch: {new Date(s.raw.start_time).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] font-inter text-zinc-400 mt-2 leading-snug">
            Karte in den Kalender ziehen, um sie einzuplanen. Blöcke lassen sich verschieben und an der Unterkante verlängern.
          </p>
        </div>
      </div>

      {/* Cursor-following card while dragging outside the grid */}
      {dragView?.moved && !dragView.preview && (
        <div
          className="fixed z-50 pointer-events-none rounded-xl border border-zinc-300 bg-white shadow-lg px-2.5 py-1.5"
          style={{ left: dragView.pointer.x + 8, top: dragView.pointer.y + 8 }}
        >
          <div className="text-[11px] font-inter font-medium text-zinc-900">{dragView.session.customerName}</div>
          <div className="text-[10px] font-inter text-zinc-400">Über den Kalender ziehen</div>
        </div>
      )}
    </div>
  );
}
