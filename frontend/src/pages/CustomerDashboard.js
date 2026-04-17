import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Calendar, MessageSquare, Clock, CheckCircle, XCircle, CreditCard, RefreshCw, AlertTriangle, Scissors, X, Search, Sparkles, Star } from "lucide-react";
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

export default function CustomerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [paymentSessionId, setPaymentSessionId] = useState(null);
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
  const [notYetPopup, setNotYetPopup] = useState(false);
  const [tick, setTick] = useState(0); // forces re-render every minute for live time checks

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    if (sessionId) setPaymentSessionId(sessionId);
    fetchStats();
    // Poll every 30s for live updates
    const pollInterval = setInterval(fetchStats, 30000);
    // Re-evaluate time every 60s
    const tickInterval = setInterval(() => setTick(t => t + 1), 60000);
    return () => { clearInterval(pollInterval); clearInterval(tickInterval); };
  }, []);

  useEffect(() => {
    if (paymentSessionId) pollPaymentStatus(paymentSessionId);
  }, [paymentSessionId]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    if (attempts >= 5) return;
    try {
      const { data } = await axios.get(`${API}/payments/status/${sessionId}`, { withCredentials: true });
      if (data.payment_status === "paid") fetchStats();
      else setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
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
      window.location.href = data.url;
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

  const today = new Date().toISOString().split("T")[0];
  const now = new Date();

  // Helper: has the appointment's end time already passed?
  const isBookingPast = (b) => {
    if (!b.date || !b.end_time) return false;
    return now > new Date(`${b.date}T${b.end_time}:00`);
  };
  const isBookingToday = (b) => b.date === today;

  const allBookings = stats?.all_bookings || [];

  // Today = pending/confirmed, today's date, end_time not yet passed
  const todayBookings = allBookings.filter(b =>
    ["pending", "confirmed"].includes(b.status) && isBookingToday(b) && !isBookingPast(b)
  );
  // Upcoming = pending/confirmed, future date (after today), not past
  const upcoming = allBookings.filter(b =>
    ["pending", "confirmed"].includes(b.status) && b.date > today
  );
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
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-xs tracking-[0.2em] uppercase text-zinc-400 font-inter mb-1">Mein Konto</p>
          <h1 className="text-3xl font-playfair font-semibold text-zinc-900">Hallo, {user?.name?.split(" ")[0]} 👋</h1>
        </motion.div>

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
                <Link to="/" className="text-xs text-red-700 font-inter font-semibold underline underline-offset-2 mt-1.5 inline-block">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Buchungen gesamt", value: stats?.total_bookings || 0, icon: Calendar, color: "text-zinc-400" },
            { label: "Ausstehend", value: upcoming.filter(b => b.status === "pending").length, icon: Clock, color: "text-amber-400" },
            { label: "Bestätigt", value: upcoming.filter(b => b.status === "confirmed").length, icon: CheckCircle, color: "text-emerald-400" },
            { label: "Storniert", value: allBookings.filter(b => b.status === "cancelled").length, icon: XCircle, color: "text-red-400" }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-4"
              >
                <Icon size={16} strokeWidth={1.5} className={`${stat.color} mb-2`} />
                <p className="text-2xl font-playfair font-semibold text-zinc-900">{stat.value}</p>
                <p className="text-xs text-zinc-500 font-inter mt-0.5">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Link to="/" className="bg-zinc-900 text-white p-5 rounded-2xl flex items-center justify-between hover:bg-zinc-700 transition-all group" data-testid="find-studio-btn">
            <div>
              <p className="text-xs tracking-[0.15em] uppercase opacity-50 font-inter mb-1">Neu buchen</p>
              <p className="font-playfair font-semibold text-base">Studio finden</p>
            </div>
            <Search size={20} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
          </Link>
          <Link to="/ai-advisor" className="bg-white border border-zinc-200 p-5 rounded-2xl flex items-center justify-between hover:border-zinc-400 transition-all group" data-testid="ai-advisor-btn">
            <div>
              <p className="text-xs tracking-[0.15em] uppercase text-zinc-400 font-inter mb-1">KI-Beratung</p>
              <p className="font-playfair font-semibold text-zinc-900 text-base">Stilberatung</p>
            </div>
            <Sparkles size={20} className="text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
          </Link>
          <Link to="/messages" className="bg-white border border-zinc-200 p-5 rounded-2xl flex items-center justify-between hover:border-zinc-400 transition-all group" data-testid="messages-btn">
            <div>
              <p className="text-xs tracking-[0.15em] uppercase text-zinc-400 font-inter mb-1">Chat</p>
              <p className="font-playfair font-semibold text-zinc-900 text-base">Nachrichten</p>
            </div>
            <MessageSquare size={20} className="text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
          </Link>
        </div>

        {/* Bookings Tabs */}
        <div className="flex gap-1 mb-5 bg-white rounded-2xl border border-black/[0.04] shadow-[0_2px_10px_rgb(0,0,0,0.04)] p-1.5 w-fit overflow-x-auto">
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
              <div className="py-14 text-center" data-testid="no-bookings">
                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Calendar size={20} className="text-zinc-400" strokeWidth={1.5} />
                </div>
                <p className="text-zinc-500 font-inter text-sm">
                  {activeTab === "today" ? "Keine heutigen Termine" : t("dashboard.noBookings")}
                </p>
                {activeTab === "upcoming" && (
                  <Link to="/" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white text-sm font-inter rounded-full hover:bg-zinc-700 transition-colors">
                    <Search size={13} strokeWidth={1.5} /> Studio finden
                  </Link>
                )}
              </div>
            ) : (
              <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="divide-y divide-zinc-50">
                {(activeTab === "today" ? todayBookings : activeTab === "upcoming" ? upcoming : past).map((booking, i) => {
                  const isPast = isBookingPast(booking);
                  const sc = statusConfig[isPast && booking.status === "confirmed" ? "completed" : booking.status] || statusConfig.pending;
                  const isCancelledByStudio = booking.status === "cancelled" && booking.cancelled_by === "studio";
                  return (
                    <motion.div key={booking.booking_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className={`p-5 flex items-start gap-4 hover:bg-zinc-50 transition-colors group ${isCancelledByStudio ? "bg-red-50/30" : ""}`}
                      data-testid={`booking-item-${booking.booking_id}`}
                    >
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
                          <h4 className={`font-playfair font-semibold text-base truncate ${booking.status === "cancelled" ? "text-zinc-400 line-through" : "text-zinc-900"}`}>
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
                            {booking.booking_type === "consultation" ? <MessageSquare size={11} strokeWidth={1.5} /> : <Scissors size={11} strokeWidth={1.5} />}
                            {booking.booking_type === "consultation" ? "Beratung" : "Tattoo-Session"}
                          </span>
                          {booking.payment_status === "paid" && (
                            <span className="text-xs text-emerald-600 font-inter font-semibold flex items-center gap-1">
                              <CheckCircle size={10} strokeWidth={2} /> Bezahlt
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {booking.status === "pending" && booking.payment_status !== "paid" && (
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
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

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

      <Footer />
    </div>
  );
}
