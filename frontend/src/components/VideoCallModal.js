import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { X, Video, VideoOff, Mic, MicOff, PhoneOff, Loader2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API = process.env.REACT_APP_BACKEND_URL;
const JITSI_DOMAIN = "meet.jit.si";

function loadJitsiScript() {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) { resolve(); return; }
    const existing = document.getElementById("jitsi-external-api");
    if (existing) { existing.onload = resolve; return; }
    const script = document.createElement("script");
    script.id = "jitsi-external-api";
    script.src = `https://${JITSI_DOMAIN}/external_api.js`;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function VideoCallModal({ booking, userRole, onClose }) {
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const jitsiContainerRef = useRef(null);
  const jitsiApi = useRef(null);
  const pollRef = useRef(null);

  const roomId = `inkbook-${booking.booking_id}`;
  const otherRole = userRole === "studio_owner" ? "customer" : "studio";
  const otherLabel = userRole === "studio_owner" ? "Kunden" : "Studio";
  const myLabel = userRole === "studio_owner" ? "Studio" : "Kunde";
  const otherIsPresent = participants.includes(otherRole);

  // Init Jitsi External API with empty toolbar
  const initJitsi = useCallback(async () => {
    if (!jitsiContainerRef.current || jitsiApi.current) return;
    try {
      await loadJitsiScript();
    } catch {
      console.error("Jitsi script failed to load");
      return;
    }
    const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
      roomName: roomId,
      parentNode: jitsiContainerRef.current,
      width: "100%",
      height: "100%",
      configOverwrite: {
        toolbarButtons: [],
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        enableWelcomePage: false,
        notifications: [],
        disableInviteFunctions: true,
        doNotStoreRoom: true,
        hideConferenceTimer: true,
        hideLobbyButton: true,
        disableThirdPartyRequests: true,
        startWithAudioMuted: false,
        startWithVideoMuted: false,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_CHROME_EXTENSION_BANNER: false,
        MOBILE_APP_PROMO: false,
        HIDE_INVITE_MORE_HEADER: true,
        TOOLBAR_BUTTONS: [],
        SETTINGS_SECTIONS: [],
        DEFAULT_REMOTE_DISPLAY_NAME: otherLabel,
        DEFAULT_LOCAL_DISPLAY_NAME: myLabel,
        FILM_STRIP_MAX_HEIGHT: 120,
        VERTICAL_FILMSTRIP: false,
      },
    });

    api.on("audioMuteStatusChanged", ({ muted }) => setMicMuted(muted));
    api.on("videoMuteStatusChanged", ({ muted }) => setVideoMuted(muted));
    api.on("readyToClose", handleLeave);
    jitsiApi.current = api;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, myLabel, otherLabel]);

  // Start Jitsi after join
  useEffect(() => {
    if (joined) initJitsi();
  }, [joined, initJitsi]);

  // Poll participants when joined
  useEffect(() => {
    if (!joined) return;
    const poll = async () => {
      try {
        const { data } = await axios.get(
          `${API}/api/bookings/${booking.booking_id}/video-status`,
          { withCredentials: true }
        );
        setParticipants(data.participants || []);
      } catch {}
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => clearInterval(pollRef.current);
  }, [joined, booking.booking_id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(pollRef.current);
      if (jitsiApi.current) {
        try { jitsiApi.current.dispose(); } catch {}
        jitsiApi.current = null;
      }
      axios
        .post(`${API}/api/bookings/${booking.booking_id}/video-leave`, {}, { withCredentials: true })
        .catch(() => {});
    };
  }, [booking.booking_id]);

  const handleJoin = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${API}/api/bookings/${booking.booking_id}/video-join`,
        {},
        { withCredentials: true }
      );
      const { data } = await axios.get(
        `${API}/api/bookings/${booking.booking_id}/video-status`,
        { withCredentials: true }
      );
      setParticipants(data.participants || []);
      setJoined(true);
    } catch {
      alert("Fehler beim Beitreten. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    clearInterval(pollRef.current);
    if (jitsiApi.current) {
      try { jitsiApi.current.dispose(); } catch {}
      jitsiApi.current = null;
    }
    await axios
      .post(`${API}/api/bookings/${booking.booking_id}/video-leave`, {}, { withCredentials: true })
      .catch(() => {});
    onClose();
  };

  const toggleMic = () => jitsiApi.current?.executeCommand("toggleAudio");
  const toggleVideo = () => jitsiApi.current?.executeCommand("toggleVideo");

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="w-full max-w-4xl mx-4 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
        style={{ height: "88vh", background: "#111113" }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
              <Video size={13} className="text-white" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-white font-inter font-medium text-sm leading-none mb-0.5">Videoberatung</p>
              <p className="text-zinc-600 text-xs font-inter">{booking.studio_name || "InkBook"}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Participant dots */}
            {joined && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                      participants.includes("customer") ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-zinc-700"
                    }`}
                  />
                  <span className="text-xs font-inter text-zinc-600">Kunde</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                      participants.includes("studio") ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-zinc-700"
                    }`}
                  />
                  <span className="text-xs font-inter text-zinc-600">Studio</span>
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl transition-colors text-zinc-600 hover:text-white"
              style={{ background: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              data-testid="video-modal-close"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 relative overflow-hidden">

          {/* Pre-join Screen */}
          {!joined && (
            <div className="flex flex-col items-center justify-center h-full gap-7 p-8 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Video size={30} className="text-white" strokeWidth={1} />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <h2 className="text-white font-playfair font-semibold text-2xl mb-2">Videoberatung beitreten</h2>
                <p className="text-zinc-500 font-inter text-sm max-w-xs mx-auto leading-relaxed">
                  {participants.length === 0
                    ? "Noch niemand im Raum. Tritt als Erster bei."
                    : `${participants.includes("studio") ? "Das Studio" : "Ein Kunde"} wartet bereits auf dich.`}
                </p>
              </motion.div>

              {participants.some(p =>
                userRole === "studio_owner" ? p === "customer" : p === "studio"
              ) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2.5 rounded-2xl px-5 py-2.5"
                  style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.18)" }}
                >
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-emerald-400 text-sm font-inter">{otherLabel} wartet bereits</span>
                </motion.div>
              )}

              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleJoin}
                disabled={loading}
                className="flex items-center gap-2.5 bg-white text-zinc-900 font-inter font-semibold px-9 py-3.5 rounded-2xl transition-all disabled:opacity-50 text-sm hover:bg-zinc-100"
                data-testid="video-join-btn"
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Verbinde…</>
                  : <><Video size={16} strokeWidth={2} /> Jetzt beitreten</>
                }
              </motion.button>
            </div>
          )}

          {/* Active Call */}
          {joined && (
            <div className="relative h-full">
              {/* Jitsi Container – always rendered */}
              <div ref={jitsiContainerRef} className="w-full h-full" />

              {/* Waiting overlay */}
              <AnimatePresence>
                {!otherIsPresent && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.4 } }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-6"
                    style={{ background: "rgba(10,10,12,0.82)", backdropFilter: "blur(12px)" }}
                  >
                    <div className="relative">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        <Clock size={22} className="text-white" strokeWidth={1} />
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-400/40">
                        <Loader2 size={11} className="text-white animate-spin" />
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-playfair font-semibold text-xl mb-1.5">Warte auf {otherLabel}…</p>
                      <p className="text-zinc-500 text-sm font-inter">Du bist verbunden. Die Gegenseite wird benachrichtigt.</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-inter text-zinc-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Verbunden
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Custom Controls Bar */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 280, damping: 24 }}
                className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
                style={{
                  background: "rgba(18,18,20,0.92)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {/* Mic */}
                <button
                  onClick={toggleMic}
                  title={micMuted ? "Mikrofon einschalten" : "Stummschalten"}
                  data-testid="video-mic-btn"
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: micMuted ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.09)",
                    color: micMuted ? "#f87171" : "#ffffff",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = micMuted ? "rgba(239,68,68,0.28)" : "rgba(255,255,255,0.15)"}
                  onMouseLeave={e => e.currentTarget.style.background = micMuted ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.09)"}
                >
                  {micMuted ? <MicOff size={18} strokeWidth={1.5} /> : <Mic size={18} strokeWidth={1.5} />}
                </button>

                {/* End Call */}
                <button
                  onClick={handleLeave}
                  title="Gespräch beenden"
                  data-testid="video-leave-btn"
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{ background: "#ef4444", color: "white", boxShadow: "0 4px 20px rgba(239,68,68,0.4)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#dc2626"}
                  onMouseLeave={e => e.currentTarget.style.background = "#ef4444"}
                >
                  <PhoneOff size={18} strokeWidth={1.5} />
                </button>

                {/* Camera */}
                <button
                  onClick={toggleVideo}
                  title={videoMuted ? "Kamera einschalten" : "Kamera ausschalten"}
                  data-testid="video-camera-btn"
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: videoMuted ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.09)",
                    color: videoMuted ? "#f87171" : "#ffffff",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = videoMuted ? "rgba(239,68,68,0.28)" : "rgba(255,255,255,0.15)"}
                  onMouseLeave={e => e.currentTarget.style.background = videoMuted ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.09)"}
                >
                  {videoMuted ? <VideoOff size={18} strokeWidth={1.5} /> : <Video size={18} strokeWidth={1.5} />}
                </button>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
