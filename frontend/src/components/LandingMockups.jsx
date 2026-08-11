import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValueEvent } from "framer-motion";
import {
  CheckCheck,
  Send,
  Mic,
  Paperclip,
  LayoutGrid,
  BookOpen,
  MessageCircle,
  CalendarDays,
  Bell,
  Users,
  Settings2,
  LogOut,
} from "lucide-react";
import { artistColor } from "../lib/artistColors";

/**
 * Animated fake-UI for the landing page. Deliberately rebuilt in miniature
 * rather than screenshotted: a screenshot goes stale the moment the real UI
 * changes, can't loop, and would carry real customer data. These use the same
 * zinc/rounded/Inter language as the app so they read as the product.
 *
 * Timings are slow on purpose — a visitor should be able to follow each step
 * without rewinding, so every stage sits long enough to actually be read.
 */

/** Runs `steps` on a loop, but only while the mockup is actually on screen. */
function useLoop(steps, interval) {
  const [step, setStep] = useState(0);
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setStep((s) => (s + 1) % steps), interval);
    return () => clearInterval(id);
  }, [active, steps, interval]);

  return [step, ref];
}

function Frame({ children, label, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-card border border-black/[0.04] overflow-hidden ${className}`}>
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-100 bg-zinc-50/60">
        <span className="w-2 h-2 rounded-full bg-zinc-200" />
        <span className="w-2 h-2 rounded-full bg-zinc-200" />
        <span className="w-2 h-2 rounded-full bg-zinc-200" />
        <span className="ml-1.5 text-[10px] font-inter text-zinc-400">{label}</span>
      </div>
      {children}
    </div>
  );
}

/** A caption under the frame naming the step, so the loop reads as a story. */
function StepCaption({ steps, active }) {
  return (
    <div className="flex items-center gap-2 mt-3 px-1">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <motion.span animate={{ color: i === active ? "#18181b" : "#d4d4d8" }} className="text-[10px] font-inter whitespace-nowrap">
            {label}
          </motion.span>
          {i < steps.length - 1 && <span className="text-zinc-200 text-[10px]">›</span>}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── Dashboard (im MacBook) ─────────────────────────── */

const NAV = [
  { icon: LayoutGrid, label: "Übersicht" },
  { icon: BookOpen, label: "Buchungen", badge: 3 },
  { icon: MessageCircle, label: "Nachrichten", badge: 2 },
  { icon: CalendarDays, label: "Kalender", active: true },
  { icon: Bell, label: "Warteliste" },
  { icon: Users, label: "Artists" },
  { icon: Settings2, label: "Profil & Link" },
];

const AGENDA = [
  { artist: 0, top: 0, height: 76, name: "Lena M.", meta: "09:00 – 11:00 · Fine-Line" },
  { artist: 0, top: 114, height: 57, name: "Jonas K.", meta: "12:00 – 13:30 · Cover-up" },
  { artist: 1, top: 38, height: 95, name: "Mira T.", meta: "10:00 – 12:30 · Blackwork" },
  { artist: 1, top: 171, height: 76, name: "Sam R.", meta: "14:00 – 16:00 · Nachstechen" },
];

// Pulled from the app's own palette rather than hand-picked, so the mockup
// keeps showing the colours a real roster actually gets.
const ARTIST_COLORS = [artistColor(0), artistColor(1)];

/**
 * A miniature of the real studio dashboard — same sidebar, same stat strip,
 * same day agenda. Lives inside the laptop screen, so it renders full-bleed
 * without the browser chrome the other mockups carry.
 */
const REQUESTS = [
  { n: "Nora B.", m: "Projekt · Rücken" },
  { n: "Tim W.", m: "Beratung · 30 Min." },
  { n: "Ida S.", m: "Termin · Fine-Line" },
  { n: "Jo P.", m: "Projekt · Sleeve" },
  { n: "Ronja L.", m: "Termin · Cover-up" },
];

/**
 * Shared by the live dashboard and the workflow acts, so the software around
 * the story stays the same while the story moves. `animateIn` is off for the
 * acts: their sidebar is already on screen from the previous act and should
 * not re-stagger itself on every step.
 */
function StudioSidebar({ animateIn = false }) {
  return (
    <div className="w-[152px] flex-shrink-0 bg-zinc-900 p-3 flex flex-col">
      <div className="text-[7px] uppercase tracking-[0.18em] text-zinc-500">Studio Dashboard</div>
      <div className="text-[11px] text-white mt-0.5 mb-2.5">Blackline Studio</div>

      <div className="grid grid-cols-2 gap-1.5 mb-3">
        <div className="bg-white/10 rounded-md px-2 py-1.5">
          <div className="font-playfair text-white text-[13px] leading-none">14</div>
          <div className="text-[6px] uppercase tracking-wide text-zinc-400 mt-1">Buchungen</div>
        </div>
        <div className="bg-white/10 rounded-md px-2 py-1.5">
          <div className="font-playfair text-white text-[13px] leading-none">3</div>
          <div className="text-[6px] uppercase tracking-wide text-zinc-400 mt-1">Ausstehend</div>
        </div>
      </div>

      <div className="space-y-0.5 flex-1">
        {NAV.map(({ icon: Icon, label, active, badge }, i) => (
          <motion.div
            key={label}
            initial={animateIn ? { opacity: 0, x: -6 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5 + i * 0.05, duration: 0.35 }}
            className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md ${active ? "bg-white text-zinc-900" : "text-zinc-400"}`}
          >
            <Icon size={9} strokeWidth={1.6} />
            <span className="text-[8px]">{label}</span>
            {badge && (
              <span
                className={`ml-auto text-[6px] rounded-full w-2.5 h-2.5 flex items-center justify-center ${
                  active ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"
                }`}
              >
                {badge}
              </span>
            )}
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 px-1.5 text-zinc-500">
        <LogOut size={9} strokeWidth={1.6} />
        <span className="text-[8px]">Abmelden</span>
      </div>
    </div>
  );
}

export function DashboardMockup() {
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCursor((c) => (c + 1) % REQUESTS.length), 3800);
    return () => clearInterval(id);
  }, []);

  const shownRequests = [0, 1, 2].map((o) => REQUESTS[(cursor + o) % REQUESTS.length]);
  const firstRun = cursor === 0;

  return (
    <div className="w-full h-full bg-zinc-50 flex font-inter select-none" style={{ width: 720, height: 450 }}>
      <StudioSidebar animateIn />

      {/* Main */}
      <div className="flex-1 p-3.5 min-w-0">
        <div className="font-playfair text-[13px] text-zinc-900 leading-none">Kalender</div>
        <div className="text-[7px] text-zinc-500 mt-1 mb-2.5">Termin anklicken für Aktionen, ziehen zum Umbuchen</div>

        <div className="grid grid-cols-3 gap-2 mb-2.5">
          {[
            { v: "4", l: "Heute" },
            { v: "14", l: "Nächste 7 Tage" },
            { v: "3", l: "Offene Anfragen" },
          ].map(({ v, l }, i) => (
            <motion.div
              key={l}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7 + i * 0.08, duration: 0.4 }}
              className="bg-white rounded-lg border border-black/[0.04] px-2 py-1.5"
            >
              <div className="font-playfair text-[13px] text-zinc-900 leading-none">{v}</div>
              <div className="text-[6px] uppercase tracking-wide text-zinc-400 mt-1">{l}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-2">
          {/* Day agenda */}
          <div className="flex-1 bg-white rounded-lg border border-black/[0.04] p-2.5 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <div className="text-[8px] text-zinc-900">Donnerstag, 20. August</div>
                <div className="text-[6px] text-zinc-400 mt-0.5">4 Termine · 09:00–20:00</div>
              </div>
              <div className="flex gap-0.5 bg-zinc-100 rounded-md p-0.5">
                <span className="text-[6px] px-1.5 py-0.5 rounded bg-white text-zinc-900">Tag</span>
                <span className="text-[6px] px-1.5 py-0.5 text-zinc-400">Woche</span>
              </div>
            </div>

            <div className="flex gap-1.5 mb-1">
              {["Alex", "Mira"].map((a, i) => (
                <div key={a} className="flex-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: ARTIST_COLORS[i] }} />
                  <span className="text-[6px] text-zinc-500">{a}</span>
                </div>
              ))}
            </div>

            <div className="relative flex gap-1.5" style={{ height: 252 }}>
              {/* Hour grid */}
              <div className="absolute inset-0">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="border-t border-zinc-100" style={{ height: 36 }}>
                    <span className="text-[5px] text-zinc-300 -mt-1 block">{String(9 + i).padStart(2, "0")}:00</span>
                  </div>
                ))}
              </div>

              {[0, 1].map((col) => (
                <div key={col} className="flex-1 relative ml-3">
                  {AGENDA.filter((a) => a.artist === col).map((a, i) => (
                    <motion.div
                      key={a.name}
                      initial={{ opacity: 0, scaleY: 0.7 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ delay: 2 + i * 0.12 + col * 0.18, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        originY: 0,
                        position: "absolute",
                        top: a.top,
                        left: 0,
                        right: 0,
                        height: a.height,
                        background: ARTIST_COLORS[col],
                      }}
                      className="rounded-md px-1.5 py-1 overflow-hidden"
                    >
                      <div className="text-[7px] text-white leading-tight">{a.name}</div>
                      <div className="text-[6px] text-white/60 leading-tight mt-0.5">{a.meta}</div>
                    </motion.div>
                  ))}
                </div>
              ))}

              {/* "Now" line — creeps down the day so the screen is never
                  completely still, without pulling attention off the content. */}
              <motion.div
                className="absolute left-3 right-0 flex items-center pointer-events-none"
                initial={{ opacity: 0, top: 140 }}
                animate={{ opacity: 1, top: [140, 176] }}
                transition={{
                  opacity: { delay: 2.6, duration: 0.5 },
                  top: { delay: 2.6, duration: 26, repeat: Infinity, repeatType: "reverse", ease: "linear" },
                }}
              >
                <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                <span className="flex-1 h-px bg-red-500/60" />
              </motion.div>
            </div>
          </div>

          {/* Open requests rail — a new one drops in every few seconds and the
              oldest falls off, which is what this list actually does all day. */}
          <div className="w-[122px] flex-shrink-0 bg-white rounded-lg border border-black/[0.04] p-2">
            <div className="text-[6px] uppercase tracking-[0.14em] text-zinc-400 mb-1.5">Offene Anfragen</div>
            <div className="space-y-1.5">
              <AnimatePresence initial={false} mode="popLayout">
                {shownRequests.map((r, i) => (
                  <motion.div
                    key={r.n}
                    layout
                    initial={{ opacity: 0, x: 10, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, x: -8, height: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 26, delay: firstRun ? 2.2 + i * 0.12 : 0 }}
                    className="rounded-md border border-zinc-100 px-1.5 py-1 overflow-hidden"
                  >
                    <div className="text-[7px] text-zinc-900 leading-tight">{r.n}</div>
                    <div className="text-[6px] text-zinc-400 leading-tight mt-0.5">{r.m}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Guided tour (inside the laptop) ─────────────────── */

/**
 * Once the camera is inside the screen, the scroll stops being a camera move
 * and becomes a guided tour of the *same* real dashboard — nothing swaps out
 * from under the reader, a callout just walks over to the next thing and
 * explains it. That is deliberately different from a narrated fake booking:
 * this is the actual Kalender screen (same sidebar, same stat strip, same
 * day agenda as StudioOsDashboard.js), so what's being pointed at is what a
 * studio actually sees on day one.
 *
 * Thresholds are on the same 0→1 stage progress the camera uses, so the tour
 * only starts once the dive has actually landed.
 */
const STEP_AT = [0.6, 0.72, 0.84, 0.94];

/**
 * Anchor points and callout-card placement, hand-measured against
 * `DashboardMockup`'s own layout below (720×450 canvas, sidebar 152px wide,
 * 14px main padding) — so the arrow actually lands on the thing being
 * described instead of floating near it.
 */
const TOUR_STEPS = [
  {
    title: "Kalender ist die Startseite",
    body: "Nach dem Login steht der Tag sofort da — anklicken für Aktionen, ziehen zum Umbuchen.",
    anchor: { x: 145, y: 155 },
    card: { x: 190, y: 106, width: 210 },
  },
  {
    title: "Ein Tag, alle Artists",
    body: "Farbcodiert pro Artist, mit einer Live-Linie für die aktuelle Uhrzeit.",
    anchor: { x: 330, y: 230 },
    card: { x: 176, y: 330, width: 230 },
  },
  {
    title: "Offene Anfragen",
    body: "Neue Anfragen laufen hier auf, bevor sie zu einem festen Termin werden.",
    anchor: { x: 615, y: 118 },
    card: { x: 366, y: 168, width: 224 },
  },
  {
    title: "Alles auf einen Blick",
    body: "Wie viele Buchungen offen sind, siehst du sofort oben in der Sidebar.",
    anchor: { x: 55, y: 60 },
    card: { x: 190, y: 108, width: 220 },
  },
];

/** A dot that keeps quietly pulsing, so the eye finds the anchor even before reading the card. */
function AnchorPulse({ x, y }) {
  return (
    <div className="absolute pointer-events-none" style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}>
      <motion.span
        animate={{ scale: [1, 2.6], opacity: [0.5, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        className="absolute inset-0 rounded-full bg-zinc-900"
        style={{ width: 10, height: 10, left: -5, top: -5 }}
      />
      <span className="block rounded-full bg-zinc-900 ring-2 ring-white" style={{ width: 7, height: 7 }} />
    </div>
  );
}

/**
 * One step of the tour: a line drawn from the card to the thing it explains,
 * a pulsing anchor dot, and the card itself. The line is a real SVG path
 * animated with `pathLength` rather than a straight CSS-rotated div, so it
 * still points correctly however the two ends relate to each other.
 */
function TourCallout({ step, n }) {
  const { anchor, card, title, body } = step;
  // The line starts from whichever card edge is closer to the anchor, so it
  // never has to cross over the card itself to get there.
  const cardCx = card.x + card.width / 2;
  const startX = anchor.x < cardCx ? card.x : card.x + card.width;
  const startY = card.y + 30;
  const midX = (startX + anchor.x) / 2;

  return (
    <>
      <svg className="absolute inset-0 pointer-events-none" width={720} height={450} style={{ overflow: "visible" }}>
        <motion.path
          d={`M ${startX} ${startY} Q ${midX} ${startY}, ${anchor.x} ${anchor.y}`}
          fill="none"
          stroke="#18181b"
          strokeWidth={1.4}
          strokeDasharray="3 3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.55 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>

      <AnchorPulse x={anchor.x} y={anchor.y} />

      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="absolute rounded-xl bg-zinc-900 text-white shadow-[0_10px_24px_rgba(0,0,0,0.28)] px-3 py-2.5"
        style={{ left: card.x, top: card.y, width: card.width }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-3.5 h-3.5 rounded-full bg-white/15 flex items-center justify-center text-[6px] font-inter flex-shrink-0">
            {n}
          </span>
          <span className="text-[6px] uppercase tracking-[0.14em] text-zinc-400">Schritt {n} von 4</span>
        </div>
        <div className="text-[9.5px] font-inter font-medium leading-snug">{title}</div>
        <div className="text-[7.5px] font-inter text-zinc-300 leading-relaxed mt-1">{body}</div>
      </motion.div>
    </>
  );
}

function pickStep(v) {
  let next = -1;
  for (let i = 0; i < STEP_AT.length; i++) if (v >= STEP_AT[i]) next = i;
  return next;
}

/**
 * The laptop's screen for the whole pinned stage: the real dashboard is
 * mounted once and stays mounted — only the callout layer on top changes as
 * the reader scrolls through the tour.
 */
export function WorkflowActs({ progress }) {
  // Seeded from the current value, not just from later changes: this only
  // mounts once the screen is lit, which is already past the first threshold
  // on a fast scroll — and "change" would then never fire again if the reader
  // stopped there, leaving the tour stuck at the dashboard with no callout.
  const [step, setStep] = useState(() => pickStep(progress.get()));
  useMotionValueEvent(progress, "change", (v) => setStep(pickStep(v)));

  return (
    <div className="relative" style={{ width: 720, height: 450 }}>
      <DashboardMockup />
      <AnimatePresence mode="wait">
        {step >= 0 && <TourCallout key={step} step={TOUR_STEPS[step]} n={step + 1} />}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────── Drag & Drop ─────────────────────────── */

/**
 * Three beats, in the order they really happen: a customer's acceptance drops
 * the appointment into the calendar by itself, the studio drags it to a
 * better time, and the customer is told how far it moved. That last beat is
 * not decoration — PATCH /studios/me/sessions/:id fires notifySessionMoved
 * whenever start_time changes, and the customer gets exactly this message.
 */
const DRAG_SLOT_10 = 36; // top offset of the 10:00 row, in px
const DRAG_SLOT_11 = 72; // …and of 11:00

export function DragCalendarMockup() {
  const [step, ref] = useLoop(3, 2100);
  const hours = ["09", "10", "11", "12", "13"];
  const dragging = step === 1;
  const top = step === 0 ? DRAG_SLOT_10 : DRAG_SLOT_11;

  return (
    <div ref={ref}>
      <Frame label="Kalender">
        <div className="p-4 h-[248px]">
          <div className="flex items-start justify-between mb-2">
            <div className="text-[9px] font-inter uppercase tracking-widest text-zinc-400">Donnerstag</div>
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.span
                  key="accepted"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[8px] font-inter text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5"
                >
                  Angebot angenommen
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            {hours.map((h) => (
              <div key={h} className="flex items-start gap-2 h-9 border-t border-zinc-100">
                <span className="text-[8px] font-inter text-zinc-300 w-4 pt-0.5">{h}</span>
              </div>
            ))}

            {/* Where it is headed, shown only while it is in the air. */}
            <AnimatePresence>
              {dragging && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ top: DRAG_SLOT_11 }}
                  className="absolute left-6 right-0 h-[72px] rounded-lg border-2 border-dashed border-emerald-400 bg-emerald-50/60"
                />
              )}
            </AnimatePresence>

            {/* One element throughout — it is the same appointment the whole
                time, so it animates between slots rather than being swapped
                for a copy. */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{
                opacity: 1,
                top,
                scale: dragging ? 1.03 : 1,
                rotate: dragging ? -2.5 : 0,
                boxShadow: dragging ? "0 12px 24px rgb(0 0 0 / 0.18)" : "0 0 0 rgb(0 0 0 / 0)",
              }}
              transition={{ type: "spring", stiffness: 140, damping: 18 }}
              className="absolute left-6 right-0 h-[72px] rounded-lg bg-emerald-500 px-2 py-1.5 z-10"
            >
              <div className="text-[9px] font-inter font-medium text-white">Lena M.</div>
              <motion.div key={step === 0 ? "a" : "b"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[8px] font-inter text-white/70">
                {step === 0 ? "10:00 – 12:00" : "11:00 – 13:00"}
              </motion.div>
            </motion.div>
          </div>

          {/* Reserved row, so the notification appearing can't change the
              frame's height and nudge the page. */}
          <div className="h-[26px] mt-2">
            <AnimatePresence>
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-2 py-1.5"
                >
                  <Bell size={9} className="text-white flex-shrink-0" />
                  <span className="text-[8px] font-inter text-white">
                    Lena wurde benachrichtigt: eine Stunde nach hinten
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Frame>
      <StepCaption steps={["Zusage landet im Kalender", "Umbuchen per Drag", "Kunde informiert"]} active={step} />
    </div>
  );
}

/* ─────────────────────────── Chat ─────────────────────────── */

const CHAT_SCRIPT = [
  { from: "staff", text: "Hi Lena! Schick mir gern noch eine Referenz vom Motiv." },
  { from: "customer", typing: true },
  { from: "customer", image: true, text: "Klar, so ungefähr:" },
  { from: "customer", audio: true },
  { from: "staff", typing: true },
  { from: "staff", text: "Perfekt — das kriegen wir in einer Session hin.", read: true },
];

export function ChatMockup() {
  const [step, ref] = useLoop(CHAT_SCRIPT.length + 2, 1900);

  // A "typing" entry is replaced by the next real message, so it never stacks.
  const visible = [];
  for (let i = 0; i < Math.min(step, CHAT_SCRIPT.length); i++) {
    const m = CHAT_SCRIPT[i];
    if (m.typing && i < step - 1) continue;
    visible.push({ ...m, i });
  }

  return (
    <div ref={ref}>
      <Frame label="Nachrichten">
        {/* Fixed, not min-height: the thread grows by one bubble every couple
            of seconds, and a min-height lets that growth push everything below
            the mockup down the page on every single message. Pinning the box
            and letting the oldest bubbles run out of the top is both stable
            and what a real thread does. */}
        <div className="p-4 h-[320px] flex flex-col">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-[9px] font-inter text-zinc-500">LM</div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div>
                <div className="text-[11px] font-inter font-medium text-zinc-900 leading-tight">Lena M.</div>
                <div className="text-[9px] font-inter text-emerald-600">Online</div>
              </div>
            </div>
            <span className="text-[9px] font-inter text-zinc-400">Fine-Line Unterarm</span>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-end space-y-2">
            {visible.map((m) => (
              <motion.div
                key={m.i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className={`flex flex-shrink-0 ${m.from === "staff" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-2.5 py-1.5 ${m.from === "staff" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-800"}`}>
                  {m.typing ? (
                    <div className="flex items-center gap-1 py-1 px-1">
                      {[0, 1, 2].map((d) => (
                        <motion.span
                          key={d}
                          animate={{ opacity: [0.25, 1, 0.25] }}
                          transition={{ duration: 1.1, repeat: Infinity, delay: d * 0.18 }}
                          className={`w-1.5 h-1.5 rounded-full ${m.from === "staff" ? "bg-white" : "bg-zinc-400"}`}
                        />
                      ))}
                    </div>
                  ) : (
                    <>
                      {m.image && <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-zinc-300 via-zinc-400 to-zinc-300 mb-1.5" />}
                      {m.audio && (
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Mic size={11} className="flex-shrink-0" />
                          <div className="flex items-end gap-[2px] h-4">
                            {[6, 11, 7, 14, 9, 13, 5, 10, 7, 12, 6].map((h, i) => (
                              <motion.span
                                key={i}
                                animate={{ height: [h * 0.5, h, h * 0.6] }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.07 }}
                                className="w-[2px] rounded-full bg-zinc-400"
                                style={{ height: h }}
                              />
                            ))}
                          </div>
                          <span className="text-[9px] font-inter text-zinc-500">0:14</span>
                        </div>
                      )}
                      {m.text && <p className="text-[10px] font-inter leading-snug">{m.text}</p>}
                      {m.read && (
                        <div className="flex items-center justify-end gap-0.5 mt-0.5">
                          <CheckCheck size={9} className="text-white/50" />
                          <span className="text-[8px] font-inter text-white/50">Gelesen</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-zinc-100">
            <Paperclip size={12} className="text-zinc-300 flex-shrink-0" />
            <Mic size={12} className="text-zinc-300 flex-shrink-0" />
            <div className="flex-1 h-7 rounded-lg border border-zinc-200 px-2 flex items-center">
              <span className="text-[9px] font-inter text-zinc-300">Nachricht schreiben…</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center flex-shrink-0">
              <Send size={11} className="text-white" />
            </div>
          </div>
        </div>
      </Frame>
      <StepCaption steps={["Rückfrage", "Bild & Audio", "Antwort"]} active={step < 2 ? 0 : step < 5 ? 1 : 2} />
    </div>
  );
}
