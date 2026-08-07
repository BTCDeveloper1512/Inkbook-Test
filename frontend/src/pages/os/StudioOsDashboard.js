import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  LogOut,
  LayoutGrid,
  BookOpen,
  Users,
  Settings2,
  Calendar,
  Search,
  X,
  BadgeCheck,
  Bell,
  Trash2,
  CalendarDays,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { studioApi } from "../../lib/studioApi";
import { SLOT_LABEL } from "../../lib/daySlots";
import { studioOsAuth } from "../../lib/studioOsAuth";
import { StudioOSWordmark } from "../../components/StudioOSLogo";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import OfferModal from "./OfferModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import StudioProfileTab from "./StudioProfileTab";
import StudioArtistsTab from "./StudioArtistsTab";
import StudioCalendarTab from "./StudioCalendarTab";

const STATUS_OPTIONS = ["anfrage", "angebot_gesendet", "angenommen", "abgelehnt", "in_planung", "laufend", "abgeschlossen", "abgebrochen"];
const STATUS_LABEL = {
  anfrage: "Anfrage",
  angebot_gesendet: "Angebot läuft",
  angenommen: "Angenommen",
  abgelehnt: "Abgelehnt",
  in_planung: "In Planung",
  laufend: "Läuft",
  abgeschlossen: "Abgeschlossen",
  abgebrochen: "Abgebrochen",
};
// Same visual language as the old dashboard's statusColors map: amber for
// "needs attention", blue/violet for in-progress, green for done, red for cancelled.
const STATUS_DOT = {
  anfrage: "bg-amber-500",
  angebot_gesendet: "bg-violet-500",
  angenommen: "bg-teal-500",
  abgelehnt: "bg-zinc-400",
  in_planung: "bg-blue-500",
  laufend: "bg-violet-500",
  abgeschlossen: "bg-emerald-500",
  abgebrochen: "bg-red-500",
};
const STATUS_BADGE = {
  anfrage: "bg-amber-50 text-amber-700 border-amber-200",
  angebot_gesendet: "bg-violet-50 text-violet-700 border-violet-200",
  angenommen: "bg-teal-50 text-teal-700 border-teal-200",
  abgelehnt: "bg-zinc-100 text-zinc-500 border-zinc-200",
  in_planung: "bg-blue-50 text-blue-700 border-blue-200",
  laufend: "bg-violet-50 text-violet-700 border-violet-200",
  abgeschlossen: "bg-emerald-50 text-emerald-700 border-emerald-200",
  abgebrochen: "bg-red-50 text-red-700 border-red-200",
};
const TYPE_LABEL = { consultation: "Beratung", project: "Projekt", single_session: "Termin" };

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

export default function StudioOsDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("kalender");
  const [staff, setStaff] = useState(null);
  const [studio, setStudio] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [waitlist, setWaitlist] = useState([]);
  const [offerModal, setOfferModal] = useState(null);

  function handleOfferSent(projectId, offer) {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === projectId
          ? { ...b, status: "angebot_gesendet", price_estimated: offer.price_total, offers: [offer, ...(b.offers || [])] }
          : b
      )
    );
  }

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
                            {b.sessions?.[0]?.start_time
                              ? new Date(b.sessions[0].start_time).toLocaleString("de-DE")
                              : b.preferred_date && (
                                  <>
                                    Wunsch: {new Date(b.preferred_date).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short" })}
                                    {b.preferred_slot && <>, {SLOT_LABEL[b.preferred_slot]?.toLowerCase()}</>}
                                    {b.preferred_time && <> ({b.preferred_time})</>}
                                  </>
                                )}
                          </div>
                          {b.offers?.some((o) => o.status === "gesendet") && (
                            <div className="text-[11px] font-inter text-violet-600 mt-1">
                              Angebot läuft: {Number(b.offers.find((o) => o.status === "gesendet").price_total).toFixed(0)} € ·{" "}
                              {b.offers.find((o) => o.status === "gesendet").duration_minutes} Min.
                            </div>
                          )}
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
                          {["anfrage", "angebot_gesendet", "abgelehnt"].includes(b.status) && (
                            <Button
                              size="sm"
                              onClick={() => setOfferModal(b)}
                              className="h-9 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-inter text-xs"
                            >
                              {b.status === "angebot_gesendet" ? "Angebot ändern" : "Angebot erstellen"}
                            </Button>
                          )}
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
              <SectionHeader title="Kalender" subtitle="Zugesagte Angebote in den Tagesplan ziehen" />
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
              <StudioCalendarTab bookings={bookings} artists={artists} studio={studio} onBookingsChange={setBookings} />
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
              <SectionHeader title="Artists" subtitle="Dein Team, sichtbar auf der Buchungsseite" />
              <StudioArtistsTab artists={artists} bookings={bookings} onArtistsChange={setArtists} />
            </section>
          )}

          {tab === "profil" && (
            <section>
              <SectionHeader title="Profil & Link" subtitle="So sehen Kunden dein Studio" />
              <StudioProfileTab studio={studio} staff={staff} onStudioUpdate={setStudio} onStaffUpdate={setStaff} />
            </section>
          )}
        </main>
      </div>

      <AnimatePresence>
        {offerModal && <OfferModal booking={offerModal} onClose={() => setOfferModal(null)} onSent={handleOfferSent} />}
      </AnimatePresence>
    </div>
  );
}
