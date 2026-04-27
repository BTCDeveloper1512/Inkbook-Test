import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MessageSquare, X, Send, Loader2, ThumbsUp, ThumbsDown, LifeBuoy } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function getSessionId() {
  let id = localStorage.getItem("inkbook_support_session");
  if (!id) {
    id = "sup_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("inkbook_support_session", id);
  }
  return id;
}

export default function SupportChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminId, setAdminId] = useState(null);
  const [satisfactionPending, setSatisfactionPending] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const sessionId = useRef(getSessionId());

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, satisfactionPending]);

  // Fetch admin ID once
  useEffect(() => {
    axios.get(`${API}/support/admin-id`).then(r => setAdminId(r.data.admin_id)).catch(() => {});
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Hallo! Ich bin der InkBook Support-Assistent. Wie kann ich dir helfen?",
        id: "welcome",
      }]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setSatisfactionPending(false);

    try {
      const { data } = await axios.post(`${API}/support/chat`, {
        session_id: sessionId.current,
        message: text,
      });
      setMessages(prev => [...prev, { role: "assistant", content: data.response, id: Date.now() + 1 }]);
      setSatisfactionPending(true);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Entschuldigung, da ist etwas schiefgelaufen. Bitte versuche es erneut.", id: Date.now() + 1 },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleSatisfied = () => {
    setSatisfactionPending(false);
    setMessages(prev => [...prev, {
      role: "assistant",
      content: "Super! Falls du weitere Fragen hast, bin ich gerne für dich da.",
      id: Date.now(),
    }]);
  };

  const handleNotSatisfied = async () => {
    setSatisfactionPending(false);
    setRedirecting(true);

    if (!user) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Um mit unserem Kundendienst zu sprechen, melde dich bitte an oder erstelle ein Konto.",
        id: Date.now(),
        action: "auth",
      }]);
      setRedirecting(false);
      return;
    }

    if (!adminId) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Kein Support-Mitarbeiter verfügbar. Bitte schreibe an support@inkbook.de",
        id: Date.now(),
      }]);
      setRedirecting(false);
      return;
    }

    setMessages(prev => [...prev, {
      role: "assistant",
      content: "Ich verbinde dich jetzt mit unserem Kundendienst-Team...",
      id: Date.now(),
    }]);

    setTimeout(() => {
      setOpen(false);
      setRedirecting(false);
      navigate(`/messages/${adminId}`);
    }, 1200);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[9990] w-12 h-12 rounded-full bg-zinc-900 text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:bg-zinc-700 transition-all duration-200 flex items-center justify-center"
        data-testid="support-chat-btn"
        aria-label="Support Chat öffnen"
        style={{ bottom: open ? 24 : 24 }}
      >
        {open
          ? <X size={18} strokeWidth={2} />
          : <MessageSquare size={18} strokeWidth={1.5} />
        }
      </button>

      {/* Chat Window */}
      {open && (
        <div
          className="fixed bottom-20 right-4 sm:right-6 z-[9989] w-[calc(100vw-32px)] sm:w-[380px] bg-white rounded-2xl border border-zinc-200 shadow-[0_16px_64px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden"
          style={{ maxHeight: "520px", minHeight: "400px" }}
          data-testid="support-chat-window"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100 bg-zinc-900">
            <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
              <LifeBuoy size={14} className="text-zinc-300" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-inter font-semibold text-white leading-none">InkBook Support</p>
              <p className="text-xs text-zinc-500 mt-0.5">KI-Assistent · Normalerweise sofort</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollBehavior: "smooth" }}>
            {messages.map((msg) => (
              <div key={msg.id}>
                <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm font-inter leading-relaxed ${
                      msg.role === "user"
                        ? "bg-zinc-900 text-white rounded-br-sm"
                        : "bg-zinc-100 text-zinc-800 rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
                {/* Auth redirect prompt */}
                {msg.action === "auth" && (
                  <div className="flex gap-2 mt-2 pl-1">
                    <button
                      onClick={() => { setOpen(false); navigate("/login"); }}
                      className="text-xs px-3 py-1.5 rounded-full bg-zinc-900 text-white font-inter font-medium hover:bg-zinc-700 transition-colors"
                    >
                      Anmelden
                    </button>
                    <button
                      onClick={() => { setOpen(false); navigate("/register"); }}
                      className="text-xs px-3 py-1.5 rounded-full border border-zinc-300 text-zinc-600 font-inter hover:bg-zinc-50 transition-colors"
                    >
                      Registrieren
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-100 px-3.5 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                  <Loader2 size={12} className="text-zinc-400 animate-spin" />
                  <span className="text-xs text-zinc-400 font-inter">Schreibt...</span>
                </div>
              </div>
            )}

            {/* Satisfaction Check */}
            {satisfactionPending && !loading && (
              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                <p className="text-xs font-inter text-zinc-600 mb-2.5 font-medium">
                  Wurde deine Frage beantwortet?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSatisfied}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 text-white text-xs font-inter font-medium hover:bg-zinc-700 transition-colors"
                    data-testid="support-satisfied-btn"
                  >
                    <ThumbsUp size={11} /> Ja, danke
                  </button>
                  <button
                    onClick={handleNotSatisfied}
                    disabled={redirecting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-300 text-zinc-600 text-xs font-inter hover:bg-zinc-50 transition-colors disabled:opacity-50"
                    data-testid="support-unsatisfied-btn"
                  >
                    <ThumbsDown size={11} /> Nein, Kundendienst
                  </button>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-zinc-100 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Deine Frage..."
              rows={1}
              className="flex-1 resize-none text-sm font-inter text-zinc-900 placeholder-zinc-400 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-400 transition-colors"
              style={{ maxHeight: 80 }}
              data-testid="support-chat-input"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-700 disabled:opacity-40 transition-colors flex-shrink-0"
              data-testid="support-chat-send-btn"
            >
              <Send size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
