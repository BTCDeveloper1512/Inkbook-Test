import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Timer, AlertTriangle, Clock } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;
const DEADLINE_MINUTES = 15;

/**
 * VideoCountdownTimer
 * - Before start (> 60 min): shows "Startet um HH:MM"
 * - Pre-window (≤ 60 min before start): shows amber countdown "Startet in X:XX"
 * - Active window (0–15 min after start): shows red urgent countdown + progress ring
 * - Expired (> 15 min after start): auto-cancels booking, shows "Abgelaufen"
 *
 * Props:
 *   booking       – booking object with { booking_id, date, start_time, status }
 *   onAutoCancel  – callback triggered when 15-min window expires (to refresh UI)
 */
export default function VideoCountdownTimer({ booking, onAutoCancel }) {
  const [phase, setPhase] = useState(null); // "far" | "soon" | "active" | "expired"
  const [display, setDisplay] = useState("");
  const [progress, setProgress] = useState(100); // 0–100 for ring
  const cancelFiredRef = useRef(false);
  const intervalRef = useRef(null);

  const compute = useCallback(() => {
    const now = new Date();
    const startDT = new Date(`${booking.date}T${booking.start_time}:00`);
    const deadline = new Date(startDT.getTime() + DEADLINE_MINUTES * 60 * 1000);
    const msToStart = startDT - now;
    const msToDeadline = deadline - now;
    const totalWindowMs = DEADLINE_MINUTES * 60 * 1000;

    if (msToStart > 60 * 60 * 1000) {
      // > 60 min away – show static start time
      return { phase: "far", display: booking.start_time + " Uhr", progress: 100 };
    }

    if (msToStart > 0) {
      // Within 60 min before start
      const totalSec = Math.ceil(msToStart / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      const disp = m > 0 ? `${m}:${String(s).padStart(2, "0")} min` : `${s}s`;
      return { phase: "soon", display: disp, progress: 100 };
    }

    if (msToDeadline > 0) {
      // After start, within 15-min window
      const remainSec = Math.ceil(msToDeadline / 1000);
      const m = Math.floor(remainSec / 60);
      const s = remainSec % 60;
      const disp = `${m}:${String(s).padStart(2, "0")}`;
      const prog = Math.max(0, (msToDeadline / totalWindowMs) * 100);
      return { phase: "active", display: disp, progress: prog };
    }

    return { phase: "expired", display: "00:00", progress: 0 };
  }, [booking.date, booking.start_time]);

  useEffect(() => {
    const tick = () => {
      const result = compute();
      setPhase(result.phase);
      setDisplay(result.display);
      setProgress(result.progress);

      if (result.phase === "expired" && !cancelFiredRef.current) {
        cancelFiredRef.current = true;
        // Auto-cancel: fire and forget, then notify parent
        axios.put(
          `${API}/api/bookings/${booking.booking_id}/status`,
          null,
          { params: { status: "cancelled" }, withCredentials: true }
        ).catch(() => {}).finally(() => {
          onAutoCancel?.();
        });
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [compute, booking.booking_id, onAutoCancel]);

  if (!phase) return null;

  // ── Far: static display ──────────────────────────────────────────────────────
  if (phase === "far") {
    return (
      <span className="flex items-center gap-1 text-xs font-inter text-zinc-400" data-testid="video-timer-far">
        <Clock size={10} strokeWidth={1.5} />
        {display}
      </span>
    );
  }

  // ── Soon: amber countdown to start ──────────────────────────────────────────
  if (phase === "soon") {
    return (
      <span
        className="flex items-center gap-1 text-xs font-inter font-semibold text-amber-600"
        data-testid="video-timer-soon"
      >
        <Timer size={10} strokeWidth={2} />
        Startet in {display}
      </span>
    );
  }

  // ── Active: red countdown ring ───────────────────────────────────────────────
  if (phase === "active") {
    const urgent = progress < 34; // last 5 min
    const radius = 10;
    const circ = 2 * Math.PI * radius;
    const dash = (progress / 100) * circ;

    return (
      <div
        className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-inter font-bold border ${
          urgent
            ? "bg-red-600 text-white border-red-600 animate-pulse"
            : "bg-red-50 text-red-600 border-red-200"
        }`}
        data-testid="video-timer-active"
      >
        {/* SVG ring */}
        <svg width="24" height="24" viewBox="0 0 24 24" className="flex-shrink-0 -rotate-90">
          <circle cx="12" cy="12" r={radius} fill="none"
            stroke={urgent ? "rgba(255,255,255,0.25)" : "rgba(239,68,68,0.15)"}
            strokeWidth="2.5" />
          <circle cx="12" cy="12" r={radius} fill="none"
            stroke={urgent ? "white" : "#ef4444"}
            strokeWidth="2.5"
            strokeDasharray={circ}
            strokeDashoffset={circ - dash}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <span>{display}</span>
        <span className="opacity-75 font-normal">verbleibend</span>
      </div>
    );
  }

  // ── Expired ──────────────────────────────────────────────────────────────────
  return (
    <span className="flex items-center gap-1 text-xs font-inter font-semibold text-red-500" data-testid="video-timer-expired">
      <AlertTriangle size={10} strokeWidth={2} />
      Abgelaufen – wird storniert
    </span>
  );
}
