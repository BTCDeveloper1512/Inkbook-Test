import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { MessageCircle, X, HelpCircle, Ticket, Headphones, Send, ChevronLeft, Loader2, CheckCircle, Lock } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;
const STORAGE_KEY = "inkbook_support_session";

// ─── AI Chat ────────────────────────────────────────────────────────────────
function AIChat({ onBack }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hallo! Ich bin der InkBook KI-Assistent. Wie kann ich dir helfen?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => {
    const s = sessionStorage.getItem(STORAGE_KEY) || `s_${Date.now()}`;
    sessionStorage.setItem(STORAGE_KEY, s);
    return s;
  });
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const newMsgs = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/chat/support`, { message: text, session_id: sessionId }, { withCredentials: true });
      setMessages([...newMsgs, { role: "assistant", content: res.data.response }]);
    } catch {
      setMessages([...newMsgs, { role: "assistant", content: "Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuche es später erneut." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100">
        <button onClick={onBack} className="p-1 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-500">
          <ChevronLeft size={16} />
        </button>
        <div className="w-7 h-7 bg-zinc-900 rounded-full flex items-center justify-center">
          <HelpCircle size={14} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-inter font-semibold text-zinc-900 leading-tight">KI-Assistent</p>
          <p className="text-[10px] text-zinc-400 font-inter">Antwortet sofort</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-xs font-inter leading-relaxed ${
              m.role === "user" ? "bg-zinc-900 text-white rounded-br-sm" : "bg-zinc-100 text-zinc-800 rounded-bl-sm"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-100 px-3 py-2 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="px-3 py-3 border-t border-zinc-100 flex gap-2">
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Nachricht eingeben…"
          className="flex-1 bg-zinc-100 rounded-xl px-3 py-2 text-xs font-inter text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
        <button onClick={send} disabled={!input.trim() || loading}
          className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center disabled:opacity-40 transition-opacity flex-shrink-0">
          <Send size={13} className="text-white" />
        </button>
      </div>
    </div>
  );
}

// ─── Ticket Form ─────────────────────────────────────────────────────────────
function TicketForm({ onBack, user }) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);
  const [myTickets, setMyTickets] = useState([]);
  const [view, setView] = useState("form"); // "form" | "list"

  useEffect(() => {
    if (user) fetchMyTickets();
  }, [user]);

  const fetchMyTickets = async () => {
    try {
      const res = await axios.get(`${API}/api/support/my-tickets`, { withCredentials: true });
      setMyTickets(res.data || []);
    } catch {}
  };

  const submitTicket = async () => {
    if (!subject.trim() || !description.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/support/tickets`, { subject, description }, { withCredentials: true });
      setCreated(res.data);
      fetchMyTickets();
    } catch {
      alert("Fehler beim Erstellen des Tickets. Bitte versuche es erneut.");
    } finally { setLoading(false); }
  };

  if (!user) return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100">
        <button onClick={onBack} className="p-1 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-500"><ChevronLeft size={16} /></button>
        <p className="text-xs font-inter font-semibold text-zinc-900">Support-Ticket</p>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-sm font-inter text-zinc-600 mb-3">Du musst angemeldet sein um ein Ticket zu erstellen.</p>
          <a href="/login" className="btn-primary text-xs px-4 py-2">Anmelden</a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100">
        <button onClick={onBack} className="p-1 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-500"><ChevronLeft size={16} /></button>
        <div className="flex-1">
          <p className="text-xs font-inter font-semibold text-zinc-900">Support-Ticket</p>
        </div>
        {myTickets.length > 0 && (
          <button onClick={() => setView(v => v === "form" ? "list" : "form")}
            className="text-[10px] font-inter font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
            {view === "form" ? `Meine Tickets (${myTickets.length})` : "Neues Ticket"}
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {view === "list" ? (
          <div className="space-y-2">
            {myTickets.map(t => (
              <div key={t.ticket_id} className="border border-zinc-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-zinc-400">{t.ticket_number}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-inter font-medium ${
                    t.status === "open" ? "bg-amber-50 text-amber-600" :
                    t.status === "answered" ? "bg-green-50 text-green-600" : "bg-zinc-100 text-zinc-500"
                  }`}>{t.status === "open" ? "Offen" : t.status === "answered" ? "Beantwortet" : t.status}</span>
                </div>
                <p className="text-xs font-inter font-medium text-zinc-900">{t.subject}</p>
                {t.replies?.length > 0 && (
                  <div className="mt-2 bg-zinc-50 rounded-lg p-2">
                    <p className="text-[10px] text-zinc-400 font-inter mb-1">Admin-Antwort:</p>
                    <p className="text-xs font-inter text-zinc-700">{t.replies[t.replies.length - 1].message}</p>
                  </div>
                )}
                <p className="text-[10px] text-zinc-400 font-inter mt-1">{t.created_at ? new Date(t.created_at).toLocaleDateString("de-DE") : ""}</p>
              </div>
            ))}
          </div>
        ) : created ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={22} className="text-green-600" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-inter font-semibold text-zinc-900 mb-1">Ticket erstellt!</p>
            <p className="text-xs font-mono bg-zinc-100 inline-block px-2 py-1 rounded-lg text-zinc-700 mb-2">{created.ticket_number}</p>
            <p className="text-xs text-zinc-500 font-inter">Wir melden uns per E-Mail sobald dein Ticket bearbeitet wurde.</p>
            <button onClick={() => { setCreated(null); setSubject(""); setDescription(""); setView("list"); }}
              className="text-xs font-inter font-semibold text-zinc-900 underline mt-3 block mx-auto">
              Meine Tickets ansehen
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500 font-inter">Beschreibe dein Problem. Wir antworten dir per E-Mail.</p>
            <div>
              <label className="block text-[10px] font-inter font-medium text-zinc-600 mb-1">Betreff</label>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="z.B. Buchung nicht sichtbar"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-inter focus:outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>
            <div>
              <label className="block text-[10px] font-inter font-medium text-zinc-600 mb-1">Beschreibung</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                rows={4} placeholder="Was ist passiert? Welche Schritte hast du unternommen?"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-inter focus:outline-none focus:ring-2 focus:ring-zinc-200 resize-none" />
            </div>
            <button onClick={submitTicket} disabled={!subject.trim() || !description.trim() || loading}
              className="w-full btn-primary text-xs py-2.5 disabled:opacity-40">
              {loading ? <Loader2 size={13} className="animate-spin mx-auto" /> : "Ticket einreichen"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Direct Chat ─────────────────────────────────────────────────────────────
function DirectChat({ onBack, user }) {
  const [chat, setChat] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [proError, setProError] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (user) initChat();
  }, [user]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat?.messages]);

  // Poll for new messages every 5s
  useEffect(() => {
    if (!chat || proError) return;
    const iv = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/api/support/direct`, { withCredentials: true });
        setChat(res.data);
      } catch {}
    }, 5000);
    return () => clearInterval(iv);
  }, [chat, proError]);

  const initChat = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/support/direct`, { withCredentials: true });
      setChat(res.data);
    } catch (err) {
      if (err.response?.status === 403) setProError(true);
    } finally { setLoading(false); }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    try {
      await axios.post(`${API}/api/support/direct/messages`, { content: text }, { withCredentials: true });
      const res = await axios.get(`${API}/api/support/direct`, { withCredentials: true });
      setChat(res.data);
    } catch {} finally { setSending(false); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100">
        <button onClick={onBack} className="p-1 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-500"><ChevronLeft size={16} /></button>
        <div className="w-7 h-7 bg-zinc-900 rounded-full flex items-center justify-center">
          <Headphones size={13} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-inter font-semibold text-zinc-900 leading-tight">Direkter Support</p>
          <p className="text-[10px] text-zinc-400 font-inter">InkBook Team</p>
        </div>
      </div>

      {!user ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <Lock size={28} className="text-zinc-300 mx-auto mb-3" strokeWidth={1} />
            <p className="text-xs font-inter text-zinc-500">Anmeldung erforderlich</p>
          </div>
        </div>
      ) : proError ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <Lock size={28} className="text-zinc-300 mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm font-inter font-semibold text-zinc-800 mb-1">Pro-Abo erforderlich</p>
            <p className="text-xs text-zinc-500 font-inter mb-3">Direkter Support ist nur für Studios mit Pro-Plan verfügbar.</p>
            <a href="/subscription" className="text-xs font-inter font-semibold text-zinc-900 underline">Jetzt upgraden →</a>
          </div>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-zinc-300" />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {!chat?.messages?.length ? (
              <div className="text-center py-6">
                <p className="text-xs text-zinc-400 font-inter">Starte ein Gespräch mit unserem Support-Team.</p>
              </div>
            ) : (
              chat.messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-xs font-inter leading-relaxed ${
                    m.from === "user" ? "bg-zinc-900 text-white rounded-br-sm" : "bg-zinc-100 text-zinc-800 rounded-bl-sm"
                  }`}>
                    {m.from === "admin" && <p className="text-[9px] text-zinc-500 mb-1 font-semibold">InkBook Support</p>}
                    {m.content}
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>
          <div className="px-3 py-3 border-t border-zinc-100 flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Nachricht eingeben…"
              className="flex-1 bg-zinc-100 rounded-xl px-3 py-2 text-xs font-inter focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
            <button onClick={sendMessage} disabled={!input.trim() || sending}
              className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center disabled:opacity-40 transition-opacity flex-shrink-0">
              {sending ? <Loader2 size={12} className="text-white animate-spin" /> : <Send size={13} className="text-white" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main SupportChat Component ───────────────────────────────────────────────
export default function SupportChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("home"); // "home" | "ai" | "ticket" | "direct"

  // Listen for external open event (from FAQ page)
  useEffect(() => {
    const handler = () => { setOpen(true); setView("home"); };
    window.addEventListener("inkbook:open-support", handler);
    return () => window.removeEventListener("inkbook:open-support", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const options = [
    {
      id: "ai",
      icon: <HelpCircle size={20} strokeWidth={1.5} className="text-zinc-900" />,
      title: "KI-Assistent",
      desc: "Sofortige Antworten auf häufige Fragen",
      badge: null,
    },
    {
      id: "ticket",
      icon: <Ticket size={20} strokeWidth={1.5} className="text-zinc-900" />,
      title: "Support-Ticket",
      desc: "Erstelle ein Ticket · Antwort per E-Mail",
      badge: null,
    },
    {
      id: "direct",
      icon: <Headphones size={20} strokeWidth={1.5} className="text-zinc-900" />,
      title: "Direktnachricht",
      desc: "Echtzeit-Chat mit dem Support-Team",
      badge: "Pro",
    },
  ];

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) setView("home"); }}
        className="fixed bottom-6 right-20 z-50 w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:scale-105 transition-transform"
        data-testid="support-chat-toggle"
        aria-label="Support öffnen"
      >
        {open
          ? <X size={22} className="text-white" strokeWidth={1.5} />
          : <MessageCircle size={22} className="text-white" strokeWidth={1.5} />
        }
      </button>

      {/* Chat Panel */}
      {open && (
        <div
          className="fixed bottom-24 right-20 z-50 w-80 bg-white rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.18)] border border-zinc-100 overflow-hidden flex flex-col"
          style={{ height: 460 }}
          data-testid="support-chat-panel"
        >
          {view === "home" && (
            <div className="flex flex-col h-full">
              <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-900">
                <p className="text-white font-playfair font-semibold text-base">InkBook Support</p>
                <p className="text-zinc-400 text-xs font-inter mt-0.5">Wie können wir dir helfen?</p>
              </div>
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {options.map(opt => (
                  <button key={opt.id} onClick={() => setView(opt.id)}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-xl border border-zinc-100 hover:bg-zinc-50 hover:border-zinc-200 transition-all group"
                    data-testid={`support-option-${opt.id}`}
                  >
                    <div className="w-9 h-9 bg-zinc-50 group-hover:bg-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors border border-zinc-100">
                      {opt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-inter font-semibold text-zinc-900 leading-tight">{opt.title}</p>
                        {opt.badge && (
                          <span className="text-[9px] bg-zinc-900 text-white px-1.5 py-0.5 rounded-full font-inter font-semibold">{opt.badge}</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 font-inter mt-0.5 leading-relaxed">{opt.desc}</p>
                    </div>
                    <span className="text-zinc-300 group-hover:text-zinc-500 transition-colors mt-1 flex-shrink-0">›</span>
                  </button>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-zinc-50">
                <p className="text-[10px] text-zinc-400 font-inter text-center">
                  support@inkbook.de · Mo–Fr 9–18 Uhr
                </p>
              </div>
            </div>
          )}

          {view === "ai" && <AIChat onBack={() => setView("home")} />}
          {view === "ticket" && <TicketForm onBack={() => setView("home")} user={user} />}
          {view === "direct" && <DirectChat onBack={() => setView("home")} user={user} />}
        </div>
      )}
    </>
  );
}
