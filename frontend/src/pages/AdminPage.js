import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Users, Store, Calendar, DollarSign, TrendingUp,
  CheckCircle, XCircle, AlertCircle, Search, Trash2, ToggleLeft,
  ToggleRight, Eye, Crown, Shield, ChevronDown, Activity
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const pageAnim = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } };

const statusBadge = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-zinc-100 text-zinc-500 border-zinc-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
};

const TABS = [
  { id: "overview", label: "Übersicht", icon: BarChart3 },
  { id: "studios", label: "Studios", icon: Store },
  { id: "users", label: "Nutzer", icon: Users },
  { id: "bookings", label: "Buchungen", icon: Calendar },
];

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [studios, setStudios] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchStudios, setSearchStudios] = useState("");
  const [searchUsers, setSearchUsers] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.role !== "admin") { navigate("/"); return; }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, studiosRes, usersRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { withCredentials: true }),
        axios.get(`${API}/admin/studios`, { withCredentials: true }),
        axios.get(`${API}/admin/users`, { withCredentials: true }),
      ]);
      setStats(statsRes.data);
      setStudios(studiosRes.data);
      setUsers(usersRes.data);
    } catch (e) {
      if (e.response?.status === 403) navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const toggleStudioStatus = async (studio) => {
    setActionLoading(studio.studio_id);
    try {
      await axios.patch(`${API}/admin/studios/${studio.studio_id}`, {
        is_active: !studio.is_active
      }, { withCredentials: true });
      setStudios(prev => prev.map(s => s.studio_id === studio.studio_id ? { ...s, is_active: !s.is_active } : s));
    } finally { setActionLoading(""); }
  };

  const toggleVerified = async (studio) => {
    setActionLoading(`v_${studio.studio_id}`);
    try {
      await axios.patch(`${API}/admin/studios/${studio.studio_id}`, {
        is_verified: !studio.is_verified
      }, { withCredentials: true });
      setStudios(prev => prev.map(s => s.studio_id === studio.studio_id ? { ...s, is_verified: !s.is_verified } : s));
    } finally { setActionLoading(""); }
  };

  const deleteStudio = async (studioId) => {
    if (!window.confirm("Studio wirklich löschen? Diese Aktion ist nicht rückgängig zu machen.")) return;
    setActionLoading(`del_${studioId}`);
    try {
      await axios.delete(`${API}/admin/studios/${studioId}`, { withCredentials: true });
      setStudios(prev => prev.filter(s => s.studio_id !== studioId));
      if (stats) setStats(prev => ({ ...prev, total_studios: prev.total_studios - 1 }));
    } finally { setActionLoading(""); }
  };

  const filteredStudios = studios.filter(s =>
    s.name?.toLowerCase().includes(searchStudios.toLowerCase()) ||
    s.city?.toLowerCase().includes(searchStudios.toLowerCase())
  );
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchUsers.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchUsers.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  const statCards = [
    { label: "Studios gesamt", value: stats?.total_studios || 0, sub: `${stats?.active_studios || 0} aktiv`, icon: Store, color: "text-zinc-900" },
    { label: "Nutzer gesamt", value: stats?.total_users || 0, sub: `${stats?.customers || 0} Kunden · ${stats?.studio_owners || 0} Studios`, icon: Users, color: "text-zinc-900" },
    { label: "Buchungen", value: stats?.total_bookings || 0, sub: `${stats?.confirmed_bookings || 0} bestätigt`, icon: Calendar, color: "text-zinc-900" },
    { label: "Aktive Abos", value: stats?.active_subscriptions || 0, sub: `${stats?.total_revenue ? `€${stats.total_revenue.toLocaleString("de-DE")} Umsatz` : "—"}`, icon: Crown, color: "text-zinc-900" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Header */}
        <motion.div {...pageAnim} className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-zinc-400 font-inter mb-1 flex items-center gap-2">
              <Shield size={12} /> Admin Panel
            </p>
            <h1 className="text-3xl font-playfair font-semibold text-zinc-900">InkBook Operator Dashboard</h1>
          </div>
          <button onClick={fetchAll} className="btn-secondary flex items-center gap-2 text-sm" data-testid="admin-refresh-btn">
            <Activity size={14} /> Aktualisieren
          </button>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-white rounded-2xl p-1.5 border border-black/[0.04] shadow-[0_2px_10px_rgb(0,0,0,0.04)] w-fit">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`admin-tab-${tab.id}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-inter font-medium transition-all duration-200 ${
                  activeTab === tab.id ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                <Icon size={14} strokeWidth={1.5} /> {tab.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="admin-stats-grid">
                {statCards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5"
                      data-testid={`stat-card-${i}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Icon size={18} strokeWidth={1.5} className="text-zinc-400" />
                        <TrendingUp size={12} className="text-emerald-500" />
                      </div>
                      <p className="text-3xl font-playfair font-semibold text-zinc-900 mb-1">{card.value}</p>
                      <p className="text-xs font-inter text-zinc-500">{card.label}</p>
                      <p className="text-xs font-inter text-zinc-400 mt-0.5">{card.sub}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Revenue Banner */}
              <div className="bg-zinc-900 rounded-2xl p-6 mb-8 flex items-center justify-between" data-testid="revenue-banner">
                <div>
                  <p className="text-xs tracking-[0.2em] uppercase text-zinc-400 font-inter mb-1">Gesamtumsatz (bezahlte Transaktionen)</p>
                  <p className="text-4xl font-playfair text-white">€{(stats?.total_revenue || 0).toLocaleString("de-DE", { minimumFractionDigits: 2 })}</p>
                </div>
                <DollarSign size={48} className="text-zinc-600" strokeWidth={1} />
              </div>

              {/* Recent Bookings */}
              <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100">
                  <h3 className="font-inter font-semibold text-zinc-900">Letzte Buchungen</h3>
                </div>
                <div className="divide-y divide-zinc-50">
                  {(stats?.recent_bookings || []).length === 0 ? (
                    <div className="py-10 text-center text-zinc-400 font-inter text-sm">Keine Buchungen vorhanden</div>
                  ) : (
                    (stats?.recent_bookings || []).map((b, i) => (
                      <div key={i} className="px-6 py-3.5 flex items-center justify-between hover:bg-zinc-50 transition-colors" data-testid={`recent-booking-${i}`}>
                        <div>
                          <p className="text-sm font-inter font-medium text-zinc-800">{b.studio_name || "—"}</p>
                          <p className="text-xs text-zinc-400 font-inter">{b.date} · {b.booking_type === "consultation" ? "Beratung" : "Session"}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-inter ${statusBadge[b.status] || statusBadge.pending}`}>
                          {b.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Studios ── */}
          {activeTab === "studios" && (
            <motion.div key="studios" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={searchStudios}
                    onChange={e => setSearchStudios(e.target.value)}
                    placeholder="Studio oder Stadt suchen..."
                    className="pl-9 pr-4 py-2.5 w-full bg-white border border-zinc-200 rounded-xl text-sm font-inter focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                    data-testid="admin-studio-search"
                  />
                </div>
                <span className="text-sm text-zinc-400 font-inter">{filteredStudios.length} Studios</span>
              </div>

              <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden" data-testid="admin-studios-table">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        {["Studio", "Stadt", "Abo", "Buchungen", "Status", "Aktionen"].map(h => (
                          <th key={h} className="px-5 py-3.5 text-left text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {filteredStudios.map(studio => (
                        <tr key={studio.studio_id} className="hover:bg-zinc-50 transition-colors group" data-testid={`studio-row-${studio.studio_id}`}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-zinc-100 rounded-xl overflow-hidden flex-shrink-0">
                                {studio.images?.[0] ? (
                                  <img src={studio.images[0]} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-400"><Store size={14} /></div>
                                )}
                              </div>
                              <div>
                                <p className="font-inter font-medium text-zinc-900 text-sm">{studio.name}</p>
                                {studio.is_verified && (
                                  <span className="text-xs text-emerald-600 font-inter flex items-center gap-0.5">
                                    <CheckCircle size={10} /> Verifiziert
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-zinc-600 font-inter">{studio.city}</td>
                          <td className="px-5 py-4">
                            {studio.subscription ? (
                              <span className={`text-xs px-2 py-1 rounded-full border font-inter ${statusBadge[studio.subscription.status] || statusBadge.inactive}`}>
                                {studio.subscription.plan} · {studio.subscription.status}
                              </span>
                            ) : (
                              <span className="text-xs text-zinc-400 font-inter">Kein Abo</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-sm font-inter text-zinc-600">{studio.booking_count || 0}</td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => toggleStudioStatus(studio)}
                              disabled={actionLoading === studio.studio_id}
                              className="flex items-center gap-1.5 text-sm font-inter transition-colors"
                              data-testid={`toggle-studio-${studio.studio_id}`}
                            >
                              {studio.is_active ? (
                                <><ToggleRight size={18} className="text-emerald-500" /> <span className="text-emerald-600">Aktiv</span></>
                              ) : (
                                <><ToggleLeft size={18} className="text-zinc-400" /> <span className="text-zinc-500">Inaktiv</span></>
                              )}
                            </button>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => toggleVerified(studio)}
                                disabled={actionLoading === `v_${studio.studio_id}`}
                                title={studio.is_verified ? "Verifizierung entfernen" : "Verifizieren"}
                                className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
                                data-testid={`verify-studio-${studio.studio_id}`}
                              >
                                <Shield size={14} />
                              </button>
                              <Link to={`/studios/${studio.studio_id}`} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors" data-testid={`view-studio-${studio.studio_id}`}>
                                <Eye size={14} />
                              </Link>
                              <button
                                onClick={() => deleteStudio(studio.studio_id)}
                                disabled={actionLoading === `del_${studio.studio_id}`}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
                                data-testid={`delete-studio-${studio.studio_id}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredStudios.length === 0 && (
                  <div className="py-12 text-center text-zinc-400 font-inter text-sm">Keine Studios gefunden</div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Users ── */}
          {activeTab === "users" && (
            <motion.div key="users" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={searchUsers}
                    onChange={e => setSearchUsers(e.target.value)}
                    placeholder="Name oder E-Mail suchen..."
                    className="pl-9 pr-4 py-2.5 w-full bg-white border border-zinc-200 rounded-xl text-sm font-inter focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                    data-testid="admin-user-search"
                  />
                </div>
                <span className="text-sm text-zinc-400 font-inter">{filteredUsers.length} Nutzer</span>
              </div>

              <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden" data-testid="admin-users-table">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        {["Name", "E-Mail", "Rolle", "Registriert", "Auth"].map(h => (
                          <th key={h} className="px-5 py-3.5 text-left text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {filteredUsers.map((u, i) => (
                        <tr key={i} className="hover:bg-zinc-50 transition-colors" data-testid={`user-row-${i}`}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs font-bold font-inter">
                                {u.name?.[0]?.toUpperCase() || "?"}
                              </div>
                              <span className="text-sm font-inter font-medium text-zinc-900">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-zinc-600 font-inter">{u.email}</td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs px-2 py-1 rounded-full border font-inter ${
                              u.role === "admin" ? "bg-zinc-900 text-white border-zinc-900" :
                              u.role === "studio_owner" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-blue-50 text-blue-700 border-blue-200"
                            }`}>
                              {u.role === "admin" ? "Admin" : u.role === "studio_owner" ? "Studio-Inhaber" : "Kunde"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-zinc-400 font-inter">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString("de-DE") : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-zinc-400 font-inter">{u.auth_provider || "email"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length === 0 && (
                  <div className="py-12 text-center text-zinc-400 font-inter text-sm">Keine Nutzer gefunden</div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Bookings ── */}
          {activeTab === "bookings" && (
            <motion.div key="bookings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { label: "Ausstehend", value: stats?.pending_bookings || 0, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
                  { label: "Bestätigt", value: stats?.confirmed_bookings || 0, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                  { label: "Gesamt", value: stats?.total_bookings || 0, color: "text-zinc-900", bg: "bg-white", border: "border-zinc-100" },
                ].map((item, i) => (
                  <div key={i} className={`${item.bg} ${item.border} border rounded-2xl p-5`}>
                    <p className={`text-3xl font-playfair font-semibold ${item.color}`}>{item.value}</p>
                    <p className="text-xs font-inter text-zinc-500 mt-1">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100">
                  <h3 className="font-inter font-semibold text-zinc-900">Letzte 10 Buchungen</h3>
                </div>
                {(stats?.recent_bookings || []).length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 font-inter text-sm">Keine Buchungen vorhanden</div>
                ) : (
                  <div className="divide-y divide-zinc-50">
                    {(stats?.recent_bookings || []).map((b, i) => (
                      <div key={i} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-zinc-50 transition-colors">
                        <div>
                          <p className="text-sm font-inter font-medium text-zinc-900">{b.studio_name || "—"}</p>
                          <p className="text-xs text-zinc-400 font-inter">{b.date} · {b.start_time} – {b.end_time}</p>
                          <p className="text-xs text-zinc-400 font-inter mt-0.5">{b.booking_type === "consultation" ? "Beratung" : "Session"}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className={`text-xs px-2.5 py-1 rounded-full border font-inter ${statusBadge[b.status] || statusBadge.pending}`}>
                            {b.status}
                          </span>
                          <span className="text-xs text-zinc-400 font-inter">{b.payment_status === "paid" ? "✓ Bezahlt" : "—"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
