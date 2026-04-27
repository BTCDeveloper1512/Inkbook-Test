import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { X, Video, Loader2, UserCheck, Clock } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

export default function VideoCallModal({ booking, userRole, onClose }) {
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef(null);
  const pollRef = useRef(null);
  const roomId = `inkbook-${booking.booking_id}`;
  const otherRole = userRole === "studio_owner" ? "customer" : "studio";
  const otherLabel = userRole === "studio_owner" ? "Kunden" : "Studio";

  // Poll participants every 3s
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/api/bookings/${booking.booking_id}/video-status`, { withCredentials: true });
        setParticipants(res.data.participants || []);
      } catch {}
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [booking.booking_id]);

  // Leave on unmount
  useEffect(() => {
    return () => {
      axios.post(`${API}/api/bookings/${booking.booking_id}/video-leave`, {}, { withCredentials: true }).catch(() => {});
    };
  }, [booking.booking_id]);

  const handleJoin = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/api/bookings/${booking.booking_id}/video-join`, {}, { withCredentials: true });
      setJoined(true);
      const res = await axios.get(`${API}/api/bookings/${booking.booking_id}/video-status`, { withCredentials: true });
      setParticipants(res.data.participants || []);
    } catch (err) {
      alert("Fehler beim Beitreten. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  const otherIsPresent = participants.includes(otherRole);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden flex flex-col" style={{ height: "85vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-zinc-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
              <Video size={16} className="text-white" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-white font-inter font-semibold text-sm">Videoberatungsgespräch</p>
              <p className="text-zinc-400 text-xs font-inter">{booking.studio_name || "InkBook Video"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {joined && (
              <div className="flex items-center gap-1.5 text-xs font-inter">
                <span className={`w-2 h-2 rounded-full ${participants.includes("customer") ? "bg-green-400" : "bg-zinc-600"}`} />
                <span className="text-zinc-400">Kunde</span>
                <span className={`w-2 h-2 rounded-full ml-2 ${participants.includes("studio") ? "bg-green-400" : "bg-zinc-600"}`} />
                <span className="text-zinc-400">Studio</span>
              </div>
            )}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-zinc-400 hover:text-white">
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative bg-zinc-950">
          {!joined ? (
            /* Pre-join screen */
            <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
              <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center">
                <Video size={32} className="text-white" strokeWidth={1} />
              </div>
              <div>
                <h2 className="text-white font-playfair font-semibold text-2xl mb-2">Videoberatung beitreten</h2>
                <p className="text-zinc-400 font-inter text-sm">
                  {participants.length === 0
                    ? "Noch niemand im Raum. Tritt als Erster bei."
                    : `${participants.includes("studio") ? "Studio" : "Kunde"} wartet bereits.`}
                </p>
              </div>
              {participants.length > 0 && !participants.includes(otherRole === "studio" ? "customer" : "studio") && (
                <div className="flex items-center gap-2 bg-green-900/30 border border-green-500/30 rounded-xl px-4 py-2">
                  <UserCheck size={15} className="text-green-400" />
                  <span className="text-green-400 text-sm font-inter">
                    {participants.includes("studio") ? "Studio" : "Kunde"} ist bereits im Raum
                  </span>
                </div>
              )}
              <button
                onClick={handleJoin}
                disabled={loading}
                className="flex items-center gap-2 bg-white text-zinc-900 font-inter font-semibold px-8 py-3 rounded-2xl hover:bg-zinc-100 transition-all disabled:opacity-50"
                data-testid="video-join-btn"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Video size={18} strokeWidth={1.5} />}
                {loading ? "Verbinde..." : "Jetzt beitreten"}
              </button>
            </div>
          ) : !otherIsPresent ? (
            /* Waiting screen - other hasn't joined yet */
            <div className="relative h-full">
              {/* Jitsi in background (muted preview) */}
              <iframe
                ref={iframeRef}
                src={`https://meet.jit.si/${roomId}?minimal=1`}
                allow="camera; microphone; fullscreen; display-capture"
                className="w-full h-full border-0 opacity-30"
                title="Video Call"
              />
              {/* Waiting overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-zinc-950/70 backdrop-blur-sm">
                <div className="relative">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
                    <Clock size={28} className="text-white" strokeWidth={1} />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                    <Loader2 size={12} className="text-white animate-spin" />
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-white font-playfair font-semibold text-xl mb-1">Warte auf {otherLabel}...</p>
                  <p className="text-zinc-400 text-sm font-inter">Du bist bereits im Raum. Die andere Seite wird benachrichtigt.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-inter text-zinc-500">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Verbunden · Warte auf Gegenseite
                </div>
              </div>
            </div>
          ) : (
            /* Both joined - full Jitsi */
            <iframe
              ref={iframeRef}
              src={`https://meet.jit.si/${roomId}`}
              allow="camera; microphone; fullscreen; display-capture"
              className="w-full h-full border-0"
              title="Video Call"
            />
          )}
        </div>
      </div>
    </div>
  );
}
