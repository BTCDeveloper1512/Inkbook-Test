import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
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
  const [subscription, setSubscription] = useState(null);

  useEffect(() => { fetchStats(); fetchSubscription(); }, []);

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
    <div className="min-h-screen bg-white"><Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );

  if (!stats?.has_studio && !showCreateStudio) {
    return (
      <div className="min-h-screen bg-white"><Navbar />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-playfair font-bold mb-4">Studio erstellen</h2>
          <p className="text-gray-500 font-outfit mb-8">Richte dein Studio-Profil ein und starte mit Buchungen.</p>
          <button onClick={() => setShowCreateStudio(true)} className="px-8 py-3 bg-black text-white font-outfit hover:bg-neutral-800 transition-colors" data-testid="create-studio-btn">
            Studio erstellen
          </button>
        </div>
      </div>
    );
  }

  if (showCreateStudio) {
    return (
      <div className="min-h-screen bg-white"><Navbar />
        <div className="max-w-2xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-playfair font-bold mb-8">Studio erstellen</h2>
          <form onSubmit={handleCreateStudio} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Studio-Name *</label>
              <input type="text" value={studioForm.name} onChange={e => setStudioForm({...studioForm, name: e.target.value})} required className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit" data-testid="studio-name-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Beschreibung *</label>
              <textarea value={studioForm.description} onChange={e => setStudioForm({...studioForm, description: e.target.value})} required rows={3} className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit resize-none" data-testid="studio-description-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Adresse *</label>
                <input type="text" value={studioForm.address} onChange={e => setStudioForm({...studioForm, address: e.target.value})} required className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit" data-testid="studio-address-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Stadt *</label>
                <input type="text" value={studioForm.city} onChange={e => setStudioForm({...studioForm, city: e.target.value})} required className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit" data-testid="studio-city-input" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Tattoo-Stile</label>
              <div className="flex flex-wrap gap-2">
                {STYLES_LIST.map(s => (
                  <button key={s} type="button" onClick={() => toggleCreateStyle(s)} className={`px-3 py-1.5 text-xs border font-outfit transition-colors ${studioForm.styles.includes(s) ? "bg-black text-white border-black" : "border-gray-300 hover:border-black"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Telefon</label>
                <input type="text" value={studioForm.phone} onChange={e => setStudioForm({...studioForm, phone: e.target.value})} className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit" />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Preisklasse</label>
                <select value={studioForm.price_range} onChange={e => setStudioForm({...studioForm, price_range: e.target.value})} className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit bg-white" data-testid="studio-price-select">
                  <option value="budget">Günstig</option><option value="medium">Mittel</option><option value="premium">Premium</option><option value="luxury">Luxus</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-black text-white font-outfit hover:bg-neutral-800" data-testid="submit-create-studio-btn">Studio erstellen</button>
          </form>
        </div>
      </div>
    );
  }

  const studio = stats?.studio;
  const upcomingBookings = stats?.upcoming_bookings || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs tracking-widest uppercase text-gray-400 font-outfit mb-1">Studio Dashboard</p>
            <h1 className="text-3xl font-playfair font-bold text-black">{studio?.name}</h1>
            {subscription?.status === "active" && (
              <span className="inline-flex items-center gap-1 mt-1 text-xs bg-black text-white px-2 py-0.5 font-outfit capitalize">
                <Crown size={10} /> {subscription.plan} Plan
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Link to="/subscription" className="px-3 py-2 bg-black text-white text-sm font-outfit hover:bg-neutral-800 transition-colors flex items-center gap-1" data-testid="subscription-btn">
              <Crown size={14} /> Abo
            </Link>
            <Link to="/messages" className="px-3 py-2 border border-gray-300 text-sm font-outfit hover:border-black transition-colors flex items-center gap-2">
              <MessageSquare size={14} /> Nachrichten
            </Link>
            <Link to={`/studios/${studio?.studio_id}`} className="px-4 py-2 border border-gray-300 text-sm font-outfit hover:border-black transition-colors">
              Profil ansehen
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Buchungen", value: stats?.total_bookings || 0, icon: <Calendar size={18} />, color: "text-blue-600" },
            { label: "Ausstehend", value: stats?.pending_bookings || 0, icon: <Clock size={18} />, color: "text-amber-600" },
            { label: "Bestätigt", value: stats?.confirmed_bookings || 0, icon: <CheckCircle size={18} />, color: "text-green-600" },
            { label: "Einnahmen", value: `€${(stats?.revenue || 0).toFixed(0)}`, icon: <TrendingUp size={18} />, color: "text-purple-600" }
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-gray-200 p-4">
              <div className={`flex items-center gap-2 mb-2 ${stat.color}`}>{stat.icon}</div>
              <p className="text-2xl font-playfair font-bold">{stat.value}</p>
              <p className="text-xs text-gray-500 font-outfit mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-gray-200 p-1 overflow-x-auto">
          {[
            { id: "overview", label: "Übersicht" },
            { id: "slots", label: "Slots" },
            { id: "bookings", label: `Buchungen (${stats?.total_bookings || 0})` },
            { id: "artists", label: "Artists" },
            { id: "profile", label: "Profil bearbeiten" }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-shrink-0 px-3 py-2 text-sm font-outfit transition-colors whitespace-nowrap ${activeTab === tab.id ? "bg-black text-white" : "text-gray-500 hover:text-black"}`} data-testid={`studio-tab-${tab.id}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="font-playfair font-bold mb-4">Kommende Termine</h3>
            {upcomingBookings.length === 0 ? (
              <p className="text-gray-500 font-outfit text-sm">Keine kommenden Buchungen</p>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map(b => (
                  <div key={b.booking_id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100">
                    <div>
                      <p className="font-outfit font-semibold text-sm">{b.user_name}</p>
                      <p className="text-xs text-gray-500 font-outfit">{b.date} • {b.start_time} – {b.end_time} • {b.booking_type === "consultation" ? "Beratung" : "Tattoo"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 border font-outfit ${statusColors[b.status]}`}>{b.status === "pending" ? "Ausstehend" : "Bestätigt"}</span>
                      {b.status === "pending" && (
                        <button onClick={() => handleConfirmBooking(b.booking_id)} className="text-xs px-3 py-1 bg-black text-white font-outfit hover:bg-neutral-800" data-testid={`confirm-btn-${b.booking_id}`}>Bestätigen</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Slots Tab */}
        {activeTab === "slots" && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowAddSlot(!showAddSlot)} className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-outfit hover:bg-neutral-800" data-testid="add-slot-btn">
                <Plus size={16} /> Slot hinzufügen
              </button>
            </div>
            {showAddSlot && (
              <form onSubmit={handleAddSlot} className="bg-white border border-gray-200 p-6 mb-6 space-y-4">
                <h3 className="font-playfair font-bold">Neuen Slot erstellen</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Datum</label>
                    <input type="date" value={slotForm.date} onChange={e => setSlotForm({...slotForm, date: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit" data-testid="slot-date-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Von</label>
                    <input type="time" value={slotForm.start_time} onChange={e => setSlotForm({...slotForm, start_time: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit" data-testid="slot-start-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Bis</label>
                    <input type="time" value={slotForm.end_time} onChange={e => setSlotForm({...slotForm, end_time: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit" data-testid="slot-end-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Art</label>
                    <select value={slotForm.slot_type} onChange={e => setSlotForm({...slotForm, slot_type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit bg-white" data-testid="slot-type-select">
                      <option value="consultation">Beratung</option><option value="tattoo">Tattoo</option><option value="full_day">Ganzer Tag</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={slotLoading} className="px-6 py-2 bg-black text-white text-sm font-outfit hover:bg-neutral-800 disabled:opacity-50" data-testid="submit-slot-btn">{slotLoading ? "..." : "Slot erstellen"}</button>
                  <button type="button" onClick={() => setShowAddSlot(false)} className="px-6 py-2 border border-gray-300 text-sm font-outfit hover:border-black">Abbrechen</button>
                </div>
              </form>
            )}
            <div className="bg-white border border-gray-200">
              {slots.length === 0 ? (
                <div className="py-12 text-center"><p className="text-gray-400 font-outfit text-sm">Keine Slots vorhanden</p></div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {slots.slice(0, 30).map(slot => (
                    <div key={slot.slot_id} className="flex items-center justify-between p-4 hover:bg-gray-50" data-testid={`slot-item-${slot.slot_id}`}>
                      <div>
                        <p className="font-outfit font-medium text-sm">{slot.date}</p>
                        <p className="text-xs text-gray-500 font-outfit">{slot.start_time} – {slot.end_time} • {slot.slot_type === "consultation" ? "Beratung" : slot.slot_type === "full_day" ? "Ganzer Tag" : "Tattoo"}</p>
                      </div>
                      <button onClick={() => handleDeleteSlot(slot.slot_id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" data-testid={`delete-slot-btn-${slot.slot_id}`}>
                        <Trash2 size={15} />
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
          <div className="bg-white border border-gray-200">
            <div className="divide-y divide-gray-100">
              {upcomingBookings.length === 0 ? (
                <div className="py-12 text-center"><p className="text-gray-400 font-outfit text-sm">Keine Buchungen vorhanden</p></div>
              ) : upcomingBookings.map(b => (
                <div key={b.booking_id} className="p-5 hover:bg-gray-50" data-testid={`studio-booking-${b.booking_id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-outfit font-semibold">{b.user_name}</p>
                      <p className="text-sm text-gray-600 font-outfit">{b.user_email}</p>
                      <p className="text-xs text-gray-400 font-outfit mt-1">{b.date} • {b.start_time} – {b.end_time} • {b.booking_type === "consultation" ? "Beratung" : "Tattoo"}</p>
                      {b.notes && <p className="text-xs text-gray-500 font-outfit mt-1 italic">"{b.notes}"</p>}
                      {b.reference_images?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {b.reference_images.slice(0, 3).map((img, i) => (
                            <img key={i} src={img} alt="" className="w-12 h-12 object-cover border border-gray-200" />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-0.5 border font-outfit ${statusColors[b.status]}`}>{b.status === "pending" ? "Ausstehend" : b.status === "confirmed" ? "Bestätigt" : "Abgesagt"}</span>
                      {b.status === "pending" && (
                        <button onClick={() => handleConfirmBooking(b.booking_id)} className="text-xs px-3 py-1 bg-black text-white font-outfit hover:bg-neutral-800" data-testid={`confirm-booking-studio-${b.booking_id}`}>Bestätigen</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm font-outfit flex items-center gap-2" data-testid="profile-save-success">
                <CheckCircle size={16} /> Profil erfolgreich gespeichert!
              </div>
            )}

            <div className="bg-white border border-gray-200 p-6">
              <h3 className="font-playfair font-bold text-lg mb-5">Grunddaten</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Studio-Name</label>
                  <input type="text" value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit" data-testid="edit-studio-name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Stadt</label>
                  <input type="text" value={editForm.city || ""} onChange={e => setEditForm({...editForm, city: e.target.value})} className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit" data-testid="edit-studio-city" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Adresse</label>
                  <input type="text" value={editForm.address || ""} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit" data-testid="edit-studio-address" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Beschreibung</label>
                  <textarea value={editForm.description || ""} onChange={e => setEditForm({...editForm, description: e.target.value})} rows={4} className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit resize-none" data-testid="edit-studio-description" />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Telefon</label>
                  <input type="text" value={editForm.phone || ""} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit" />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">E-Mail</label>
                  <input type="email" value={editForm.email || ""} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit" data-testid="edit-studio-email" />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Website</label>
                  <input type="text" value={editForm.website || ""} onChange={e => setEditForm({...editForm, website: e.target.value})} className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit" />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">Preisklasse</label>
                  <select value={editForm.price_range || "medium"} onChange={e => setEditForm({...editForm, price_range: e.target.value})} className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit bg-white" data-testid="edit-price-range">
                    <option value="budget">Günstig</option><option value="medium">Mittel</option><option value="premium">Premium</option><option value="luxury">Luxus</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Styles */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="font-playfair font-bold text-lg mb-4">Tattoo-Stile</h3>
              <div className="flex flex-wrap gap-2">
                {STYLES_LIST.map(s => (
                  <button key={s} type="button" onClick={() => toggleStyle(s)} className={`px-3 py-1.5 text-xs border font-outfit transition-colors ${editForm.styles?.includes(s) ? "bg-black text-white border-black" : "border-gray-300 hover:border-black"}`} data-testid={`style-toggle-${s}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Gallery */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="font-playfair font-bold text-lg mb-4">Galerie</h3>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                {editForm.images?.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} alt="" className="w-full h-20 object-cover border border-gray-200" />
                    <button type="button" onClick={() => setEditForm(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))} className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} />
                    </button>
                  </div>
                ))}
                <label className={`h-20 border-2 border-dashed border-gray-300 hover:border-black flex flex-col items-center justify-center cursor-pointer transition-colors ${uploadingImg ? "opacity-50" : ""}`}>
                  <Upload size={18} className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-400 font-outfit">{uploadingImg ? "..." : "Upload"}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImg} data-testid="gallery-upload-input" />
                </label>
              </div>
            </div>

            <button type="submit" disabled={editLoading} className="px-8 py-3 bg-black text-white font-outfit hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2" data-testid="save-profile-btn">
              <Save size={16} /> {editLoading ? "Speichern..." : "Profil speichern"}
            </button>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}
