import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { MessageCircle, X, HelpCircle, Ticket, Headphones, Send, ChevronLeft, Loader2, CheckCircle, Lock, Star, MapPin, Calendar, Clock, Zap, ChevronRight, Sparkles } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;
const STORAGE_KEY = "inkbook_support_session";

// ─── Booking-Type Labels ─────────────────────────────────────────────────────
const BOOKING_TYPE_LABELS = {
  tattoo: "Tätowierung",
  consultation: "Beratung",
  video_consultation: "Video-Beratung",
};

// ─── Studio Card (inline in chat) ────────────────────────────────────────────
function StudioCard({ studio, onShowSlots }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.95)", border: "1px solid rgba(0,0,0,0.07)",
        borderRadius: 14, overflow: "hidden", marginBottom: 8, cursor: "pointer",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
      onClick={() => onShowSlots(studio)}
      data-testid="agent-studio-card"
    >
      {studio.cover_url && (
        <img src={studio.cover_url} alt={studio.name}
          style={{ width: "100%", height: 72, objectFit: "cover" }} />
      )}
      <div style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, fontFamily: "Inter,sans-serif", color: "#111", lineHeight: 1.3 }}>{studio.name}</p>
          {studio.avg_rating > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#f59e0b", fontFamily: "Inter,sans-serif", flexShrink: 0 }}>
              <Star size={10} fill="#f59e0b" strokeWidth={0} />{studio.avg_rating.toFixed(1)}
            </span>
          )}
        </div>
        {studio.city && (
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "#666", fontFamily: "Inter,sans-serif", display: "flex", alignItems: "center", gap: 3 }}>
            <MapPin size={9} strokeWidth={1.5} />{studio.city}
          </p>
        )}
        {studio.booking_types?.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
            {studio.booking_types.map(t => (
              <span key={t} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "#f4f4f5", color: "#666", fontFamily: "Inter,sans-serif" }}>
                {BOOKING_TYPE_LABELS[t] || t}
              </span>
            ))}
          </div>
        )}
        <button style={{
          width: "100%", marginTop: 8, padding: "7px 0", borderRadius: 10, border: "none",
          background: "#111", color: "#fff", fontSize: 12, fontWeight: 600,
          fontFamily: "Inter,sans-serif", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        }}>
          <Calendar size={11} strokeWidth={2} /> Freie Termine anzeigen
        </button>
      </div>
    </div>
  );
}

// ─── Slot Card (inline in chat) ───────────────────────────────────────────────
function SlotCard({ slot, studioId, studioName, onBook }) {
  const [bookingType, setBookingType] = useState("tattoo");
  const dayStr = new Date(slot.date + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div style={{
      background: "rgba(255,255,255,0.95)", border: "1px solid rgba(0,0,0,0.07)",
      borderRadius: 14, padding: "10px 12px", marginBottom: 8,
    }} data-testid="agent-slot-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, fontFamily: "Inter,sans-serif", color: "#111" }}>{dayStr}</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#666", fontFamily: "Inter,sans-serif", display: "flex", alignItems: "center", gap: 3 }}>
            <Clock size={9} strokeWidth={1.5} />{slot.start_time} – {slot.end_time}
          </p>
        </div>
        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", fontFamily: "Inter,sans-serif" }}>Frei</span>
      </div>
      <select
        value={bookingType}
        onChange={e => setBookingType(e.target.value)}
        style={{
          width: "100%", padding: "5px 8px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)",
          fontSize: 11, fontFamily: "Inter,sans-serif", color: "#333", background: "#f9f9f9",
          marginBottom: 8, cursor: "pointer",
        }}
      >
        <option value="tattoo">Tätowierung</option>
        <option value="consultation">Beratung</option>
        <option value="video_consultation">Video-Beratung</option>
      </select>
      <button
        onClick={() => onBook(slot, studioId, studioName, bookingType)}
        style={{
          width: "100%", padding: "7px 0", borderRadius: 10, border: "none",
          background: "#111", color: "#fff", fontSize: 12, fontWeight: 600,
          fontFamily: "Inter,sans-serif", cursor: "pointer",
        }}
        data-testid="agent-book-slot-btn"
      >
        Jetzt buchen
      </button>
    </div>
  );
}

// ─── Booking Confirmation Card ────────────────────────────────────────────────
function BookingConfirmationCard({ booking }) {
  const dayStr = booking.date ? new Date(booking.date + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "";
  return (
    <div style={{
      background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "12px 14px",
    }} data-testid="agent-booking-confirmation">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CheckCircle size={16} strokeWidth={2} style={{ color: "#fff" }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, fontFamily: "Inter,sans-serif", color: "#15803d" }}>Buchung erstellt!</p>
          <p style={{ margin: 0, fontSize: 10, color: "#16a34a", fontFamily: "Inter,sans-serif" }}>Ausstehend – Studio muss bestätigen</p>
        </div>
      </div>
      <div style={{ fontSize: 11, fontFamily: "Inter,sans-serif", color: "#166534", lineHeight: 1.6 }}>
        <p style={{ margin: "2px 0" }}><strong>Studio:</strong> {booking.studio_name}</p>
        <p style={{ margin: "2px 0" }}><strong>Datum:</strong> {dayStr}</p>
        <p style={{ margin: "2px 0" }}><strong>Zeit:</strong> {booking.start_time} – {booking.end_time}</p>
        <p style={{ margin: "2px 0" }}><strong>Typ:</strong> {BOOKING_TYPE_LABELS[booking.booking_type] || booking.booking_type}</p>
      </div>
      <a href="/dashboard" style={{
        display: "block", marginTop: 10, textAlign: "center", padding: "7px 0",
        borderRadius: 10, background: "#16a34a", color: "#fff", fontSize: 12, fontWeight: 600,
        fontFamily: "Inter,sans-serif", textDecoration: "none",
      }}>Im Dashboard anzeigen</a>
    </div>
  );
}

// ─── AI Booking Agent Chat ────────────────────────────────────────────────────
function AIChat({ onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hallo! Ich bin Ink, dein KI-Buchungsassistent von InkBook. Ich kann Studios in deiner Nähe suchen, freie Termine anzeigen und Buchungen direkt hier im Chat durchführen.",
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY + "_agent");
    if (stored) return stored;
    const newId = `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(STORAGE_KEY + "_agent", newId);
    return newId;
  });
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/chat/agent`, {
        session_id: sessionId,
        message: msg,
      }, { withCredentials: true });

      const { response, tool_result } = res.data;
      setMessages(prev => [...prev, {
        role: "assistant",
        content: response,
        tool_result: tool_result || null,
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Es tut mir leid, ich konnte deine Anfrage gerade nicht bearbeiten. Bitte versuche es erneut.",
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionId]);

  const handleShowSlots = (studio) => {
    sendMessage(`Zeige mir freie Termine von ${studio.name} (studio_id: ${studio.studio_id})`);
  };

  const handleBook = (slot, studioId, studioName, bookingType) => {
    sendMessage(`Buche den Termin am ${slot.date} von ${slot.start_time} bis ${slot.end_time} im Studio ${studioName} (studio_id: ${studioId}, slot_id: ${slot.slot_id}, booking_type: ${bookingType})`);
  };

  const SUGGESTIONS = [
    "Studios in meiner Stadt suchen",
    "Was ist InkBook?",
    "Wie läuft eine Buchung ab?",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <button onClick={onBack} style={{ padding: 4, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "#71717a", display: "flex" }}>
          <ChevronLeft size={16} />
        </button>
        <div style={{ width: 30, height: 30, borderRadius: 10, background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={14} strokeWidth={1.5} style={{ color: "rgba(255,255,255,0.85)" }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, fontFamily: "Inter,sans-serif", color: "#111" }}>Ink – KI-Assistent</p>
          <p style={{ margin: 0, fontSize: 10, color: "#16a34a", fontFamily: "Inter,sans-serif" }}>● Online</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 4px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex", flexDirection: "column",
            alignItems: msg.role === "user" ? "flex-end" : "flex-start",
            marginBottom: 10,
          }}>
            <div style={{
              maxWidth: "88%",
              padding: "9px 12px",
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: msg.role === "user" ? "#111" : "#f4f4f5",
              color: msg.role === "user" ? "#fff" : "#111",
              fontSize: 12, fontFamily: "Inter,sans-serif", lineHeight: 1.5,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}
              dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\*(.+?)\*/g, "<em>$1</em>")
                  .replace(/\n/g, "<br/>"),
              }}
            />

            {/* Rich tool results */}
            {msg.tool_result && msg.role === "assistant" && (() => {
              const tr = msg.tool_result;
              if (tr.tool === "search_studios" && tr.studios?.length > 0) {
                return (
                  <div style={{ width: "88%", marginTop: 6 }}>
                    {tr.studios.map(s => (
                      <StudioCard key={s.studio_id} studio={s} onShowSlots={handleShowSlots} />
                    ))}
                  </div>
                );
              }
              if (tr.tool === "get_slots") {
                if (!tr.slots?.length) {
                  return <p style={{ fontSize: 11, color: "#999", fontFamily: "Inter,sans-serif", marginTop: 4, maxWidth: "88%" }}>Leider keine freien Termine im nächsten Monat gefunden.</p>;
                }
                return (
                  <div style={{ width: "88%", marginTop: 6 }}>
                    {tr.slots.map(s => (
                      <SlotCard key={s.slot_id} slot={s} studioId={tr.studio_id} studioName={tr.studio_name} onBook={handleBook} />
                    ))}
                  </div>
                );
              }
              if (tr.tool === "create_booking" && tr.success && tr.booking) {
                return <div style={{ width: "88%", marginTop: 6 }}><BookingConfirmationCard booking={tr.booking} /></div>;
              }
              return null;
            })()}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ padding: "8px 14px", borderRadius: "18px 18px 18px 4px", background: "#f4f4f5", display: "flex", gap: 4 }}>
              {[0, 1, 2].map(j => (
                <span key={j} style={{
                  width: 5, height: 5, borderRadius: "50%", background: "#aaa",
                  animation: "bounce 1.2s infinite",
                  animationDelay: `${j * 0.18}s`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions (only when not loading and chat just started) */}
      {messages.length <= 1 && !loading && (
        <div style={{ padding: "4px 12px 8px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => sendMessage(s)}
              style={{
                padding: "5px 10px", borderRadius: 20,
                border: "1px solid rgba(0,0,0,0.1)", background: "#fff",
                fontSize: 11, fontFamily: "Inter,sans-serif", color: "#444",
                cursor: "pointer", transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f4f4f5"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
              data-testid="agent-suggestion-chip"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: 8, padding: "8px 12px 12px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Frag mich alles über Studios & Buchungen..."
          style={{
            flex: 1, background: "#f4f4f5", border: "none", borderRadius: 20,
            padding: "8px 14px", fontSize: 12, fontFamily: "Inter,sans-serif",
            outline: "none", color: "#111",
          }}
          data-testid="agent-chat-input"
        />
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
          style={{
            width: 34, height: 34, borderRadius: 17, border: "none",
            background: input.trim() && !loading ? "#111" : "#e4e4e7",
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.2s", flexShrink: 0,
          }}
          data-testid="agent-send-btn"
        >
          <Send size={13} style={{ color: input.trim() && !loading ? "#fff" : "#aaa" }} />
        </button>
      </div>

      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
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
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [followUp, setFollowUp] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [view, setView] = useState("form"); // "form" | "list" | "detail"

  useEffect(() => {
    if (user) fetchMyTickets();
  }, [user]);

  // Poll for ticket updates every 8s when viewing a ticket
  useEffect(() => {
    if (!selectedTicket) return;
    const iv = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/api/support/tickets/${selectedTicket.ticket_id}`, { withCredentials: true });
        setSelectedTicket(res.data);
        setMyTickets(p => p.map(t => t.ticket_id === res.data.ticket_id ? res.data : t));
      } catch {}
    }, 8000);
    return () => clearInterval(iv);
  }, [selectedTicket?.ticket_id]);

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

  const sendFollowUp = async () => {
    if (!followUp.trim() || !selectedTicket) return;
    setFollowUpLoading(true);
    try {
      await axios.post(`${API}/api/support/tickets/${selectedTicket.ticket_id}/user-reply`, { message: followUp }, { withCredentials: true });
      setFollowUp("");
      // Refresh ticket
      const res = await axios.get(`${API}/api/support/tickets/${selectedTicket.ticket_id}`, { withCredentials: true });
      setSelectedTicket(res.data);
      setMyTickets(p => p.map(t => t.ticket_id === res.data.ticket_id ? res.data : t));
    } catch (err) {
      if (err.response?.data?.detail) alert(err.response.data.detail);
    } finally { setFollowUpLoading(false); }
  };

  const statusBadge = (status) => {
    if (status === "open") return { label: "Offen · Antwort ausstehend", color: "bg-amber-50 text-amber-600 border-amber-100" };
    if (status === "answered") return { label: "Beantwortet per E-Mail", color: "bg-green-50 text-green-600 border-green-100" };
    if (status === "closed") return { label: "Geschlossen", color: "bg-zinc-100 text-zinc-500 border-zinc-200" };
    return { label: status, color: "bg-zinc-100 text-zinc-500 border-zinc-200" };
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

  // ── Ticket Detail View ──
  if (view === "detail" && selectedTicket) {
    const badge = statusBadge(selectedTicket.status);
    const isClosed = selectedTicket.status === "closed";
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100">
          <button onClick={() => { setView("list"); setSelectedTicket(null); }}
            className="p-1 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-500"><ChevronLeft size={16} /></button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-inter font-semibold text-zinc-900 truncate">{selectedTicket.subject}</p>
            <span className={`text-[9px] font-inter font-medium border px-1.5 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {/* Original description */}
          <div className="bg-zinc-50 rounded-xl p-3">
            <p className="text-[9px] text-zinc-400 font-inter mb-1 font-semibold">DEINE ANFRAGE</p>
            <p className="text-xs font-inter text-zinc-700 leading-relaxed">{selectedTicket.description}</p>
          </div>
          {/* Replies */}
          {selectedTicket.replies?.map((r, i) => (
            <div key={i} className={`rounded-xl p-3 ${r.from === "admin" ? "border border-green-100 bg-green-50" : "bg-blue-50 border border-blue-100"}`}>
              {r.from === "admin" ? (
                <>
                  <p className="text-[9px] text-green-500 mb-1 font-inter font-semibold">INKBOOK SUPPORT</p>
                  <p className="text-xs font-inter text-green-800 leading-relaxed">
                    Deine Anfrage wurde per E-Mail beantwortet.{r.created_at ? ` (${new Date(r.created_at).toLocaleDateString("de-DE")})` : ""}
                  </p>
                  <p className="text-[10px] text-green-500 font-inter mt-1">Antworte hier unten, falls du weitere Fragen hast.</p>
                </>
              ) : (
                <>
                  <p className="text-[9px] text-blue-400 mb-1 font-inter font-semibold">DEINE ANTWORT</p>
                  <p className="text-xs font-inter text-blue-800 leading-relaxed">{r.message}</p>
                </>
              )}
            </div>
          ))}
        </div>
        {/* Follow-up or closed state */}
        {isClosed ? (
          <div className="px-4 py-3 border-t border-zinc-100 bg-zinc-50 text-center">
            <p className="text-xs text-zinc-400 font-inter">Dieses Ticket ist geschlossen.</p>
          </div>
        ) : (
          <div className="px-4 py-3 border-t border-zinc-100">
            <p className="text-[10px] text-zinc-400 font-inter mb-1.5">Noch eine Frage? Schreib hier:</p>
            <div className="flex gap-2">
              <input value={followUp} onChange={e => setFollowUp(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendFollowUp()}
                placeholder="Folgenachricht…"
                className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-inter focus:outline-none focus:ring-2 focus:ring-zinc-200"
              />
              <button onClick={sendFollowUp} disabled={!followUp.trim() || followUpLoading}
                className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center disabled:opacity-40 flex-shrink-0">
                {followUpLoading ? <Loader2 size={12} className="text-white animate-spin" /> : <Send size={13} className="text-white" />}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100">
        <button onClick={onBack} className="p-1 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-500"><ChevronLeft size={16} /></button>
        <div className="flex-1">
          <p className="text-xs font-inter font-semibold text-zinc-900">Support-Ticket</p>
        </div>
        {myTickets.length > 0 && view === "form" && (
          <button onClick={() => setView("list")}
            className="text-[10px] font-inter font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
            Meine Tickets ({myTickets.length})
          </button>
        )}
        {view === "list" && (
          <button onClick={() => setView("form")}
            className="text-[10px] font-inter font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
            + Neues Ticket
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {/* Ticket List */}
        {view === "list" ? (
          <div className="space-y-2">
            {myTickets.map(t => {
              const badge = statusBadge(t.status);
              return (
                <button key={t.ticket_id} onClick={() => { setSelectedTicket(t); setView("detail"); }}
                  className="w-full text-left border border-zinc-100 hover:border-zinc-200 rounded-xl p-3 hover:bg-zinc-50 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-zinc-400">{t.ticket_number}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-inter font-medium border ${badge.color}`}>{badge.label}</span>
                  </div>
                  <p className="text-xs font-inter font-medium text-zinc-900">{t.subject}</p>
                  <p className="text-[10px] text-zinc-400 font-inter mt-0.5">{t.created_at ? new Date(t.created_at).toLocaleDateString("de-DE") : ""}</p>
                </button>
              );
            })}
          </div>
        ) : created ? (
          /* Success State */
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={22} className="text-green-600" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-inter font-semibold text-zinc-900 mb-1">Ticket erstellt!</p>
            <p className="text-xs font-mono bg-zinc-100 inline-block px-2 py-1 rounded-lg text-zinc-700 mb-2">{created.ticket_number}</p>
            <p className="text-xs text-zinc-500 font-inter">Wir melden uns per E-Mail. Deine Antwort kannst du dann hier im Chat eingeben.</p>
            <button onClick={() => { setCreated(null); setSubject(""); setDescription(""); setView("list"); fetchMyTickets(); }}
              className="text-xs font-inter font-semibold text-zinc-900 underline mt-3 block mx-auto">
              Tickets ansehen →
            </button>
          </div>
        ) : (
          /* New Ticket Form */
          <div className="space-y-3">
            <p className="text-xs text-zinc-500 font-inter">Beschreibe dein Problem. Wir melden uns per E-Mail und du kannst dann hier antworten.</p>
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

  const isStudioOwner = user?.role === "studio_owner";

  const options = [
    {
      id: "ai",
      icon: <Sparkles size={20} strokeWidth={1.5} className="text-zinc-900" />,
      title: "Ink – KI-Buchungsassistent",
      desc: "Studios suchen, Termine buchen & alles fragen",
      badge: "KI",
    },
    {
      id: "ticket",
      icon: <Ticket size={20} strokeWidth={1.5} className="text-zinc-900" />,
      title: "Support-Ticket",
      desc: "Erstelle ein Ticket · Antwort per E-Mail",
      badge: null,
    },
    // Direct chat only available to studio owners (Pro feature)
    ...(isStudioOwner ? [{
      id: "direct",
      icon: <Headphones size={20} strokeWidth={1.5} className="text-zinc-900" />,
      title: "Direktnachricht",
      desc: "Echtzeit-Chat mit dem Support-Team",
      badge: "Pro",
    }] : []),
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
