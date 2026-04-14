import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Calendar, MessageSquare, TrendingUp, Clock, CheckCircle, XCircle, CreditCard, ChevronRight, RefreshCw } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusColors = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  completed: "bg-gray-50 text-gray-700 border-gray-200"
};
const statusLabels = {
  pending: "Ausstehend",
  confirmed: "Bestätigt",
  cancelled: "Abgesagt",
  completed: "Abgeschlossen"
};

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

  useEffect(() => {
    // Check for payment return
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    const paymentStatus = urlParams.get("payment");
    if (sessionId) setPaymentSessionId(sessionId);
    
    fetchStats();
  }, []);

  useEffect(() => {
    if (paymentSessionId) {
      pollPaymentStatus(paymentSessionId);
    }
  }, [paymentSessionId]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    if (attempts >= 5) return;
    try {
      const { data } = await axios.get(`${API}/payments/status/${sessionId}`, { withCredentials: true });
      if (data.payment_status === "paid") {
        fetchStats();
      } else {
        setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
      }
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API}/dashboard/stats`, { withCredentials: true });
      setStats(data);
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handlePayDeposit = async (booking) => {
    try {
      const { data } = await axios.post(`${API}/payments/create-session`, {
        booking_id: booking.booking_id,
        origin_url: window.location.origin
      }, { withCredentials: true });
      window.location.href = data.url;
    } catch (e) {
      alert(e.response?.data?.detail || "Zahlungsfehler");
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Buchung wirklich absagen?")) return;
    try {
      await axios.put(`${API}/bookings/${bookingId}/status`, null, {
        params: { status: "cancelled" },
        withCredentials: true
      });
      fetchStats();
    } catch {}
  };

  const handleOpenReschedule = async (booking) => {
    setRescheduleBooking(booking);
    setRescheduleDate("");
    setRescheduleSlots([]);
  };

  const handleRescheduleDate = async (date) => {
    setRescheduleDate(date);
    try {
      const { data } = await axios.get(`${API}/studios/${rescheduleBooking.studio_id}/slots`, { params: { date } });
      setRescheduleSlots(data);
    } catch {}
  };

  const handleReschedule = async (newSlotId) => {
    setRescheduleLoading(true);
    try {
      await axios.put(`${API}/bookings/${rescheduleBooking.booking_id}/reschedule`, { new_slot_id: newSlotId }, { withCredentials: true });
      setRescheduleBooking(null);
      fetchStats();
    } catch (e) {
      alert(e.response?.data?.detail || "Umbuchung fehlgeschlagen");
    } finally { setRescheduleLoading(false); }
  };

  const getDates = () => {
    const dates = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  };

  const allBookings = stats?.all_bookings || [];
  const upcoming = allBookings.filter(b => ["pending", "confirmed"].includes(b.status));
  const past = allBookings.filter(b => ["cancelled", "completed"].includes(b.status));

  if (loading) return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs tracking-widest uppercase text-gray-400 font-outfit mb-1">Dashboard</p>
          <h1 className="text-3xl font-playfair font-bold text-black">Hallo, {user?.name?.split(" ")[0]}</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Buchungen gesamt", value: stats?.total_bookings || 0, icon: <Calendar size={18} /> },
            { label: "Ausstehend", value: upcoming.length, icon: <Clock size={18} /> },
            { label: "Bestätigt", value: upcoming.filter(b => b.status === "confirmed").length, icon: <CheckCircle size={18} /> },
            { label: "Abgesagt", value: allBookings.filter(b => b.status === "cancelled").length, icon: <XCircle size={18} /> }
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">{stat.icon}<span className="text-xs font-outfit">{stat.label}</span></div>
              <p className="text-2xl font-playfair font-bold text-black">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/search" className="bg-black text-white p-5 flex items-center justify-between hover:bg-neutral-800 transition-colors group" data-testid="find-studio-btn">
            <div>
              <p className="text-xs tracking-widest uppercase opacity-60 font-outfit mb-1">Neu buchen</p>
              <p className="font-playfair font-semibold">Studio finden</p>
            </div>
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/ai-advisor" className="bg-white border border-gray-200 p-5 flex items-center justify-between hover:border-black transition-colors group" data-testid="ai-advisor-btn">
            <div>
              <p className="text-xs tracking-widest uppercase text-gray-400 font-outfit mb-1">KI-Beratung</p>
              <p className="font-playfair font-semibold">Stilberatung</p>
            </div>
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/messages" className="bg-white border border-gray-200 p-5 flex items-center justify-between hover:border-black transition-colors group" data-testid="messages-btn">
            <div>
              <p className="text-xs tracking-widest uppercase text-gray-400 font-outfit mb-1">Chat</p>
              <p className="font-playfair font-semibold">Nachrichten</p>
            </div>
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Bookings */}
        <div className="bg-white border border-gray-200">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`flex-1 py-4 text-sm font-outfit font-medium transition-colors ${activeTab === "upcoming" ? "bg-black text-white" : "text-gray-500 hover:text-black"}`}
              data-testid="upcoming-tab"
            >
              {t("dashboard.upcoming")} ({upcoming.length})
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`flex-1 py-4 text-sm font-outfit font-medium transition-colors ${activeTab === "past" ? "bg-black text-white" : "text-gray-500 hover:text-black"}`}
              data-testid="past-tab"
            >
              {t("dashboard.past")} ({past.length})
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {(activeTab === "upcoming" ? upcoming : past).length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-400 font-outfit text-sm">{t("dashboard.noBookings")}</p>
                {activeTab === "upcoming" && (
                  <Link to="/search" className="mt-4 inline-block px-6 py-2 bg-black text-white text-sm font-outfit hover:bg-neutral-800">
                    Studio finden
                  </Link>
                )}
              </div>
            ) : (
              (activeTab === "upcoming" ? upcoming : past).map(booking => (
                <div key={booking.booking_id} className="p-5 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors" data-testid={`booking-item-${booking.booking_id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-playfair font-semibold text-black truncate">{booking.studio_name}</h4>
                      <span className={`text-xs px-2 py-0.5 border font-outfit ${statusColors[booking.status]}`}>
                        {statusLabels[booking.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 font-outfit">
                      {booking.date} • {booking.start_time} - {booking.end_time}
                    </p>
                    <p className="text-xs text-gray-400 font-outfit mt-1">
                      {booking.booking_type === "consultation" ? "Beratung" : "Tattoo-Session"}
                      {booking.payment_status === "paid" && <span className="ml-2 text-green-600 font-semibold">✓ Bezahlt</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {booking.status === "pending" && booking.payment_status !== "paid" && (
                      <button
                        onClick={() => handlePayDeposit(booking)}
                        className="px-3 py-1.5 bg-black text-white text-xs font-outfit flex items-center gap-1 hover:bg-neutral-800"
                        data-testid={`pay-deposit-btn-${booking.booking_id}`}
                      >
                        <CreditCard size={12} /> Anzahlung
                      </button>
                    )}
                    {["pending", "confirmed"].includes(booking.status) && (
                      <button
                        onClick={() => handleOpenReschedule(booking)}
                        className="px-3 py-1.5 border border-gray-300 text-xs font-outfit hover:border-black hover:text-black transition-colors flex items-center gap-1"
                        data-testid={`reschedule-btn-${booking.booking_id}`}
                      >
                        <RefreshCw size={11} /> Umbuchen
                      </button>
                    )}
                    {["pending", "confirmed"].includes(booking.status) && (
                      <button
                        onClick={() => handleCancelBooking(booking.booking_id)}
                        className="px-3 py-1.5 border border-gray-300 text-xs font-outfit hover:border-red-500 hover:text-red-600 transition-colors"
                        data-testid={`cancel-booking-btn-${booking.booking_id}`}
                      >
                        Absagen
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" data-testid="reschedule-modal">
          <div className="bg-white w-full max-w-md">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-playfair font-bold text-lg">Termin umbuchen</h3>
              <button onClick={() => setRescheduleBooking(null)} className="text-gray-400 hover:text-black"><RefreshCw size={18} /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 font-outfit mb-4">
                Aktueller Termin: <strong>{rescheduleBooking.date}</strong> um <strong>{rescheduleBooking.start_time}</strong> bei <strong>{rescheduleBooking.studio_name}</strong>
              </p>
              <div className="mb-4">
                <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Neues Datum</label>
                <div className="flex gap-1 overflow-x-auto pb-2">
                  {getDates().map(d => (
                    <button key={d} onClick={() => handleRescheduleDate(d)} className={`flex-shrink-0 w-12 py-2 text-xs font-outfit border transition-colors ${rescheduleDate === d ? "bg-black text-white border-black" : "border-gray-300 hover:border-black"}`} data-testid={`reschedule-date-${d}`}>
                      <div>{new Date(d).toLocaleDateString("de-DE", { day: "2-digit" })}</div>
                      <div className="opacity-70">{new Date(d).toLocaleDateString("de-DE", { month: "short" })}</div>
                    </button>
                  ))}
                </div>
              </div>
              {rescheduleDate && (
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Freie Slots</label>
                  {rescheduleSlots.length === 0 ? (
                    <p className="text-sm text-gray-400 font-outfit">Keine freien Slots an diesem Tag</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {rescheduleSlots.map(slot => (
                        <button
                          key={slot.slot_id}
                          onClick={() => handleReschedule(slot.slot_id)}
                          disabled={rescheduleLoading}
                          className="py-2.5 border border-gray-300 hover:bg-black hover:text-white hover:border-black text-xs font-outfit transition-colors disabled:opacity-50"
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
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
