import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";
import { Send, Image as ImageIcon, ArrowLeft, MessageSquare, X, Check, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { recipientId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileRef = useRef();
  const pollMsgRef = useRef(null);
  const pollConvRef = useRef(null);
  const pollTypingRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const activeConvRef = useRef(null);
  activeConvRef.current = activeConv;

  const userId = user?.id || user?.user_id;

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchConversations(true);
    // Poll conversations every 3s for new convs
    pollConvRef.current = setInterval(() => fetchConversations(false), 3000);
    return () => { clearInterval(pollConvRef.current); clearInterval(pollMsgRef.current); };
  }, []);

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.other_id);
      clearInterval(pollMsgRef.current);
      clearInterval(pollTypingRef.current);
      // Poll messages every 2s
      pollMsgRef.current = setInterval(() => fetchMessages(activeConvRef.current?.other_id), 2000);
      // Poll typing status every 1.5s
      pollTypingRef.current = setInterval(async () => {
        const otherId = activeConvRef.current?.other_id;
        if (!otherId) return;
        try {
          const { data } = await axios.get(`${API}/messages/${otherId}/typing-status`, { withCredentials: true });
          setOtherIsTyping(data.is_typing || false);
        } catch {}
      }, 1500);
    }
    return () => { clearInterval(pollMsgRef.current); clearInterval(pollTypingRef.current); };
  }, [activeConv?.other_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async (initialLoad = false) => {
    try {
      const { data } = await axios.get(`${API}/messages`, { withCredentials: true });
      setConversations(data);
      if (loading) setLoading(false);

      if (initialLoad && recipientId) {
        // Open conversation from URL param
        const existingConv = data.find(c => c.other_user_id === recipientId);
        if (existingConv) {
          openConvFromData(existingConv);
        } else {
          // New conversation – look up recipient name from state or fetch
          const passedName = location.state?.recipientName || null;
          if (passedName) {
            setActiveConv({ other_id: recipientId, other_name: passedName, other_role: location.state?.recipientRole || "studio_owner" });
          } else {
            // Try to look up studio name
            try {
              const studioRes = await axios.get(`${API}/studios`, { params: { owner_id: recipientId } });
              const studio = studioRes.data?.[0];
              setActiveConv({ other_id: recipientId, other_name: studio?.name || "Studio", other_role: "studio_owner" });
            } catch {
              setActiveConv({ other_id: recipientId, other_name: "Studio", other_role: "studio_owner" });
            }
          }
        }
      }
    } catch { navigate("/login"); }
  };

  const openConvFromData = (conv) => {
    setActiveConv({
      other_id: conv.other_user_id,
      other_name: conv.other_name || conv.last_sender_name || "Nutzer",
      other_role: conv.other_role || "customer",
      conv_id: conv.conv_id
    });
  };

  const fetchMessages = async (otherId) => {
    if (!otherId) return;
    try {
      const { data } = await axios.get(`${API}/messages/${otherId}`, { withCredentials: true });
      setMessages(data);
    } catch {}
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!text.trim() && !imageUrl) return;
    if (!activeConv?.other_id) return;
    setSending(true);
    try {
      await axios.post(`${API}/messages`, {
        recipient_id: activeConv.other_id,
        content: text.trim(),
        image_url: imageUrl || null
      }, { withCredentials: true });
      setText("");
      setImageUrl("");
      setImagePreview(null);
      await fetchMessages(activeConv.other_id);
      fetchConversations(false);
    } catch {} finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    // Emit typing signal (debounced – don't spam on every keystroke)
    if (!activeConv?.other_id) return;
    clearTimeout(typingTimeoutRef.current);
    axios.post(`${API}/messages/${activeConv.other_id}/typing`, {}, { withCredentials: true }).catch(() => {});
    // Auto-clear local typing state after 4s of no input
    typingTimeoutRef.current = setTimeout(() => {}, 4000);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await axios.post(`${API}/upload/image`, formData, { withCredentials: true });
      setImageUrl(data.url);
      const reader = new FileReader();
      reader.onload = ev => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    } catch {}
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  };
  const formatConvTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  };
  const formatDateSep = (iso) => {
    const d = new Date(iso);
    if (d.toDateString() === new Date().toDateString()) return "Heute";
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Gestern";
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
  };

  // Group messages by date for date separators
  const groupedMessages = messages.reduce((groups, msg) => {
    const dateKey = new Date(msg.created_at).toDateString();
    if (!groups[dateKey]) groups[dateKey] = { date: msg.created_at, msgs: [] };
    groups[dateKey].msgs.push(msg);
    return groups;
  }, {});

  if (loading) return (
    <div className="min-h-screen bg-zinc-50"><Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  const initials = (name) => name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const avatarColor = (name) => {
    const colors = ["bg-zinc-800", "bg-stone-700", "bg-neutral-800", "bg-slate-700"];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-stretch max-w-6xl mx-auto w-full px-4 md:px-6 py-4 md:py-6" style={{ minHeight: 0 }}>
        <div className="flex w-full rounded-2xl overflow-hidden border border-black/[0.04] shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white" style={{ height: "calc(100vh - 130px)" }}>

          {/* ── Sidebar ── */}
          <div className={`flex-shrink-0 border-r border-zinc-100 flex flex-col bg-white ${activeConv ? "hidden md:flex" : "flex"}`} style={{ width: 300 }}>
            <div className="px-5 py-4 border-b border-zinc-100 bg-white">
              <h2 className="font-playfair font-semibold text-xl text-zinc-900">Nachrichten</h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-6 py-10 text-center">
                  <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mb-3">
                    <MessageSquare size={22} className="text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-inter font-medium text-zinc-600 mb-1">Keine Gespräche</p>
                  <p className="text-xs text-zinc-400 font-inter">
                    {user?.role === "studio_owner"
                      ? "Kunden schreiben dir, sobald sie einen Termin buchen"
                      : "Buche einen Termin und schreibe dem Studio"}
                  </p>
                </div>
              ) : conversations.map(conv => {
                const isActive = activeConv?.other_id === conv.other_user_id;
                const name = conv.other_name || conv.last_sender_name || "Nutzer";
                return (
                  <button
                    key={conv.conv_id}
                    onClick={() => openConvFromData(conv)}
                    className={`w-full text-left px-4 py-3.5 border-b border-zinc-50 transition-all duration-150 ${isActive ? "bg-zinc-100" : "hover:bg-zinc-50"}`}
                    data-testid={`conv-item-${conv.conv_id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${avatarColor(name)} text-white rounded-full flex items-center justify-center text-sm font-bold font-inter flex-shrink-0`}>
                        {initials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-inter font-semibold text-sm text-zinc-900 truncate">{name}</p>
                          <span className="text-xs text-zinc-400 font-inter flex-shrink-0 ml-2">{formatConvTime(conv.last_message_at)}</span>
                        </div>
                        <p className="text-xs text-zinc-400 font-inter truncate">{conv.last_message || "Starte eine Unterhaltung"}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Chat ── */}
          <div className={`flex flex-col flex-1 min-w-0 bg-zinc-50 ${!activeConv ? "hidden md:flex" : "flex"}`}>
            {!activeConv ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-center mx-auto mb-4">
                    <MessageSquare size={26} className="text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-zinc-500 font-inter text-sm font-medium">Wähle ein Gespräch aus</p>
                  <p className="text-zinc-400 font-inter text-xs mt-1">
                    {user?.role === "studio_owner"
                      ? "Deine Kunden-Nachrichten erscheinen hier"
                      : "oder buche einen Termin, um ein Studio anzuschreiben"}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="px-5 py-3.5 bg-white border-b border-zinc-100 flex items-center gap-3 shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
                  <button onClick={() => setActiveConv(null)} className="md:hidden p-1.5 rounded-xl hover:bg-zinc-100 transition-colors text-zinc-500">
                    <ArrowLeft size={16} strokeWidth={1.5} />
                  </button>
                  <div className={`w-9 h-9 ${avatarColor(activeConv.other_name)} text-white rounded-full flex items-center justify-center text-sm font-bold font-inter flex-shrink-0`}>
                    {initials(activeConv.other_name)}
                  </div>
                  <div>
                    <p className="font-inter font-semibold text-zinc-900 text-sm leading-tight">{activeConv.other_name}</p>
                    <AnimatePresence mode="wait">
                      {otherIsTyping ? (
                        <motion.p key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-xs text-emerald-500 font-inter leading-tight font-medium" data-testid="typing-status-header">
                          tippt...
                        </motion.p>
                      ) : (
                        <motion.p key="role" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-xs text-zinc-400 font-inter leading-tight">
                          {activeConv.other_role === "studio_owner" ? "Tattoo Studio" : "Kunde"}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)", backgroundSize: "20px 20px" }}>
                  {Object.values(groupedMessages).map(group => (
                    <div key={group.date}>
                      {/* Date separator */}
                      <div className="flex items-center justify-center my-3">
                        <span className="text-xs text-zinc-500 font-inter bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-zinc-100">
                          {formatDateSep(group.date)}
                        </span>
                      </div>
                      {group.msgs.map((msg, i) => {
                        const isMine = msg.sender_id === userId;
                        const isLast = i === group.msgs.length - 1;
                        const isFirst = i === 0 || group.msgs[i-1]?.sender_id !== msg.sender_id;
                        return (
                          <motion.div
                            key={msg.message_id}
                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.15 }}
                            className={`flex ${isMine ? "justify-end" : "justify-start"} mb-0.5`}
                            data-testid={`msg-${msg.message_id}`}
                          >
                            {!isMine && isFirst && (
                              <div className={`w-7 h-7 ${avatarColor(msg.sender_name)} text-white rounded-full flex items-center justify-center text-xs font-bold font-inter flex-shrink-0 self-end mr-2 mb-1`}>
                                {initials(msg.sender_name || activeConv.other_name)}
                              </div>
                            )}
                            {!isMine && !isFirst && <div className="w-7 mr-2" />}

                            <div className={`max-w-[70%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                              {!isMine && isFirst && (
                                <p className="text-xs text-zinc-500 font-inter font-semibold mb-1 px-1">{msg.sender_name || activeConv.other_name}</p>
                              )}
                              {msg.image_url && (
                                <img src={msg.image_url} alt="" className="max-w-[220px] max-h-[220px] object-cover rounded-2xl mb-1 shadow-sm" />
                              )}
                              {msg.content && (
                                <div className={`relative px-3.5 py-2.5 shadow-sm ${
                                  isMine
                                    ? "bg-zinc-900 text-white rounded-2xl rounded-br-sm"
                                    : "bg-white text-zinc-900 rounded-2xl rounded-bl-sm border border-zinc-100"
                                }`}>
                                  <p className="font-inter text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                  <div className="flex items-center gap-1 mt-0.5 justify-end">
                                    <span className="text-xs font-inter text-zinc-400">{formatTime(msg.created_at)}</span>
                                    {isMine && (
                                      msg.read
                                        ? <CheckCheck size={12} className="text-blue-400" strokeWidth={2} />
                                        : <Check size={12} className="text-zinc-400" strokeWidth={2} />
                                    )}
                                  </div>
                                </div>
                              )}
                              {!msg.content && msg.image_url && (
                                <span className="text-xs text-zinc-400 font-inter mt-0.5">{formatTime(msg.created_at)}</span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}

                  {/* ── Typing Indicator ── */}
                  <AnimatePresence>
                    {otherIsTyping && (
                      <motion.div
                        key="typing"
                        initial={{ opacity: 0, y: 8, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="flex justify-start items-end gap-2 mb-1"
                        data-testid="typing-indicator"
                      >
                        <div className={`w-7 h-7 ${avatarColor(activeConv.other_name)} text-white rounded-full flex items-center justify-center text-xs font-bold font-inter flex-shrink-0`}>
                          {initials(activeConv.other_name)}
                        </div>
                        <div className="bg-white border border-zinc-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                          {[0, 1, 2].map(i => (
                            <motion.span
                              key={i}
                              className="w-2 h-2 bg-zinc-400 rounded-full block"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </div>

                {/* Image preview */}
                <AnimatePresence>
                  {imagePreview && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="px-4 py-2 bg-white border-t border-zinc-100"
                    >
                      <div className="inline-flex items-center gap-2 p-2 bg-zinc-50 rounded-xl border border-zinc-200">
                        <img src={imagePreview} alt="" className="w-12 h-12 object-cover rounded-lg" />
                        <div>
                          <p className="text-xs font-inter text-zinc-600 font-medium">Bild ausgewählt</p>
                          <button onClick={() => { setImagePreview(null); setImageUrl(""); }} className="text-xs text-red-500 font-inter flex items-center gap-1 mt-0.5">
                            <X size={10} /> Entfernen
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input Area */}
                <div className="px-4 py-3 bg-white border-t border-zinc-100">
                  <form onSubmit={handleSend} className="flex items-end gap-2">
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" data-testid="chat-file-input" />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="p-2.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all flex-shrink-0 mb-0.5"
                      data-testid="chat-image-btn"
                    >
                      <ImageIcon size={18} strokeWidth={1.5} />
                    </button>
                    <div className="flex-1 relative">
                      <textarea
                        value={text}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Nachricht schreiben..."
                        rows={1}
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl font-inter text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all resize-none max-h-28 overflow-y-auto"
                        style={{ lineHeight: "1.5" }}
                        data-testid="chat-input"
                      />
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      type="submit"
                      disabled={sending || (!text.trim() && !imageUrl)}
                      className="p-2.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 disabled:opacity-40 transition-all flex-shrink-0 mb-0.5"
                      data-testid="chat-send-btn"
                    >
                      <Send size={16} strokeWidth={1.5} />
                    </motion.button>
                  </form>
                  <p className="text-xs text-zinc-400 font-inter mt-1.5 px-1">Enter senden · Shift+Enter neue Zeile</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
