import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, LogOut, CheckCircle, Clock, Bell, XCircle, CalendarCheck, Hourglass, ArrowLeftRight, MessageCircle } from "lucide-react";
import { studioApi } from "../lib/studioApi";
import { useLiveUpdates } from "../lib/useLiveUpdates";
import { SLOT_LABEL } from "../lib/daySlots";
import { StudioOSWordmark } from "../components/StudioOSLogo";
import ChatThread from "../components/ChatThread";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const STATUS_LABEL = {
  anfrage: "Anfrage gesendet",
  angebot_gesendet: "Angebot erhalten",
  angenommen: "Zugesagt",
  anzahlung_ausstehend: "Anzahlung ausstehend",
  abgelehnt: "Abgelehnt",
  in_planung: "Termin steht",
  laufend: "Läuft",
  abgeschlossen: "Abgeschlossen",
  abgebrochen: "Storniert",
};
const TYPE_LABEL = { consultation: "Beratung", project: "Projekt", single_session: "Termin" };
const CLOSED = ["abgeschlossen", "abgebrochen"];

const SECTIONS = [
  { id: "heute", label: "Heute", icon: Clock, subtitle: "Was heute ansteht" },
  { id: "anstehend", label: "Anstehend", icon: CalendarCheck, subtitle: "Deine kommenden Termine und offenen Angebote" },
  { id: "vergangen", label: "Vergangen", icon: CheckCircle, subtitle: "Abgeschlossen oder storniert" },
  { id: "warteliste", label: "Warteliste", icon: Hourglass, subtitle: "Plätze, auf die du wartest" },
  { id: "nachrichten", label: "Nachrichten", icon: MessageCircle, subtitle: "Dein Chat mit dem Studio, je Buchung" },
];

/** Earliest session that still counts — a cancelled one shouldn't set the date. */
function nextSession(b) {
  return (b.sessions || [])
    .filter((s) => s.status !== "storniert")
    .sort((a, c) => new Date(a.start_time) - new Date(c.start_time))[0];
}

/**
 * A customer's dashboard at ONE studio. Their identity is global but their
 * record is per studio, so this is scoped to /t/:slug — /konto picks the
 * studio first and sends them here.
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
  const [unverifiedOfferId, setUnverifiedOfferId] = useState(null);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const [confirmationResent, setConfirmationResent] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [tab, setTab] = useState("anstehend");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancellationHours, setCancellationHours] = useState(48);
  const [waitlist, setWaitlist] = useState([]);
  const [studio, setStudio] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [depositBanner, setDepositBanner] = useState(null);

  // Landing back here from the Stripe Checkout redirect. Only the tab switch
  // happens immediately — whether the deposit actually confirmed depends on
  // the confirm call below, so the banner isn't set from the query param
  // alone (that showed "Termin steht fest" before it necessarily was).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("project")) setTab("anstehend");
  }, []);

  async function leaveWaitlist(entryId) {
    setWaitlist((prev) => prev.filter((w) => w.id !== entryId));
    await studioApi.delete(`/t/${slug}/waitlist/${entryId}`);
  }

  const unread = notifications.filter((n) => !n.read_at).length;

  const load = useCallback(async () => {
    try {
      const me = await studioApi.get(`/t/${slug}/auth/me`).then((r) => r.data);
      const list = await studioApi.get(`/t/${slug}/bookings`).then((r) => r.data);
      // The studio's own cancellation window, so the confirm dialog can say
      // whether this particular cancellation is still free instead of leaving
      // the customer to guess.
      studioApi
        .get(`/t/${slug}`)
        .then(({ data }) => {
          setCancellationHours(Number(data?.settings?.cancellationHours ?? 48));
          setStudio(data);
        })
        .catch(() => {});
      studioApi
        .get(`/t/${slug}/waitlist`)
        .then(({ data }) => setWaitlist(data))
        .catch(() => {});
      setCustomer(me);
      setBookings(list);
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await studioApi.get(`/t/${slug}/notifications`);
      setNotifications(data);
    } catch {
      /* not signed in yet */
    }
  }, [slug]);

  // The webhook that would normally confirm a deposit can't reach a
  // non-public backend (local dev, or before a production webhook is wired
  // up) — without this, the customer lands back here after really paying and
  // still sees "Anzahlung ausstehend" forever. Confirming from the session id
  // Stripe appended to the redirect is idempotent with the webhook, so
  // whichever gets there first wins and the other is a no-op.
  const depositConfirmRequested = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const deposit = params.get("deposit");
    const projectId = params.get("project");
    const sessionId = params.get("session_id");
    if (deposit === "cancel") {
      setDepositBanner("cancel");
      return;
    }
    if (deposit !== "success" || !projectId || !sessionId) return;
    // StrictMode double-invokes effects in development, and this one has a
    // real side effect — without this guard it fires the confirm call twice
    // on every single page load, not just on a genuine double-click.
    if (depositConfirmRequested.current) return;
    depositConfirmRequested.current = true;

    setDepositBanner("confirming");
    studioApi
      .post(`/t/${slug}/bookings/${projectId}/deposit-confirm`, { sessionId })
      .then(() => setDepositBanner("success"))
      .catch(() => setDepositBanner("error"))
      .finally(() => {
        load();
        window.history.replaceState(null, "", window.location.pathname);
      });
    // Only ever meant to run once, right after the redirect lands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    loadNotifications();
  }, [load, loadNotifications]);

  // The studio changing something has to reach the customer without a reload.
  const onLive = useCallback(
    (type) => {
      if (type === "notification") loadNotifications();
      load();
    },
    [load, loadNotifications]
  );
  useLiveUpdates(`/t/${slug}/stream`, onLive, !!customer);

  const groups = useMemo(() => {
    const now = new Date();
    const heute = [];
    const anstehend = [];
    const vergangen = [];
    for (const b of bookings) {
      const s = nextSession(b);
      const start = s ? new Date(s.start_time) : null;
      if (CLOSED.includes(b.status) || (start && start < now && !s)) vergangen.push(b);
      else if (start && start.toDateString() === now.toDateString()) heute.push(b);
      else if (start && start < now) vergangen.push(b);
      else anstehend.push(b);
    }
    return { heute, anstehend, vergangen };
  }, [bookings]);

  const stats = useMemo(
    () => ({
      offen: bookings.filter((b) => ["anfrage", "angebot_gesendet"].includes(b.status)).length,
      bestaetigt: bookings.filter((b) => ["in_planung", "laufend", "angenommen"].includes(b.status)).length,
      storniert: bookings.filter((b) => b.status === "abgebrochen").length,
    }),
    [bookings]
  );

  const unreadMessages = useMemo(
    () => bookings.reduce((n, b) => n + (b.messages || []).filter((m) => m.sender === "staff" && !m.read_at).length, 0),
    [bookings]
  );
  // Every booking is a potential thread, not just ones with messages already —
  // a customer needs to reach the (locked) chat on a fresh "anfrage" to see
  // why it's locked and when it unlocks, not just once someone has written.
  const threads = useMemo(
    () =>
      bookings
        .map((b) => ({
          booking: b,
          last: (b.messages || []).length ? [...b.messages].sort((x, y) => new Date(y.created_at) - new Date(x.created_at))[0] : null,
        }))
        .sort((a, b) => new Date(b.last?.created_at || b.booking.created_at) - new Date(a.last?.created_at || a.booking.created_at)),
    [bookings]
  );
  const selectedThread = threads.find((t) => t.booking.id === selectedThreadId) || threads[0];
  const staffOnline = !!studio?.staff_last_seen_at && Date.now() - new Date(studio.staff_last_seen_at).getTime() < 45_000;
  const activeSection = SECTIONS.find((s) => s.id === tab) || SECTIONS[1];

  useEffect(() => {
    if (tab === "nachrichten" && selectedThread) markThreadRead(selectedThread.booking);
    // Only when the tab/thread actually changes, not on every message-array update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedThread?.booking.id]);

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
    setUnverifiedOfferId(null);
    try {
      const { data } = await studioApi.post(`/t/${slug}/offers/${offerId}/respond`, { accept });
      // A deposit is required: the slot isn't held until the payment lands,
      // so there is nothing to reload here yet — send the customer straight
      // to Stripe instead of showing a "confirmed" state that isn't true.
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      await load();
      setResponding(null);
    } catch (err) {
      setRespondError((prev) => ({ ...prev, [offerId]: err.response?.data?.error || "Konnte nicht gesendet werden." }));
      if (err.response?.data?.code === "email_unverified") setUnverifiedOfferId(offerId);
      setResponding(null);
    }
  }

  async function resendOwnConfirmation() {
    setResendingConfirmation(true);
    try {
      await studioApi.post("/auth/customer/resend-confirmation", { email: customer?.email });
    } catch {
      // Same stance as everywhere else this resend exists: nothing to reveal either way.
    } finally {
      setResendingConfirmation(false);
      setConfirmationResent(true);
    }
  }

  const [resumingDeposit, setResumingDeposit] = useState(null);

  async function resumeDeposit(projectId) {
    setResumingDeposit(projectId);
    try {
      const { data } = await studioApi.post(`/t/${slug}/bookings/${projectId}/deposit-checkout`);
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setRespondError((prev) => ({ ...prev, [projectId]: err.response?.data?.error || "Konnte nicht gestartet werden." }));
      setResumingDeposit(null);
    }
  }

  async function confirmCancel() {
    setCancelBusy(true);
    try {
      await studioApi.post(`/t/${slug}/bookings/${cancelTarget.booking.id}/cancel`);
      setCancelTarget(null);
      await load();
    } catch (err) {
      setRespondError((prev) => ({ ...prev, cancel: err.response?.data?.error || "Stornieren fehlgeschlagen." }));
    } finally {
      setCancelBusy(false);
    }
  }

  function markThreadRead(booking) {
    const hasUnread = (booking.messages || []).some((m) => m.sender === "staff" && !m.read_at);
    if (!hasUnread) return;
    setBookings((all) =>
      all.map((b) =>
        b.id === booking.id
          ? { ...b, messages: (b.messages || []).map((m) => (m.sender === "staff" ? { ...m, read_at: m.read_at || new Date().toISOString() } : m)) }
          : b
      )
    );
    studioApi.patch(`/t/${slug}/bookings/${booking.id}/messages/read`).catch(() => {});
  }

  function openThread(projectId) {
    setSelectedThreadId(projectId);
    setTab("nachrichten");
    const booking = bookings.find((b) => b.id === projectId);
    if (booking) markThreadRead(booking);
  }

  async function sendMessage(projectId, payload) {
    setSendingMessage(true);
    try {
      const { data: message } = await studioApi.post(`/t/${slug}/bookings/${projectId}/messages`, payload);
      setBookings((prev) => prev.map((b) => (b.id === projectId ? { ...b, messages: [...(b.messages || []), message] } : b)));
    } finally {
      setSendingMessage(false);
    }
  }

  async function submitLogin(e) {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      await studioApi.post(`/t/${slug}/auth/login`, { email, password });
      await load();
      await loadNotifications();
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
    setNotifications([]);
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
          <button type="button" onClick={() => navigate(`/t/${slug}`)} className="w-full text-center text-xs font-inter text-zinc-400 hover:text-zinc-600 mt-4">
            Zurück zur Studioseite
          </button>
        </div>
      </div>
    );
  }

  const shown = groups[tab] || [];

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-100">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <StudioOSWordmark markSize={22} textSize="text-sm" />
          <div className="flex items-center gap-3">
            <span className="text-xs font-inter text-zinc-400 hidden sm:inline">{customer.name}</span>

            <button type="button" onClick={() => setTab("nachrichten")} className="relative p-2 rounded-xl hover:bg-zinc-100 transition-colors" title="Nachrichten">
              <MessageCircle size={16} className="text-zinc-500" />
              {unreadMessages > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-zinc-900 text-white text-[9px] font-inter flex items-center justify-center"
                >
                  {unreadMessages}
                </motion.span>
              )}
            </button>

            <div className="relative">
              <button type="button" onClick={openBell} className="relative p-2 rounded-xl hover:bg-zinc-100 transition-colors" title="Benachrichtigungen">
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

            <button type="button" onClick={() => navigate("/konto")} className="p-2 rounded-xl hover:bg-zinc-100 transition-colors" title="Studio wechseln">
              <ArrowLeftRight size={15} className="text-zinc-500" />
            </button>
            <Button variant="outline" size="sm" onClick={logout} className="rounded-lg font-inter">
              <LogOut size={14} className="sm:mr-1.5" /> <span className="hidden sm:inline">Abmelden</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-6">
        {/* Same shape as the studio dashboard: a sticky rail that names where
            you are and what needs attention, so a customer with several
            bookings isn't navigating by a row of pills that all look alike. */}
        <aside className="md:w-52 flex-shrink-0">
          <div className="md:sticky md:top-8 space-y-4">
            <div className="bg-zinc-900 rounded-2xl p-4">
              <div className="text-[10px] font-inter uppercase tracking-widest text-zinc-500 mb-1">Dein Konto</div>
              <div className="font-playfair text-white text-base leading-tight mb-1">{studio?.name || "Studio"}</div>
              <div className="text-[11px] font-inter text-zinc-400 truncate">{customer?.name || customer?.email}</div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-white/10 rounded-xl px-3 py-2">
                  <div className="font-playfair text-white text-lg leading-none">{stats.offen}</div>
                  <div className="text-[9px] font-inter uppercase tracking-wide text-zinc-400 mt-1">Offen</div>
                </div>
                <div className="bg-white/10 rounded-xl px-3 py-2">
                  <div className="font-playfair text-white text-lg leading-none">{stats.bestaetigt}</div>
                  <div className="text-[9px] font-inter uppercase tracking-wide text-zinc-400 mt-1">Bestätigt</div>
                </div>
              </div>
            </div>

            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1">
              {SECTIONS.map(({ id, label, icon: Icon }) => {
                const badge =
                  id === "nachrichten"
                    ? unreadMessages
                    : id === "heute"
                      ? groups.heute.length
                      : id === "warteliste"
                        ? waitlist.length
                        : id === "anstehend"
                          ? groups.anstehend.length
                          : 0;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-inter whitespace-nowrap transition-colors flex-shrink-0 ${
                      tab === id ? "bg-white shadow-card text-zinc-900 font-medium" : "text-zinc-500 hover:bg-white/60"
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
          </div>
        </aside>

        <main className="flex-1 min-w-0">
        {depositBanner && (
          <div
            className={`mb-4 rounded-2xl px-4 py-3 text-xs font-inter flex items-start justify-between gap-3 ${
              depositBanner === "success" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            <span>
              {depositBanner === "confirming" && "Zahlung wird bestätigt…"}
              {depositBanner === "success" && "Zahlung erhalten — dein Termin steht jetzt fest."}
              {depositBanner === "error" &&
                "Die Zahlung konnte noch nicht bestätigt werden. Das kann kurz dauern — lade die Seite gleich neu, oder wende dich ans Studio."}
              {depositBanner === "cancel" &&
                "Die Zahlung wurde nicht abgeschlossen. Der Termin ist noch nicht reserviert — du kannst es erneut versuchen."}
            </span>
            {depositBanner !== "confirming" && (
              <button type="button" onClick={() => setDepositBanner(null)} className="opacity-60 hover:opacity-100 flex-shrink-0">
                <XCircle size={14} />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-playfair text-lg text-zinc-900">{activeSection.label}</h2>
            <p className="text-xs font-inter text-zinc-500 mt-0.5">{activeSection.subtitle}</p>
          </div>
        </div>

        {tab === "nachrichten" ? (
          bookings.length === 0 ? (
            <p className="text-sm text-zinc-400 font-inter text-center py-12">Noch keine Buchungen, also auch noch keine Nachrichten.</p>
          ) : (
            <div className="space-y-4">
              {threads.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {threads.map(({ booking: b }) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => openThread(b.id)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-inter transition-colors ${
                        selectedThread?.booking.id === b.id ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 shadow-card hover:bg-zinc-50"
                      }`}
                    >
                      {b.title || TYPE_LABEL[b.appointment_type]}
                      {(b.messages || []).some((m) => m.sender === "staff" && !m.read_at) && (
                        <span className="ml-1.5 inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded-full bg-red-500 text-white text-[8px]">
                          {(b.messages || []).filter((m) => m.sender === "staff" && !m.read_at).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {selectedThread && (
                <div className="bg-white rounded-2xl shadow-card p-4 h-[480px] flex flex-col">
                  <ChatThread
                    messages={selectedThread.booking.messages}
                    viewerRole="customer"
                    sending={sendingMessage}
                    uploadPath={`/t/${slug}/upload/chat`}
                    presence={{ online: staffOnline, lastSeenAt: studio?.staff_last_seen_at }}
                    locked={selectedThread.booking.status === "anfrage"}
                    lockedReason="Nachrichten sind verfügbar, sobald du ein Angebot bekommst."
                    onSend={(payload) => sendMessage(selectedThread.booking.id, payload)}
                  />
                </div>
              )}
            </div>
          )
        ) : tab === "warteliste" ? (
          waitlist.length === 0 ? (
            <p className="text-sm text-zinc-400 font-inter text-center py-12">
              Du stehst auf keiner Warteliste. Trag dich auf der Studioseite ein, wenn dein Wunschzeitraum ausgebucht ist.
            </p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {waitlist.map((w, i) => (
                  <motion.div
                    key={w.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 320, damping: 28, delay: i * 0.04 }}
                    className="bg-white rounded-2xl shadow-card p-5"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="font-inter font-medium text-sm text-zinc-900 truncate">{w.motif_rough || "Wartelisten-Platz"}</span>
                      <span className="text-[11px] font-inter px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">Wartet</span>
                    </div>
                    <p className="text-xs font-inter text-zinc-500">
                      Zeitraum: {w.desired_period || "flexibel"}
                      {w.artists?.name && <> · bei {w.artists.name}</>}
                    </p>
                    <p className="text-xs font-inter text-zinc-400 mt-1">
                      Eingetragen am {new Date(w.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "long" })}
                    </p>
                    <p className="text-[11px] font-inter text-zinc-400 mt-2">
                      Wird ein Platz frei, schickt dir das Studio ein Angebot — du bekommst hier eine Benachrichtigung.
                    </p>
                    <button
                      type="button"
                      onClick={() => leaveWaitlist(w.id)}
                      className="text-[11px] font-inter text-zinc-400 hover:text-red-600 transition-colors mt-3"
                    >
                      Von der Warteliste nehmen
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )
        ) : shown.length === 0 ? (
          <p className="text-sm text-zinc-400 font-inter text-center py-12">Hier ist gerade nichts.</p>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {shown.map((b, i) => {
                const openOffer = (b.offers || []).find((o) => o.status === "gesendet");
                const session = nextSession(b);
                const cancellable = !CLOSED.includes(b.status);
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
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="font-inter font-medium text-sm text-zinc-900 truncate">{b.title || TYPE_LABEL[b.appointment_type]}</span>
                      <span className="flex items-center gap-1.5 flex-shrink-0">
                        {b.in_progress && (
                          <span className="text-[11px] font-inter px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">In Bearbeitung</span>
                        )}
                        <span
                          className={`text-[11px] font-inter px-2 py-0.5 rounded-full ${
                            openOffer ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {STATUS_LABEL[b.status] || b.status}
                        </span>
                      </span>
                    </div>
                    <p className="text-xs font-inter text-zinc-500">{TYPE_LABEL[b.appointment_type]}</p>

                    {session ? (
                      <p className="text-xs font-inter text-zinc-700 mt-1">
                        {new Date(session.start_time).toLocaleString("de-DE", {
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

                    {b.price_final != null && (
                      <p className="text-xs font-inter text-zinc-500 mt-1">Endpreis: {Number(b.price_final).toFixed(0)} €</p>
                    )}

                    {openOffer && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 rounded-2xl border border-zinc-900/10 bg-zinc-50 p-4">
                        <p className="text-xs font-inter font-semibold text-zinc-900 mb-2">
                          {/* An existing session means this isn't the project's first offer — said
                              explicitly, so accepting doesn't read as replacing the session(s)
                              already fixed, just adding to them. */}
                          {(b.sessions || []).length > 0 ? "Weitere Session für dein Projekt" : "Studio-Angebot erhalten"}
                        </p>
                        <div className="grid grid-cols-2 gap-y-1.5 text-xs font-inter mb-3">
                          <span className="text-zinc-400">{openOffer.additional_sessions?.length > 0 ? "Termine" : "Termin"}</span>
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
                            {openOffer.additional_sessions?.map((s) => (
                              <React.Fragment key={s.startsAt}>
                                <br />
                                {new Date(s.startsAt).toLocaleString("de-DE", {
                                  weekday: "short",
                                  day: "2-digit",
                                  month: "long",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                Uhr
                              </React.Fragment>
                            ))}
                          </span>
                          <span className="text-zinc-400">Dauer</span>
                          <span className="text-zinc-900 font-medium">{openOffer.duration_minutes} Minuten</span>
                          {/* A consultation isn't sold — nothing to show a price for. */}
                          {b.appointment_type !== "consultation" && (
                            <>
                              <span className="text-zinc-400">Gesamtpreis</span>
                              <span className="text-zinc-900 font-medium">{Number(openOffer.price_total).toFixed(0)} €</span>
                            </>
                          )}
                          {openOffer.deposit_amount > 0 && (
                            <>
                              <span className="text-zinc-400">Anzahlung</span>
                              <span className="text-zinc-900 font-medium">{Number(openOffer.deposit_amount).toFixed(0)} €</span>
                            </>
                          )}
                        </div>
                        {openOffer.notes && <p className="text-xs font-inter text-zinc-600 italic mb-3">"{openOffer.notes}"</p>}
                        <p className="text-[11px] font-inter text-zinc-500 mb-3 flex items-start gap-1">
                          <Clock size={11} className="mt-0.5 flex-shrink-0" />
                          {openOffer.deposit_amount > 0
                            ? "Mit deiner Zusage geht es direkt zur Anzahlung — erst danach ist der Termin reserviert. Ohne Zahlung kann der Termin anderweitig vergeben werden."
                            : "Mit deiner Zusage ist der Termin verbindlich gebucht."}
                        </p>
                        {respondError[openOffer.id] && <p className="text-xs font-inter text-red-600 mb-2">{respondError[openOffer.id]}</p>}
                        {unverifiedOfferId === openOffer.id && (
                          <button
                            type="button"
                            onClick={resendOwnConfirmation}
                            disabled={resendingConfirmation}
                            className="text-xs font-inter text-zinc-900 underline underline-offset-2 mb-2 block"
                          >
                            {resendingConfirmation ? "Wird gesendet…" : confirmationResent ? "Erneut gesendet" : "Bestätigungslink erneut senden"}
                          </button>
                        )}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => respondToOffer(openOffer.id, true)}
                            disabled={responding === openOffer.id}
                            className="flex-1 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-inter text-xs"
                          >
                            <CheckCircle size={13} className="mr-1.5" />
                            {responding === openOffer.id ? "…" : openOffer.deposit_amount > 0 ? "Annehmen & bezahlen" : "Angebot annehmen"}
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

                    {b.status === "anzahlung_ausstehend" && (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-xs font-inter font-semibold text-amber-800 mb-1">Anzahlung ausstehend</p>
                        <p className="text-[11px] font-inter text-amber-700 mb-3">
                          Dein Termin ist noch nicht reserviert — ohne Anzahlung kann er anderweitig vergeben werden.
                        </p>
                        {respondError[b.id] && <p className="text-xs font-inter text-red-600 mb-2">{respondError[b.id]}</p>}
                        <Button
                          onClick={() => resumeDeposit(b.id)}
                          disabled={resumingDeposit === b.id}
                          className="w-full h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-inter text-xs"
                        >
                          {resumingDeposit === b.id ? "…" : "Jetzt Anzahlung bezahlen"}
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <button
                        type="button"
                        onClick={() => openThread(b.id)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-inter text-zinc-500 hover:text-zinc-900 transition-colors"
                      >
                        <MessageCircle size={12} />
                        Zu den Nachrichten
                        {(b.messages || []).some((m) => m.sender === "staff" && !m.read_at) && (
                          <span className="inline-flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-full bg-zinc-900 text-white text-[9px] font-inter">
                            {(b.messages || []).filter((m) => m.sender === "staff" && !m.read_at).length}
                          </span>
                        )}
                      </button>
                      {cancellable && !openOffer && (
                        <button
                          type="button"
                          onClick={() => setCancelTarget({ booking: b, session })}
                          className="text-[11px] font-inter text-zinc-400 hover:text-red-600 transition-colors"
                        >
                          Termin stornieren
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
        </main>
      </div>

      <AnimatePresence>
        {cancelTarget && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setCancelTarget(null);
            }}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm"
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
            >
              <h3 className="font-playfair text-xl text-zinc-900 mb-2">Termin stornieren?</h3>
              <p className="text-sm font-inter text-zinc-600 mb-4">
                {cancelTarget.session
                  ? `${new Date(cancelTarget.session.start_time).toLocaleString("de-DE", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })} Uhr`
                  : cancelTarget.booking.title || "Diese Anfrage"}
              </p>
              {(() => {
                const start = cancelTarget.session ? new Date(cancelTarget.session.start_time) : null;
                const free = !start || new Date() < new Date(start.getTime() - cancellationHours * 3600_000);
                return free ? (
                  <p className="text-xs font-inter text-zinc-500 mb-4">
                    Kostenlos: die Stornofrist von {cancellationHours} Stunden vor dem Termin läuft noch. Das Studio wird sofort benachrichtigt.
                  </p>
                ) : (
                  <p className="text-xs font-inter text-red-600 mb-4">
                    Die Stornofrist von {cancellationHours} Stunden vor dem Termin ist abgelaufen — eine geleistete Anzahlung verfällt.
                  </p>
                );
              })()}
              {respondError.cancel && <p className="text-xs font-inter text-red-600 mb-2">{respondError.cancel}</p>}
              <div className="flex gap-2">
                <Button onClick={confirmCancel} disabled={cancelBusy} className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-inter">
                  {cancelBusy ? "…" : "Ja, stornieren"}
                </Button>
                <Button variant="outline" onClick={() => setCancelTarget(null)} className="h-11 rounded-xl font-inter">
                  Zurück
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
