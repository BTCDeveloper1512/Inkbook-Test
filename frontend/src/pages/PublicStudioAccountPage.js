import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, LogOut } from "lucide-react";
import { studioApi } from "../lib/studioApi";
import { StudioOSWordmark } from "../components/StudioOSLogo";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const STATUS_LABEL = {
  anfrage: "Anfrage gesendet",
  in_planung: "In Planung",
  laufend: "Läuft",
  abgeschlossen: "Abgeschlossen",
  abgebrochen: "Abgebrochen",
};
const TYPE_LABEL = { consultation: "Beratung", project: "Projekt", single_session: "Termin" };

/**
 * A customer's own account at ONE studio (/t/:slug/konto) — not a global
 * "my account" across studios, since a customer's identity is scoped per
 * studio here (see the tenancy notes in studioApi.js / backend auth).
 */
export default function PublicStudioAccountPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const me = await studioApi.get(`/t/${slug}/auth/me`).then((r) => r.data);
      const list = await studioApi.get(`/t/${slug}/bookings`).then((r) => r.data);
      setCustomer(me);
      setBookings(list);
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function submitLogin(e) {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      await studioApi.post(`/t/${slug}/auth/login`, { email, password });
      await load();
    } catch (err) {
      setLoginError(err.response?.data?.error || "Anmeldung fehlgeschlagen.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function logout() {
    await studioApi.post(`/t/${slug}/auth/logout`);
    setCustomer(null);
    setBookings([]);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin text-zinc-400" size={28} />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-card p-8">
          <StudioOSWordmark className="mb-6" />
          <h1 className="font-playfair text-lg text-zinc-900 mb-1">Dein Konto</h1>
          <p className="text-sm text-zinc-500 font-inter mb-5">Melde dich an, um deine Termine zu sehen.</p>
          <form onSubmit={submitLogin} className="space-y-3">
            <div>
              <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">E-Mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl h-10" required />
            </div>
            <div>
              <Label className="text-xs font-inter text-zinc-500 mb-1.5 block">Passwort</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl h-10" required />
            </div>
            {loginError && <p className="text-xs text-red-600 font-inter">{loginError}</p>}
            <Button type="submit" disabled={loggingIn} className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter mt-2">
              {loggingIn ? <Loader2 size={16} className="animate-spin" /> : "Anmelden"}
            </Button>
          </form>
          <button
            type="button"
            onClick={() => navigate(`/t/${slug}`)}
            className="w-full text-center text-xs font-inter text-zinc-400 hover:text-zinc-600 mt-4"
          >
            Zurück zur Studioseite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-100">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <StudioOSWordmark markSize={22} textSize="text-sm" />
          <div className="flex items-center gap-4">
            <span className="text-xs font-inter text-zinc-400">{customer.name}</span>
            <Button variant="outline" size="sm" onClick={logout} className="rounded-lg font-inter">
              <LogOut size={14} className="mr-1.5" /> Abmelden
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-playfair text-xl text-zinc-900 mb-4">Deine Termine</h1>
        {bookings.length === 0 ? (
          <p className="text-sm text-zinc-400 font-inter">Noch keine Termine bei diesem Studio.</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl shadow-card p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-inter font-medium text-sm text-zinc-900">{b.title || TYPE_LABEL[b.appointment_type]}</span>
                  <span className="text-[11px] font-inter px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">{STATUS_LABEL[b.status]}</span>
                </div>
                <p className="text-xs font-inter text-zinc-500">{TYPE_LABEL[b.appointment_type]}</p>
                {b.sessions?.[0]?.start_time && (
                  <p className="text-xs font-inter text-zinc-400 mt-1">{new Date(b.sessions[0].start_time).toLocaleString("de-DE")}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
