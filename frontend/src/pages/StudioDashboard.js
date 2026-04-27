import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AnnouncementBell from "../components/AnnouncementBell";
import { Plus, Calendar, TrendingUp, Clock, CheckCircle, Trash2, Edit3, Save, X, MessageSquare, Upload, Crown } from "lucide-react";
import ArtistsTab from "../components/ArtistsTab";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STYLES_LIST = ["Fine Line", "Blackwork", "Traditional", "Neo-Traditional", "Japanese", "Realism", "Portrait", "Geometric", "Watercolor", "Tribal", "Minimalist", "Color", "Abstract", "Surrealism", "Illustrative", "Black & Grey"];
const statusColors = { pending: "bg-amber-50 text-amber-700 border-amber-200", confirmed: "bg-green-50 text-green-700 border-green-200", cancelled: "bg-red-50 text-red-700 border-red-200" };

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
  const [studioBookingsTab, setStudioBookingsTab] = useState("active");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetchStats();
    fetchSubscription();
    // Poll every 30s for live updates
    const pollInterval = setInterval(fetchStats, 30000);
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

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API}/dashboard/stats`, { withCredentials: true });
      setStats(data);
      if (data.has_studio && data.studio) {
        fetchSlots(data.studio.studio_id);
        setEditForm({ ...data.studio });
      }
    } catch { navigate("/login"); } finally { setLoading(false); }
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
    } catch (err) { alert(err.response?.data?.detail || "Fehler"); } finally { setSlotLoading(false); }
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
      await axios.put(`${API}/studios/${stats.studio.studio_id}`, editForm, { withCredentials: true });
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
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
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

  const todayStr = new Date().toISOString().split("T")[0];
  const now = new Date();
  const isBookingPast = (b) => {
    if (!b.date || !b.end_time) return false;
    return now > new Date(`${b.date}T${b.end_time}:00`);
  };
  const isBookingToday = (b) => b.date === todayStr;

  // For overview tab
  const todayUpcoming = upcomingBookings.filter(b => isBookingToday(b) && !isBookingPast(b));
  const futureUpcoming = upcomingBookings.filter(b => b.date > todayStr);

  // For bookings tab
  const activeBookings = allStudioBookings.filter(b =>
    ["pending", "confirmed"].includes(b.status) && !isBookingPast(b)
  );
  const pastStudioBookings = allStudioBookings.filter(b =>
    isBookingPast(b) || ["cancelled", "completed"].includes(b.status)
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-zinc-400 font-inter mb-1">Studio Dashboard</p>
            <h1 className="text-3xl font-playfair font-semibold text-zinc-900">{studio?.name}</h1>
            {subscription?.status === "active" && (
              <span className="inline-flex items-center gap-1 mt-1.5 text-xs bg-zinc-900 text-white px-3 py-1 rounded-full font-inter capitalize">
                <Crown size={10} strokeWidth={1.5} /> {subscription.plan} Plan
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap justify-end items-center">
            <AnnouncementBell />
            <Link to="/subscription" className="btn-primary flex items-center gap-1.5 text-sm px-4 py-2" data-testid="subscription-btn">
              <Crown size={13} strokeWidth={1.5} /> Abo
            </Link>
            <Link to="/messages" className="btn-secondary flex items-center gap-1.5 text-sm px-4 py-2">
              <MessageSquare size={13} strokeWidth={1.5} /> Nachrichten
            </Link>
            <Link to={`/studios/${studio?.studio_id}`} className="btn-secondary text-sm px-4 py-2">
              Profil ansehen
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Buchungen", value: stats?.total_bookings || 0, icon: <Calendar size={16} strokeWidth={1.5} /> },
            { label: "Ausstehend", value: stats?.pending_bookings || 0, icon: <Clock size={16} strokeWidth={1.5} /> },
            { label: "Bestätigt", value: stats?.confirmed_bookings || 0, icon: <CheckCircle size={16} strokeWidth={1.5} /> },
            { label: "Einnahmen", value: `€${(stats?.revenue || 0).toFixed(0)}`, icon: <TrendingUp size={16} strokeWidth={1.5} /> }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-4">
              <div className="text-zinc-400 mb-2">{stat.icon}</div>
              <p className="text-2xl font-playfair font-semibold text-zinc-900">{stat.value}</p>
              <p className="text-xs text-zinc-500 font-inter mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-2xl border border-black/[0.04] shadow-[0_2px_10px_rgb(0,0,0,0.04)] p-1.5 w-fit overflow-x-auto">
          {[
            { id: "overview", label: "Übersicht" },
            { id: "slots", label: "Slots" },
            { id: "bookings", label: `Buchungen (${stats?.total_bookings || 0})` },
            { id: "artists", label: "Artists" },
            { id: "profile", label: "Profil" }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-inter font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}`}
              data-testid={`studio-tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Heutige Termine */}
            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="font-playfair font-semibold text-lg text-zinc-900">Heutige Termine</h3>
                <span className="text-xs font-inter font-medium text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{todayUpcoming.length}</span>
              </div>
              {todayUpcoming.length === 0 ? (
                <p className="text-zinc-400 font-inter text-sm">Keine Termine heute</p>
              ) : (
                <div className="space-y-3">
                  {todayUpcoming.map(b => (
                    <div key={b.booking_id} className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
                      <div>
                        <p className="font-inter font-semibold text-sm text-zinc-900">{b.user_name}</p>
                        <p className="text-xs text-zinc-500 font-inter mt-0.5">{b.start_time} – {b.end_time} · {b.booking_type === "consultation" ? "Beratung" : "Tattoo"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-inter ${statusColors[b.status]}`}>{b.status === "pending" ? "Ausstehend" : "Bestätigt"}</span>
                        {b.status === "pending" && (
                          <button onClick={() => handleConfirmBooking(b.booking_id)} className="text-xs px-3 py-1.5 bg-zinc-900 text-white rounded-full font-inter hover:bg-zinc-700 transition-colors" data-testid={`confirm-btn-${b.booking_id}`}>Bestätigen</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kommende Termine */}
            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <h3 className="font-playfair font-semibold text-lg mb-4 text-zinc-900">Kommende Termine</h3>
              {futureUpcoming.length === 0 ? (
                <p className="text-zinc-400 font-inter text-sm">Keine kommenden Buchungen</p>
              ) : (
                <div className="space-y-3">
                  {futureUpcoming.map(b => (
                    <div key={b.booking_id} className="flex items-center justify-between p-3.5 bg-zinc-50 rounded-xl border border-zinc-100">
                      <div>
                        <p className="font-inter font-semibold text-sm text-zinc-900">{b.user_name}</p>
                        <p className="text-xs text-zinc-500 font-inter mt-0.5">{b.date ? new Date(b.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""} · {b.start_time} – {b.end_time} · {b.booking_type === "consultation" ? "Beratung" : "Tattoo"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-inter ${statusColors[b.status]}`}>{b.status === "pending" ? "Ausstehend" : "Bestätigt"}</span>
                        {b.status === "pending" && (
                          <button onClick={() => handleConfirmBooking(b.booking_id)} className="text-xs px-3 py-1.5 bg-zinc-900 text-white rounded-full font-inter hover:bg-zinc-700 transition-colors" data-testid={`confirm-btn-${b.booking_id}`}>Bestätigen</button>
                        )}
                        {["pending", "confirmed"].includes(b.status) && (
                          <button onClick={async () => { if (!window.confirm("Buchung stornieren?")) return; try { await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/${b.booking_id}/status`, null, { params: { status: "cancelled" }, withCredentials: true }); fetchStats(); } catch {} }}
                            className="text-xs px-3 py-1.5 border border-zinc-200 text-zinc-500 rounded-full font-inter hover:border-red-300 hover:text-red-600 transition-all"
                            data-testid={`cancel-btn-overview-${b.booking_id}`}>Stornieren</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Slots Tab */}
        {activeTab === "slots" && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowAddSlot(!showAddSlot)} className="btn-primary flex items-center gap-2 text-sm" data-testid="add-slot-btn">
                <Plus size={15} strokeWidth={1.5} /> Slot hinzufügen
              </button>
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
                      <option value="consultation">Beratung</option><option value="tattoo">Tattoo</option><option value="full_day">Ganzer Tag</option>
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
                <div className="py-12 text-center"><p className="text-zinc-400 font-inter text-sm">Keine Slots vorhanden</p></div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {slots.slice(0, 30).map(slot => (
                    <div key={slot.slot_id} className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors" data-testid={`slot-item-${slot.slot_id}`}>
                      <div>
                        <p className="font-inter font-medium text-sm text-zinc-900">{slot.date ? new Date(slot.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""}</p>
                        <p className="text-xs text-zinc-500 font-inter mt-0.5">{slot.start_time} – {slot.end_time} · {slot.slot_type === "consultation" ? "Beratung" : slot.slot_type === "full_day" ? "Ganzer Tag" : "Tattoo"}</p>
                      </div>
                      <button onClick={() => handleDeleteSlot(slot.slot_id)} className="p-2 rounded-xl text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all" data-testid={`delete-slot-btn-${slot.slot_id}`}>
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="space-y-5">
            {/* Sub-tabs */}
            <div className="flex gap-1 bg-white rounded-2xl border border-black/[0.04] shadow-[0_2px_10px_rgb(0,0,0,0.04)] p-1.5 w-fit">
              {[
                { id: "active", label: `Aktuelle Buchungen (${activeBookings.length})` },
                { id: "past", label: `Vergangene Termine (${pastStudioBookings.length})` }
              ].map(t => (
                <button key={t.id} onClick={() => setStudioBookingsTab(t.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-inter font-medium transition-all whitespace-nowrap ${studioBookingsTab === t.id ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}`}
                  data-testid={`studio-bookings-${t.id}-tab`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="divide-y divide-zinc-50">
                {(studioBookingsTab === "active" ? activeBookings : pastStudioBookings).length === 0 ? (
                  <div className="py-12 text-center"><p className="text-zinc-400 font-inter text-sm">Keine Buchungen vorhanden</p></div>
                ) : (studioBookingsTab === "active" ? activeBookings : pastStudioBookings).map(b => {
                  const isPast = isBookingPast(b);
                  return (
                    <div key={b.booking_id} className={`p-5 hover:bg-zinc-50 transition-colors ${isPast ? "opacity-70" : ""}`} data-testid={`studio-booking-${b.booking_id}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-inter font-semibold text-zinc-900">{b.user_name}</p>
                          <p className="text-sm text-zinc-500 font-inter">{b.user_email}</p>
                          <p className="text-xs text-zinc-400 font-inter mt-1">{b.date ? new Date(b.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""} · {b.start_time} – {b.end_time} · {b.booking_type === "consultation" ? "Beratung" : "Tattoo"}</p>
                          {b.notes && <p className="text-xs text-zinc-400 font-inter mt-1 italic">"{b.notes}"</p>}
                          {b.reference_images?.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {b.reference_images.slice(0, 3).map((img, i) => (
                                <img key={i} src={img} alt="" className="w-12 h-12 object-cover rounded-xl border border-zinc-200" />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {isPast && b.status === "confirmed" ? (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200 font-inter flex items-center gap-1">
                              <CheckCircle size={10} strokeWidth={2} className="text-zinc-400" /> Abgeschlossen
                            </span>
                          ) : (
                            <span className={`text-xs px-2.5 py-1 rounded-full border font-inter ${statusColors[b.status] || statusColors.pending}`}>
                              {b.status === "pending" ? "Ausstehend" : b.status === "confirmed" ? "Bestätigt" : "Abgesagt"}
                            </span>
                          )}
                          {b.status === "pending" && !isPast && (
                            <button onClick={() => handleConfirmBooking(b.booking_id)} className="text-xs px-3 py-1.5 bg-zinc-900 text-white rounded-full font-inter hover:bg-zinc-700 transition-colors" data-testid={`confirm-booking-studio-${b.booking_id}`}>Bestätigen</button>
                          )}
                          {/* Stornieren: nur aktive, ausgegraut wenn vergangen */}
                          {["pending", "confirmed"].includes(b.status) && (
                            <button
                              disabled={isPast}
                              onClick={async () => {
                                if (isPast) return;
                                if (!window.confirm("Buchung wirklich stornieren?")) return;
                                try {
                                  await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/bookings/${b.booking_id}/status`, null, {
                                    params: { status: "cancelled" }, withCredentials: true
                                  });
                                  fetchStats();
                                } catch {}
                              }}
                              className={`text-xs px-3 py-1.5 rounded-full font-inter transition-all ${
                                isPast
                                  ? "border border-zinc-100 text-zinc-300 bg-zinc-50 cursor-not-allowed"
                                  : "border border-zinc-200 text-zinc-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50"
                              }`}
                              title={isPast ? "Termin bereits abgeschlossen" : "Buchung stornieren"}
                              data-testid={`cancel-booking-studio-${b.booking_id}`}
                            >
                              Stornieren
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Artists Tab */}
        {activeTab === "artists" && stats?.studio && (
          <ArtistsTab studioId={stats.studio.studio_id} />
        )}

        {/* Profile Edit Tab */}
        {activeTab === "profile" && editForm && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
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
              <h3 className="font-playfair font-semibold text-lg mb-4 text-zinc-900">Anzahlung</h3>
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setEditForm(prev => ({ ...prev, deposit_required: !prev.deposit_required }))}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${editForm?.deposit_required ? "bg-zinc-900" : "bg-zinc-200"}`}
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

            <button type="submit" disabled={editLoading} className="btn-primary flex items-center gap-2 disabled:opacity-50" data-testid="save-profile-btn">
              <Save size={15} strokeWidth={1.5} /> {editLoading ? "Speichern..." : "Profil speichern"}
            </button>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}
