import React, { useState, useEffect, useRef } from "react";
import { Bell, X } from "lucide-react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;
const STORAGE_KEY = "inkbook_dismissed_announcements";

export default function AnnouncementBell() {
  const [announcement, setAnnouncement] = useState(null);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  });
  const ref = useRef(null);

  useEffect(() => {
    fetchAnnouncement();
    const iv = setInterval(fetchAnnouncement, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchAnnouncement = async () => {
    try {
      const res = await axios.get(`${API}/api/announcements/active`, { withCredentials: true });
      setAnnouncement(res.data || null);
    } catch { setAnnouncement(null); }
  };

  const isDismissed = announcement && dismissed.includes(announcement.announcement_id);
  const hasActive = announcement && !isDismissed;

  const dismiss = () => {
    if (!announcement) return;
    const next = [...dismissed, announcement.announcement_id];
    setDismissed(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setOpen(false);
  };

  const typeColors = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl hover:bg-zinc-100 transition-colors"
        data-testid="announcement-bell-btn"
        title="Ankündigungen"
      >
        <Bell size={20} className="text-zinc-600" strokeWidth={1.5} />
        {hasActive && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-zinc-100 z-50 overflow-hidden"
          data-testid="announcement-bell-panel">
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="font-inter font-semibold text-sm text-zinc-900">Ankündigungen</h3>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-zinc-100 transition-colors">
              <X size={14} className="text-zinc-500" />
            </button>
          </div>
          <div className="p-4">
            {!announcement ? (
              <p className="text-sm text-zinc-400 font-inter text-center py-4">Keine aktiven Ankündigungen</p>
            ) : isDismissed ? (
              <p className="text-sm text-zinc-400 font-inter text-center py-4">Keine neuen Ankündigungen</p>
            ) : (
              <div className={`border rounded-xl p-3 ${typeColors[announcement.type] || typeColors.info}`}>
                <p className="text-sm font-inter leading-relaxed">{announcement.text}</p>
                {announcement.link && (
                  <a href={announcement.link} className="text-xs font-inter font-semibold mt-2 block underline" target="_blank" rel="noopener noreferrer">
                    Mehr erfahren →
                  </a>
                )}
                <button onClick={dismiss} className="text-xs font-inter mt-2 opacity-60 hover:opacity-100 transition-opacity">
                  Als gelesen markieren
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
