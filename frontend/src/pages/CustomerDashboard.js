import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Calendar, Clock, CheckCircle, XCircle, CreditCard, RefreshCw, AlertTriangle, Scissors, X, Search, Star, HelpCircle, Video, Settings, ChevronRight, Heart, Bell, PenLine, Camera, ChevronDown, ChevronUp } from "lucide-react";
import StudioCard from "../components/StudioCard";
import VideoCallModal from "../components/VideoCallModal";
import VideoCountdownTimer from "../components/VideoCountdownTimer";
import PaymentModal from "../components/PaymentModal";
import DashboardHeroSmoke from "../components/DashboardHeroSmoke";
import BorderGlow from "../components/BorderGlow/BorderGlow";
import { motion, AnimatePresence } from "framer-motion";
import { notify } from "../components/InkNotify";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function DepositCountdown({ deadlineAt }) {
  const [remaining, setRemaining] = React.useState(null);
  const [urgent, setUrgent] = React.useState(false);
  const [expired, setExpired] = React.useState(false);
  React.useEffect(() => {
    const calc = () => {
      const diff = new Date(deadlineAt) - Date.now();
      if (diff <= 0) { setExpired(true); setRemaining(null); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setUrgent(diff < 5 * 60000);
      setRemaining(`${m}:${String(s).padStart(2, "0")}`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [deadlineAt]);
  if (expired) return (
    <span className="inline-flex items-center gap-1 text-[11px] font-inter font-semibold px-2.5 py-1 rounded-full border bg-red-50 text-red-600 border-red-200">
      ⏱ Frist abgelaufen
    </span>
  );
  if (!remaining) return null;
  return (
    <div className={`flex items-center gap-1.5 rounded-xl px-3 py-2 border text-xs font-inter font-medium w-full ${urgent ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
      <span className={`text-sm ${urgent ? "animate-pulse" : ""}`}>⏳</span>
      <span>Zahle in <strong>{remaining} Min.</strong> an — sonst verfällt dein Termin automatisch</span>
    </div>
  );
}

const statusConfig = {
  pending:               { label: "Ausstehend",           cls: "bg-amber-50 text-amber-700 border-amber-200" },
  pending_studio_review: { label: "In Bearbeitung",       cls: "bg-amber-50 text-amber-700 border-amber-200" },
  under_review:          { label: "Wird geprüft",         cls: "bg-blue-50 text-blue-700 border-blue-200" },
  offer_sent:            { label: "Angebot wartet",       cls: "bg-violet-50 text-violet-700 border-violet-200" },
  waiting_for_deposit:   { label: "Anzahlung fällig",     cls: "bg-orange-50 text-orange-700 border-orange-200" },
  deposit_pending:       { label: "Zahlung läuft",        cls: "bg-orange-50 text-orange-600 border-orange-200" },
  confirmed:             { label: "Bestätigt",            cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled:             { label: "Storniert",            cls: "bg-red-50 text-red-700 border-red-200" },
  customer_cancelled:    { label: "Von dir storniert",    cls: "bg-red-50 text-red-700 border-red-200" },
  studio_cancelled:      { label: "Vom Studio storniert", cls: "bg-red-50 text-red-700 border-red-200" },
  completed:             { label: "Abgeschlossen",        cls: "bg-zinc-100 text-zinc-500 border-zinc-200" },
  no_show:               { label: "Nicht erschienen",     cls: "bg-zinc-100 text-zinc-500 border-zinc-200" },
};
const ACTIVE_STATUSES = ["pending","pending_studio_review","under_review","offer_sent","waiting_for_deposit","deposit_pending","confirmed"];
const CLOSED_STATUSES = ["cancelled","customer_cancelled","studio_cancelled","completed","no_show"];

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
      className="fixed left-1/2 -translate-x-1/2 w-full max-w-sm z-40 px-4"
      style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
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
  const [cancelModal, setCancelModal] = useState(null);
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
  const [acceptingOffer, setAcceptingOffer] = useState("");
  const [favoriteStudios, setFavoriteStudios] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [bookingPhotosMap, setBookingPhotosMap] = useState({});
  const [expandedPhotos, setExpandedPhotos] = useState(new Set());

  const fetchBookingPhotos = async (bookingId) => {
    if (bookingPhotosMap[bookingId] !== undefined) return;
    setBookingPhotosMap(prev => ({ ...prev, [bookingId]: null }));
    try {
      const { data } = await axios.get(`${API}/bookings/${bookingId}/photos`, { withCredentials: true });
      setBookingPhotosMap(prev => ({ ...prev, [bookingId]: data.photos || [] }));
    } catch {
      setBookingPhotosMap(prev => ({ ...prev, [bookingId]: [] }));
    }
  };

  const togglePhotos = (bookingId) => {
    setExpandedPhotos(prev => {
      const next = new Set(prev);
      if (next.has(bookingId)) { next.delete(bookingId); }
      else { next.add(bookingId); fetchBookingPhotos(bookingId); }
      return next;
    });
  };

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

  const fetchFavorites = async () => {
    setFavoritesLoading(true);
    try {
      const { data } = await axios.get(`${API}/favorites/studios`, { withCredentials: true });
      setFavoriteStudios(data || []);
    } catch {
      setFavoriteStudios([]);
    } finally {
      setFavoritesLoading(false);
    }
  };

  const fetchWaitlist = async () => {
    setWaitlistLoading(true);
    try {
      const { data } = await axios.get(`${API}/waitlist/my`, { withCredentials: true });
      setWaitlistEntries(data?.entries || []);
    } catch {
      setWaitlistEntries([]);
    } finally {
      setWaitlistLoading(false);
    }
  };

  const cancelWaitlistEntry = async (waitlistId) => {
    try {
      await axios.delete(`${API}/waitlist/${waitlistId}`, { withCredentials: true });
      setWaitlistEntries(prev => prev.filter(e => e.waitlist_id !== waitlistId));
    } catch {}
  };

  useEffect(() => {
    fetchStats();
    fetchMessages();
    fetchReviewedIds();
    fetchFavorites();
    fetchWaitlist();
    const pollInterval = setInterval(fetchStats, 8000);
    const msgInterval = setInterval(fetchMessages, 15000);
    const tickInterval = setInterval(() => setTick(t => t + 1), 60000);
    return () => { clearInterval(pollInterval); clearInterval(msgInterval); clearInterval(tickInterval); };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentType = params.get("payment");
    const sid = params.get("session_id");
    if (paymentType === "final_success" && sid) {
      window.history.replaceState({}, "", window.location.pathname);
      (async () => {
        try {
          await axios.post(`${API}/payments/confirm/${sid}`, {}, { withCredentials: true });
          notify.success("Zahlung erfolgreich! Dein Termin ist jetzt abgeschlossen.");
          fetchStats();
        } catch (e) {
          notify.info("Zahlung wurde bereits verarbeitet.");
        }
      })();
    }
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
    } catch (e) { notify.error(e.response?.data?.detail || "Zahlungsfehler"); }
  };

  const handleCancelBooking = (booking) => {
    const cancelHours = booking.studio_cancellation_hours;
    const depositAmount = parseFloat(booking.offer_deposit_amount || booking.deposit_amount || 0);
    let isWithinFreeWindow = true;
    if (cancelHours && booking.date) {
      const timeStr = booking.start_time || "12:00";
      const appointmentAt = new Date(`${booking.date}T${timeStr}:00`);
      const freeUntil = new Date(appointmentAt.getTime() - cancelHours * 3600 * 1000);
      isWithinFreeWindow = new Date() < freeUntil;
    }
    setCancelModal({ booking, cancelHours, depositAmount, isWithinFreeWindow });
  };

  const confirmCancelBooking = async () => {
    if (!cancelModal) return;
    const bookingId = cancelModal.booking.booking_id;
    setCancelLoading(bookingId);
    setCancelModal(null);
    try {
      await axios.put(`${API}/bookings/${bookingId}/status`, null, {
        params: { status: "customer_cancelled" }, withCredentials: true
      });
      fetchStats();
    } catch {} finally { setCancelLoading(""); }
  };

  const handleAcceptOffer = async (booking) => {
    setAcceptingOffer(booking.booking_id);
    try {
      const { data } = await axios.post(`${API}/bookings/${booking.booking_id}/accept-offer`, {}, { withCredentials: true });
      fetchStats();
      if (!data.is_free) {
        handlePayDeposit(booking);
      }
    } catch (e) {
      notify.error(e.response?.data?.detail || "Fehler beim Annehmen des Angebots");
    } finally { setAcceptingOffer(""); }
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
    } catch (e) { notify.error(e.response?.data?.detail || "Umbuchung fehlgeschlagen"); } finally { setRescheduleLoading(false); }
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

  // Today = confirmed bookings today, end_time not yet passed
  const todayBookings = allBookings
    .filter(b => ["confirmed"].includes(b.status) && isBookingToday(b) && !isBookingPast(b))
    .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
  // Upcoming = all active statuses (requests, offers, confirmed) that are not yet past
  const upcoming = allBookings
    .filter(b => ACTIVE_STATUSES.includes(b.status) && !isBookingPast(b))
    .sort((a, b) => {
      const da = a.offer_date || a.date || "";
      const db2 = b.offer_date || b.date || "";
      return da === db2 ? (a.start_time || "").localeCompare(b.start_time || "") : da.localeCompare(db2);
    });
  // Past = closed statuses OR active status with past date/time
  const past = allBookings.filter(b =>
    CLOSED_STATUSES.includes(b.status) ||
    (ACTIVE_STATUSES.includes(b.status) && isBookingPast(b))
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
                      <motion.div
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35, type: "spring", stiffness: 260, damping: 15 }}
                        className="select-none"
                        style={{ display: "inline-flex", alignItems: "center" }}
                      >
                        <motion.svg
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                          width="32" height="32" viewBox="0 0 32 32" fill="none"
                          style={{ display: "block" }}
                        >
                          {/* Body */}
                          <rect x="10" y="3" width="12" height="8" rx="3" fill="white" fillOpacity="0.9"/>
                          {/* Left coil */}
                          <circle cx="12.5" cy="8" r="2.5" fill="none" stroke="white" strokeWidth="1.4" strokeOpacity="0.6"/>
                          <circle cx="12.5" cy="8" r="1" fill="white" fillOpacity="0.8"/>
                          {/* Right coil */}
                          <circle cx="19.5" cy="8" r="2.5" fill="none" stroke="white" strokeWidth="1.4" strokeOpacity="0.6"/>
                          <circle cx="19.5" cy="8" r="1" fill="white" fillOpacity="0.8"/>
                          {/* Connector bar */}
                          <rect x="9" y="10.5" width="14" height="2" rx="1" fill="white" fillOpacity="0.5"/>
                          {/* Grip */}
                          <rect x="11" y="12.5" width="10" height="11" rx="2.5" fill="white" fillOpacity="0.85"/>
                          {/* Grip ridges */}
                          <line x1="11.5" y1="15" x2="20.5" y2="15" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8"/>
                          <line x1="11.5" y1="17.5" x2="20.5" y2="17.5" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8"/>
                          <line x1="11.5" y1="20" x2="20.5" y2="20" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8"/>
                          {/* Needle tube */}
                          <rect x="14.5" y="23.5" width="3" height="5" rx="1.5" fill="white" fillOpacity="0.7"/>
                          {/* Needle tip */}
                          <circle cx="16" cy="30" r="1" fill="white" fillOpacity="0.9"/>
                        </motion.svg>
                      </motion.div>
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

        {/* Consent Banner — shown when any confirmed booking needs the form */}
        {(() => {
          const pendingConsent = allBookings.filter(b =>
            b.consent_status === "required" && b.studio_consent_required
          );
          if (pendingConsent.length === 0) return null;
          return (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3"
              >
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <PenLine size={15} className="text-amber-600" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <p className="font-inter font-semibold text-amber-900 text-sm">Einverständniserklärung erforderlich</p>
                  {pendingConsent.map(b => (
                    <div key={b.booking_id} className="flex items-center gap-2 mt-1.5">
                      <p className="text-xs text-amber-700 font-inter flex-1">
                        {b.studio_name} · {b.date ? new Date(b.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""}
                      </p>
                      <Link
                        to={`/consent/${b.booking_id}`}
                        className="flex-shrink-0 text-xs font-inter font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900"
                      >
                        Jetzt ausfüllen →
                      </Link>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          );
        })()}

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


        {/* Bookings Tabs */}
        <div className="flex gap-1 mb-5 bg-white rounded-2xl border border-black/[0.04] shadow-[0_2px_10px_rgb(0,0,0,0.04)] p-1.5 w-fit max-w-full overflow-x-auto">
          {[
            { id: "today", label: `Heutige Termine (${todayBookings.length})` },
            { id: "upcoming", label: `${t("dashboard.upcoming")} (${upcoming.length})` },
            { id: "past", label: `${t("dashboard.past")} (${past.length})` },
            { id: "favorites", label: `Favoriten (${favoriteStudios.length})` },
            { id: "waitlist", label: `Warteliste (${waitlistEntries.length})` }
          ].map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === "favorites") fetchFavorites(); if (tab.id === "waitlist") fetchWaitlist(); }}
              className={`flex-shrink-0 px-5 py-2 rounded-xl text-sm font-inter font-medium transition-all ${activeTab === tab.id ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}`}
              data-testid={`${tab.id}-tab`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Favorites Tab Content */}
        {activeTab === "favorites" && (
          <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
            <AnimatePresence mode="wait">
              {favoritesLoading ? (
                <motion.div key="fav-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-3">
                      <div className="aspect-[4/3] bg-zinc-100 rounded-2xl animate-pulse" />
                      <div className="h-4 bg-zinc-100 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-zinc-100 rounded animate-pulse w-1/2" />
                    </div>
                  ))}
                </motion.div>
              ) : favoriteStudios.length === 0 ? (
                <motion.div key="fav-empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="py-20 flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-5">
                    <Heart size={26} className="text-zinc-300" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-playfair text-xl text-zinc-900 mb-1.5">Noch keine Favoriten</h3>
                  <p className="text-zinc-400 font-inter text-sm mb-7 text-center max-w-xs">
                    Klicke auf das Herz-Symbol auf einer Studio-Kachel, um sie hier zu speichern.
                  </p>
                  <Link to="/search" className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white text-sm font-inter rounded-full hover:bg-zinc-800 transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
                    <Search size={13} strokeWidth={1.5} /> Studios entdecken
                  </Link>
                </motion.div>
              ) : (
                <motion.div key="fav-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {favoriteStudios.map((studio, i) => (
                    <motion.div key={studio.studio_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <StudioCard
                        studio={studio}
                        index={i}
                        favorited={true}
                        onToggleFavorite={(sid, isFav) => {
                          if (!isFav) setFavoriteStudios(prev => prev.filter(s => s.studio_id !== sid));
                        }}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Waitlist Tab Content */}
        {activeTab === "waitlist" && (
          <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
            {waitlistLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-zinc-100 rounded-2xl animate-pulse" />)}</div>
            ) : waitlistEntries.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-5">
                  <Bell size={26} className="text-zinc-300" strokeWidth={1.5} />
                </div>
                <h3 className="font-playfair text-xl text-zinc-900 mb-1.5">Keine Wartelisten-Einträge</h3>
                <p className="text-zinc-400 font-inter text-sm text-center max-w-xs">
                  Wenn ein Wunschtermin ausgebucht ist, kannst du dich auf die Warteliste setzen und wirst benachrichtigt.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-playfair font-bold text-lg text-zinc-900 mb-4">Deine Wartelisten-Einträge</h3>
                {waitlistEntries.map(entry => {
                  const sizeLabel = { mini: "Mini", small: "Small", medium: "Medium", large: "Large", xl: "XL" }[entry.size_category] || entry.size_category;
                  const dateLabel = entry.date
                    ? new Date(entry.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })
                    : (() => { try { const [y,m] = entry.month.split("-"); return new Date(y,m-1,1).toLocaleDateString("de-DE",{month:"long",year:"numeric"}); } catch { return entry.month; } })();
                  return (
                    <div key={entry.waitlist_id} className={`rounded-2xl border p-4 flex items-start justify-between gap-4 ${entry.status === "notified" ? "bg-violet-50 border-violet-200" : "bg-zinc-50 border-zinc-200"}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-inter font-semibold text-sm text-zinc-900">{entry.studio_name}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${entry.status === "notified" ? "bg-violet-200 text-violet-800" : "bg-emerald-100 text-emerald-700"}`}>
                            {entry.status === "notified" ? "Benachrichtigt" : "Wartet"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs font-inter text-zinc-600">📅 {entry.date ? "Am" : "Im"} {dateLabel}</span>
                          <span className="text-xs font-inter text-zinc-600">📐 {sizeLabel}</span>
                        </div>
                        {entry.notes && <p className="text-xs text-zinc-400 font-inter mt-1 italic">"{entry.notes}"</p>}
                      </div>
                      {entry.status === "active" && (
                        <button onClick={() => cancelWaitlistEntry(entry.waitlist_id)}
                          className="flex-shrink-0 text-xs text-zinc-400 hover:text-red-500 font-inter transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
                          Abmelden
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Bookings List */}
        {activeTab !== "favorites" && activeTab !== "waitlist" && (
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
                  const isCancelledByStudio = booking.status === "studio_cancelled" || (booking.status === "cancelled" && booking.cancelled_by === "studio");
                  const isClosed = CLOSED_STATUSES.includes(booking.status);
                  const isOffer = booking.status === "offer_sent";
                  const needsDeposit = booking.status === "waiting_for_deposit" || (["pending","confirmed"].includes(booking.status) && booking.deposit_required && booking.payment_status !== "paid");
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
                        isClosed ? "bg-zinc-50 border-zinc-200" :
                        isPast ? "bg-zinc-200 border-zinc-200" :
                        isOffer ? "bg-violet-600 border-violet-600" :
                        "bg-zinc-900 border-zinc-900"
                      }`}>
                        <p className={`text-lg font-playfair font-bold leading-none ${isClosed || isPast ? "text-zinc-400" : "text-white"}`}>
                          {(booking.offer_date || booking.date) ? new Date((booking.offer_date || booking.date) + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit" }) : "—"}
                        </p>
                        <p className={`text-xs font-inter leading-none mt-0.5 ${isClosed || isPast ? "text-zinc-400" : "text-zinc-300"}`}>
                          {(booking.offer_date || booking.date) ? new Date((booking.offer_date || booking.date) + "T12:00:00").toLocaleDateString("de-DE", { month: "short" }) : ""}
                        </p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`font-playfair font-semibold text-base break-words leading-snug ${isClosed ? "text-zinc-400 line-through" : "text-zinc-900"}`}>
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
                          {booking.offer_time
                            ? `${booking.offer_time} Uhr · ${((booking.offer_duration_min || 120) / 60).toLocaleString('de-DE')} Std.`
                            : booking.start_time
                            ? `${booking.start_time} – ${booking.end_time}`
                            : "Anfrage wird geprüft"}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-zinc-400 font-inter flex items-center gap-1">
                            <Scissors size={11} strokeWidth={1.5} />
                            {booking.booking_type === "video_consultation" ? "Videoberatung" : booking.booking_type === "consultation" ? "Beratung" : "Tattoo-Session"}
                          </span>
                          {booking.payment_status === "paid" && (
                            <span className="text-xs text-emerald-600 font-inter font-semibold flex items-center gap-1">
                              <CheckCircle size={10} strokeWidth={2} /> Bezahlt
                            </span>
                          )}
                        </div>

                        {/* Offer details card */}
                        {isOffer && (
                          <div className="mt-2.5 bg-violet-50 border border-violet-200 rounded-xl p-3">
                            <p className="text-xs font-inter font-semibold text-violet-800 mb-1.5">🎨 Studio-Angebot erhalten</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-inter text-violet-700">
                              {booking.artist_name && <><span>Artist</span><span className="font-semibold">🎨 {booking.artist_name}</span></>}
                              <span>Datum</span><span className="font-semibold">{booking.offer_date ? new Date(booking.offer_date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" }) : "–"}</span>
                              <span>Uhrzeit</span><span className="font-semibold">{booking.offer_time ? `${booking.offer_time} Uhr` : "–"}</span>
                              <span>Gesamtpreis</span><span className="font-semibold">{booking.offer_total_price ? `€ ${parseFloat(booking.offer_total_price).toLocaleString("de-DE", { minimumFractionDigits: 2 })}` : "–"}</span>
                              <span>Anzahlung</span><span className="font-semibold">{booking.offer_deposit_amount ? `€ ${parseFloat(booking.offer_deposit_amount).toLocaleString("de-DE", { minimumFractionDigits: 2 })}` : "–"}</span>
                            </div>
                            {booking.offer_notes && <p className="text-xs font-inter text-violet-600 mt-1.5 italic">"{booking.offer_notes}"</p>}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">

                        {/* Accept offer + pay deposit */}
                        {isOffer && !isPast && (
                          <div className="w-full flex flex-col gap-2">
                            {booking.deposit_deadline_at && (
                              <DepositCountdown deadlineAt={booking.deposit_deadline_at} />
                            )}
                            <button onClick={() => handleAcceptOffer(booking)}
                              disabled={acceptingOffer === booking.booking_id}
                              className="px-3 py-1.5 bg-violet-600 text-white text-xs font-inter rounded-full flex items-center gap-1.5 hover:bg-violet-700 transition-colors whitespace-nowrap disabled:opacity-50 self-start"
                              data-testid={`accept-offer-btn-${booking.booking_id}`}
                            >
                              <CheckCircle size={11} strokeWidth={1.5} /> {acceptingOffer === booking.booking_id ? "..." : "Angebot annehmen & bezahlen"}
                            </button>
                          </div>
                        )}

                        {/* Regular deposit payment */}
                        {needsDeposit && !isOffer && booking.payment_status !== "paid" && (
                          <div className="w-full flex flex-col gap-2">
                            {booking.deposit_deadline_at && (
                              <DepositCountdown deadlineAt={booking.deposit_deadline_at} />
                            )}
                            <button onClick={() => handlePayDeposit(booking)}
                              className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-inter rounded-full flex items-center gap-1.5 hover:bg-zinc-700 transition-colors whitespace-nowrap self-start"
                              data-testid={`pay-deposit-btn-${booking.booking_id}`}
                            >
                              <CreditCard size={11} strokeWidth={1.5} /> Jetzt Anzahlung bezahlen
                            </button>
                          </div>
                        )}

                        {/* Reschedule: only for confirmed slot bookings */}
                        {booking.status === "confirmed" && !isPast && (
                          <button onClick={() => handleOpenReschedule(booking)}
                            className="px-3 py-1.5 border border-zinc-200 text-xs font-inter text-zinc-600 rounded-full flex items-center gap-1.5 hover:border-zinc-900 hover:text-zinc-900 transition-all whitespace-nowrap"
                            data-testid={`reschedule-btn-${booking.booking_id}`}
                          >
                            <RefreshCw size={11} strokeWidth={1.5} /> Umbuchen
                          </button>
                        )}
                        {ACTIVE_STATUSES.includes(booking.status) && !isPast && (
                          <button onClick={() => handleCancelBooking(booking)}
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

                        {/* Consent form badge */}
                        {booking.consent_status === "submitted" && (
                          <span className="text-xs text-emerald-700 font-inter font-medium flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <CheckCircle size={11} strokeWidth={2} className="text-emerald-500" /> Einverständnis eingereicht
                          </span>
                        )}
                        {booking.consent_status === "required" && booking.studio_consent_required && !isClosed && (
                          <Link
                            to={`/consent/${booking.booking_id}`}
                            className="text-xs font-inter font-semibold flex items-center gap-1 bg-amber-50 border border-amber-300 text-amber-800 px-2.5 py-1 rounded-full hover:bg-amber-100 transition-colors"
                          >
                            <PenLine size={11} strokeWidth={2} /> Formular ausfüllen →
                          </Link>
                        )}
                        </div>{/* end actions flex-wrap */}

                        {/* Photos section — shown for past/completed bookings that have studio-uploaded photos */}
                        {(booking.photos_count > 0) && (isPast || isClosed) && (
                          <div className="mt-3 border-t border-zinc-100 pt-3">
                            <button
                              onClick={() => togglePhotos(booking.booking_id)}
                              className="flex items-center gap-1.5 text-xs font-inter text-zinc-500 hover:text-zinc-800 transition-colors"
                            >
                              <Camera size={11} strokeWidth={1.5} />
                              {booking.photos_count} {booking.photos_count === 1 ? "Foto" : "Fotos"} vom Studio
                              {expandedPhotos.has(booking.booking_id) ? <ChevronUp size={11} strokeWidth={2} /> : <ChevronDown size={11} strokeWidth={2} />}
                            </button>
                            <AnimatePresence>
                              {expandedPhotos.has(booking.booking_id) && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                  <div className="pt-3">
                                    {bookingPhotosMap[booking.booking_id] === null ? (
                                      <div className="flex gap-2">
                                        {[1,2,3].map(i => <div key={i} className="w-20 h-20 rounded-xl bg-zinc-100 animate-pulse" />)}
                                      </div>
                                    ) : (bookingPhotosMap[booking.booking_id] || []).length === 0 ? (
                                      <p className="text-xs text-zinc-400 font-inter">Keine Fotos vorhanden.</p>
                                    ) : (
                                      <div className="flex gap-2 flex-wrap">
                                        {(bookingPhotosMap[booking.booking_id] || []).map(ph => {
                                          const lblMap = { before: "Vorher", after: "Nachher", healed: "Verheilt" };
                                          return (
                                            <div key={ph.photo_id} className="relative group">
                                              <img src={ph.photo_data} alt={ph.label}
                                                className="w-20 h-20 object-cover rounded-xl border border-zinc-200 cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => window.open(ph.photo_data, "_blank")}
                                              />
                                              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-inter font-semibold px-1.5 py-0.5 rounded-full">
                                                {lblMap[ph.label] || ph.label}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>{/* end content flex-1 */}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}
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

      {/* ── Stornierung Bestätigungs-Modal ── */}
      <AnimatePresence>
        {cancelModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setCancelModal(null)}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ type: "spring", stiffness: 300, damping: 28 }} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cancelModal.cancelHours && !cancelModal.isWithinFreeWindow ? "bg-red-100" : "bg-zinc-100"}`}>
                  <AlertTriangle size={18} className={cancelModal.cancelHours && !cancelModal.isWithinFreeWindow ? "text-red-600" : "text-zinc-600"} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-inter font-semibold text-zinc-900 text-base">Termin absagen</h3>
                  <p className="text-xs text-zinc-500 font-inter">{cancelModal.booking.studio_name}</p>
                </div>
              </div>

              {cancelModal.cancelHours ? (
                cancelModal.isWithinFreeWindow ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-5">
                    <p className="text-sm font-inter font-semibold text-emerald-800 mb-1">Kostenlose Stornierung möglich ✓</p>
                    <p className="text-xs text-emerald-700 font-inter leading-relaxed">
                      Du stornierst innerhalb der kostenlosen Frist.
                      {cancelModal.depositAmount > 0
                        ? ` Deine Anzahlung von €\u202F${cancelModal.depositAmount.toFixed(2)} wird zurückerstattet.`
                        : " Es fallen keine Gebühren an."}
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
                    <p className="text-sm font-inter font-semibold text-red-800 mb-1">Stornierungsfrist abgelaufen</p>
                    <p className="text-xs text-red-700 font-inter leading-relaxed">
                      Die kostenlose Stornierungsfrist ({cancelModal.cancelHours >= 24 ? `${cancelModal.cancelHours / 24} Tag${cancelModal.cancelHours >= 48 ? "e" : ""}` : `${cancelModal.cancelHours} Stunden`} vor dem Termin) ist abgelaufen.
                      {cancelModal.depositAmount > 0
                        ? ` Deine Anzahlung von €\u202F${cancelModal.depositAmount.toFixed(2)} wird einbehalten.`
                        : " Die Stornierung ist gebührenfrei."}
                    </p>
                  </div>
                )
              ) : (
                <p className="text-sm font-inter text-zinc-500 mb-5 leading-relaxed">Diese Aktion kann nicht rückgängig gemacht werden.</p>
              )}

              <div className="flex gap-3">
                <button onClick={() => setCancelModal(null)} className="flex-1 py-2.5 border border-zinc-200 text-sm font-inter text-zinc-600 rounded-xl hover:bg-zinc-50 transition-colors">
                  Zurück
                </button>
                <button onClick={confirmCancelBooking} className="flex-1 py-2.5 bg-red-600 text-white text-sm font-inter font-semibold rounded-xl hover:bg-red-700 transition-colors">
                  Ja, absagen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
