import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Users, Store, Calendar, DollarSign, TrendingUp, Crown, Shield,
  Star, Mail, Bell, Flag, LifeBuoy, Megaphone, HelpCircle, Activity,
  CheckCircle, XCircle, Search, Trash2, ToggleLeft, ToggleRight, Eye,
  Plus, Edit2, Send, X, ChevronRight, AlertCircle, MessageSquare, Loader2,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ax = () => axios.create({ withCredentials: true });

const statusBadge = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-zinc-100 text-zinc-500 border-zinc-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  open: "bg-red-50 text-red-700 border-red-200",
  dismissed: "bg-zinc-100 text-zinc-400 border-zinc-200",
  expired: "bg-zinc-100 text-zinc-400 border-zinc-200",
};

const SIDEBAR = [
  { group: "Übersicht",       items: [{ id: "overview",        label: "Dashboard",       icon: BarChart3 }] },
  { group: "Plattform",       items: [
    { id: "studios",           label: "Studios",          icon: Store },
    { id: "users",             label: "Nutzer",           icon: Users },
    { id: "bookings",          label: "Buchungen",        icon: Calendar },
  ]},
  { group: "Finanzen",        items: [
    { id: "subscriptions",     label: "Abonnements",      icon: Crown },
    { id: "revenue",           label: "Einnahmen",        icon: DollarSign },
  ]},
  { group: "Content",         items: [
    { id: "reviews",           label: "Bewertungen",      icon: Star },
    { id: "faq",               label: "FAQ",              icon: HelpCircle },
    { id: "announcements",     label: "Ankündigungen",    icon: Bell },
  ]},
  { group: "Kommunikation",   items: [
    { id: "newsletter",        label: "Newsletter",       icon: Mail },
    { id: "broadcast",         label: "Broadcast",        icon: Megaphone },
    { id: "support-tickets",   label: "Support-Tickets",  icon: LifeBuoy },
  ]},
  { group: "Moderation",      items: [
    { id: "reports",           label: "Meldungen",        icon: Flag },
  ]},
];

const Pill = ({ children, type = "neutral" }) => {
  const styles = { neutral: "bg-zinc-100 text-zinc-600 border-zinc-200", ...statusBadge };
  return <span className={`text-xs px-2.5 py-1 rounded-full border font-inter ${styles[type] || styles.neutral}`}>{children}</span>;
};

const SectionCard = ({ title, action, children }) => (
  <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden">
    {(title || action) && (
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
        {title && <h3 className="font-inter font-semibold text-zinc-900">{title}</h3>}
        {action}
      </div>
    )}
    {children}
  </div>
);

const EmptyState = ({ text }) => (
  <div className="py-12 text-center text-zinc-400 font-inter text-sm">{text}</div>
);

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h3 className="font-inter font-semibold text-zinc-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"><X size={15} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const Input = ({ label, ...props }) => (
  <div>
    {label && <label className="block text-xs font-inter font-medium text-zinc-600 mb-1.5">{label}</label>}
    <input className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm font-inter focus:outline-none focus:border-zinc-400 transition-colors" {...props} />
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div>
    {label && <label className="block text-xs font-inter font-medium text-zinc-600 mb-1.5">{label}</label>}
    <textarea className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm font-inter focus:outline-none focus:border-zinc-400 transition-colors resize-none" rows={4} {...props} />
  </div>
);

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  // Data states
  const [stats, setStats] = useState(null);
  const [enhanced, setEnhanced] = useState(null);
  const [studios, setStudios] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [reports, setReports] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [newTickets, setNewTickets] = useState([]);
  const [directChats, setDirectChats] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [supportTab, setSupportTab] = useState("tickets"); // "chats" | "tickets" | "direct"

  // UI states
  const [searchStudios, setSearchStudios] = useState("");
  const [searchUsers, setSearchUsers] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [faqModal, setFaqModal] = useState(null);
  const [faqForm, setFaqForm] = useState({ category: "", question: "", answer: "", order: 0, target_role: "all" });
  const [annForm, setAnnForm] = useState({ text: "", type: "info", link: "", link_label: "" });
  const [nlForm, setNlForm] = useState({ subject: "", content: "", preview_email: "" });
  const [nlResult, setNlResult] = useState(null);
  const [broadcastForm, setBroadcastForm] = useState({ title: "", message: "", target: "all" });
  const [broadcastResult, setBroadcastResult] = useState(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.role !== "admin") { navigate("/"); return; }
    fetchCore();
  }, [user]);

  const fetchCore = async () => {
    setLoading(true);
    try {
      const [statsR, enhR, studiosR, usersR] = await Promise.all([
        ax().get(`${API}/admin/stats`),
        ax().get(`${API}/admin/stats/enhanced`),
        ax().get(`${API}/admin/studios`),
        ax().get(`${API}/admin/users`),
      ]);
      setStats(statsR.data);
      setEnhanced(enhR.data);
      setStudios(studiosR.data);
      setUsers(usersR.data);
    } catch (e) {
      if (e.response?.status === 403) navigate("/");
    } finally { setLoading(false); }
  };

  const lazyFetch = useCallback(async (section) => {
    try {
      if (section === "bookings" && !bookings.length)
        setBookings((await ax().get(`${API}/admin/bookings/all`)).data);
      if (section === "subscriptions" && !subscriptions.length)
        setSubscriptions((await ax().get(`${API}/admin/subscriptions`)).data);
      if (section === "revenue" && !revenue)
        setRevenue((await ax().get(`${API}/admin/revenue`)).data);
      if (section === "reviews" && !reviews.length)
        setReviews((await ax().get(`${API}/admin/reviews`)).data);
      if (section === "faq" && !faqs.length)
        setFaqs((await ax().get(`${API}/faq/public`)).data);
      if (section === "announcements" && !announcements.length)
        setAnnouncements((await ax().get(`${API}/admin/announcements`)).data);
      if (section === "newsletter" && !subscribers.length)
        setSubscribers((await ax().get(`${API}/newsletter/subscribers`)).data.subscribers || []);
      if (section === "reports" && !reports.length)
        setReports((await ax().get(`${API}/admin/reports`)).data);
      if (section === "support-tickets" && !tickets.length)
        setTickets((await ax().get(`${API}/admin/support-tickets`)).data);
      if (section === "support-tickets")
        setNewTickets((await ax().get(`${API}/admin/support-tickets-new`)).data);
      if (section === "support-tickets")
        setDirectChats((await ax().get(`${API}/admin/direct-chats`)).data);
    } catch {}
  }, [bookings.length, subscriptions.length, revenue, reviews.length, faqs.length,
      announcements.length, subscribers.length, reports.length, tickets.length]);

  const switchSection = (id) => { setActiveSection(id); lazyFetch(id); };

  // ── Actions ──────────────────────────────────────────────────────────────
  const toggleStudioStatus = async (studio) => {
    setActionLoading(studio.studio_id);
    await ax().patch(`${API}/admin/studios/${studio.studio_id}`, { is_active: !studio.is_active });
    setStudios(p => p.map(s => s.studio_id === studio.studio_id ? { ...s, is_active: !s.is_active } : s));
    setActionLoading("");
  };
  const toggleVerified = async (studio) => {
    setActionLoading(`v_${studio.studio_id}`);
    await ax().patch(`${API}/admin/studios/${studio.studio_id}`, { is_verified: !studio.is_verified });
    setStudios(p => p.map(s => s.studio_id === studio.studio_id ? { ...s, is_verified: !s.is_verified } : s));
    setActionLoading("");
  };
  const deleteStudio = async (studioId) => {
    if (!window.confirm("Studio wirklich löschen?")) return;
    await ax().delete(`${API}/admin/studios/${studioId}`);
    setStudios(p => p.filter(s => s.studio_id !== studioId));
  };
  const deleteUser = async (userId, name, role) => {
    if (!window.confirm(`"${name}" löschen?${role === "studio_owner" ? "\n\nStudio + Daten werden ebenfalls gelöscht!" : ""}`)) return;
    setActionLoading(`del_user_${userId}`);
    try {
      await ax().delete(`${API}/admin/users/${userId}`);
      setUsers(p => p.filter(u => u.user_id !== userId));
    } catch (e) { alert(e.response?.data?.detail || "Fehler"); }
    setActionLoading("");
  };
  const openUserDetails = async (userId) => {
    setSelectedUser(userId); setUserDetails(null);
    try {
      const r = await ax().get(`${API}/admin/users/${userId}/details`);
      setUserDetails(r.data);
    } catch {}
  };
  const deleteReview = async (reviewId) => {
    if (!window.confirm("Bewertung löschen?")) return;
    await ax().delete(`${API}/admin/reviews/${reviewId}`);
    setReviews(p => p.filter(r => r.review_id !== reviewId));
  };
  const dismissReport = async (reportId) => {
    await ax().patch(`${API}/admin/reports/${reportId}/status`, { status: "dismissed" });
    setReports(p => p.map(r => r.report_id === reportId ? { ...r, status: "dismissed" } : r));
  };
  const deleteReport = async (reportId) => {
    await ax().delete(`${API}/admin/reports/${reportId}`);
    setReports(p => p.filter(r => r.report_id !== reportId));
  };
  const saveFaq = async () => {
    if (faqModal === "new") {
      const r = await ax().post(`${API}/admin/faq`, faqForm);
      setFaqs(p => [...p, r.data]);
    } else {
      await ax().put(`${API}/admin/faq/${faqModal}`, faqForm);
      setFaqs(p => p.map(f => f.faq_id === faqModal ? { ...f, ...faqForm } : f));
    }
    setFaqModal(null); setFaqForm({ category: "", question: "", answer: "", order: 0 });
  };
  const deleteFaq = async (faqId) => {
    if (!window.confirm("FAQ-Eintrag löschen?")) return;
    await ax().delete(`${API}/admin/faq/${faqId}`);
    setFaqs(p => p.filter(f => f.faq_id !== faqId));
  };
  const createAnnouncement = async () => {
    const r = await ax().post(`${API}/admin/announcements`, annForm);
    setAnnouncements(p => [r.data, ...p.map(a => ({ ...a, active: false }))]);
    setAnnForm({ text: "", type: "info", link: "", link_label: "" });
  };
  const toggleAnn = async (annId) => {
    const r = await ax().patch(`${API}/admin/announcements/${annId}/toggle`);
    setAnnouncements(p => p.map(a => ({ ...a, active: a.announcement_id === annId ? r.data.active : false })));
  };
  const deleteAnn = async (annId) => {
    await ax().delete(`${API}/admin/announcements/${annId}`);
    setAnnouncements(p => p.filter(a => a.announcement_id !== annId));
  };
  const sendNewsletter = async (preview) => {
    setActionLoading("nl");
    try {
      const payload = { ...nlForm };
      if (!preview) delete payload.preview_email;
      else payload.preview_email = nlForm.preview_email;
      const r = await ax().post(`${API}/admin/newsletter/send`, preview ? payload : { subject: nlForm.subject, content: nlForm.content });
      setNlResult(r.data);
    } finally { setActionLoading(""); }
  };
  const sendBroadcast = async () => {
    setActionLoading("broadcast");
    try {
      const r = await ax().post(`${API}/admin/broadcast`, broadcastForm);
      setBroadcastResult(r.data);
    } finally { setActionLoading(""); }
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-50"><Navbar />
      <div className="flex items-center justify-center py-40">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  const filteredStudios = studios.filter(s =>
    s.name?.toLowerCase().includes(searchStudios.toLowerCase()) || s.city?.toLowerCase().includes(searchStudios.toLowerCase()));
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchUsers.toLowerCase()) || u.email?.toLowerCase().includes(searchUsers.toLowerCase()));

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-zinc-400 font-inter flex items-center gap-2 mb-1">
              <Shield size={11} /> Admin Panel
            </p>
            <h1 className="text-2xl font-playfair font-semibold text-zinc-900">InkBook Operator</h1>
          </div>
          <button onClick={fetchCore} className="btn-secondary flex items-center gap-2 text-sm" data-testid="admin-refresh-btn">
            <Activity size={13} /> Aktualisieren
          </button>
        </div>

        <div className="flex gap-6">
          {/* ── Sidebar ── */}
          <aside className="w-52 flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-3 sticky top-6 space-y-4">
              {SIDEBAR.map(({ group, items }) => (
                <div key={group}>
                  <p className="text-[10px] tracking-widest uppercase text-zinc-400 font-inter px-2 mb-1.5">{group}</p>
                  {items.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => switchSection(id)}
                      data-testid={`admin-nav-${id}`}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-inter font-medium transition-all ${
                        activeSection === id ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                      }`}>
                      <Icon size={14} strokeWidth={1.5} /> {label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </aside>

          {/* ── Main Content ── */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={activeSection} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>

                {/* ══════════════════════════════════════════ OVERVIEW */}
                {activeSection === "overview" && (
                  <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="admin-stats-grid">
                      {[
                        { label: "Studios",    value: stats?.total_studios || 0,   sub: `${stats?.active_studios || 0} aktiv`, icon: Store },
                        { label: "Nutzer",     value: stats?.total_users || 0,     sub: `${enhanced?.new_users_today || 0} heute neu`, icon: Users },
                        { label: "Buchungen",  value: stats?.total_bookings || 0,  sub: `${enhanced?.new_bookings_week || 0} diese Woche`, icon: Calendar },
                        { label: "Aktive Abos",value: stats?.active_subscriptions || 0, sub: `€${(stats?.total_revenue || 0).toLocaleString("de-DE", { minimumFractionDigits: 2 })}`, icon: Crown },
                      ].map((c, i) => {
                        const Icon = c.icon;
                        return (
                          <div key={i} className="bg-white rounded-2xl border border-black/[0.04] p-5" data-testid={`stat-card-${i}`}>
                            <div className="flex items-center justify-between mb-3">
                              <Icon size={16} strokeWidth={1.5} className="text-zinc-400" />
                              <TrendingUp size={11} className="text-emerald-500" />
                            </div>
                            <p className="text-3xl font-playfair font-semibold text-zinc-900 mb-0.5">{c.value}</p>
                            <p className="text-xs font-inter text-zinc-500">{c.label}</p>
                            <p className="text-xs font-inter text-zinc-400 mt-0.5">{c.sub}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Secondary KPIs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: "Newsletter-Abos",   value: enhanced?.newsletter_subscribers || 0, color: "text-blue-600" },
                        { label: "Offene Meldungen",  value: enhanced?.open_reports || 0,            color: "text-red-600" },
                        { label: "Neue Nutzer/Woche", value: enhanced?.new_users_week || 0,          color: "text-emerald-600" },
                        { label: "Pending Buchungen", value: stats?.pending_bookings || 0,            color: "text-amber-600" },
                      ].map((c, i) => (
                        <div key={i} className="bg-white rounded-xl border border-zinc-100 p-4">
                          <p className={`text-2xl font-playfair font-semibold ${c.color}`}>{c.value}</p>
                          <p className="text-xs text-zinc-400 font-inter mt-1">{c.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Top Studios + Recent Bookings */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <SectionCard title="Top Studios">
                        {(enhanced?.top_studios || []).length === 0
                          ? <EmptyState text="Noch keine Buchungshistorie" />
                          : (enhanced.top_studios.map((s, i) => (
                            <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-zinc-50 last:border-0">
                              <div>
                                <p className="text-sm font-inter font-medium text-zinc-900">{s.name}</p>
                                <p className="text-xs text-zinc-400 font-inter">{s.city} · ★ {s.avg_rating || "—"}</p>
                              </div>
                              <span className="text-sm font-inter font-semibold text-zinc-900">{s.booking_count} Buchungen</span>
                            </div>
                          )))}
                      </SectionCard>
                      <SectionCard title="Letzte Buchungen">
                        {(stats?.recent_bookings || []).length === 0
                          ? <EmptyState text="Keine Buchungen" />
                          : stats.recent_bookings.slice(0, 5).map((b, i) => (
                            <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-zinc-50 last:border-0">
                              <div>
                                <p className="text-sm font-inter font-medium text-zinc-800">{b.studio_name || "—"}</p>
                                <p className="text-xs text-zinc-400 font-inter">{b.date}</p>
                              </div>
                              <Pill type={b.status}>{b.status}</Pill>
                            </div>
                          ))}
                      </SectionCard>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════ STUDIOS */}
                {activeSection === "studios" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 max-w-xs">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input value={searchStudios} onChange={e => setSearchStudios(e.target.value)} placeholder="Studio oder Stadt…"
                          className="pl-8 pr-4 py-2 w-full bg-white border border-zinc-200 rounded-xl text-sm font-inter focus:outline-none focus:border-zinc-400" data-testid="admin-studio-search" />
                      </div>
                      <span className="text-sm text-zinc-400 font-inter">{filteredStudios.length} Studios</span>
                    </div>
                    <SectionCard>
                      <div className="overflow-x-auto" data-testid="admin-studios-table">
                        <table className="w-full">
                          <thead><tr className="border-b border-zinc-100">
                            {["Studio","Stadt","Abo","Buchungen","Status","Aktionen"].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400">{h}</th>
                            ))}</tr></thead>
                          <tbody className="divide-y divide-zinc-50">
                            {filteredStudios.map(s => (
                              <tr key={s.studio_id} className="hover:bg-zinc-50 transition-colors" data-testid={`studio-row-${s.studio_id}`}>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0">
                                      {s.images?.[0] ? <img src={s.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Store size={12} className="text-zinc-400" /></div>}
                                    </div>
                                    <div>
                                      <p className="font-inter font-medium text-zinc-900 text-sm">{s.name}</p>
                                      {s.is_verified && <span className="text-[10px] text-emerald-600 font-inter flex items-center gap-0.5"><CheckCircle size={9} /> Verifiziert</span>}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-sm text-zinc-500 font-inter">{s.city || "—"}</td>
                                <td className="px-4 py-3.5">
                                  {s.subscription ? <Pill type={s.subscription.status}>{s.subscription.plan} · {s.subscription.status}</Pill>
                                    : <span className="text-xs text-zinc-400 font-inter">Kein Abo</span>}
                                </td>
                                <td className="px-4 py-3.5 text-sm font-inter text-zinc-600">{s.booking_count || 0}</td>
                                <td className="px-4 py-3.5">
                                  <button onClick={() => toggleStudioStatus(s)} disabled={actionLoading === s.studio_id}
                                    className="flex items-center gap-1.5 text-sm font-inter" data-testid={`toggle-studio-${s.studio_id}`}>
                                    {s.is_active ? <><ToggleRight size={16} className="text-emerald-500" /><span className="text-emerald-600">Aktiv</span></>
                                      : <><ToggleLeft size={16} className="text-zinc-400" /><span className="text-zinc-500">Inaktiv</span></>}
                                  </button>
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-1.5">
                                    <button onClick={() => toggleVerified(s)} disabled={actionLoading === `v_${s.studio_id}`}
                                      title={s.is_verified ? "Verifizierung entfernen" : "Studio verifizieren"}
                                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-inter font-semibold transition-all ${s.is_verified ? "bg-blue-600 text-white" : "border border-zinc-200 text-zinc-500 hover:border-blue-300 hover:text-blue-600"}`}
                                      data-testid={`verify-studio-${s.studio_id}`}>
                                      <CheckCircle size={9} /> {s.is_verified ? "Verifiziert" : "Verifizieren"}
                                    </button>
                                    <Link to={`/studios/${s.studio_id}`} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors"><Eye size={13} /></Link>
                                    <button onClick={() => deleteStudio(s.studio_id)} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors" data-testid={`delete-studio-${s.studio_id}`}><Trash2 size={13} /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {filteredStudios.length === 0 && <EmptyState text="Keine Studios gefunden" />}
                      </div>
                    </SectionCard>
                  </div>
                )}

                {/* ══════════════════════════════════════════ USERS */}
                {activeSection === "users" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 max-w-xs">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input value={searchUsers} onChange={e => setSearchUsers(e.target.value)} placeholder="Name oder E-Mail…"
                          className="pl-8 pr-4 py-2 w-full bg-white border border-zinc-200 rounded-xl text-sm font-inter focus:outline-none focus:border-zinc-400" data-testid="admin-user-search" />
                      </div>
                      <span className="text-sm text-zinc-400 font-inter">{filteredUsers.length} Nutzer</span>
                    </div>
                    <SectionCard>
                      <div className="overflow-x-auto" data-testid="admin-users-table">
                        <table className="w-full">
                          <thead><tr className="border-b border-zinc-100">
                            {["Name","E-Mail","Rolle","Registriert","Aktionen"].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400">{h}</th>
                            ))}</tr></thead>
                          <tbody className="divide-y divide-zinc-50">
                            {filteredUsers.map((u, i) => (
                              <tr key={i} className="hover:bg-zinc-50 transition-colors" data-testid={`user-row-${u.user_id || i}`}>
                                <td className="px-4 py-3"><div className="flex items-center gap-2">
                                  <div className="w-7 h-7 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs font-bold">{u.name?.[0]?.toUpperCase() || "?"}</div>
                                  <span className="text-sm font-inter font-medium text-zinc-900">{u.name}</span>
                                </div></td>
                                <td className="px-4 py-3 text-sm text-zinc-500 font-inter">{u.email}</td>
                                <td className="px-4 py-3">
                                  <Pill type={u.role === "admin" ? "neutral" : u.role === "studio_owner" ? "pending" : "confirmed"}>
                                    {u.role === "admin" ? "Admin" : u.role === "studio_owner" ? "Studio" : "Kunde"}
                                  </Pill>
                                </td>
                                <td className="px-4 py-3 text-xs text-zinc-400 font-inter">{u.created_at ? new Date(u.created_at).toLocaleDateString("de-DE") : "—"}</td>
                                <td className="px-4 py-3"><div className="flex items-center gap-1.5">
                                  <button onClick={() => openUserDetails(u.user_id)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors" data-testid={`view-user-${u.user_id}`}><Eye size={13} /></button>
                                  {u.role !== "admin" && (
                                    <button onClick={() => deleteUser(u.user_id, u.name, u.role)} disabled={actionLoading === `del_user_${u.user_id}`}
                                      className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-40" data-testid={`delete-user-${u.user_id}`}>
                                      {actionLoading === `del_user_${u.user_id}` ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                    </button>
                                  )}
                                </div></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {filteredUsers.length === 0 && <EmptyState text="Keine Nutzer gefunden" />}
                      </div>
                    </SectionCard>
                  </div>
                )}

                {/* ══════════════════════════════════════════ BOOKINGS */}
                {activeSection === "bookings" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      {[["Ausstehend", stats?.pending_bookings || 0, "text-amber-600"], ["Bestätigt", stats?.confirmed_bookings || 0, "text-emerald-600"], ["Gesamt", stats?.total_bookings || 0, "text-zinc-900"]].map(([l, v, c]) => (
                        <div key={l} className="bg-white rounded-xl border border-zinc-100 p-4">
                          <p className={`text-2xl font-playfair font-semibold ${c}`}>{v}</p>
                          <p className="text-xs text-zinc-400 font-inter mt-1">{l}</p>
                        </div>
                      ))}
                    </div>
                    <SectionCard title={`Alle Buchungen (${bookings.length})`}>
                      {bookings.length === 0 ? <EmptyState text="Keine Buchungen vorhanden" /> : (
                        <div className="divide-y divide-zinc-50">
                          {bookings.map((b, i) => (
                            <div key={i} className="px-5 py-3.5 flex items-center justify-between hover:bg-zinc-50">
                              <div>
                                <p className="text-sm font-inter font-medium text-zinc-900">{b.studio_name || b.studio_id}</p>
                                <p className="text-xs text-zinc-400 font-inter">{b.date} · {b.start_time} – {b.end_time} · {b.booking_type === "consultation" ? "Beratung" : "Session"}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Pill type={b.status}>{b.status}</Pill>
                                {b.payment_status === "paid" && <span className="text-xs text-emerald-600 font-inter">✓ Bezahlt</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </SectionCard>
                  </div>
                )}

                {/* ══════════════════════════════════════════ SUBSCRIPTIONS */}
                {activeSection === "subscriptions" && (
                  <SectionCard title={`Abonnements (${subscriptions.length})`}>
                    {subscriptions.length === 0 ? <EmptyState text="Keine Abonnements" /> : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead><tr className="border-b border-zinc-100">
                            {["Studio","Plan","Status","Erstellt","Läuft ab"].map(h => (
                              <th key={h} className="px-5 py-3 text-left text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400">{h}</th>
                            ))}</tr></thead>
                          <tbody className="divide-y divide-zinc-50">
                            {subscriptions.map((s, i) => (
                              <tr key={i} className="hover:bg-zinc-50">
                                <td className="px-5 py-3.5">
                                  <p className="text-sm font-inter font-medium text-zinc-900">{s.studio_name}</p>
                                  <p className="text-xs text-zinc-400 font-inter">{s.studio_city}</p>
                                </td>
                                <td className="px-5 py-3.5 text-sm font-inter text-zinc-700 capitalize">{s.plan || "—"}</td>
                                <td className="px-5 py-3.5"><Pill type={s.status}>{s.status}</Pill></td>
                                <td className="px-5 py-3.5 text-xs text-zinc-400 font-inter">{s.created_at ? new Date(s.created_at).toLocaleDateString("de-DE") : "—"}</td>
                                <td className="px-5 py-3.5 text-xs text-zinc-400 font-inter">{s.expires_at ? new Date(s.expires_at).toLocaleDateString("de-DE") : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </SectionCard>
                )}

                {/* ══════════════════════════════════════════ REVENUE */}
                {activeSection === "revenue" && revenue && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { l: "Monatl. Wiederkehrend (MRR)", v: `€ ${(revenue.mrr || 0).toFixed(2)}`, c: "text-emerald-600" },
                        { l: "Aktive Abonnements", v: revenue.active_subscriptions || 0, c: "text-zinc-900" },
                        { l: "Zahlungen gesamt", v: `€ ${(revenue.total_from_payments || 0).toFixed(2)}`, c: "text-zinc-900" },
                      ].map(({ l, v, c }) => (
                        <div key={l} className="bg-white rounded-xl border border-zinc-100 p-5">
                          <p className={`text-2xl font-playfair font-semibold ${c}`}>{v}</p>
                          <p className="text-xs text-zinc-400 font-inter mt-1">{l}</p>
                        </div>
                      ))}
                    </div>
                    <SectionCard title="Letzte 6 Monate">
                      {revenue.monthly_breakdown?.length === 0 ? <EmptyState text="Keine Zahlungsdaten" /> : (
                        <div className="p-5 space-y-3">
                          {(revenue.monthly_breakdown || []).map((m) => (
                            <div key={m.month} className="flex items-center gap-4">
                              <span className="text-sm font-inter text-zinc-500 w-20">{m.month}</span>
                              <div className="flex-1 h-6 bg-zinc-100 rounded-lg overflow-hidden">
                                <div className="h-full bg-zinc-900 rounded-lg transition-all"
                                  style={{ width: `${Math.min(100, (m.amount / Math.max(...(revenue.monthly_breakdown || []).map(x => x.amount))) * 100)}%` }} />
                              </div>
                              <span className="text-sm font-inter font-semibold text-zinc-900 w-20 text-right">€ {m.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </SectionCard>
                  </div>
                )}

                {/* ══════════════════════════════════════════ REVIEWS */}
                {activeSection === "reviews" && (
                  <SectionCard title={`Bewertungen (${reviews.length})`}>
                    {reviews.length === 0 ? <EmptyState text="Keine Bewertungen" /> : (
                      <div className="divide-y divide-zinc-50">
                        {reviews.map((r) => (
                          <div key={r.review_id} className="px-5 py-4 flex items-start justify-between hover:bg-zinc-50">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-yellow-500 text-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                                <span className="text-xs text-zinc-400 font-inter">{r.user_name || "Anonym"} · {r.studio_name || r.studio_id}</span>
                              </div>
                              <p className="text-sm font-inter text-zinc-700">{r.comment || "Kein Kommentar"}</p>
                              <p className="text-xs text-zinc-400 font-inter mt-1">{r.created_at ? new Date(r.created_at).toLocaleDateString("de-DE") : ""}</p>
                            </div>
                            <button onClick={() => deleteReview(r.review_id)} className="p-1.5 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0" data-testid={`delete-review-${r.review_id}`}><Trash2 size={13} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                )}

                {/* ══════════════════════════════════════════ FAQ */}
                {activeSection === "faq" && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <button onClick={() => { setFaqModal("new"); setFaqForm({ category: "", question: "", answer: "", order: 0 }); }}
        className="btn-primary flex items-center gap-2 text-sm" data-testid="admin-add-faq-btn">
                        <Plus size={14} /> FAQ hinzufügen
                      </button>
                    </div>
                    <SectionCard title={`FAQ-Einträge (${faqs.length})`}>
                      {faqs.length === 0 ? <EmptyState text="Keine FAQ-Einträge" /> : (
                        <div className="divide-y divide-zinc-50">
                          {faqs.map(f => (
                            <div key={f.faq_id} className="px-5 py-4 flex items-start justify-between hover:bg-zinc-50">
                              <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-[10px] tracking-widest uppercase text-zinc-400 font-inter">{f.category}</p>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-inter font-medium ${
                                    f.target_role === "customer" ? "bg-blue-50 text-blue-600" :
                                    f.target_role === "studio_owner" ? "bg-purple-50 text-purple-600" :
                                    "bg-zinc-100 text-zinc-500"
                                  }`}>
                                    {f.target_role === "customer" ? "Kunden" : f.target_role === "studio_owner" ? "Studios" : "Alle"}
                                  </span>
                                </div>
                                <p className="text-sm font-inter font-medium text-zinc-900">{f.question}</p>
                                <p className="text-xs text-zinc-500 font-inter mt-1 line-clamp-2">{f.answer}</p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button onClick={() => { setFaqModal(f.faq_id); setFaqForm({ category: f.category, question: f.question, answer: f.answer, order: f.order || 0, target_role: f.target_role || "all" }); }}
                                  className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 transition-colors"><Edit2 size={13} /></button>
                                <button onClick={() => deleteFaq(f.faq_id)} className="p-1.5 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </SectionCard>
                  </div>
                )}

                {/* ══════════════════════════════════════════ ANNOUNCEMENTS */}
                {activeSection === "announcements" && (
                  <div className="space-y-6">
                    <SectionCard title="Neue Ankündigung">
                      <div className="p-5 space-y-4">
                        <Textarea label="Text" value={annForm.text} onChange={e => setAnnForm(p => ({ ...p, text: e.target.value }))} placeholder="Ankündigungstext…" rows={2} />
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-inter font-medium text-zinc-600 mb-1.5">Typ</label>
                            <select value={annForm.type} onChange={e => setAnnForm(p => ({ ...p, type: e.target.value }))}
                              className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm font-inter focus:outline-none">
                              <option value="info">Info (Blau)</option>
                              <option value="warning">Warnung (Gelb)</option>
                              <option value="success">Erfolg (Grün)</option>
                            </select>
                          </div>
                          <Input label="Link (optional)" value={annForm.link} onChange={e => setAnnForm(p => ({ ...p, link: e.target.value }))} placeholder="/search" />
                          <Input label="Link-Label" value={annForm.link_label} onChange={e => setAnnForm(p => ({ ...p, link_label: e.target.value }))} placeholder="Mehr erfahren" />
                        </div>
                        <button onClick={createAnnouncement} disabled={!annForm.text} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-40" data-testid="admin-create-announcement-btn">
                          <Bell size={13} /> Ankündigung aktivieren
                        </button>
                      </div>
                    </SectionCard>
                    <SectionCard title="Aktive Ankündigungen">
                      {announcements.length === 0 ? <EmptyState text="Keine Ankündigungen" /> : (
                        <div className="divide-y divide-zinc-50">
                          {announcements.map(a => (
                            <div key={a.announcement_id} className="px-5 py-4 flex items-center justify-between hover:bg-zinc-50">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-inter font-semibold border ${a.type === "warning" ? "bg-amber-50 text-amber-700 border-amber-200" : a.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>{a.type}</span>
                                  {a.active && <span className="text-[10px] text-emerald-600 font-inter font-semibold">● Live</span>}
                                </div>
                                <p className="text-sm font-inter text-zinc-800">{a.text}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => toggleAnn(a.announcement_id)} className={`text-xs px-3 py-1.5 rounded-full font-inter font-medium border transition-colors ${a.active ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}>
                                  {a.active ? "Deaktivieren" : "Aktivieren"}
                                </button>
                                <button onClick={() => deleteAnn(a.announcement_id)} className="p-1.5 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </SectionCard>
                  </div>
                )}

                {/* ══════════════════════════════════════════ NEWSLETTER */}
                {activeSection === "newsletter" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl border border-zinc-100 p-5">
                        <p className="text-2xl font-playfair font-semibold text-zinc-900">{subscribers.length}</p>
                        <p className="text-xs text-zinc-400 font-inter mt-1">Aktive Abonnenten</p>
                      </div>
                    </div>
                    <SectionCard title="Kampagne versenden">
                      <div className="p-5 space-y-4">
                        <Input label="Betreff" value={nlForm.subject} onChange={e => setNlForm(p => ({ ...p, subject: e.target.value }))} placeholder="Dein Newsletter-Betreff" />
                        <Textarea label="Inhalt" value={nlForm.content} onChange={e => setNlForm(p => ({ ...p, content: e.target.value }))} placeholder="Newsletter-Text hier eingeben…" rows={5} />
                        <Input label="Vorschau an E-Mail (optional)" value={nlForm.preview_email} onChange={e => setNlForm(p => ({ ...p, preview_email: e.target.value }))} placeholder="deine@email.de" />
                        {nlResult && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-inter text-emerald-700">
                            {nlResult.status === "sent" ? `✓ Versendet an ${nlResult.sent} Abonnenten` : `✓ Vorschau an ${nlForm.preview_email} gesendet`}
                          </div>
                        )}
                        <div className="flex gap-3">
                          <button onClick={() => sendNewsletter(true)} disabled={!nlForm.preview_email || actionLoading === "nl"}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-inter font-medium border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-40" data-testid="admin-nl-preview-btn">
                            {actionLoading === "nl" ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Vorschau senden
                          </button>
                          <button onClick={() => sendNewsletter(false)} disabled={!nlForm.subject || !nlForm.content || actionLoading === "nl"}
                            className="btn-primary flex items-center gap-2 text-sm disabled:opacity-40" data-testid="admin-nl-send-btn">
                            {actionLoading === "nl" ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} An alle senden ({subscribers.length})
                          </button>
                        </div>
                      </div>
                    </SectionCard>
                    <SectionCard title="Abonnenten">
                      {subscribers.length === 0 ? <EmptyState text="Noch keine Abonnenten" /> : (
                        <div className="divide-y divide-zinc-50 max-h-72 overflow-y-auto">
                          {subscribers.map((s, i) => (
                            <div key={i} className="px-5 py-3 flex items-center justify-between">
                              <span className="text-sm font-inter text-zinc-700">{s.email}</span>
                              <span className="text-xs text-zinc-400 font-inter">{s.subscribed_at ? new Date(s.subscribed_at).toLocaleDateString("de-DE") : "—"}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </SectionCard>
                  </div>
                )}

                {/* ══════════════════════════════════════════ BROADCAST */}
                {activeSection === "broadcast" && (
                  <SectionCard title="Push-Nachricht an Nutzer">
                    <div className="p-5 space-y-4">
                      <p className="text-sm text-zinc-500 font-inter">Sendet eine Push-Benachrichtigung an alle Nutzer mit aktiven Browser-Notifications.</p>
                      <Input label="Titel" value={broadcastForm.title} onChange={e => setBroadcastForm(p => ({ ...p, title: e.target.value }))} placeholder="Wichtige Neuigkeit" />
                      <Textarea label="Nachricht" value={broadcastForm.message} onChange={e => setBroadcastForm(p => ({ ...p, message: e.target.value }))} placeholder="Deine Broadcast-Nachricht…" rows={3} />
                      <div>
                        <label className="block text-xs font-inter font-medium text-zinc-600 mb-1.5">Empfänger</label>
                        <select value={broadcastForm.target} onChange={e => setBroadcastForm(p => ({ ...p, target: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm font-inter focus:outline-none" data-testid="broadcast-target-select">
                          <option value="all">Alle Nutzer</option>
                          <option value="customers">Nur Kunden</option>
                          <option value="studio_owners">Nur Studios</option>
                        </select>
                      </div>
                      {broadcastResult && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-inter text-emerald-700">
                          ✓ Gesendet an {broadcastResult.sent} Nutzer
                        </div>
                      )}
                      <button onClick={sendBroadcast} disabled={!broadcastForm.title || !broadcastForm.message || actionLoading === "broadcast"}
                        className="btn-primary flex items-center gap-2 text-sm disabled:opacity-40" data-testid="admin-broadcast-send-btn">
                        {actionLoading === "broadcast" ? <Loader2 size={13} className="animate-spin" /> : <Megaphone size={13} />} Broadcast senden
                      </button>
                    </div>
                  </SectionCard>
                )}

                {/* ══════════════════════════════════════════ SUPPORT TICKETS */}
                {activeSection === "support-tickets" && (
                  <div className="space-y-4">
                    {/* Sub-tabs */}
                    <div className="flex gap-1 bg-white rounded-xl border border-zinc-100 p-1 w-fit">
                      {[
                        { id: "tickets", label: `Tickets (${newTickets.length})` },
                        { id: "direct", label: `Direkt-Chats (${directChats.length})` },
                        { id: "chats", label: `KI-Chats (${tickets.length})` },
                      ].map(t => (
                        <button key={t.id} onClick={() => setSupportTab(t.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-inter font-medium transition-all ${supportTab === t.id ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-800"}`}
                        >{t.label}</button>
                      ))}
                    </div>

                    {/* Support Tickets */}
                    {supportTab === "tickets" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SectionCard title="Support-Tickets" className="overflow-auto">
                          {newTickets.length === 0 ? <EmptyState text="Keine Tickets" /> : (
                            <div className="divide-y divide-zinc-50">
                              {newTickets.map(t => (
                                <button key={t.ticket_id} onClick={() => setSelectedTicket(t)}
                                  className={`w-full text-left px-5 py-3.5 hover:bg-zinc-50 transition-colors ${selectedTicket?.ticket_id === t.ticket_id ? "bg-zinc-50" : ""}`}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-mono text-zinc-400 font-inter">{t.ticket_number}</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-inter font-medium ${t.status === "open" ? "bg-amber-50 text-amber-600" : t.status === "answered" ? "bg-green-50 text-green-600" : "bg-zinc-100 text-zinc-500"}`}>
                                      {t.status === "open" ? "Offen" : t.status === "answered" ? "Beantwortet" : t.status}
                                    </span>
                                  </div>
                                  <p className="text-sm font-inter font-medium text-zinc-900 truncate">{t.subject}</p>
                                  <p className="text-xs text-zinc-400 font-inter">{t.user_name} · {t.created_at ? new Date(t.created_at).toLocaleDateString("de-DE") : ""}</p>
                                </button>
                              ))}
                            </div>
                          )}
                        </SectionCard>
                        {selectedTicket && (
                          <SectionCard title={`${selectedTicket.ticket_number} – ${selectedTicket.subject}`}>
                            <div className="p-4 space-y-4">
                              <div className="bg-zinc-50 rounded-xl p-3">
                                <p className="text-xs text-zinc-400 font-inter mb-1">Von: {selectedTicket.user_name} ({selectedTicket.user_email})</p>
                                <p className="text-sm font-inter text-zinc-800 leading-relaxed">{selectedTicket.description}</p>
                              </div>
                              {selectedTicket.replies?.map((r, i) => (
                                <div key={i} className={`rounded-xl p-3 ${r.from === "admin" ? "bg-zinc-900 text-white" : "bg-blue-50 border border-blue-100"}`}>
                                  <p className={`text-[10px] mb-1 opacity-60 font-inter font-semibold ${r.from === "admin" ? "" : "text-blue-500 opacity-100"}`}>
                                    {r.from === "admin" ? "INKBOOK SUPPORT" : "NUTZER-ANTWORT"}
                                  </p>
                                  <p className={`text-sm font-inter leading-relaxed ${r.from !== "admin" ? "text-blue-900" : ""}`}>{r.message}</p>
                                </div>
                              ))}
                              <div className="pt-2">
                                <Textarea label="Antwort" value={replyText} onChange={e => setReplyText(e.target.value)} rows={3} placeholder="Antwort eingeben…" />
                                <div className="flex gap-2 mt-3">
                                  <button
                                    onClick={async () => {
                                      if (!replyText.trim()) return;
                                      setReplyLoading(true);
                                      try {
                                        await ax().post(`${API}/admin/support-tickets/${selectedTicket.ticket_id}/reply`, { message: replyText });
                                        const updated = { ...selectedTicket, status: "answered", replies: [...(selectedTicket.replies || []), { from: "admin", message: replyText, created_at: new Date().toISOString() }] };
                                        setSelectedTicket(updated);
                                        setNewTickets(p => p.map(t => t.ticket_id === updated.ticket_id ? updated : t));
                                        setReplyText("");
                                      } finally { setReplyLoading(false); }
                                    }}
                                    disabled={!replyText.trim() || replyLoading}
                                    className="flex-1 btn-primary text-sm disabled:opacity-40"
                                  >
                                    {replyLoading ? "Senden…" : "Antworten & E-Mail"}
                                  </button>
                                  {selectedTicket.status !== "closed" && (
                                    <button
                                      onClick={async () => {
                                        await ax().patch(`${API}/admin/support-tickets/${selectedTicket.ticket_id}/close`);
                                        const updated = { ...selectedTicket, status: "closed" };
                                        setSelectedTicket(updated);
                                        setNewTickets(p => p.map(t => t.ticket_id === updated.ticket_id ? updated : t));
                                      }}
                                      className="px-3 py-2 rounded-xl border border-zinc-200 text-xs font-inter text-zinc-600 hover:bg-zinc-50 transition-colors flex-shrink-0"
                                    >
                                      Schließen
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </SectionCard>
                        )}
                      </div>
                    )}

                    {/* Direct Chats */}
                    {supportTab === "direct" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SectionCard title="Direkt-Chats (Pro)">
                          {directChats.length === 0 ? <EmptyState text="Keine Direkt-Chats" /> : (
                            <div className="divide-y divide-zinc-50">
                              {directChats.map(c => (
                                <button key={c.chat_id} onClick={() => setSelectedTicket({ ...c, _type: "direct" })}
                                  className={`w-full text-left px-5 py-3.5 hover:bg-zinc-50 transition-colors ${selectedTicket?.chat_id === c.chat_id ? "bg-zinc-50" : ""}`}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-inter font-medium text-zinc-900">{c.user_name}</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-inter font-medium ${c.status === "open" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>
                                      {c.status === "open" ? "Offen" : "Aktiv"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-zinc-400 font-inter">{c.user_email} · {c.messages?.length || 0} Nachrichten</p>
                                </button>
                              ))}
                            </div>
                          )}
                        </SectionCard>
                        {selectedTicket?._type === "direct" && (
                          <SectionCard title={`Chat mit ${selectedTicket.user_name}`}>
                            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                              {selectedTicket.messages?.map((m, i) => (
                                <div key={i} className={`rounded-xl p-3 ${m.from === "admin" ? "bg-zinc-900 text-white ml-8" : "bg-zinc-50 mr-8"}`}>
                                  <p className="text-[10px] mb-1 opacity-60 font-inter">{m.from === "admin" ? "InkBook Support" : selectedTicket.user_name}</p>
                                  <p className="text-sm font-inter leading-relaxed">{m.content}</p>
                                </div>
                              ))}
                            </div>
                            <div className="p-4 border-t border-zinc-100">
                              <Textarea label="Antwort" value={replyText} onChange={e => setReplyText(e.target.value)} rows={2} placeholder="Nachricht eingeben…" />
                              <button
                                onClick={async () => {
                                  if (!replyText.trim()) return;
                                  setReplyLoading(true);
                                  try {
                                    const r = await ax().post(`${API}/admin/direct-chats/${selectedTicket.chat_id}/reply`, { message: replyText });
                                    const newMsg = r.data.msg;
                                    const updated = { ...selectedTicket, messages: [...(selectedTicket.messages || []), newMsg] };
                                    setSelectedTicket(updated);
                                    setDirectChats(p => p.map(c => c.chat_id === updated.chat_id ? updated : c));
                                    setReplyText("");
                                  } finally { setReplyLoading(false); }
                                }}
                                disabled={!replyText.trim() || replyLoading}
                                className="btn-primary text-sm w-full mt-3 disabled:opacity-40"
                              >
                                {replyLoading ? "Senden…" : "Nachricht senden"}
                              </button>
                            </div>
                          </SectionCard>
                        )}
                      </div>
                    )}

                    {/* Legacy AI Chats */}
                    {supportTab === "chats" && (
                      <SectionCard title={`KI-Support-Chats (${tickets.length})`}>
                        {tickets.length === 0 ? <EmptyState text="Keine Support-Chats" /> : (
                          <div className="divide-y divide-zinc-50">
                            {tickets.map((t, i) => {
                              const lastMsg = t.messages?.[t.messages.length - 1];
                              return (
                                <div key={i} className="px-5 py-4 hover:bg-zinc-50">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs text-zinc-400 font-inter font-mono">{t.session_id}</p>
                                    <p className="text-xs text-zinc-400 font-inter">{t.updated_at ? new Date(t.updated_at).toLocaleDateString("de-DE") : "—"}</p>
                                  </div>
                                  <p className="text-sm font-inter text-zinc-700">{lastMsg?.content?.slice(0, 120) || "—"}{lastMsg?.content?.length > 120 ? "…" : ""}</p>
                                  <p className="text-xs text-zinc-400 font-inter mt-1">{t.messages?.length || 0} Nachrichten</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </SectionCard>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════ REPORTS */}
                {activeSection === "reports" && (
                  <SectionCard title={`Meldungen (${reports.filter(r => r.status === "open").length} offen)`}>
                    {reports.length === 0 ? <EmptyState text="Keine Meldungen" /> : (
                      <div className="divide-y divide-zinc-50">
                        {reports.map((r) => (
                          <div key={r.report_id} className={`px-5 py-4 flex items-start justify-between hover:bg-zinc-50 ${r.status === "dismissed" ? "opacity-50" : ""}`}>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Pill type={r.status}>{r.status}</Pill>
                                <span className="text-xs text-zinc-400 font-inter">{r.target_type} · {r.reporter_name || "Anonym"}</span>
                              </div>
                              <p className="text-sm font-inter text-zinc-800">{r.reason}</p>
                              <p className="text-xs text-zinc-400 font-inter mt-1">{r.created_at ? new Date(r.created_at).toLocaleDateString("de-DE") : ""}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {r.status === "open" && (
                                <button onClick={() => dismissReport(r.report_id)} className="text-xs px-2.5 py-1 rounded-full border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-inter transition-colors" data-testid={`dismiss-report-${r.report_id}`}>
                                  Schließen
                                </button>
                              )}
                              <button onClick={() => deleteReport(r.report_id)} className="p-1.5 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                )}

              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* ── FAQ Modal ── */}
      <Modal open={!!faqModal} onClose={() => setFaqModal(null)} title={faqModal === "new" ? "FAQ hinzufügen" : "FAQ bearbeiten"}>
        <div className="space-y-4">
          <Input label="Kategorie" value={faqForm.category} onChange={e => setFaqForm(p => ({ ...p, category: e.target.value }))} placeholder="Für Kunden" />
          <div>
            <label className="block text-xs font-inter font-medium text-zinc-600 mb-1.5">Zielgruppe</label>
            <select value={faqForm.target_role} onChange={e => setFaqForm(p => ({ ...p, target_role: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm font-inter text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white">
              <option value="all">Für alle sichtbar</option>
              <option value="customer">Nur für Kunden</option>
              <option value="studio_owner">Nur für Studios</option>
            </select>
          </div>
          <Input label="Frage" value={faqForm.question} onChange={e => setFaqForm(p => ({ ...p, question: e.target.value }))} placeholder="Wie buche ich einen Termin?" />
          <Textarea label="Antwort" value={faqForm.answer} onChange={e => setFaqForm(p => ({ ...p, answer: e.target.value }))} placeholder="Antwort…" rows={4} />
          <Input label="Reihenfolge" type="number" value={faqForm.order} onChange={e => setFaqForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} />
          <div className="flex gap-3 pt-2">
            <button onClick={() => setFaqModal(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-inter text-zinc-600 hover:bg-zinc-50 transition-colors">Abbrechen</button>
            <button onClick={saveFaq} disabled={!faqForm.question || !faqForm.answer} className="flex-1 btn-primary text-sm disabled:opacity-40" data-testid="faq-save-btn">Speichern</button>
          </div>
        </div>
      </Modal>

      {/* ── User Detail Modal ── */}
      <Modal open={!!selectedUser} onClose={() => { setSelectedUser(null); setUserDetails(null); }} title="Nutzer-Details">
        {!userDetails ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-zinc-400" /></div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-zinc-900 text-white rounded-full flex items-center justify-center text-lg font-bold">{userDetails.user?.name?.[0]?.toUpperCase() || "?"}</div>
              <div>
                <p className="font-inter font-semibold text-zinc-900">{userDetails.user?.name}</p>
                <p className="text-sm text-zinc-500 font-inter">{userDetails.user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Rolle", userDetails.user?.role], ["Registriert", userDetails.user?.created_at ? new Date(userDetails.user.created_at).toLocaleDateString("de-DE") : "—"], ["Auth", userDetails.user?.auth_provider || "email"], ["Studio", userDetails.studio?.name || "—"]].map(([k, v]) => (
                <div key={k} className="bg-zinc-50 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-inter mb-1">{k}</p>
                  <p className="font-inter font-medium text-zinc-900">{v}</p>
                </div>
              ))}
            </div>
            {userDetails.bookings?.length > 0 && (
              <div>
                <p className="text-xs tracking-widest uppercase text-zinc-400 font-inter mb-2">Letzte Buchungen</p>
                <div className="space-y-2">
                  {userDetails.bookings.slice(0, 5).map((b, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-zinc-50 rounded-lg">
                      <div>
                        <p className="text-sm font-inter text-zinc-800">{b.studio_name || b.studio_id}</p>
                        <p className="text-xs text-zinc-400 font-inter">{b.date}</p>
                      </div>
                      <Pill type={b.status}>{b.status}</Pill>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
