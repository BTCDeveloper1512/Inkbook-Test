import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, LogOut, CheckCircle, Clock, Bell } from "lucide-react";
import { studioApi } from "../lib/studioApi";
import { useLiveUpdates } from "../lib/useLiveUpdates";
import { SLOT_LABEL } from "../lib/daySlots";
import { StudioOSWordmark } from "../components/StudioOSLogo";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const STATUS_LABEL = {
  anfrage: "Anfrage gesendet",
  angebot_gesendet: "Angebot erhalten",
  angenommen: "Zugesagt",
  abgelehnt: "Abgelehnt",
  in_planung: "Termin steht",
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
  const [responding, setResponding] = useState(null);
  const [respondError, setRespondError] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);

  const unread = notifications.filter((n) => !n.read_at).length;

  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await studioApi.get(`/t/${slug}/notifications`);
      setNotifications(data);
    } catch {
      /* not signed in yet */
    }
  }, [slug]);

  // The studio changing a status has to reach the customer without a reload —
  // that's the whole point of them having an account page open.
  const onLive = useCallback(
    (type) => {
      if (type === "notification") loadNotifications();
      load();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadNotifications]
  );
  useLiveUpdates(`/t/${slug}/stream`, onLive, !!customer);

  async function openBell() {
    setBellOpen((v) => !v);
    if (!bellOpen && unread > 0) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      await studioApi.post(`/t/${slug}/notifications/read`, {});
    }
  }

  async function respondToOffer(offerId, accept) {
    setResponding(offerId);
    setRespondError((prev) => ({ ...prev, [offerId]: "" }));
    try {
      await studioApi.post(`/t/${slug}/offers/${offerId}/respond`, { accept });
      await load();
    } catch (err) {
      setRespondError((prev) => ({ ...prev, [offerId]: err.response?.data?.error || "Konnte nicht gesendet werden." }));
    } finally {
      setResponding(null);
    }
  }

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
    loadNotifications();
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
          <div className="flex items-center gap-3">
            <span className="text-xs font-inter text-zinc-400">{customer.name}</span>

            <div className="relative">
              <button
                type="button"
                onClick={openBell}
                className="relative p-2 rounded-xl hover:bg-zinc-100 transition-colors"
                title="Benachrichtigungen"
              >
                <Bell size={16} className="text-zinc-500" />
                {unread > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-zinc-900 text-white text-[9px] font-inter flex items-center justify-center"
                  >
                    {unread}
                  </motion.span>
                )}
              </button>

              <AnimatePresence>
                {bellOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto bg-white rounded-2xl shadow-xl border border-zinc-100 z-50 p-2"
                  >
                    {notifications.length === 0 ? (
                      <p className="text-[11px] font-inter text-zinc-400 text-center py-6">Noch nichts passiert.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="px-2.5 py-2 rounded-xl hover:bg-zinc-50">
                          <div className="text-xs font-inter font-medium text-zinc-900">{n.title}</div>
                          <div className="text-[11px] font-inter text-zinc-500">{n.body}</div>
                          <div className="text-[10px] font-inter text-zinc-300 mt-0.5">
                            {new Date(n.created_at).toLocaleString("de-DE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
            <AnimatePresence initial={false}>
              {bookings.map((b, i) => {
                const openOffer = (b.offers || []).find((o) => o.status === "gesendet");
                return (
                  <motion.div
                    key={b.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 320, damping: 28, delay: i * 0.04 }}
                    className="bg-white rounded-2xl shadow-card p-5"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-inter font-medium text-sm text-zinc-900">{b.title || TYPE_LABEL[b.appointment_type]}</span>
                      <span
                        className={`text-[11px] font-inter px-2 py-0.5 rounded-full ${
                          openOffer ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {STATUS_LABEL[b.status] || b.status}
                      </span>
                    </div>
                    <p className="text-xs font-inter text-zinc-500">{TYPE_LABEL[b.appointment_type]}</p>

                    {b.sessions?.[0]?.start_time ? (
                      <p className="text-xs font-inter text-zinc-400 mt-1">
                        {new Date(b.sessions[0].start_time).toLocaleString("de-DE", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        Uhr
                      </p>
                    ) : (
                      b.preferred_date && (
                        <p className="text-xs font-inter text-zinc-400 mt-1">
                          Wunsch: {new Date(b.preferred_date).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "long" })}
                          {b.preferred_slot && <>, {SLOT_LABEL[b.preferred_slot]?.toLowerCase()}</>}
                        </p>
                      )
                    )}

                    {openOffer && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 rounded-2xl border border-zinc-900/10 bg-zinc-50 p-4"
                      >
                        <p className="text-xs font-inter font-semibold text-zinc-900 mb-2">🎨 Studio-Angebot erhalten</p>
                        <div className="grid grid-cols-2 gap-y-1.5 text-xs font-inter mb-3">
                          <span className="text-zinc-400">Termin</span>
                          <span className="text-zinc-900 font-medium">
                            {openOffer.offer_starts_at ? (
                              <>
                                {new Date(openOffer.offer_starts_at).toLocaleString("de-DE", {
                                  weekday: "short",
                                  day: "2-digit",
                                  month: "long",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                Uhr
                              </>
                            ) : (
                              <>
                                {new Date(openOffer.offer_date).toLocaleDateString("de-DE", { day: "2-digit", month: "long" })}
                                {openOffer.offer_slot && <>, {SLOT_LABEL[openOffer.offer_slot]?.toLowerCase()}</>}
                              </>
                            )}
                          </span>
                          <span className="text-zinc-400">Dauer</span>
                          <span className="text-zinc-900 font-medium">{openOffer.duration_minutes} Minuten</span>
                          <span className="text-zinc-400">Gesamtpreis</span>
                          <span className="text-zinc-900 font-medium">{Number(openOffer.price_total).toFixed(0)} €</span>
                        </div>
                        {openOffer.notes && <p className="text-xs font-inter text-zinc-600 italic mb-3">"{openOffer.notes}"</p>}
                        <p className="text-[11px] font-inter text-zinc-500 mb-3 flex items-start gap-1">
                          <Clock size={11} className="mt-0.5 flex-shrink-0" />
                          Mit deiner Zusage ist der Termin verbindlich gebucht.
                        </p>
                        {respondError[openOffer.id] && (
                          <p className="text-xs font-inter text-red-600 mb-2">{respondError[openOffer.id]}</p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => respondToOffer(openOffer.id, true)}
                            disabled={responding === openOffer.id}
                            className="flex-1 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter text-xs"
                          >
                            <CheckCircle size={13} className="mr-1.5" />
                            {responding === openOffer.id ? "…" : "Angebot annehmen"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => respondToOffer(openOffer.id, false)}
                            disabled={responding === openOffer.id}
                            className="h-10 rounded-xl font-inter text-xs"
                          >
                            Ablehnen
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
