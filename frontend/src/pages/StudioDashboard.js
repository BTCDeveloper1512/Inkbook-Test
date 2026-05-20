import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Plus, Calendar, TrendingUp, Clock, CheckCircle, Trash2, Save, X, MessageSquare, Upload, HelpCircle, Video, FileText, Search, Download, CreditCard } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ArtistsTab from "../components/ArtistsTab";
import { lookupIban, formatIban } from "../utils/ibanLookup";
import VideoCallModal from "../components/VideoCallModal";
import VideoCountdownTimer from "../components/VideoCountdownTimer";
import DashboardHeroSmoke from "../components/DashboardHeroSmoke";
import BorderGlow from "../components/BorderGlow/BorderGlow";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STYLES_LIST = ["Fine Line", "Blackwork", "Traditional", "Neo-Traditional", "Japanese", "Realism", "Portrait", "Geometric", "Watercolor", "Tribal", "Minimalist", "Color", "Abstract", "Surrealism", "Illustrative", "Black & Grey"];
const statusColors = { pending: "bg-amber-50 text-amber-700 border-amber-200", confirmed: "bg-green-50 text-green-700 border-green-200", cancelled: "bg-red-50 text-red-700 border-red-200", completed: "bg-zinc-100 text-zinc-500 border-zinc-200" };

export default function StudioDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [slots, setSlots] = useState([]);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [slotForm, setSlotForm] = useState({ date: "", start_time: "", end_time: "", slot_type: "tattoo", duration_minutes: 120, notes: "" });
  const [slotLoading, setSlotLoading] = useState(false);
  const [showCreateStudio, setShowCreateStudio] = useState(false);
  const [studioForm, setStudioForm] = useState({ name: "", description: "", address: "", city: "", phone: "", email: "", website: "", styles: [], price_range: "medium", images: [] });
  // Edit profile
  const [editForm, setEditForm] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const isPro = true; // All features unlocked – subscription model coming later
  const isFullStudio = true;
  const [videoCallBooking, setVideoCallBooking] = useState(null);
  const [studioBookingsTab, setStudioBookingsTab] = useState("active");
  const [tick, setTick] = useState(0);
  const [notesModal, setNotesModal] = useState(null);
  const [notesLightbox, setNotesLightbox] = useState(null);
  const [bookingSearch, setBookingSearch] = useState("");
  const [revenueInputs, setRevenueInputs] = useState({});
  const [connectStatus, setConnectStatus] = useState(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [inquiries, setInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchSubscription();
    // Poll every 8s for live updates (new bookings pop up fast)
    const pollInterval = setInterval(fetchStats, 8000);
    // Re-evaluate time checks every 60s
    const tickInterval = setInterval(() => setTick(t => t + 1), 60000);
    return () => { clearInterval(pollInterval); clearInterval(tickInterval); };
  }, []);

  const fetchSubscription = async () => {
    try {
      const { data } = await axios.get(`${API}/subscriptions/status`, { withCredentials: true });
      setSubscription(data?.subscription);
    } catch {}
  };

  const generateRevenuePDF = () => {
    const doc = new jsPDF();
    const studioName = stats?.studio?.name || "Studio";
    const now = new Date();
    const monthLabel = now.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
    const typeLabels = { tattoo: "Tattoo", consultation: "Beratung", full_day: "Ganztag", video_consultation: "Videoberatung" };

    // Sort completed bookings for current month by date asc
    const rows = completedBookings
      .filter(b => b.date >= firstDayOfMonth)
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    // ── Header ────────────────────────────────────────────────
    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, 210, 36, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text("InkBook", 14, 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.text("Umsatzbericht", 14, 25);

    // ── Meta ──────────────────────────────────────────────────
    doc.setTextColor(24, 24, 27);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Monatsumsatz · ${monthLabel}`, 14, 48);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(studioName, 14, 56);
    doc.text(
      `Erstellt am ${now.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}`,
      14, 63
    );

    // ── Summary boxes ─────────────────────────────────────────
    const sumBoxes = [
      { label: "Abgeschlossene Termine", value: String(rows.length) },
      { label: "Monatsumsatz", value: `\u20AC ${monthRevenue.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    ];
    const boxW = 86; const boxH = 16; const boxY = 70;
    sumBoxes.forEach((b, i) => {
      const x = 14 + i * (boxW + 6);
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(x, boxY, boxW, boxH, 3, 3, "F");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(b.label, x + 4, boxY + 6);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(24, 24, 27);
      doc.text(b.value, x + 4, boxY + 13);
      doc.setFont("helvetica", "normal");
    });

    // ── Table ─────────────────────────────────────────────────
    autoTable(doc, {
      startY: 94,
      head: [["Datum", "Uhrzeit", "Kunde", "Art des Termins", "Betrag"]],
      body: rows.length > 0
        ? rows.map(b => [
            b.date ? new Date(b.date + "T12:00:00").toLocaleDateString("de-DE") : "–",
            b.start_time && b.end_time ? `${b.start_time} – ${b.end_time}` : b.start_time || "–",
            b.user_name || "–",
            typeLabels[b.booking_type] || b.booking_type || "–",
            `\u20AC ${(b.revenue || 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          ])
        : [["–", "–", "Keine abgeschlossenen Termine in diesem Monat", "", ""]],
      foot: rows.length > 0
        ? [["", "", "", "Gesamt", `\u20AC ${monthRevenue.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]]
        : undefined,
      styles: { font: "helvetica", fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      footStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [249, 249, 249] },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 30 },
        2: { cellWidth: 50 },
        3: { cellWidth: 40 },
        4: { cellWidth: 30, halign: "right" },
      },
      tableLineColor: [235, 235, 235],
      tableLineWidth: 0.1,
    });

    // ── Footer ────────────────────────────────────────────────
    const pageH = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text("Erstellt mit InkBook · inkbook.io", 14, pageH - 8);

    const fname = `inkbook-monatsumsatz-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.pdf`;
    doc.save(fname);
  };

  const handleCompleteBooking = async (bookingId) => {    const revenue = parseFloat(revenueInputs[bookingId] || 0);
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${bookingId}/complete`,
        { revenue },
        { withCredentials: true }
      );
      setRevenueInputs(prev => { const n = { ...prev }; delete n[bookingId]; return n; });
      fetchStats();
    } catch (e) {
      alert("Fehler beim Abschließen des Termins.");
    }
  };

  const handleContactCustomer = async (booking) => {
    if (booking.status === "pending") {
      const studioName = stats?.studio?.name || "unser Studio";
      const firstName = (booking.user_name || "").split(" ")[0] || booking.user_name;
      const dateStr = booking.date
        ? new Date(booking.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })
        : "";
      const typeMap = { tattoo: "Tattoo-Termin", consultation: "Beratung", full_day: "Ganztages-Termin", video_consultation: "Videoberatung" };
      const typeStr = typeMap[booking.booking_type] || "Termin";
      const msg = `Hallo ${firstName} 👋\n\nHier meldet sich ${studioName} zu deiner Buchung:\n\n📅 ${dateStr} · ${booking.start_time} – ${booking.end_time}\n✏️ ${typeStr}\n\nBei Fragen oder Wünschen, schreib mir gerne hier. Bis bald! 🎨`;
      navigate(`/messages/${booking.user_id}`, {
        state: { recipientName: booking.user_name, recipientRole: "customer", initialMessage: msg }
      });
    } else {
      navigate(`/messages/${booking.user_id}`, {
        state: { recipientName: booking.user_name, recipientRole: "customer" }
      });
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API}/dashboard/stats`, { withCredentials: true });
      setStats(data);
      if (data.has_studio && data.studio) {
        fetchSlots(data.studio.studio_id);
        fetchConnectStatus();
        fetchInquiries(data.studio.studio_id);
        const studio = data.studio;
        const ibanLookup = studio.bank_iban ? lookupIban(studio.bank_iban) : null;
        setEditForm(prev => prev === null ? { ...studio, bank_institution: ibanLookup ? ibanLookup.name : "" } : prev);
      }
    } catch { navigate("/login"); } finally { setLoading(false); }
  };

  const fetchConnectStatus = async () => {
    try {
      const { data } = await axios.get(`${API}/stripe/connect/status`, { withCredentials: true });
      setConnectStatus(data);
    } catch {}
  };

  const fetchInquiries = async (studioId) => {
    if (!studioId) return;
    setInquiriesLoading(true);
    try {
      const { data } = await axios.get(`${API}/studios/${studioId}/inquiries`, { withCredentials: true });
      setInquiries(data || []);
    } catch {} finally { setInquiriesLoading(false); }
  };

  const updateInquiryStatus = async (inquiryId, status) => {
    try {
      await axios.patch(`${API}/inquiries/${inquiryId}/status`, { status }, { withCredentials: true });
      setInquiries(prev => prev.map(i => i.inquiry_id === inquiryId ? { ...i, status } : i));
    } catch {}
  };

  const handleConnectStripe = async () => {
    setConnectLoading(true);
    try {
      const { data } = await axios.post(`${API}/stripe/connect/create`, {}, { withCredentials: true });
      if (data.onboarding_url) {
        window.open(data.onboarding_url, "_blank", "noopener,noreferrer");
        setTimeout(() => fetchConnectStatus(), 3000);
      } else if (data.status === "complete") {
        fetchConnectStatus();
      }
    } catch (e) { alert(e.response?.data?.detail || "Stripe-Fehler"); } finally { setConnectLoading(false); }
  };

  const fetchSlots = async (studioId) => {
    try {
      const { data } = await axios.get(`${API}/studios/${studioId}/slots`);
      setSlots(data);
    } catch {}
  };

  const handleCreateStudio = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/studios`, studioForm, { withCredentials: true });
      setShowCreateStudio(false);
      fetchStats();
    } catch (err) { alert(err.response?.data?.detail || "Fehler beim Erstellen"); }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setSlotLoading(true);
    try {
      await axios.post(`${API}/studios/${stats.studio.studio_id}/slots`, slotForm, { withCredentials: true });
      setShowAddSlot(false);
      setSlotForm({ date: "", start_time: "", end_time: "", slot_type: "tattoo", duration_minutes: 120, notes: "" });
      fetchSlots(stats.studio.studio_id);
    } catch (err) {
      alert(err.response?.data?.detail || "Fehler beim Erstellen des Slots");
    } finally { setSlotLoading(false); }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      await axios.delete(`${API}/studios/${stats.studio.studio_id}/slots/${slotId}`, { withCredentials: true });
      fetchSlots(stats.studio.studio_id);
    } catch {}
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      await axios.put(`${API}/bookings/${bookingId}/status`, null, { params: { status: "confirmed" }, withCredentials: true });
      fetchStats();
    } catch {}
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const { bank_institution, ...payload } = editForm;
      await axios.put(`${API}/studios/${stats.studio.studio_id}`, payload, { withCredentials: true });
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3000);
      fetchStats();
    } catch (err) { alert(err.response?.data?.detail || "Fehler"); } finally { setEditLoading(false); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImg(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await axios.post(`${API}/upload/image`, formData, { withCredentials: true });
      setEditForm(prev => ({ ...prev, images: [...(prev.images || []), data.url] }));
    } catch {} finally { setUploadingImg(false); }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingBanner(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await axios.post(`${API}/upload/image`, formData, { withCredentials: true });
      setEditForm(prev => ({ ...prev, banner_image: data.url }));
    } catch {} finally { setUploadingBanner(false); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await axios.post(`${API}/upload/image`, formData, { withCredentials: true });
      setEditForm(prev => ({ ...prev, logo_image: data.url }));
    } catch {} finally { setUploadingLogo(false); }
  };

  const toggleStyle = (style) => {
    setEditForm(prev => ({
      ...prev,
      styles: prev.styles?.includes(style) ? prev.styles.filter(s => s !== style) : [...(prev.styles || []), style]
    }));
  };

  const toggleCreateStyle = (style) => {
    setStudioForm(prev => ({
      ...prev,
      styles: prev.styles.includes(style) ? prev.styles.filter(s => s !== style) : [...prev.styles, style]
    }));
  };

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

  if (!stats?.has_studio && !showCreateStudio) {
    return (
      <div className="min-h-screen bg-zinc-50"><Navbar />
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Plus size={24} className="text-zinc-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-playfair font-semibold mb-3">Studio erstellen</h2>
          <p className="text-zinc-500 font-inter mb-8">Richte dein Studio-Profil ein und starte mit Buchungen.</p>
          <button onClick={() => setShowCreateStudio(true)} className="btn-primary" data-testid="create-studio-btn">
            Studio erstellen
          </button>
        </div>
      </div>
    );
  }

  if (showCreateStudio) {
    return (
      <div className="min-h-screen bg-zinc-50"><Navbar />
        <div className="max-w-2xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-playfair font-semibold mb-8">Studio erstellen</h2>
          <form onSubmit={handleCreateStudio} className="space-y-5">
            <div>
              <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Studio-Name *</label>
              <input type="text" value={studioForm.name} onChange={e => setStudioForm({...studioForm, name: e.target.value})} required className="input-base w-full" data-testid="studio-name-input" />
            </div>
            <div>
              <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Beschreibung *</label>
              <textarea value={studioForm.description} onChange={e => setStudioForm({...studioForm, description: e.target.value})} required rows={3} className="input-base w-full resize-none" data-testid="studio-description-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Adresse *</label>
                <input type="text" value={studioForm.address} onChange={e => setStudioForm({...studioForm, address: e.target.value})} required className="input-base w-full" data-testid="studio-address-input" />
              </div>
              <div>
                <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Stadt *</label>
                <input type="text" value={studioForm.city} onChange={e => setStudioForm({...studioForm, city: e.target.value})} required className="input-base w-full" data-testid="studio-city-input" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Tattoo-Stile</label>
              <div className="flex flex-wrap gap-2">
                {STYLES_LIST.map(s => (
                  <button key={s} type="button" onClick={() => toggleCreateStyle(s)} className={`px-3 py-1.5 text-xs rounded-full border font-inter transition-all ${studioForm.styles.includes(s) ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 hover:border-zinc-400"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Telefon</label>
                <input type="text" value={studioForm.phone} onChange={e => setStudioForm({...studioForm, phone: e.target.value})} className="input-base w-full" />
              </div>
              <div>
                <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Preisklasse</label>
                <select value={studioForm.price_range} onChange={e => setStudioForm({...studioForm, price_range: e.target.value})} className="input-base w-full" data-testid="studio-price-select">
                  <option value="budget">Günstig</option><option value="medium">Mittel</option><option value="premium">Premium</option><option value="luxury">Luxus</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full justify-center" data-testid="submit-create-studio-btn">Studio erstellen</button>
          </form>
        </div>
      </div>
    );
  }

  const studio = stats?.studio;
  const upcomingBookings = stats?.upcoming_bookings || [];
  const allStudioBookings = stats?.all_bookings || [];

  // Local date (not UTC!) to avoid timezone bugs for German users
  const nowTime = new Date();
  const todayStr = `${nowTime.getFullYear()}-${String(nowTime.getMonth()+1).padStart(2,'0')}-${String(nowTime.getDate()).padStart(2,'0')}`;
  const now = nowTime;
  const isBookingPast = (b) => {
    if (!b.date || !b.end_time) return false;
    return now > new Date(`${b.date}T${b.end_time}:00`);
  };
  const isBookingToday = (b) => b.date === todayStr;

  // Use allStudioBookings (not limited upcoming_bookings) for the overview
  const allActiveBookings = allStudioBookings.filter(b => ["pending", "confirmed"].includes(b.status));
  const todayUpcoming = allActiveBookings
    .filter(b => isBookingToday(b) && !isBookingPast(b))
    .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
  const futureUpcoming = allActiveBookings
    .filter(b => b.date > todayStr)
    .sort((a, b) => a.date === b.date ? (a.start_time || "").localeCompare(b.start_time || "") : a.date.localeCompare(b.date));

  // For bookings tab
  const activeBookings = allStudioBookings.filter(b =>
    ["pending", "confirmed"].includes(b.status) && !isBookingPast(b)
  );
  const pastStudioBookings = allStudioBookings.filter(b =>
    isBookingPast(b) || ["cancelled", "completed"].includes(b.status)
  );

  // Revenue calculations (only completed bookings)
  const completedBookings = allStudioBookings.filter(b => b.status === "completed");
  const firstDayOfMonth = `${nowTime.getFullYear()}-${String(nowTime.getMonth()+1).padStart(2,'0')}-01`;
  const todayRevenue = completedBookings
    .filter(b => b.date === todayStr)
    .reduce((s, b) => s + (b.revenue || 0), 0);
  const monthRevenue = completedBookings
    .filter(b => b.date >= firstDayOfMonth)
    .reduce((s, b) => s + (b.revenue || 0), 0);
  const totalRevenue = completedBookings.reduce((s, b) => s + (b.revenue || 0), 0);

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      {/* ── Dark Hero Card (rounded, bordered glow) ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
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
                <div className="flex items-start justify-between gap-4 mb-2">
                  <p className="text-[10px] tracking-[0.28em] uppercase font-inter" style={{ color: "rgba(255,255,255,0.28)" }}>Studio Dashboard</p>
                  {studio?.is_verified && (
                    <span className="text-[10px] tracking-[0.2em] uppercase font-inter px-2.5 py-1 rounded-full border" style={{ color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)" }}>Verifiziert</span>
                  )}
                </div>
                <h1 className="font-playfair font-bold text-white" style={{ fontSize: "clamp(26px, 4vw, 36px)" }}>
                  {studio?.name}
                </h1>
              </motion.div>
            </div>
          </div>
        </BorderGlow>
      </div>

      {/* ── White Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats */}
        <motion.div
          initial="hidden" animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4"
        >
          {[
            { label: "Buchungen", value: stats?.total_bookings || 0, icon: <Calendar size={16} strokeWidth={1.5} /> },
            { label: "Ausstehend", value: stats?.pending_bookings || 0, icon: <Clock size={16} strokeWidth={1.5} /> },
            { label: "Bestätigt", value: stats?.confirmed_bookings || 0, icon: <CheckCircle size={16} strokeWidth={1.5} /> },
            { label: "Abgeschlossen", value: completedBookings.length, icon: <TrendingUp size={16} strokeWidth={1.5} /> }
          ].map((stat, i) => (
            <motion.div key={i}
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 22 } } }}
              whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.08)" }}
              className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-4 cursor-default"
            >
              <div className="text-zinc-400 mb-2">{stat.icon}</div>
              <p className="text-2xl font-playfair font-semibold text-zinc-900">{stat.value}</p>
              <p className="text-xs text-zinc-500 font-inter mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Revenue strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, type: "spring", stiffness: 280, damping: 22 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {[
            { label: "Tagesumsatz", value: todayRevenue, accent: true },
            { label: "Monatsumsatz", value: monthRevenue },
            { label: "Gesamtumsatz", value: totalRevenue },
          ].map((r, i) => (
            <motion.div key={i}
              whileHover={{ y: -3, boxShadow: "0 12px 32px rgba(0,0,0,0.08)" }}
              className={`rounded-2xl border p-4 cursor-default transition-shadow ${r.accent ? "bg-zinc-900 border-zinc-800" : "bg-white border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)]"}`}
              data-testid={`revenue-card-${i}`}
            >
              <p className={`text-xs font-inter font-semibold uppercase tracking-wider mb-1.5 ${r.accent ? "text-white/50" : "text-zinc-400"}`}>{r.label}</p>
              <p className={`text-xl font-playfair font-semibold ${r.accent ? "text-white" : "text-zinc-900"}`}>
                €&thinsp;{r.value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Anzahlungen Kachel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, type: "spring", stiffness: 280, damping: 22 }}
          className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5 mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center">
                <CreditCard size={14} className="text-white" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-inter font-semibold text-zinc-900">Stripe Anzahlungen</p>
            </div>
            <span className="text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 bg-zinc-50 px-2.5 py-1 rounded-full border border-zinc-100">Live-Daten</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-50 rounded-xl p-3.5">
              <p className="text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Anzahl gesamt</p>
              <p className="text-2xl font-playfair font-semibold text-zinc-900">{stats?.deposit_count ?? 0}</p>
              <p className="text-xs text-zinc-400 font-inter mt-0.5">Zahlungen</p>
            </div>
            <div className="bg-zinc-50 rounded-xl p-3.5">
              <p className="text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Diesen Monat</p>
              <p className="text-2xl font-playfair font-semibold text-zinc-900">
                €&thinsp;{(stats?.deposit_month ?? 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-zinc-400 font-inter mt-0.5">Anzahlungen</p>
            </div>
            <div className="bg-zinc-900 rounded-xl p-3.5">
              <p className="text-[10px] font-inter font-semibold tracking-widest uppercase text-white/40 mb-1.5">Gesamt</p>
              <p className="text-2xl font-playfair font-semibold text-white">
                €&thinsp;{(stats?.deposit_total ?? 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-white/40 font-inter mt-0.5">Eingenommen</p>
            </div>
          </div>
        </motion.div>

        {/* PDF Export Button */}
        <div className="flex justify-end -mt-3 mb-4">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={generateRevenuePDF}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-full font-inter text-sm text-zinc-600 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all"
            data-testid="pdf-export-btn"
          >
            <Download size={14} strokeWidth={1.8} />
            Monatsumsatz PDF
          </motion.button>
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex gap-1 mb-6 bg-white rounded-2xl border border-black/[0.04] shadow-[0_2px_10px_rgb(0,0,0,0.04)] p-1.5 w-fit max-w-full overflow-x-auto"
        >
          {[
            { id: "overview", label: "Übersicht" },
            { id: "inquiries", label: `Anfragen${inquiries.length > 0 ? ` (${inquiries.filter(i => i.status === "pending").length})` : ""}` },
            { id: "slots", label: "Slots" },
            { id: "bookings", label: `Buchungen (${stats?.total_bookings || 0})` },
            { id: "artists", label: "Artist hinzufügen" },
            { id: "profile", label: "Profil bearbeiten" }
          ].map(tab => (
            <motion.button key={tab.id} onClick={() => setActiveTab(tab.id)}
              whileTap={{ scale: 0.96 }}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-inter font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}`}
              data-testid={`studio-tab-${tab.id}`}
            >
              {tab.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="space-y-5"
          >
            {/* Heutige Termine – Dark Inverted Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05, type: "spring", stiffness: 280, damping: 22 }}
              className="bg-zinc-900 rounded-2xl p-6 relative overflow-hidden"
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "linear", repeatDelay: 4 }}
              />
              <div className="flex items-center gap-2 mb-4 relative">
                <div className="relative flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div className="w-4 h-4 rounded-full bg-emerald-400/20 animate-ping absolute -top-1 -left-1" />
                </div>
                <h3 className="font-playfair font-semibold text-lg text-white">Heutige Termine</h3>
                <span className="text-xs font-inter font-medium text-white/40 bg-white/10 px-2 py-0.5 rounded-full">{todayUpcoming.length}</span>
              </div>
              {todayUpcoming.length === 0 ? (
                <div className="py-8 flex flex-col items-center text-center">
                  <p className="font-playfair text-lg text-white/70 mb-1">Keine Termine heute</p>
                  <p className="text-xs text-white/40 font-inter">Freier Tag – genieße die Ruhe</p>
                </div>
              ) : (
                <div className="space-y-3 relative">
                  {todayUpcoming.map((b, idx) => (
                    <motion.div key={b.booking_id}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08, type: "spring", stiffness: 300, damping: 22 }}
                      className={`flex flex-wrap items-start justify-between gap-3 p-4 rounded-xl ${idx === 0 ? "bg-white/10 border border-white/10" : "bg-white/5 border border-white/5"}`}
                    >
                      <div>
                        <p className="font-inter font-semibold text-sm text-white">{b.user_name}</p>
                        <p className="text-xs text-white/50 font-inter mt-0.5">{b.start_time} – {b.end_time} · {b.booking_type === "video_consultation" ? "Videoberatung" : b.booking_type === "consultation" ? "Beratung" : "Tattoo"}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          <motion.button whileTap={{ scale: 0.95 }}
                            onClick={() => setNotesModal(b)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-white/20 text-white/70 rounded-full font-inter hover:bg-white/10 hover:text-white transition-all"
                            data-testid={`notes-btn-today-${b.booking_id}`}>
                            <FileText size={11} strokeWidth={1.5} /> Bemerkungen
                          </motion.button>
                          <span className={`text-xs px-2.5 py-1 rounded-full border font-inter ${statusColors[b.status]}`}>{b.status === "pending" ? "Ausstehend" : "Bestätigt"}</span>
                          {b.status === "pending" && (
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleConfirmBooking(b.booking_id)} className="text-xs px-3 py-1.5 bg-white text-zinc-900 rounded-full font-inter font-semibold hover:bg-zinc-100 transition-colors" data-testid={`confirm-btn-${b.booking_id}`}>Bestätigen</motion.button>
                          )}
                          {/* VIDEO CONSULTATION HIDDEN
                          {b.booking_type === "video_consultation" && b.status === "confirmed" && (
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setVideoCallBooking(b)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-500 text-white rounded-full font-inter hover:bg-emerald-400 transition-colors" data-testid={`video-join-btn-overview-${b.booking_id}`}>
                              <Video size={11} strokeWidth={2} /> Beitreten
                            </motion.button>
                          )}
                          */}
                        </div>
                        {/* VIDEO CONSULTATION HIDDEN
                        {b.booking_type === "video_consultation" && b.status === "confirmed" && (
                          <VideoCountdownTimer booking={b} onAutoCancel={fetchStats} />
                        )}
                        */}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Kommende Termine */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 22 }}
              className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6"
            >
              <h3 className="font-playfair font-semibold text-lg mb-4 text-zinc-900">Kommende Termine</h3>
              {futureUpcoming.length === 0 ? (
                <div className="py-12 flex flex-col items-center text-center">
                  <Calendar size={28} className="text-zinc-200 mb-3" strokeWidth={1.5} />
                  <p className="font-playfair text-lg text-zinc-900 mb-1">Keine Buchungen</p>
                  <p className="text-xs text-zinc-400 font-inter">Neue Buchungen erscheinen hier automatisch</p>
                </div>
              ) : (
                <div className="space-y-2 px-1">
                  {futureUpcoming.map((b, idx) => (
                    <motion.div key={b.booking_id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06, type: "spring", stiffness: 300, damping: 22 }}
                      whileHover={{ y: -1, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}
                      className="group relative flex flex-wrap items-start justify-between gap-2 p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 transition-colors hover:bg-white cursor-default"
                    >
                      <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-zinc-900 rounded-r-full scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center" />
                      <div className="pl-1.5">
                        <p className="font-inter font-semibold text-sm text-zinc-900">{b.user_name}</p>
                        <p className="text-xs text-zinc-500 font-inter mt-0.5 group-hover:text-zinc-700 transition-colors">{b.date ? new Date(b.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""} · {b.start_time} – {b.end_time} · {b.booking_type === "video_consultation" ? "Videoberatung" : b.booking_type === "consultation" ? "Beratung" : "Tattoo"}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={() => setNotesModal(b)}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-zinc-200 text-zinc-500 rounded-full font-inter hover:bg-zinc-100 hover:text-zinc-700 transition-all"
                          data-testid={`notes-btn-upcoming-${b.booking_id}`}>
                          <FileText size={11} strokeWidth={1.5} /> Bemerkungen
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={() => handleContactCustomer(b)}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-zinc-200 text-zinc-600 rounded-full font-inter hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all"
                          data-testid={`contact-customer-btn-${b.booking_id}`}>
                          <MessageSquare size={11} strokeWidth={1.5} /> Kunde kontaktieren
                        </motion.button>
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-inter ${statusColors[b.status]}`}>{b.status === "pending" ? "Ausstehend" : "Bestätigt"}</span>
                        {b.status === "pending" && (
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleConfirmBooking(b.booking_id)} className="text-xs px-3 py-1.5 bg-zinc-900 text-white rounded-full font-inter hover:bg-zinc-700 transition-colors" data-testid={`confirm-btn-${b.booking_id}`}>Bestätigen</motion.button>
                        )}
                        {["pending", "confirmed"].includes(b.status) && (
                          <motion.button whileTap={{ scale: 0.95 }} onClick={async () => { if (!window.confirm("Buchung stornieren?")) return; try { await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/${b.booking_id}/status`, null, { params: { status: "cancelled" }, withCredentials: true }); fetchStats(); } catch {} }}
                            className="text-xs px-3 py-1.5 border border-zinc-200 text-zinc-500 rounded-full font-inter hover:border-red-300 hover:text-red-600 transition-all"
                            data-testid={`cancel-btn-overview-${b.booking_id}`}>Stornieren</motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Slots Tab */}
        {activeTab === "slots" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}>
            <div className="flex justify-end mb-4">
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} onClick={() => setShowAddSlot(!showAddSlot)} className="btn-primary flex items-center gap-2 text-sm" data-testid="add-slot-btn">
                <Plus size={15} strokeWidth={1.5} /> Slot hinzufügen
              </motion.button>
            </div>
            {showAddSlot && (
              <form onSubmit={handleAddSlot} className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6 mb-6 space-y-4">
                <h3 className="font-playfair font-semibold text-lg text-zinc-900">Neuen Slot erstellen</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Datum</label>
                    <input type="date" value={slotForm.date} onChange={e => setSlotForm({...slotForm, date: e.target.value})} required className="input-base w-full" data-testid="slot-date-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Von</label>
                    <input type="time" value={slotForm.start_time} onChange={e => setSlotForm({...slotForm, start_time: e.target.value})} required className="input-base w-full" data-testid="slot-start-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Bis</label>
                    <input type="time" value={slotForm.end_time} onChange={e => setSlotForm({...slotForm, end_time: e.target.value})} required className="input-base w-full" data-testid="slot-end-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Art</label>
                    <select value={slotForm.slot_type} onChange={e => setSlotForm({...slotForm, slot_type: e.target.value})} className="input-base w-full" data-testid="slot-type-select">
                      <option value="consultation">Beratung</option><option value="tattoo">Tattoo</option>{/* <option value="video_consultation">Videoberatung</option> VIDEO HIDDEN */}<option value="full_day">Ganzer Tag</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={slotLoading} className="btn-primary disabled:opacity-50" data-testid="submit-slot-btn">{slotLoading ? "..." : "Slot erstellen"}</button>
                  <button type="button" onClick={() => setShowAddSlot(false)} className="btn-secondary">Abbrechen</button>
                </div>
              </form>
            )}
            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden">
              {slots.length === 0 ? (
                <div className="py-20 flex flex-col items-center text-center">
                  <Calendar size={28} className="text-zinc-200 mb-4" strokeWidth={1.5} />
                  <h3 className="font-playfair text-lg text-zinc-900 mb-1">Keine Slots</h3>
                  <p className="text-xs text-zinc-400 font-inter">Füge deinen ersten verfügbaren Termin hinzu</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {slots.slice(0, 30).map((slot, idx) => (
                    <motion.div key={slot.slot_id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04, type: "spring", stiffness: 300, damping: 22 }}
                      whileHover={{ y: -1, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}
                      className="group relative flex items-center justify-between px-4 py-3.5 rounded-xl mx-1 my-0.5 transition-colors hover:bg-zinc-50 cursor-default" data-testid={`slot-item-${slot.slot_id}`}
                    >
                      {/* Left accent bar */}
                      <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-zinc-900 rounded-r-full scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center" />
                      <div className="pl-1.5">
                        <p className="font-inter font-medium text-sm text-zinc-900">{slot.date ? new Date(slot.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""}</p>
                        <p className="text-xs text-zinc-400 font-inter mt-0.5 group-hover:text-zinc-600 transition-colors">{slot.start_time} – {slot.end_time} · {slot.slot_type === "video_consultation" ? "Videoberatung" : slot.slot_type === "consultation" ? "Beratung" : slot.slot_type === "full_day" ? "Ganzer Tag" : "Tattoo"}</p>
                      </div>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDeleteSlot(slot.slot_id)}
                        className="p-2 rounded-xl text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        data-testid={`delete-slot-btn-${slot.slot_id}`}>
                        <Trash2 size={14} strokeWidth={1.5} />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 22 }} className="space-y-5">

            {/* Search bar */}
            <div className="relative">
              <Search size={15} strokeWidth={1.8} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={bookingSearch}
                onChange={e => setBookingSearch(e.target.value)}
                placeholder="Suchen nach Name, Datum, Art oder Status..."
                className="w-full pl-9 pr-10 py-2.5 bg-white border border-zinc-200 rounded-2xl font-inter text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-all"
                data-testid="booking-search-input"
              />
              {bookingSearch && (
                <button onClick={() => setBookingSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors">
                  <X size={14} strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 bg-white rounded-2xl border border-black/[0.04] shadow-[0_2px_10px_rgb(0,0,0,0.04)] p-1.5 w-fit">
              {[
                { id: "active", label: `Aktuelle Buchungen (${activeBookings.length})` },
                { id: "past", label: `Vergangene Termine (${pastStudioBookings.length})` }
              ].map(t => (
                <motion.button key={t.id} onClick={() => setStudioBookingsTab(t.id)} whileTap={{ scale: 0.96 }}
                  className={`px-4 py-2 rounded-xl text-sm font-inter font-medium transition-all whitespace-nowrap ${studioBookingsTab === t.id ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}`}
                  data-testid={`studio-bookings-${t.id}-tab`}>
                  {t.label}
                </motion.button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="divide-y divide-zinc-50">
                {(() => {
                  const typeMap = { tattoo: "tattoo", consultation: "beratung", full_day: "ganztag", video_consultation: "video" };
                  const statusMap = { pending: "ausstehend", confirmed: "bestätigt", cancelled: "abgesagt" };
                  const q = bookingSearch.toLowerCase().trim();
                  const base = studioBookingsTab === "active" ? activeBookings : pastStudioBookings;
                  const filtered = q ? base.filter(b => {
                    const dateStr = b.date ? new Date(b.date + "T12:00:00").toLocaleDateString("de-DE") : "";
                    return (
                      (b.user_name || "").toLowerCase().includes(q) ||
                      (b.user_email || "").toLowerCase().includes(q) ||
                      dateStr.includes(q) ||
                      (typeMap[b.booking_type] || b.booking_type || "").includes(q) ||
                      (b.booking_type || "").toLowerCase().includes(q) ||
                      (statusMap[b.status] || b.status || "").includes(q) ||
                      (b.start_time || "").includes(q) ||
                      (b.notes || "").toLowerCase().includes(q)
                    );
                  }) : base;

                  if (filtered.length === 0) return (
                    <div className="py-20 flex flex-col items-center text-center">
                      <Calendar size={28} className="text-zinc-200 mb-4" strokeWidth={1.5} />
                      <h3 className="font-playfair text-lg text-zinc-900 mb-1">{q ? "Keine Ergebnisse" : "Keine Buchungen"}</h3>
                      <p className="text-xs text-zinc-400 font-inter">
                        {q ? `Keine Buchungen für "${bookingSearch}" gefunden` : studioBookingsTab === "active" ? "Aktive Buchungen erscheinen hier" : "Vergangene Termine werden hier angezeigt"}
                      </p>
                      {q && <button onClick={() => setBookingSearch("")} className="mt-3 text-xs text-zinc-500 underline font-inter hover:text-zinc-900">Filter zurücksetzen</button>}
                    </div>
                  );

                  return filtered.map((b, idx) => {
                  const isPast = isBookingPast(b);
                  return (
                    <motion.div key={b.booking_id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, type: "spring", stiffness: 300, damping: 22 }}
                      whileHover={{ y: -1, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}
                      className={`group relative px-5 py-4 rounded-xl mx-1 my-0.5 transition-colors hover:bg-zinc-50 cursor-default ${isPast && b.status !== "completed" ? "opacity-75" : ""}`}
                      data-testid={`studio-booking-${b.booking_id}`}
                    >
                      <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-zinc-900 rounded-r-full scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center" />
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-inter font-semibold text-zinc-900">{b.user_name}</p>
                          <p className="text-sm text-zinc-500 font-inter">{b.user_email}</p>
                          <p className="text-xs text-zinc-400 font-inter mt-1">{b.date ? new Date(b.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""} · {b.start_time} – {b.end_time} · {b.booking_type === "video_consultation" ? "Videoberatung" : b.booking_type === "consultation" ? "Beratung" : "Tattoo"}</p>
                          {b.notes && <p className="text-xs text-zinc-400 font-inter mt-1 italic">"{b.notes}"</p>}
                          {b.reference_images?.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {b.reference_images.slice(0, 3).map((img, i) => (
                                <img key={i} src={img} alt="" className="w-12 h-12 object-cover rounded-xl border border-zinc-200" />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 min-w-[120px]">
                          {/* Status badge */}
                          {b.status === "completed" ? (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200 font-inter flex items-center gap-1">
                              <CheckCircle size={10} strokeWidth={2} /> Abgeschlossen
                            </span>
                          ) : (
                            <span className={`text-xs px-2.5 py-1 rounded-full border font-inter ${statusColors[b.status] || statusColors.pending}`}>
                              {b.status === "pending" ? "Ausstehend" : b.status === "confirmed" ? "Bestätigt" : "Abgesagt"}
                            </span>
                          )}

                          {/* Revenue display for completed bookings */}
                          {b.status === "completed" && (b.revenue || 0) > 0 && (
                            <span className="text-sm font-playfair font-semibold text-emerald-600" data-testid={`revenue-display-${b.booking_id}`}>
                              + €&thinsp;{(b.revenue).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          )}

                          {/* Revenue entry + complete for past confirmed */}
                          {isPast && b.status === "confirmed" && (
                            <div className="flex flex-col items-end gap-1.5 mt-0.5">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-inter">€</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0,00"
                                  value={revenueInputs[b.booking_id] || ""}
                                  onChange={e => setRevenueInputs(prev => ({ ...prev, [b.booking_id]: e.target.value }))}
                                  className="pl-7 pr-3 py-1.5 w-28 text-xs border border-zinc-200 rounded-xl font-inter focus:outline-none focus:border-zinc-500 text-zinc-900 bg-white transition-colors"
                                  data-testid={`revenue-input-${b.booking_id}`}
                                />
                              </div>
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleCompleteBooking(b.booking_id)}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-zinc-900 text-white rounded-full font-inter hover:bg-zinc-700 transition-colors w-28 justify-center"
                                data-testid={`complete-booking-btn-${b.booking_id}`}
                              >
                                <CheckCircle size={11} strokeWidth={2} /> Abschließen
                              </motion.button>
                            </div>
                          )}

                          {b.status === "pending" && !isPast && (
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleConfirmBooking(b.booking_id)} className="text-xs px-3 py-1.5 bg-zinc-900 text-white rounded-full font-inter hover:bg-zinc-700 transition-colors" data-testid={`confirm-booking-studio-${b.booking_id}`}>Bestätigen</motion.button>
                          )}
                          {/* VIDEO CONSULTATION HIDDEN
                          {b.booking_type === "video_consultation" && b.status === "confirmed" && !isPast && (
                            <div className="flex flex-col items-end gap-1">
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setVideoCallBooking(b)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-full font-inter hover:bg-emerald-700 transition-colors" data-testid={`video-join-btn-${b.booking_id}`}>
                                <Video size={12} strokeWidth={2} /> Beitreten
                              </motion.button>
                              <VideoCountdownTimer booking={b} onAutoCancel={fetchStats} />
                            </div>
                          )}
                          */}
                          {["pending", "confirmed"].includes(b.status) && !isPast && (
                            <motion.button whileTap={{ scale: 0.95 }}
                              onClick={async () => {
                                if (!window.confirm("Buchung wirklich stornieren?")) return;
                                try { await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/${b.booking_id}/status`, null, { params: { status: "cancelled" }, withCredentials: true }); fetchStats(); } catch {}
                              }}
                              className="text-xs px-3 py-1.5 border border-zinc-200 text-zinc-500 rounded-full font-inter hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
                              data-testid={`cancel-booking-studio-${b.booking_id}`}
                            >
                              Stornieren
                            </motion.button>
                          )}
                          <motion.button whileTap={{ scale: 0.95 }}
                            onClick={() => setNotesModal(b)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-zinc-200 text-zinc-500 rounded-full font-inter hover:bg-zinc-100 hover:text-zinc-700 transition-all"
                            data-testid={`notes-btn-booking-${b.booking_id}`}
                          >
                            <FileText size={11} strokeWidth={1.5} /> Bemerkungen
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.95 }}
                            onClick={() => handleContactCustomer(b)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-zinc-200 text-zinc-600 rounded-full font-inter hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all"
                            data-testid={`contact-customer-booking-${b.booking_id}`}
                          >
                            <MessageSquare size={11} strokeWidth={1.5} /> Kunde kontaktieren
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                  }); // end filtered.map
                })()} {/* end IIFE */}
              </div>
            </div>
          </motion.div>
        )}

        {/* Inquiries Tab */}
        {activeTab === "inquiries" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 22 }} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-playfair font-semibold text-xl text-zinc-900">Gäste-Anfragen</h3>
                <p className="text-xs text-zinc-500 font-inter mt-0.5">Anfragen von Kunden ohne Account — direkt vom Studio-Profil</p>
              </div>
              <button onClick={() => fetchInquiries(stats?.studio?.studio_id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-inter text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 6A4 4 0 1 1 6 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 2v4H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Aktualisieren
              </button>
            </div>

            {inquiriesLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-28 bg-zinc-100 animate-pulse rounded-2xl" />)}
              </div>
            ) : inquiries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-12 text-center">
                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <MessageSquare size={20} className="text-zinc-400" strokeWidth={1.5} />
                </div>
                <p className="font-inter font-semibold text-zinc-600 text-sm mb-1">Noch keine Anfragen</p>
                <p className="text-xs text-zinc-400 font-inter">Wenn Kunden über dein Studio-Profil eine Anfrage senden, erscheinen sie hier.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inquiries.map(inq => {
                  const statusMap = {
                    pending:   { label: "Neu",          bg: "bg-amber-50 text-amber-700 border-amber-200" },
                    contacted: { label: "Kontaktiert",  bg: "bg-blue-50 text-blue-700 border-blue-200" },
                    closed:    { label: "Abgeschlossen",bg: "bg-zinc-100 text-zinc-500 border-zinc-200" },
                  };
                  const s = statusMap[inq.status] || statusMap.pending;
                  const dateStr = inq.created_at ? new Date(inq.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
                  return (
                    <motion.div key={inq.inquiry_id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0 font-playfair font-bold text-zinc-600 text-sm">
                            {(inq.user_name || "?")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-inter font-semibold text-zinc-900 text-sm">{inq.user_name}</p>
                            <p className="text-xs text-zinc-400 font-inter truncate">{inq.user_email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[11px] font-inter font-semibold px-2.5 py-1 rounded-full border ${s.bg}`}>{s.label}</span>
                          <span className="text-[11px] text-zinc-400 font-inter whitespace-nowrap">{dateStr}</span>
                        </div>
                      </div>

                      <div className="bg-zinc-50 rounded-xl p-3.5 mb-3">
                        <p className="text-xs font-inter text-zinc-700 leading-relaxed">{inq.tattoo_description}</p>
                        {(inq.size || inq.body_part) && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {inq.size && <span className="text-[11px] font-inter bg-white border border-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full">{inq.size}</span>}
                            {inq.body_part && <span className="text-[11px] font-inter bg-white border border-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full">{inq.body_part}</span>}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => navigate(`/messages/${inq.user_id}`, { state: { recipientName: inq.user_name, recipientRole: "customer" } })}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 text-white text-xs font-inter font-medium rounded-xl hover:bg-zinc-700 transition-colors"
                        >
                          <MessageSquare size={12} strokeWidth={1.5} /> Nachricht senden
                        </motion.button>
                        {inq.status === "pending" && (
                          <button onClick={() => updateInquiryStatus(inq.inquiry_id, "contacted")}
                            className="px-3.5 py-2 text-xs font-inter text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
                            Als kontaktiert markieren
                          </button>
                        )}
                        {inq.status === "contacted" && (
                          <button onClick={() => updateInquiryStatus(inq.inquiry_id, "closed")}
                            className="px-3.5 py-2 text-xs font-inter text-zinc-500 border border-zinc-100 rounded-xl hover:bg-zinc-50 transition-colors">
                            Abschließen
                          </button>
                        )}
                        {inq.status !== "pending" && (
                          <button onClick={() => updateInquiryStatus(inq.inquiry_id, "pending")}
                            className="px-3 py-2 text-xs font-inter text-zinc-400 hover:text-zinc-600 transition-colors">
                            Zurücksetzen
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Artists Tab */}
        {activeTab === "artists" && stats?.studio && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}>
            <ArtistsTab studioId={stats.studio.studio_id} />
          </motion.div>
        )}

        {/* Profile Edit Tab */}
        {activeTab === "profile" && editForm && (
          <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 22 }} onSubmit={handleSaveProfile} className="space-y-6">
            {editSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-2xl text-sm font-inter flex items-center gap-2" data-testid="profile-save-success">
                <CheckCircle size={15} strokeWidth={1.5} /> Profil erfolgreich gespeichert!
              </div>
            )}

            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <h3 className="font-playfair font-semibold text-lg mb-5 text-zinc-900">Grunddaten</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Studio-Name</label>
                  <input type="text" value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} className="input-base w-full" data-testid="edit-studio-name" />
                </div>
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Stadt</label>
                  <input type="text" value={editForm.city || ""} onChange={e => setEditForm({...editForm, city: e.target.value})} className="input-base w-full" data-testid="edit-studio-city" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Adresse</label>
                  <input type="text" value={editForm.address || ""} onChange={e => setEditForm({...editForm, address: e.target.value})} className="input-base w-full" data-testid="edit-studio-address" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Beschreibung</label>
                  <textarea value={editForm.description || ""} onChange={e => setEditForm({...editForm, description: e.target.value})} rows={4} className="input-base w-full resize-none" data-testid="edit-studio-description" />
                </div>
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Telefon</label>
                  <input type="text" value={editForm.phone || ""} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="input-base w-full" />
                </div>
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">E-Mail</label>
                  <input type="email" value={editForm.email || ""} onChange={e => setEditForm({...editForm, email: e.target.value})} className="input-base w-full" data-testid="edit-studio-email" />
                </div>
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Website</label>
                  <input type="text" value={editForm.website || ""} onChange={e => setEditForm({...editForm, website: e.target.value})} className="input-base w-full" />
                </div>
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Preisklasse</label>
                  <select value={editForm.price_range || "medium"} onChange={e => setEditForm({...editForm, price_range: e.target.value})} className="input-base w-full" data-testid="edit-price-range">
                    <option value="budget">Günstig</option><option value="medium">Mittel</option><option value="premium">Premium</option><option value="luxury">Luxus</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <h3 className="font-playfair font-semibold text-lg text-zinc-900 mb-4">Anzahlung</h3>
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setEditForm(prev => ({ ...prev, deposit_required: !prev.deposit_required }))}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${editForm?.deposit_required ? "bg-zinc-900" : "bg-zinc-200"}`}
                    data-testid="deposit-toggle"
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${editForm?.deposit_required ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                  <span className="text-sm font-inter text-zinc-700">Anzahlung bei Buchung erforderlich</span>
                </label>
              </div>
              {editForm?.deposit_required && (
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Anzahlungsbetrag (€)</label>
                  <input
                    type="number" min="1" max="500" step="1"
                    value={editForm.deposit_amount || 50}
                    onChange={e => setEditForm({ ...editForm, deposit_amount: parseFloat(e.target.value) || 0 })}
                    className="input-base w-40"
                    placeholder="z.B. 50"
                    data-testid="deposit-amount-input"
                  />
                  <p className="text-xs text-zinc-400 font-inter mt-1.5">Kunden zahlen diesen Betrag vor der Terminbestätigung.</p>
                </div>
              )}
            </div>

            {/* VIDEO CONSULTATION TOGGLE HIDDEN – auskommentiert bis Feature wieder aktiviert wird
            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <h3 className="font-playfair font-semibold text-lg text-zinc-900 mb-4">Videoberatung</h3>
              <div className="flex items-center gap-4 mb-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setEditForm(prev => ({ ...prev, video_consultation_enabled: !prev.video_consultation_enabled }))}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${editForm?.video_consultation_enabled ? "bg-zinc-900" : "bg-zinc-200"}`}
                    data-testid="video-consultation-toggle"
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${editForm?.video_consultation_enabled ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                  <span className="text-sm font-inter text-zinc-700">Videoberatungsgespräche anbieten</span>
                </label>
              </div>
              <p className="text-xs text-zinc-400 font-inter">
                Wenn aktiviert, können Kunden bei der Buchung "Videoberatungsgespräch" auswählen. Zum Termin erscheint ein "Beitreten"-Button.
              </p>
            </div>
            */}

            {/* ── Stripe Connect ── */}
            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-playfair font-semibold text-lg text-zinc-900">Stripe Konto verbinden</h3>
                {connectStatus?.status === "complete" ? (
                  <span className="text-[10px] font-inter font-semibold tracking-widest uppercase bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle size={10} strokeWidth={2} /> Verbunden
                  </span>
                ) : connectStatus?.status === "pending" ? (
                  <span className="text-[10px] font-inter font-semibold tracking-widest uppercase bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">Ausstehend</span>
                ) : (
                  <span className="text-[10px] font-inter font-semibold tracking-widest uppercase bg-zinc-100 text-zinc-500 px-2.5 py-1 rounded-full">Nicht verbunden</span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-inter mb-5">
                Verbinde dein Stripe-Konto damit Anzahlungen direkt auf dein Bankkonto ausgezahlt werden. Stripe führt dich durch das Onboarding (KYC, Bankdaten).
              </p>

              {connectStatus?.status === "complete" ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={16} className="text-emerald-600" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-inter font-semibold text-emerald-800">Stripe erfolgreich verbunden</p>
                    <p className="text-xs text-emerald-600 font-inter mt-0.5">Anzahlungen werden direkt auf dein Bankkonto überwiesen.</p>
                  </div>
                </div>
              ) : (
                <div>
                  {connectStatus?.status === "pending" && (
                    <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                      <p className="text-xs text-amber-700 font-inter font-medium">Onboarding noch nicht abgeschlossen. Klicke auf "Weiter bei Stripe" um fortzufahren.</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleConnectStripe}
                      disabled={connectLoading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white text-sm font-inter rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50"
                      data-testid="connect-stripe-btn"
                    >
                      <CreditCard size={14} strokeWidth={1.5} />
                      {connectLoading ? "Wird geöffnet…" : connectStatus?.status === "pending" ? "Weiter bei Stripe" : "Bei Stripe registrieren"}
                    </button>
                    {connectStatus?.status === "pending" && (
                      <button
                        type="button"
                        onClick={fetchConnectStatus}
                        className="text-xs text-zinc-500 font-inter hover:text-zinc-800 transition-colors"
                      >
                        Status aktualisieren
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 font-inter mt-3">
                    Nach dem Klick öffnet sich ein neues Fenster mit dem Stripe-Onboarding. Du hinterlegst dort deine Bankdaten sicher direkt bei Stripe.
                  </p>
                </div>
              )}
            </div>

            {/* ── Anzahlung Einstellungen ── */}
            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-playfair font-semibold text-lg text-zinc-900">Anzahlung</h3>
                <span className="text-[10px] font-inter font-semibold tracking-widest uppercase bg-zinc-100 text-zinc-500 px-2.5 py-1 rounded-full">Stripe</span>
              </div>
              <p className="text-xs text-zinc-400 font-inter mb-5">Lege fest ob Kunden bei der Buchung eine Anzahlung leisten müssen und in welcher Höhe.</p>

              {/* Toggle */}
              <label className="flex items-center gap-3 cursor-pointer mb-5">
                <div
                  onClick={() => setEditForm(prev => ({ ...prev, deposit_required: !prev.deposit_required }))}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${editForm?.deposit_required ? "bg-zinc-900" : "bg-zinc-200"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${editForm?.deposit_required ? "translate-x-5" : "translate-x-0"}`} />
                </div>
                <div>
                  <span className="text-sm font-inter font-medium text-zinc-800">Anzahlung erforderlich</span>
                  <p className="text-xs text-zinc-400 font-inter mt-0.5">
                    {editForm?.deposit_required ? "Kunden müssen vor Terminbestätigung bezahlen" : "Kunden können ohne Anzahlung buchen"}
                  </p>
                </div>
              </label>

              {/* Amount — only when toggle is ON */}
              {editForm?.deposit_required && (
                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Anzahlungsbetrag (€)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 font-inter text-sm">€</span>
                    <input
                      type="number"
                      min="0.50"
                      step="0.50"
                      value={editForm.deposit_amount ?? ""}
                      onChange={e => setEditForm(prev => ({ ...prev, deposit_amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="z.B. 50"
                      className="input-base w-36 text-right font-playfair text-lg"
                      data-testid="deposit-amount-input"
                    />
                    <span className="text-xs text-zinc-400 font-inter">Mindestbetrag: €0,50</span>
                  </div>
                  <p className="text-xs text-zinc-400 font-inter mt-2">
                    Dieser Betrag wird bei der Buchung per Stripe eingezogen und auf dein Konto überwiesen.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <h3 className="font-playfair font-semibold text-lg mb-4 text-zinc-900">Tattoo-Stile</h3>
              <div className="flex flex-wrap gap-2">
                {STYLES_LIST.map(s => (
                  <button key={s} type="button" onClick={() => toggleStyle(s)} className={`px-3 py-1.5 text-xs rounded-full border font-inter transition-all ${editForm.styles?.includes(s) ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 hover:border-zinc-400"}`} data-testid={`style-toggle-${s}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <h3 className="font-playfair font-semibold text-lg mb-1 text-zinc-900">Studio-Branding</h3>
              <p className="text-xs text-zinc-400 font-inter mb-5">Banner und Logo erscheinen auf deinem öffentlichen Studio-Profil.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Banner */}
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Banner-Bild</label>
                  {editForm.banner_image ? (
                    <div className="relative mb-3 group">
                      <img src={editForm.banner_image} alt="Banner" className="w-full h-28 object-cover rounded-xl border border-zinc-200" />
                      <button type="button" onClick={() => setEditForm(prev => ({ ...prev, banner_image: "" }))} className="absolute top-1.5 right-1.5 w-6 h-6 bg-zinc-900/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-28 rounded-xl bg-zinc-100 border border-dashed border-zinc-300 flex items-center justify-center mb-3">
                      <span className="text-xs text-zinc-400 font-inter">Kein Banner hochgeladen</span>
                    </div>
                  )}
                  <label className={`h-10 border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-xl flex items-center justify-center cursor-pointer transition-colors gap-2 ${uploadingBanner ? "opacity-50" : ""}`}>
                    <Upload size={14} className="text-zinc-400" strokeWidth={1.5} />
                    <span className="text-xs text-zinc-400 font-inter">{uploadingBanner ? "Wird hochgeladen..." : "Banner hochladen"}</span>
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" disabled={uploadingBanner} data-testid="banner-upload-input" />
                  </label>
                </div>
                {/* Logo */}
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Logo / Profilbild</label>
                  <div className="flex items-center gap-4 mb-3">
                    {editForm.logo_image ? (
                      <div className="relative group flex-shrink-0">
                        <img src={editForm.logo_image} alt="Logo" className="w-20 h-20 object-cover rounded-2xl border border-zinc-200" />
                        <button type="button" onClick={() => setEditForm(prev => ({ ...prev, logo_image: "" }))} className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-900/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={9} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-zinc-100 border border-dashed border-zinc-300 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-playfair text-zinc-300">{editForm?.name?.[0]}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500 font-inter mb-2">Erscheint als Profilbild auf deiner Studio-Seite.</p>
                      <label className={`h-9 border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-xl flex items-center justify-center cursor-pointer transition-colors gap-2 ${uploadingLogo ? "opacity-50" : ""}`}>
                        <Upload size={13} className="text-zinc-400" strokeWidth={1.5} />
                        <span className="text-xs text-zinc-400 font-inter">{uploadingLogo ? "..." : "Logo hochladen"}</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploadingLogo} data-testid="logo-upload-input" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} type="submit" disabled={editLoading} className="btn-primary flex items-center gap-2 disabled:opacity-50" data-testid="save-profile-btn">
              <Save size={15} strokeWidth={1.5} /> {editLoading ? "Speichern..." : "Profil speichern"}
            </motion.button>
          </motion.form>
        )}
      </div>
      {/* FAQ Help Strip */}
      <div className="bg-white border-t border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-100 rounded-xl flex items-center justify-center">
              <HelpCircle size={15} className="text-zinc-500" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs font-inter font-semibold text-zinc-800">Hast du Fragen?</p>
              <p className="text-xs text-zinc-400 font-inter">FAQs & Hilfe speziell für Studios</p>
            </div>
          </div>
          <Link to="/faq" className="text-xs font-inter font-semibold text-zinc-900 underline underline-offset-2 hover:no-underline transition-all" data-testid="studio-faq-link">
            FAQ ansehen →
          </Link>
        </div>
      </div>
      <Footer />
      {/* VIDEO CONSULTATION HIDDEN
      {videoCallBooking && (
        <VideoCallModal
          booking={videoCallBooking}
          userRole="studio_owner"
          onClose={() => setVideoCallBooking(null)}
        />
      )}
      */}

      {/* Bemerkungen Modal */}
      <AnimatePresence>
        {notesModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setNotesModal(null)}
            data-testid="notes-modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
              data-testid="notes-modal"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-playfair font-semibold text-lg text-zinc-900">Kundenanmerkungen</h3>
                <button onClick={() => setNotesModal(null)} className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 transition-colors" data-testid="notes-modal-close">
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>
              <p className="text-xs text-zinc-400 font-inter mb-4">
                Buchung von <span className="font-semibold text-zinc-600">{notesModal.user_name}</span>
                {notesModal.date ? ` · ${new Date(notesModal.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}` : ""}
              </p>

              {!notesModal.notes && (!notesModal.reference_images || notesModal.reference_images.length === 0) ? (
                <div className="py-10 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mb-3">
                    <FileText size={20} className="text-zinc-300" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-zinc-400 font-inter">Keine Kundenanmerkung vorhanden</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notesModal.notes && (
                    <div>
                      <p className="text-[10px] font-inter font-semibold uppercase tracking-wider text-zinc-400 mb-2">Anmerkung</p>
                      <p className="text-sm font-inter text-zinc-700 bg-zinc-50 rounded-xl p-3.5 leading-relaxed border border-zinc-100">
                        "{notesModal.notes}"
                      </p>
                    </div>
                  )}
                  {notesModal.reference_images?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-inter font-semibold uppercase tracking-wider text-zinc-400 mb-2">Referenzbilder ({notesModal.reference_images.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {notesModal.reference_images.map((img, i) => (
                          <button key={i} type="button" onClick={() => setNotesLightbox(img)} className="focus:outline-none">
                            <img src={img} alt="" className="w-24 h-24 object-cover rounded-xl border border-zinc-100 hover:opacity-80 transition-opacity cursor-zoom-in" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Bemerkungen Lightbox */}
      <AnimatePresence>
        {notesLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setNotesLightbox(null)}
            data-testid="notes-lightbox-overlay"
          >
            <motion.img
              src={notesLightbox}
              alt="Referenzbild"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              onClick={e => e.stopPropagation()}
              data-testid="notes-lightbox-img"
            />
            <button
              onClick={() => setNotesLightbox(null)}
              className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
              data-testid="notes-lightbox-close"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
