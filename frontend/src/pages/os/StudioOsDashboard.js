import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Plus,
  LogOut,
  Copy,
  Check,
  ExternalLink,
  LayoutGrid,
  BookOpen,
  Users,
  Settings2,
  Link2,
  Calendar,
  Search,
  X,
  BadgeCheck,
  Bell,
  Trash2,
  CalendarDays,
  Clock,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { studioApi } from "../../lib/studioApi";
import { studioOsAuth } from "../../lib/studioOsAuth";
import { StudioOSWordmark } from "../../components/StudioOSLogo";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

const STATUS_OPTIONS = ["anfrage", "in_planung", "laufend", "abgeschlossen", "abgebrochen"];
const STATUS_LABEL = {
  anfrage: "Anfrage",
  in_planung: "In Planung",
  laufend: "Läuft",
  abgeschlossen: "Abgeschlossen",
  abgebrochen: "Abgebrochen",
};
// Same visual language as the old dashboard's statusColors map: amber for
// "needs attention", blue/violet for in-progress, green for done, red for cancelled.
const STATUS_DOT = {
  anfrage: "bg-amber-500",
  in_planung: "bg-blue-500",
  laufend: "bg-violet-500",
  abgeschlossen: "bg-emerald-500",
  abgebrochen: "bg-red-500",
};
const STATUS_BADGE = {
  anfrage: "bg-amber-50 text-amber-700 border-amber-200",
  in_planung: "bg-blue-50 text-blue-700 border-blue-200",
  laufend: "bg-violet-50 text-violet-700 border-violet-200",
  abgeschlossen: "bg-emerald-50 text-emerald-700 border-emerald-200",
  abgebrochen: "bg-red-50 text-red-700 border-red-200",
};
const TYPE_LABEL = { consultation: "Beratung", project: "Projekt", single_session: "Termin" };

const SESSION_STATUS_LABEL = {
  geplant: "Geplant",
  bestaetigt: "Bestätigt",
  abgeschlossen: "Abgeschlossen",
  no_show: "No-Show",
  storniert: "Storniert",
};

const NAV_ITEMS = [
  { key: "uebersicht", label: "Übersicht", icon: LayoutGrid },
  { key: "buchungen", label: "Buchungen", icon: BookOpen, badgeFrom: "anfrage" },
  { key: "kalender", label: "Kalender", icon: CalendarDays },
  { key: "warteliste", label: "Warteliste", icon: Bell, badgeFrom: "waitlist" },
  { key: "artists", label: "Artists", icon: Users },
  { key: "profil", label: "Profil & Link", icon: Settings2 },
];

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-inter font-medium ${STATUS_BADGE[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5">
      <Icon size={18} className="text-zinc-400 mb-3" strokeWidth={1.5} />
      <div className="font-playfair text-2xl text-zinc-900">{value}</div>
      <div className="text-xs font-inter text-zinc-500 mt-0.5">{label}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="font-playfair text-lg text-zinc-900">{title}</h2>
        {subtitle && <p className="text-xs font-inter text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ heading, subtext }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Calendar size={28} className="text-zinc-200 mb-3" strokeWidth={1.5} />
      <p className="font-playfair text-base text-zinc-700">{heading}</p>
      {subtext && <p className="text-xs font-inter text-zinc-400 mt-1">{subtext}</p>}
    </div>
  );
}

function CopyLinkCard({ slug }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/t/${slug}`;
  return (
    <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
          <Link2 size={16} className="text-zinc-600" />
        </div>
        <div>
          <div className="font-inter font-medium text-sm text-zinc-900">Deine öffentliche Studio-Seite</div>
          <div className="text-xs font-inter text-zinc-500">Der einzige Weg zu deinem Studio — kein Verzeichnis, keine Suche.</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs font-mono text-zinc-600 bg-zinc-50 rounded-lg px-3 py-2 truncate">{url}</code>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-lg font-inter flex-shrink-0"
          onClick={() => {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
          {copied ? "Kopiert" : "Kopieren"}
        </Button>
        <a href={url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-zinc-100 transition-colors flex-shrink-0">
          <ExternalLink size={14} className="text-zinc-500" />
        </a>
      </div>
    </div>
  );
}

export default function StudioOsDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("kalender");
  const [staff, setStaff] = useState(null);
  const [studio, setStudio] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showArtistForm, setShowArtistForm] = useState(false);
  const [artistName, setArtistName] = useState("");
  const [savingArtist, setSavingArtist] = useState(false);
  const [waitlist, setWaitlist] = useState([]);

  const load = useCallback(async () => {
    try {
      const [me, studioRes, bookingsRes, artistsRes, waitlistRes] = await Promise.all([
        studioOsAuth.me(),
        studioApi.get("/studios/me"),
        studioApi.get("/studios/me/bookings"),
        studioApi.get("/studios/me/artists"),
        studioApi.get("/studios/me/waitlist"),
      ]);
      setStaff(me);
      setStudio(studioRes.data);
      setBookings(bookingsRes.data);
      setArtists(artistsRes.data);
      setWaitlist(waitlistRes.data);
    } catch {
      navigate("/os/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(
    () => ({
      total: bookings.length,
      anfrage: bookings.filter((b) => b.status === "anfrage").length,
      in_planung: bookings.filter((b) => b.status === "in_planung").length,
      abgeschlossen: bookings.filter((b) => b.status === "abgeschlossen").length,
      waitlist: waitlist.length,
    }),
    [bookings, waitlist]
  );

  const revenueStats = useMemo(() => {
    const completed = bookings.filter((b) => b.status === "abgeschlossen" && b.price_final);
    const revenue = completed.reduce((sum, b) => sum + Number(b.price_final || 0), 0);
    const customerIds = new Set(bookings.map((b) => b.customer_id).filter(Boolean));
    return {
      revenue,
      completedCount: completed.length,
      avgPerBooking: completed.length ? revenue / completed.length : 0,
      customerCount: customerIds.size,
      history: [...completed].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 8),
    };
  }, [bookings]);

  const eur = (n) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) => (b.customers?.name || "").toLowerCase().includes(q) || (b.title || "").toLowerCase().includes(q));
  }, [bookings, search]);

  async function updateStatus(projectId, status) {
    setBookings((prev) => prev.map((b) => (b.id === projectId ? { ...b, status } : b)));
    await studioApi.patch(`/studios/me/bookings/${projectId}`, { status });
  }

  async function updatePrice(projectId, priceFinal) {
    setBookings((prev) => prev.map((b) => (b.id === projectId ? { ...b, price_final: priceFinal } : b)));
    await studioApi.patch(`/studios/me/bookings/${projectId}`, { priceFinal });
  }

  async function addArtist(e) {
    e.preventDefault();
    if (!artistName.trim()) return;
    setSavingArtist(true);
    try {
      const { data } = await studioApi.post("/studios/me/artists", { name: artistName, type: "resident" });
      setArtists((prev) => [...prev, data]);
      setArtistName("");
      setShowArtistForm(false);
    } finally {
      setSavingArtist(false);
    }
  }

  const sessionsByDate = useMemo(() => {
    const flat = bookings.flatMap((b) =>
      (b.sessions || []).map((s) => ({ ...s, project: b }))
    );
    flat.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    const groups = new Map();
    for (const s of flat) {
      const dateKey = new Date(s.start_time).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "long" });
      if (!groups.has(dateKey)) groups.set(dateKey, []);
      groups.get(dateKey).push(s);
    }
    return groups;
  }, [bookings]);

  const planningStats = useMemo(() => {
    const now = new Date();
    const todayKey = now.toDateString();
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const flat = bookings.flatMap((b) => (b.sessions || []).map((s) => s));
    return {
      today: flat.filter((s) => new Date(s.start_time).toDateString() === todayKey).length,
      week: flat.filter((s) => {
        const d = new Date(s.start_time);
        return d >= now && d <= weekAhead;
      }).length,
    };
  }, [bookings]);

  const [durationDraft, setDurationDraft] = useState({}); // sessionId -> string

  async function updateSession(sessionId, patch) {
    setBookings((prev) =>
      prev.map((b) => ({
        ...b,
        sessions: (b.sessions || []).map((s) => (s.id === sessionId ? { ...s, ...patch } : s)),
      }))
    );
    const body = {};
    if (patch.status) body.status = patch.status;
    if (patch.actual_duration_minutes) body.actualDurationMinutes = patch.actual_duration_minutes;
    await studioApi.patch(`/studios/me/sessions/${sessionId}`, body);
  }

  function completeSession(sessionId) {
    const minutes = parseInt(durationDraft[sessionId], 10);
    updateSession(sessionId, {
      status: "abgeschlossen",
      ...(minutes > 0 ? { actual_duration_minutes: minutes } : {}),
    });
    setDurationDraft((prev) => ({ ...prev, [sessionId]: undefined }));
  }

  async function removeWaitlistEntry(entryId) {
    setWaitlist((prev) => prev.filter((w) => w.id !== entryId));
    await studioApi.delete(`/studios/me/waitlist/${entryId}`);
  }

  async function logout() {
    await studioOsAuth.logout();
    navigate("/os/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin text-zinc-400" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="md:w-52 flex-shrink-0">
          <div className="md:sticky md:top-8 space-y-4">
            <div className="bg-zinc-900 rounded-2xl p-4">
              <div className="text-[10px] font-inter uppercase tracking-widest text-zinc-500 mb-1">Studio Dashboard</div>
              <div className="font-playfair text-white text-base leading-tight mb-2">{studio?.name}</div>
              {studio?.is_verified && (
                <span className="inline-flex items-center gap-1 text-[10px] font-inter text-emerald-400 mb-2">
                  <BadgeCheck size={11} /> Verifiziert
                </span>
              )}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-white/10 rounded-xl px-3 py-2">
                  <div className="font-playfair text-white text-lg leading-none">{stats.total}</div>
                  <div className="text-[9px] font-inter uppercase tracking-wide text-zinc-400 mt-1">Buchungen</div>
                </div>
                <div className="bg-white/10 rounded-xl px-3 py-2">
                  <div className="font-playfair text-white text-lg leading-none">{stats.anfrage}</div>
                  <div className="text-[9px] font-inter uppercase tracking-wide text-zinc-400 mt-1">Ausstehend</div>
                </div>
              </div>
            </div>

            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1">
              {NAV_ITEMS.map(({ key, label, icon: Icon, badgeFrom }) => {
                const badge = badgeFrom ? stats[badgeFrom] : 0;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-inter whitespace-nowrap transition-colors flex-shrink-0 ${
                      tab === key ? "bg-white shadow-soft text-zinc-900 font-medium" : "text-zinc-500 hover:bg-white/60"
                    }`}
                  >
                    <Icon size={15} strokeWidth={1.5} />
                    {label}
                    {badge > 0 && (
                      <span className="ml-auto text-[10px] font-inter bg-zinc-900 text-white rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-inter text-zinc-400 hover:bg-white/60 transition-colors w-full"
            >
              <LogOut size={15} strokeWidth={1.5} /> Abmelden
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {tab === "uebersicht" && (
            <section>
              <SectionHeader title="Übersicht" subtitle={`Angemeldet als ${staff?.name} · ${staff?.role}`} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <StatCard icon={BookOpen} value={stats.total} label="Buchungen" />
                <StatCard icon={Calendar} value={stats.anfrage} label="Anfragen" />
                <StatCard icon={LayoutGrid} value={stats.in_planung} label="In Planung" />
                <StatCard icon={BadgeCheck} value={stats.abgeschlossen} label="Abgeschlossen" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <StatCard icon={Wallet} value={eur(revenueStats.revenue)} label="Umsatz gesamt" />
                <StatCard icon={Users} value={revenueStats.customerCount} label="Kunden gesamt" />
                <StatCard icon={TrendingUp} value={eur(revenueStats.avgPerBooking)} label="Ø pro Buchung" />
              </div>

              <SectionHeader title="Umsatz-Historie" subtitle="Zuletzt abgeschlossene Buchungen" />
              {revenueStats.history.length === 0 ? (
                <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)]">
                  <EmptyState heading="Noch kein Umsatz erfasst" subtext="Trag bei abgeschlossenen Buchungen einen Preis ein, um Historie zu sehen." />
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] divide-y divide-zinc-100">
                  {revenueStats.history.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <div className="font-inter text-sm text-zinc-900 truncate">{b.customers?.name || "—"}</div>
                        <div className="text-xs font-inter text-zinc-500 mt-0.5">
                          {b.created_at && new Date(b.created_at).toLocaleDateString("de-DE")} · {TYPE_LABEL[b.appointment_type]}
                        </div>
                      </div>
                      <div className="font-playfair text-sm text-zinc-900 flex-shrink-0">{eur(Number(b.price_final))}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === "buchungen" && (
            <section>
              <SectionHeader title="Buchungen" subtitle="Alle Anfragen und Termine deines Studios" />
              <div className="relative mb-4">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nach Name oder Titel suchen..."
                  className="rounded-2xl h-10 pl-10 pr-9 bg-white"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X size={14} className="text-zinc-400" />
                  </button>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)]">
                {filteredBookings.length === 0 ? (
                  <EmptyState
                    heading={bookings.length === 0 ? "Keine Buchungen" : "Keine Ergebnisse"}
                    subtext={bookings.length === 0 ? "Teile deinen Studio-Link, damit Kunden buchen können." : "Versuch eine andere Suche."}
                  />
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {filteredBookings.map((b) => (
                      <div key={b.id} className="flex items-center justify-between gap-4 p-4">
                        <div className="min-w-0">
                          <div className="font-inter font-medium text-sm text-zinc-900 truncate">
                            {b.customers?.name || "—"}
                            <span className="ml-2 text-[10px] font-inter uppercase tracking-wide text-zinc-400">{TYPE_LABEL[b.appointment_type]}</span>
                          </div>
                          <div className="text-xs font-inter text-zinc-500 mt-0.5 truncate">
                            {b.title && <>{b.title} · </>}
                            {b.sessions?.[0]?.start_time && new Date(b.sessions[0].start_time).toLocaleString("de-DE")}
                          </div>
                          {b.reference_images?.length > 0 && (
                            <div className="flex gap-1.5 mt-2">
                              {b.reference_images.map((url) => (
                                <a key={url} href={url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-100">
                                  <img src={url} alt="Referenz" className="w-full h-full object-cover" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              defaultValue={b.price_final ?? ""}
                              onBlur={(e) => {
                                const v = e.target.value === "" ? null : Number(e.target.value);
                                if (v !== (b.price_final ?? null)) updatePrice(b.id, v);
                              }}
                              placeholder="Preis"
                              className="w-20 h-9 rounded-lg text-xs pl-5"
                            />
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">€</span>
                          </div>
                          <StatusBadge status={b.status} />
                          <Select value={b.status} onValueChange={(v) => updateStatus(b.id, v)}>
                            <SelectTrigger className="w-[140px] rounded-lg h-9 text-xs font-inter">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s} value={s} className="text-xs font-inter">
                                  {STATUS_LABEL[s]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {tab === "kalender" && (
            <section>
              <SectionHeader title="Kalender" subtitle="Deine anstehenden Termine, nach Tag sortiert" />
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] px-4 py-3">
                  <div className="font-playfair text-xl text-zinc-900">{planningStats.today}</div>
                  <div className="text-[10px] font-inter uppercase tracking-wide text-zinc-400 mt-0.5">Heute</div>
                </div>
                <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] px-4 py-3">
                  <div className="font-playfair text-xl text-zinc-900">{planningStats.week}</div>
                  <div className="text-[10px] font-inter uppercase tracking-wide text-zinc-400 mt-0.5">Nächste 7 Tage</div>
                </div>
                <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] px-4 py-3">
                  <div className="font-playfair text-xl text-zinc-900">{stats.anfrage}</div>
                  <div className="text-[10px] font-inter uppercase tracking-wide text-zinc-400 mt-0.5">Offene Anfragen</div>
                </div>
              </div>
              {sessionsByDate.size === 0 ? (
                <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)]">
                  <EmptyState heading="Noch keine Termine" subtext="Sobald Buchungen reinkommen, erscheinen sie hier chronologisch." />
                </div>
              ) : (
                <div className="space-y-5">
                  {Array.from(sessionsByDate.entries()).map(([date, sessions]) => (
                    <div key={date}>
                      <div className="text-xs font-inter font-medium text-zinc-500 uppercase tracking-wide mb-2">{date}</div>
                      <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] divide-y divide-zinc-100">
                        {sessions.map((s) => (
                          <div key={s.id} className="flex items-center justify-between gap-4 p-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex items-center gap-1.5 text-sm font-inter font-medium text-zinc-900 flex-shrink-0 w-14">
                                <Clock size={12} className="text-zinc-400" />
                                {new Date(s.start_time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                              <div className="min-w-0">
                                <div className="font-inter text-sm text-zinc-900 truncate">
                                  {s.project.customers?.name || "—"}
                                  <span className="ml-2 text-[10px] font-inter uppercase tracking-wide text-zinc-400">
                                    {TYPE_LABEL[s.project.appointment_type]}
                                  </span>
                                </div>
                                <div className="text-xs font-inter text-zinc-500 mt-0.5">
                                  {SESSION_STATUS_LABEL[s.status]}
                                  {s.estimated_duration_minutes && <> · geschätzt {s.estimated_duration_minutes} Min.</>}
                                  {s.actual_duration_minutes && <> · tatsächlich {s.actual_duration_minutes} Min.</>}
                                </div>
                              </div>
                            </div>

                            {s.status !== "abgeschlossen" && s.status !== "storniert" && s.status !== "no_show" && (
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {durationDraft[s.id] !== undefined ? (
                                  <>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={durationDraft[s.id] || ""}
                                      onChange={(e) => setDurationDraft((prev) => ({ ...prev, [s.id]: e.target.value }))}
                                      placeholder="Min."
                                      className="w-20 h-8 rounded-lg text-xs"
                                      autoFocus
                                    />
                                    <Button size="sm" onClick={() => completeSession(s.id)} className="h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-inter text-xs">
                                      Fertig
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setDurationDraft((prev) => ({ ...prev, [s.id]: "" }))}
                                    className="h-8 rounded-lg font-inter text-xs"
                                  >
                                    Abschließen
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === "warteliste" && (
            <section>
              <SectionHeader title="Warteliste" subtitle="Kunden, die auf einen freien Termin warten" />
              <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)]">
                {waitlist.length === 0 ? (
                  <EmptyState heading="Niemand wartet aktuell" subtext="Einträge erscheinen hier, sobald Kunden sich auf deiner Studioseite eintragen." />
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {waitlist.map((w) => (
                      <div key={w.id} className="flex items-center justify-between gap-4 p-4">
                        <div className="min-w-0">
                          <div className="font-inter font-medium text-sm text-zinc-900 truncate">{w.customers?.name || "—"}</div>
                          <div className="text-xs font-inter text-zinc-500 mt-0.5 truncate">
                            {w.desired_period}
                            {w.motif_rough && <> · {w.motif_rough}</>}
                            {w.artists?.name && <> · bei {w.artists.name}</>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeWaitlistEntry(w.id)}
                          className="p-2 rounded-lg hover:bg-zinc-100 transition-colors flex-shrink-0"
                          title="Entfernen"
                        >
                          <Trash2 size={14} className="text-zinc-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {tab === "artists" && (
            <section>
              <SectionHeader
                title="Artists"
                subtitle="Dein Team, sichtbar auf der Buchungsseite"
                action={
                  <Button size="sm" onClick={() => setShowArtistForm((v) => !v)} className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter">
                    <Plus size={14} className="mr-1.5" /> Artist
                  </Button>
                }
              />

              {showArtistForm && (
                <form onSubmit={addArtist} className="flex gap-2 mb-4">
                  <Input
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="Name des Artists"
                    className="rounded-xl h-10 bg-white"
                    autoFocus
                  />
                  <Button type="submit" disabled={savingArtist} className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white flex-shrink-0">
                    {savingArtist ? <Loader2 size={14} className="animate-spin" /> : "Speichern"}
                  </Button>
                </form>
              )}

              <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)]">
                {artists.length === 0 ? (
                  <EmptyState heading="Noch keine Artists" subtext="Füge dein Team hinzu, damit Kunden gezielt buchen können." />
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {artists.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 p-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-200 flex-shrink-0 overflow-hidden">
                          {a.photo_url && <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-inter font-medium text-sm text-zinc-900">{a.name}</div>
                          {a.bio && <div className="text-xs font-inter text-zinc-500 truncate">{a.bio}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {tab === "profil" && (
            <section>
              <SectionHeader title="Profil & Link" subtitle="So sehen Kunden dein Studio" />
              <div className="space-y-4">
                {studio?.slug && <CopyLinkCard slug={studio.slug} />}
                <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5">
                  <div className="text-[10px] font-inter uppercase tracking-widest text-zinc-400 mb-3">Studio-Daten</div>
                  <dl className="space-y-2.5 text-sm font-inter">
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Name</dt>
                      <dd className="text-zinc-900 font-medium">{studio?.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Stadt</dt>
                      <dd className="text-zinc-900">{studio?.city || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Status</dt>
                      <dd className="text-zinc-900">{studio?.is_active ? "Aktiv" : "Inaktiv"}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
