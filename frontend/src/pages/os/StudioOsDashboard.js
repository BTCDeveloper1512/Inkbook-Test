import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, LogOut, Copy, Check } from "lucide-react";
import { studioApi } from "../../lib/studioApi";
import { studioOsAuth } from "../../lib/studioOsAuth";
import { StudioOSWordmark } from "../../components/StudioOSLogo";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

const STATUS_OPTIONS = ["anfrage", "in_planung", "laufend", "abgeschlossen", "abgebrochen"];
const STATUS_LABEL = {
  anfrage: "Anfrage",
  in_planung: "In Planung",
  laufend: "Läuft",
  abgeschlossen: "Abgeschlossen",
  abgebrochen: "Abgebrochen",
};
const TYPE_LABEL = { consultation: "Beratung", project: "Projekt", single_session: "Termin" };

function CopyLink({ slug }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/t/${slug}`;
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-1.5 text-xs font-inter text-zinc-500 hover:text-zinc-800 transition-colors"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {url}
    </button>
  );
}

export default function StudioOsDashboard() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [studio, setStudio] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
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
      <header className="bg-white border-b border-zinc-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <StudioOSWordmark markSize={22} textSize="text-sm" />
            <div className="mt-1 flex items-center gap-3">
              <span className="font-inter text-sm font-medium text-zinc-800">{studio?.name}</span>
              {studio?.slug && <CopyLink slug={studio.slug} />}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-inter text-zinc-400">{staff?.name} · {staff?.role}</span>
            <Button variant="outline" size="sm" onClick={logout} className="rounded-lg font-inter">
              <LogOut size={14} className="mr-1.5" /> Abmelden
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid lg:grid-cols-[1fr_320px] gap-6">
        <section className="bg-white rounded-3xl shadow-card p-6">
          <h2 className="font-playfair text-lg text-zinc-900 mb-4">Buchungen</h2>
          {bookings.length === 0 ? (
            <p className="text-sm text-zinc-400 font-inter py-8 text-center">Noch keine Buchungen — teile deinen Studio-Link.</p>
          ) : (
            <div className="space-y-2">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-100">
                  <div className="min-w-0">
                    <div className="font-inter font-medium text-sm text-zinc-900">
                      {b.title || TYPE_LABEL[b.appointment_type]}
                      <span className="ml-2 text-[10px] font-inter uppercase tracking-wide text-zinc-400">{TYPE_LABEL[b.appointment_type]}</span>
                    </div>
                    <div className="text-xs font-inter text-zinc-500 mt-0.5">
                      {b.customers?.name} · {b.sessions?.[0]?.start_time && new Date(b.sessions[0].start_time).toLocaleString("de-DE")}
                    </div>
                  </div>
                  <Select value={b.status} onValueChange={(v) => updateStatus(b.id, v)}>
                    <SelectTrigger className="w-[150px] rounded-lg h-9 text-xs font-inter flex-shrink-0">
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
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl shadow-card p-6 self-start">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair text-lg text-zinc-900">Artists</h2>
            <button type="button" onClick={() => setShowArtistForm((v) => !v)} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
              <Plus size={16} className="text-zinc-500" />
            </button>
          </div>

          {showArtistForm && (
            <form onSubmit={addArtist} className="flex gap-2 mb-4">
              <Input
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="Name"
                className="rounded-xl h-9 text-sm"
                autoFocus
              />
              <Button type="submit" disabled={savingArtist} size="sm" className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white flex-shrink-0">
                {savingArtist ? <Loader2 size={14} className="animate-spin" /> : "OK"}
              </Button>
            </form>
          )}

          {artists.length === 0 ? (
            <p className="text-xs text-zinc-400 font-inter">Noch keine Artists.</p>
          ) : (
            <div className="space-y-2">
              {artists.map((a) => (
                <div key={a.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-100">
                  <div className="w-8 h-8 rounded-full bg-zinc-200 flex-shrink-0" />
                  <span className="text-sm font-inter text-zinc-800">{a.name}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
