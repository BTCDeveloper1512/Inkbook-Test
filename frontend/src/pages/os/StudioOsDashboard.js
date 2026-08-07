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

const NAV_ITEMS = [
  { key: "uebersicht", label: "Übersicht", icon: LayoutGrid },
  { key: "buchungen", label: "Buchungen", icon: BookOpen, badgeFrom: "anfrage" },
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
  const [tab, setTab] = useState("uebersicht");
  const [staff, setStaff] = useState(null);
  const [studio, setStudio] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showArtistForm, setShowArtistForm] = useState(false);
  const [artistName, setArtistName] = useState("");
  const [savingArtist, setSavingArtist] = useState(false);

  const load = useCallback(async () => {
    try {
      const [me, studioRes, bookingsRes, artistsRes] = await Promise.all([
        studioOsAuth.me(),
        studioApi.get("/studios/me"),
        studioApi.get("/studios/me/bookings"),
        studioApi.get("/studios/me/artists"),
      ]);
      setStaff(me);
      setStudio(studioRes.data);
      setBookings(bookingsRes.data);
      setArtists(artistsRes.data);
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
    }),
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) => (b.customers?.name || "").toLowerCase().includes(q) || (b.title || "").toLowerCase().includes(q));
  }, [bookings, search]);

  async function updateStatus(projectId, status) {
    setBookings((prev) => prev.map((b) => (b.id === projectId ? { ...b, status } : b)));
    await studioApi.patch(`/studios/me/bookings/${projectId}`, { status });
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard icon={BookOpen} value={stats.total} label="Buchungen" />
                <StatCard icon={Calendar} value={stats.anfrage} label="Anfragen" />
                <StatCard icon={LayoutGrid} value={stats.in_planung} label="In Planung" />
                <StatCard icon={BadgeCheck} value={stats.abgeschlossen} label="Abgeschlossen" />
              </div>
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
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
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
