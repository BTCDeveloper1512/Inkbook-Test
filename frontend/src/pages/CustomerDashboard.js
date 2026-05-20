import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Calendar, MessageSquare, Clock, CheckCircle, XCircle, CreditCard, RefreshCw, AlertTriangle, Scissors, X, Search, Star, HelpCircle, Video, Settings, ChevronRight } from "lucide-react";
import VideoCallModal from "../components/VideoCallModal";
import VideoCountdownTimer from "../components/VideoCountdownTimer";
import PaymentModal from "../components/PaymentModal";
import DashboardHeroSmoke from "../components/DashboardHeroSmoke";
import BorderGlow from "../components/BorderGlow/BorderGlow";
import { motion, AnimatePresence } from "framer-motion";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusConfig = {
  pending:   { label: "Ausstehend",    cls: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Bestätigt",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Storniert",     cls: "bg-red-50 text-red-700 border-red-200" },
  completed: { label: "Abgeschlossen", cls: "bg-zinc-100 text-zinc-500 border-zinc-200" }
};

function ReviewModal({ booking, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) { setError("Bitte wähle eine Bewertung aus."); return; }
    setLoading(true);
    setError("");
    try {
      await axios.post(`${API}/studios/${booking.studio_id}/reviews`, {
        studio_id: booking.studio_id,
        rating,
        comment: comment.trim(),
        booking_id: booking.booking_id
      }, { withCredentials: true });
      onSubmitted();
      onClose();
    } catch (e) {
      setError(e.response?.data?.detail || "Bewertung konnte nicht gespeichert werden.");
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
      data-testid="review-modal"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="font-playfair font-semibold text-lg text-zinc-900">Bewertung abgeben</h3>
            <p className="text-xs text-zinc-400 font-inter mt-0.5">{booking.studio_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 transition-colors" data-testid="review-modal-close">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Context */}
          <div className="bg-zinc-50 rounded-xl px-4 py-3 text-sm font-inter text-zinc-500">
            Termin am <strong className="text-zinc-800">{booking.date ? new Date(booking.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""}</strong> um <strong className="text-zinc-800">{booking.start_time}</strong>
          </div>

          {/* Stars */}
          <div>
            <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-3">Deine Bewertung</p>
            <div className="flex gap-2" data-testid="star-rating">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="p-1 transition-transform hover:scale-110"
                  data-testid={`star-${star}`}
                >
                  <Star
                    size={32}
                    strokeWidth={1.5}
                    className={`transition-colors ${star <= (hovered || rating) ? "fill-amber-400 text-amber-400" : "text-zinc-200"}`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-zinc-500 font-inter mt-1.5">
                {["", "Sehr schlecht", "Nicht gut", "Ok", "Gut", "Ausgezeichnet"][rating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2">Kommentar (optional)</p>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Erzähl anderen von deiner Erfahrung..."
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl font-inter text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all resize-none"
              data-testid="review-comment"
            />
            <p className="text-xs text-zinc-400 font-inter text-right mt-1">{comment.length}/500</p>
          </div>

          {error && <p className="text-xs text-red-600 font-inter bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="btn-primary w-full justify-center disabled:opacity-40"
            data-testid="submit-review-btn"
          >
            {loading ? "Wird gespeichert..." : "Bewertung senden"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ReviewReminderPopup({ booking, onReview, onDismiss }) {
  return (
    <motion.div
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 120, opacity: 0 }}
      transition={{ type: "spring", stiffness: 340, damping: 32 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm z-40 px-4"
      data-testid="review-reminder-popup"
    >
      <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] border border-black/[0.06] overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Star size={18} strokeWidth={1.5} className="fill-amber-400 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="font-inter font-semibold text-sm text-zinc-900 leading-snug">Wie war dein Termin?</p>
              <p className="text-xs text-zinc-400 font-inter mt-0.5 truncate">
                {booking.studio_name} · {booking.date ? new Date(booking.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "short" }) : ""}
              </p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 font-inter leading-relaxed">
            Teile deine Erfahrung und hilf anderen bei der Wahl des richtigen Studios.
          </p>
        </div>
        <div className="flex border-t border-zinc-100">
          <button
            onClick={onDismiss}
            className="flex-1 py-3 text-xs font-inter text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 transition-colors"
            data-testid="review-reminder-dismiss"
          >
            Vielleicht später
          </button>
          <div className="w-px bg-zinc-100" />
          <button
            onClick={onReview}
            className="flex-1 py-3 text-xs font-inter font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-1.5"
            data-testid="review-reminder-submit"
          >
            <Star size={11} strokeWidth={2} className="fill-amber-400 text-amber-400" /> Jetzt bewerten
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function CustomerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [paymentSession, setPaymentSession] = useState(null);
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState("");
  const [reviewBooking, setReviewBooking] = useState(null);
  const [dismissedCancellations, setDismissedCancellations] = useState(() => {
    try { return JSON.parse(localStorage.getItem("inkbook_dismissed_cancellations") || "[]"); }
    catch { return []; }
  });
  const [reviewedBookingIds, setReviewedBookingIds] = useState(new Set());
  const [reviewReminderBooking, setReviewReminderBooking] = useState(null);
  const [notYetPopup, setNotYetPopup] = useState(false);
  const [videoCallBooking, setVideoCallBooking] = useState(null);
  const [tick, setTick] = useState(0); // forces re-render every minute for live time checks
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchReviewedIds = async () => {
    try {
      const { data } = await axios.get(`${API}/reviews/my-reviewed-bookings`, { withCredentials: true });
      setReviewedBookingIds(new Set(data));
    } catch {}
  };

  useEffect(() => {
    if (!stats) return;
    const now = new Date();
    const reminded = (() => { try { return JSON.parse(localStorage.getItem("inkbook_reminded_bookings") || "[]"); } catch { return []; } })();
    const allBookings = stats?.all_bookings || [];
    const candidate = allBookings
      .filter(b =>
        b.status === "confirmed" &&
        b.date && b.end_time &&
        now > new Date(`${b.date}T${b.end_time}:00`) &&
        !reviewedBookingIds.has(b.booking_id) &&
        !reminded.includes(b.booking_id)
      )
      .sort((a, b) => new Date(`${b.date}T${b.end_time}:00`) - new Date(`${a.date}T${a.end_time}:00`))[0];
    if (!candidate) return;
    const timer = setTimeout(() => setReviewReminderBooking(candidate), 900);
    return () => clearTimeout(timer);
  }, [stats, reviewedBookingIds]);

  const dismissReminder = (bookingId) => {
    const reminded = (() => { try { return JSON.parse(localStorage.getItem("inkbook_reminded_bookings") || "[]"); } catch { return []; } })();
    if (!reminded.includes(bookingId)) {
      localStorage.setItem("inkbook_reminded_bookings", JSON.stringify([...reminded, bookingId]));
    }
    setReviewReminderBooking(null);
  };

  useEffect(() => {
    fetchStats();
    fetchMessages();
    fetchReviewedIds();
    const pollInterval = setInterval(fetchStats, 8000);
    const msgInterval = setInterval(fetchMessages, 15000);
    const tickInterval = setInterval(() => setTick(t => t + 1), 60000);
    return () => { clearInterval(pollInterval); clearInterval(msgInterval); clearInterval(tickInterval); };
  }, []);

  const fetchMessages = async () => {
    try {
      const [convsRes, unreadRes] = await Promise.all([
        axios.get(`${API}/messages`, { withCredentials: true }),
        axios.get(`${API}/messages/unread-count`, { withCredentials: true })
      ]);
      const convs = (convsRes.data || [])
        .sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0))
        .slice(0, 4);
      setConversations(convs);
      setUnreadCount(unreadRes.data?.unread_count || 0);
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API}/dashboard/stats`, { withCredentials: true });
      setStats(data);
    } catch { navigate("/login"); } finally { setLoading(false); }
  };

  const handlePayDeposit = async (booking) => {
    try {
      const { data } = await axios.post(`${API}/payments/create-session`, {
        booking_id: booking.booking_id, origin_url: window.location.origin
      }, { withCredentials: true });
      setPaymentSession(data);
    } catch (e) { alert(e.response?.data?.detail || "Zahlungsfehler"); }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Buchung wirklich absagen?")) return;
    setCancelLoading(bookingId);
    try {
      await axios.put(`${API}/bookings/${bookingId}/status`, null, {
        params: { status: "cancelled" }, withCredentials: true
      });
      fetchStats();
    } catch {} finally { setCancelLoading(""); }
  };

  const handleOpenReschedule = async (booking) => {
    setRescheduleBooking(booking);
    setRescheduleDate("");
    setRescheduleSlots([]);
  };

  const handleRescheduleDate = async (date) => {
    setRescheduleDate(date);
    try {
      const { data } = await axios.get(`${API}/studios/${rescheduleBooking.studio_id}/slots`, {
        params: { date, slot_type: rescheduleBooking.booking_type }
      });
      setRescheduleSlots(data);
    } catch {}
  };

  const handleReschedule = async (newSlotId) => {
    setRescheduleLoading(true);
    try {
      await axios.put(`${API}/bookings/${rescheduleBooking.booking_id}/reschedule`, { new_slot_id: newSlotId }, { withCredentials: true });
      setRescheduleBooking(null);
      fetchStats();
    } catch (e) { alert(e.response?.data?.detail || "Umbuchung fehlgeschlagen"); } finally { setRescheduleLoading(false); }
  };

  const getDates = () => {
    const dates = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  };

  const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const now = new Date();

  // Helper: has the appointment's end time already passed?
  const isBookingPast = (b) => {
    if (!b.date || !b.end_time) return false;
    return now > new Date(`${b.date}T${b.end_time}:00`);
  };
  const isBookingToday = (b) => b.date === today;

  const allBookings = stats?.all_bookings || [];

  // Today = pending/confirmed, today's date, end_time not yet passed – sorted by start_time
  const todayBookings = allBookings
    .filter(b => ["pending", "confirmed"].includes(b.status) && isBookingToday(b) && !isBookingPast(b))
    .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
  // Upcoming = pending/confirmed, strictly future date – sorted by date then time
  const upcoming = allBookings
    .filter(b => ["pending", "confirmed"].includes(b.status) && b.date > today)
    .sort((a, b) => a.date === b.date ? (a.start_time || "").localeCompare(b.start_time || "") : a.date.localeCompare(b.date));
  // Past = cancelled/completed OR (pending/confirmed with end time passed)
  const past = allBookings.filter(b =>
    ["cancelled", "completed"].includes(b.status) ||
    (["pending", "confirmed"].includes(b.status) && isBookingPast(b)) ||
    (["pending", "confirmed"].includes(b.status) && b.date < today)
  );
  const justCancelled = allBookings.filter(b => b.status === "cancelled" && b.cancelled_by === "studio" && !dismissedCancellations.includes(b.booking_id));

  if (loading) return (
    <div className="min-h-screen bg-zinc-50"><Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <motion.div key={i}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
              className="w-2 h-2 rounded-full bg-zinc-400"
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      {/* ── Dark Hero Card (rounded, bordered glow) ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <BorderGlow
          backgroundColor="#0e0e18"
          borderRadius={24}
          glowColor="220 25 88"
          colors={["rgba(210,220,255,0.55)", "rgba(160,140,255,0.35)", "rgba(120,170,255,0.25)"]}
          glowIntensity={0.9}
          glowRadius={44}
          coneSpread={22}
          animated
          className="w-full"
        >
          <div className="relative overflow-hidden" style={{ borderRadius: 24 }}>
            <DashboardHeroSmoke />
            <div className="relative px-4 sm:px-8 pt-6 sm:pt-8 pb-8 sm:pb-10">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] tracking-[0.28em] uppercase font-inter mb-2" style={{ color: "rgba(255,255,255,0.28)" }}>Mein Konto</p>
                    <div className="flex items-baseline gap-3">
                      <h1 className="font-playfair font-bold text-white" style={{ fontSize: "clamp(26px, 4vw, 36px)" }}>
                        Hallo, {user?.name?.split(" ")[0]}
                      </h1>
                      <motion.span
                        initial={{ opacity: 0, rotate: -30, scale: 0.5 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        transition={{ delay: 0.35, type: "spring", stiffness: 260, damping: 15 }}
                        className="text-2xl select-none"
                      >👋</motion.span>
                    </div>
                  </div>
                  <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 18 }}>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-inter font-medium transition-all"
                      style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.12)" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.10)"; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; }}
                    >
                      <Settings size={14} strokeWidth={1.5} />
                      Einstellungen
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </BorderGlow>
      </div>

      {/* ── White Content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Cancellation Alert Banner (Studio-seitig storniert) */}
        <AnimatePresence>
          {justCancelled.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3"
              data-testid="cancellation-alert"
            >
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="flex-1">
                <p className="font-inter font-semibold text-red-800 text-sm">Dein Termin wurde storniert</p>
                {justCancelled.map(b => (
                  <p key={b.booking_id} className="text-xs text-red-600 font-inter mt-1">
                    {b.studio_name} · {b.date ? new Date(b.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""} {b.start_time} – {b.end_time} wurde vom Studio storniert.
                  </p>
                ))}
                <Link to="/search" className="text-xs text-red-700 font-inter font-semibold underline underline-offset-2 mt-1.5 inline-block">
                  Neues Studio finden →
                </Link>
              </div>
              <button
                onClick={() => {
                  const ids = [...dismissedCancellations, ...justCancelled.map(b => b.booking_id)];
                  setDismissedCancellations(ids);
                  localStorage.setItem("inkbook_dismissed_cancellations", JSON.stringify(ids));
                }}
                className="p-1 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-700 transition-colors flex-shrink-0 mt-0.5"
                data-testid="dismiss-cancellation-btn"
                aria-label="Meldung schließen"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <motion.div
          initial="hidden" animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          {[
            { label: "Buchungen gesamt", value: stats?.total_bookings || 0, icon: Calendar, color: "text-zinc-400" },
            { label: "Ausstehend", value: upcoming.filter(b => b.status === "pending").length, icon: Clock, color: "text-amber-400" },
            { label: "Bestätigt", value: upcoming.filter(b => b.status === "confirmed").length, icon: CheckCircle, color: "text-emerald-400" },
            { label: "Storniert", value: allBookings.filter(b => b.status === "cancelled").length, icon: XCircle, color: "text-red-400" }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={i}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 22 } } }}
                whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.08)" }}
                className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-4 cursor-default"
              >
                <Icon size={16} strokeWidth={1.5} className={`${stat.color} mb-2`} />
                <p className="text-2xl font-playfair font-semibold text-zinc-900">{stat.value}</p>
                <p className="text-xs text-zinc-500 font-inter mt-0.5">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>


        {/* Nachrichten Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] mb-6 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-50">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center">
                <MessageSquare size={13} className="text-white" strokeWidth={1.5} />
              </div>
              <span className="font-inter font-semibold text-sm text-zinc-900">Nachrichten</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-inter font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                  {unreadCount} neu
                </span>
              )}
            </div>
            <Link to="/messages" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-900 font-inter transition-colors">
              Alle <ChevronRight size={12} strokeWidth={2} />
            </Link>
          </div>

          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center mb-3">
                <MessageSquare size={18} className="text-zinc-300" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-zinc-400 font-inter">Noch keine Nachrichten</p>
              <p className="text-xs text-zinc-300 font-inter mt-1">Studio-Antworten erscheinen hier</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {conversations.map((conv, i) => {
                const name = conv.other_name || "Studio";
                const isSystem = conv.is_broadcast_conv || conv.other_user_id === "inkbook_system";
                const preview = conv.last_message
                  ? (conv.last_message.length > 55 ? conv.last_message.slice(0, 55) + "…" : conv.last_message)
                  : "Nachricht";
                const isUnread = (conv.unread_count || 0) > 0;
                const timeStr = conv.last_message_at
                  ? new Date(conv.last_message_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })
                  : "";
                const initial = name.charAt(0).toUpperCase();
                const avatarBg = isSystem
                  ? "bg-zinc-900"
                  : ["bg-violet-100", "bg-rose-100", "bg-sky-100", "bg-amber-100", "bg-emerald-100"][i % 5];
                const avatarText = isSystem
                  ? "text-white"
                  : ["text-violet-600", "text-rose-600", "text-sky-600", "text-amber-600", "text-emerald-600"][i % 5];
                return (
                  <Link key={conv.conv_id || i} to={`/messages?with=${conv.other_user_id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 transition-colors group">
                    <div className={`w-9 h-9 ${avatarBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-sm font-inter font-bold ${avatarText}`}>{initial}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className={`text-sm font-inter truncate ${isUnread ? "font-semibold text-zinc-900" : "font-medium text-zinc-600"}`}>
                          {name}
                        </p>
                        <span className="text-[10px] text-zinc-300 font-inter flex-shrink-0">{timeStr}</span>
                      </div>
                      <p className={`text-xs font-inter truncate ${isUnread ? "text-zinc-500" : "text-zinc-400"}`}>{preview}</p>
                    </div>
                    {isUnread
                      ? <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full flex-shrink-0" />
                      : <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" />
                    }
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Bookings Tabs */}
        <div className="flex gap-1 mb-5 bg-white rounded-2xl border border-black/[0.04] shadow-[0_2px_10px_rgb(0,0,0,0.04)] p-1.5 w-fit max-w-full overflow-x-auto">
          {[
            { id: "today", label: `Heutige Termine (${todayBookings.length})` },
            { id: "upcoming", label: `${t("dashboard.upcoming")} (${upcoming.length})` },
            { id: "past", label: `${t("dashboard.past")} (${past.length})` }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-5 py-2 rounded-xl text-sm font-inter font-medium transition-all ${activeTab === tab.id ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}`}
              data-testid={`${tab.id}-tab`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden">
          <AnimatePresence mode="wait">
            {(activeTab === "today" ? todayBookings : activeTab === "upcoming" ? upcoming : past).length === 0 ? (
              <motion.div
                key={`empty-${activeTab}`}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
                className="py-24 flex flex-col items-center justify-center"
                data-testid="no-bookings"
              >
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 18 }}
                  className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-5"
                >
                  <Calendar size={26} className="text-zinc-300" strokeWidth={1.5} />
                </motion.div>
                <h3 className="font-playfair text-xl text-zinc-900 mb-1.5">
                  {activeTab === "today" ? "Freier Tag" : activeTab === "upcoming" ? "Keine Termine" : "Noch nichts vergangen"}
                </h3>
                <p className="text-zinc-400 font-inter text-sm mb-7 text-center max-w-xs">
                  {activeTab === "today" ? "Keine Termine für heute geplant" : activeTab === "upcoming" ? "Buche dein nächstes Tattoo-Erlebnis." : "Vergangene Termine erscheinen hier"}
                </p>
                {activeTab === "upcoming" && (
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link to="/search" className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white text-sm font-inter rounded-full hover:bg-zinc-800 transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
                      <Search size={13} strokeWidth={1.5} /> Studio finden
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="divide-y divide-zinc-50"
              >
                {(activeTab === "today" ? todayBookings : activeTab === "upcoming" ? upcoming : past).map((booking, i) => {
                  const isPast = isBookingPast(booking);
                  const sc = statusConfig[isPast && booking.status === "confirmed" ? "completed" : booking.status] || statusConfig.pending;
                  const isCancelledByStudio = booking.status === "cancelled" && booking.cancelled_by === "studio";
                  return (
                    <motion.div key={booking.booking_id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 22 }}
                      whileHover={{ y: -1, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}
                      className={`group relative p-5 flex items-start gap-4 transition-colors rounded-xl mx-1 my-0.5 hover:bg-zinc-50 cursor-default ${isCancelledByStudio ? "bg-red-50/30 hover:bg-red-50/50" : ""}`}
                      data-testid={`booking-item-${booking.booking_id}`}
                    >
                      <span className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center ${isCancelledByStudio ? "bg-red-400" : "bg-zinc-900"}`} />
                      {/* Date block */}
                      <div className={`flex-shrink-0 w-12 text-center rounded-xl py-2 px-1 border ${
                        booking.status === "cancelled" ? "bg-zinc-50 border-zinc-200" :
                        isPast ? "bg-zinc-200 border-zinc-200" : "bg-zinc-900 border-zinc-900"
                      }`}>
                        <p className={`text-lg font-playfair font-bold leading-none ${booking.status === "cancelled" || isPast ? "text-zinc-400" : "text-white"}`}>
                          {booking.date ? new Date(booking.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit" }) : "—"}
                        </p>
                        <p className={`text-xs font-inter leading-none mt-0.5 ${booking.status === "cancelled" || isPast ? "text-zinc-400" : "text-zinc-300"}`}>
                          {booking.date ? new Date(booking.date + "T12:00:00").toLocaleDateString("de-DE", { month: "short" }) : ""}
                        </p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`font-playfair font-semibold text-base break-words leading-snug ${booking.status === "cancelled" ? "text-zinc-400 line-through" : "text-zinc-900"}`}>
                            {booking.studio_name}
                          </h4>
                          <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full border font-inter ${sc.cls}`}
                            data-testid={isPast && booking.status === "confirmed" ? `completed-badge-${booking.booking_id}` : undefined}>
                            {sc.label}
                          </span>
                        </div>

                        {isCancelledByStudio && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <AlertTriangle size={12} className="text-red-500" strokeWidth={2} />
                            <p className="text-xs text-red-600 font-inter font-semibold">Vom Studio storniert</p>
                          </div>
                        )}

                        <p className="text-sm text-zinc-500 font-inter">
                          {booking.start_time} – {booking.end_time}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-zinc-400 font-inter flex items-center gap-1">
                            {booking.booking_type === "video_consultation"
                              ? <Video size={11} strokeWidth={1.5} />
                              : booking.booking_type === "consultation"
                              ? <MessageSquare size={11} strokeWidth={1.5} />
                              : <Scissors size={11} strokeWidth={1.5} />}
                            {booking.booking_type === "video_consultation"
                              ? "Videoberatung"
                              : booking.booking_type === "consultation"
                              ? "Beratung"
                              : "Tattoo-Session"}
                          </span>
                          {booking.payment_status === "paid" && (
                            <span className="text-xs text-emerald-600 font-inter font-semibold flex items-center gap-1">
                              <CheckCircle size={10} strokeWidth={2} /> Bezahlt
                            </span>
                          )}
                        </div>

                        {/* Actions – unterhalb, flex-wrap für Mobile */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        {/* VIDEO CONSULTATION HIDDEN – auskommentiert bis Feature wieder aktiviert wird
                        {booking.booking_type === "video_consultation" && !isPast && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {booking.status === "confirmed" ? (
                              <>
                                <button
                                  onClick={() => setVideoCallBooking(booking)}
                                  className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-inter rounded-full flex items-center gap-1.5 hover:bg-zinc-700 transition-colors whitespace-nowrap"
                                  data-testid={`video-join-btn-${booking.booking_id}`}
                                >
                                  <Video size={11} strokeWidth={1.5} /> Video beitreten
                                </button>
                                <VideoCountdownTimer
                                  booking={booking}
                                  onAutoCancel={fetchStats}
                                />
                              </>
                            ) : (
                              <span className="px-2.5 py-1 bg-zinc-100 text-zinc-500 text-xs font-inter rounded-full flex items-center gap-1 whitespace-nowrap">
                                <Video size={10} strokeWidth={1.5} /> Videoberatung
                              </span>
                            )}
                          </div>
                        )}
                        */}

                        {booking.deposit_required && booking.status === "pending" && booking.payment_status !== "paid" && (
                          <button onClick={() => handlePayDeposit(booking)}
                            className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-inter rounded-full flex items-center gap-1.5 hover:bg-zinc-700 transition-colors whitespace-nowrap"
                            data-testid={`pay-deposit-btn-${booking.booking_id}`}
                          >
                            <CreditCard size={11} strokeWidth={1.5} /> Anzahlung
                          </button>
                        )}

                        {/* Umbuchen + Absagen: nur wenn Termin NOCH nicht abgelaufen */}
                        {["pending", "confirmed"].includes(booking.status) && !isPast && (
                          <button onClick={() => handleOpenReschedule(booking)}
                            className="px-3 py-1.5 border border-zinc-200 text-xs font-inter text-zinc-600 rounded-full flex items-center gap-1.5 hover:border-zinc-900 hover:text-zinc-900 transition-all whitespace-nowrap"
                            data-testid={`reschedule-btn-${booking.booking_id}`}
                          >
                            <RefreshCw size={11} strokeWidth={1.5} /> Umbuchen
                          </button>
                        )}
                        {["pending", "confirmed"].includes(booking.status) && !isPast && (
                          <button onClick={() => handleCancelBooking(booking.booking_id)}
                            disabled={cancelLoading === booking.booking_id}
                            className="px-3 py-1.5 border border-zinc-200 text-xs font-inter text-zinc-500 rounded-full hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                            data-testid={`cancel-booking-btn-${booking.booking_id}`}
                          >
                            {cancelLoading === booking.booking_id ? "..." : "Absagen"}
                          </button>
                        )}

                        {/* Bewerten */}
                        {booking.status === "confirmed" && !reviewedBookingIds.has(booking.booking_id) && (
                          <button
                            onClick={() => {
                              if (isPast) setReviewBooking(booking);
                              else setNotYetPopup(true);
                            }}
                            className={`px-3 py-1.5 text-xs font-inter rounded-full flex items-center gap-1 transition-all ${
                              isPast
                                ? "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"
                                : "border border-zinc-200 text-zinc-400 cursor-pointer hover:border-zinc-300"
                            }`}
                            data-testid={`review-btn-${booking.booking_id}`}
                          >
                            <Star size={11} strokeWidth={2} className={isPast ? "fill-amber-400 text-amber-400" : "text-zinc-300"} /> Bewerten
                          </button>
                        )}
                        {reviewedBookingIds.has(booking.booking_id) && (
                          <span className="text-xs text-zinc-400 font-inter flex items-center gap-1">
                            <CheckCircle size={11} className="text-emerald-500" strokeWidth={2} /> Bewertet
                          </span>
                        )}
                        </div>{/* end actions flex-wrap */}
                      </div>{/* end content flex-1 */}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Review Reminder Popup */}
      <AnimatePresence>
        {reviewReminderBooking && !reviewBooking && (
          <ReviewReminderPopup
            booking={reviewReminderBooking}
            onDismiss={() => dismissReminder(reviewReminderBooking.booking_id)}
            onReview={() => {
              const b = reviewReminderBooking;
              dismissReminder(b.booking_id);
              setReviewBooking(b);
            }}
          />
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewBooking && (
          <ReviewModal
            booking={reviewBooking}
            onClose={() => setReviewBooking(null)}
            onSubmitted={() => {
              setReviewedBookingIds(prev => new Set([...prev, reviewBooking.booking_id]));
              fetchStats();
            }}
          />
        )}
      </AnimatePresence>

      {/* Reschedule Modal */}      <AnimatePresence>
        {rescheduleBooking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
            data-testid="reschedule-modal"
            onClick={(e) => e.target === e.currentTarget && setRescheduleBooking(null)}
          >
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="font-playfair font-semibold text-lg text-zinc-900">Termin umbuchen</h3>
                <button onClick={() => setRescheduleBooking(null)} className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 transition-colors">
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>
              <div className="p-6">
                <div className="bg-zinc-50 rounded-xl p-3.5 mb-5 text-sm font-inter text-zinc-600">
                  Aktuell: <strong className="text-zinc-900">{rescheduleBooking.date ? new Date(rescheduleBooking.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""}</strong> um <strong className="text-zinc-900">{rescheduleBooking.start_time}</strong> · {rescheduleBooking.studio_name}
                </div>

                <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2.5">Neues Datum</p>
                <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5">
                  {getDates().map(d => {
                    const dateObj = new Date(d + "T12:00:00");
                    return (
                      <button key={d} onClick={() => handleRescheduleDate(d)}
                        className={`flex-shrink-0 w-12 py-2.5 text-center rounded-xl border transition-all ${rescheduleDate === d ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 hover:border-zinc-400"}`}
                        data-testid={`reschedule-date-${d}`}
                      >
                        <div className="text-xs font-inter font-semibold">{dateObj.toLocaleDateString("de-DE", { day: "2-digit" })}</div>
                        <div className="text-xs opacity-60">{dateObj.toLocaleDateString("de-DE", { month: "short" })}</div>
                      </button>
                    );
                  })}
                </div>

                {rescheduleDate && (
                  <div>
                    <p className="text-xs font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2.5">Freie Slots</p>
                    {rescheduleSlots.length === 0 ? (
                      <p className="text-sm text-zinc-400 font-inter py-2">Keine freien Slots an diesem Tag</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {rescheduleSlots.map(slot => (
                          <button key={slot.slot_id} onClick={() => handleReschedule(slot.slot_id)} disabled={rescheduleLoading}
                            className="py-2.5 border border-zinc-200 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 text-sm font-inter rounded-xl transition-all disabled:opacity-50"
                            data-testid={`reschedule-slot-${slot.slot_id}`}
                          >
                            {slot.start_time} – {slot.end_time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Not Yet Review Popup */}
      <AnimatePresence>
        {notYetPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setNotYetPopup(false)}
            data-testid="not-yet-popup"
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock size={22} className="text-amber-600" strokeWidth={1.5} />
              </div>
              <h3 className="font-playfair font-semibold text-lg text-zinc-900 text-center mb-2">Noch nicht möglich</h3>
              <p className="text-sm text-zinc-500 font-inter text-center mb-5">
                Du kannst deinen Termin erst bewerten, sobald er abgeschlossen ist – also nach der Endzeit des Termins.
              </p>
              <button onClick={() => setNotYetPopup(false)}
                className="w-full py-2.5 bg-zinc-900 text-white rounded-xl font-inter font-medium text-sm hover:bg-zinc-700 transition-colors"
                data-testid="not-yet-close-btn"
              >
                Verstanden
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIDEO CONSULTATION HIDDEN – auskommentiert bis Feature wieder aktiviert wird
      {videoCallBooking && (
        <VideoCallModal
          booking={videoCallBooking}
          userRole="customer"
          onClose={() => setVideoCallBooking(null)}
        />
      )}
      */}

      <AnimatePresence>
        {paymentSession && (
          <PaymentModal
            session={paymentSession}
            onClose={() => setPaymentSession(null)}
            onSuccess={() => { setPaymentSession(null); fetchStats(); }}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
