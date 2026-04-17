import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";
import { Send, Image as ImageIcon, ArrowLeft, MessageSquare, X, Check, CheckCheck, Calendar, CalendarPlus, Trash2 } from "lucide-react";
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
  const [lightboxImg, setLightboxImg] = useState(null);

  // ── Slot offer state ─────────────────────────────────────────────────────────
  const [showSlotPanel, setShowSlotPanel] = useState(false);
  const [slotPanelMode, setSlotPanelMode] = useState("existing");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [studioId, setStudioId] = useState(null);
  const [slotForm, setSlotForm] = useState({ date: "", start_time: "", end_time: "", slot_type: "tattoo" });
  const [selectedExistingSlot, setSelectedExistingSlot] = useState(null);
  const [sendingSlot, setSendingSlot] = useState(false);
  const [bookingMsgId, setBookingMsgId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingConv, setDeletingConv] = useState(false);

  // Refs – avoid stale closures in intervals
  const textRef = useRef("");               // always current text value
  const imageUrlRef = useRef("");           // always current imageUrl
  const activeConvRef = useRef(null);       // always current active conv
  const messagesEndRef = useRef(null);
  const fileRef = useRef();
  const pollMsgRef = useRef(null);
  const pollConvRef = useRef(null);
  const pollTypingRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => { textRef.current = text; }, [text]);
  useEffect(() => { imageUrlRef.current = imageUrl; }, [imageUrl]);
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  const userId = user?.id || user?.user_id;

  // ─── Fetch conversations (polling-safe: no navigate on failure) ───────────
  const fetchConversations = useCallback(async (initialLoad = false) => {
    try {
      const { data } = await axios.get(`${API}/messages`, { withCredentials: true });
      setConversations(data);
      if (initialLoad) {
        setLoading(false);
        // Open conversation from URL
        if (recipientId) {
          const existing = data.find(c => c.other_user_id === recipientId);
          if (existing) {
            setActiveConv({ other_id: existing.other_user_id, other_name: existing.other_name || "Nutzer", other_role: existing.other_role || "customer" });
          } else {
            const name = location.state?.recipientName || "Studio";
            const role = location.state?.recipientRole || "studio_owner";
            setActiveConv({ other_id: recipientId, other_name: name, other_role: role });
          }
        }
      }
    } catch (err) {
      // Only redirect on auth error, not network blips
      if (initialLoad && err?.response?.status === 401) navigate("/login");
      if (initialLoad) setLoading(false);
    }
  }, [recipientId, location.state]);

  // ─── Fetch messages for active conversation ───────────────────────────────
  const fetchMessages = useCallback(async (otherId) => {
    if (!otherId) return;
    try {
      const { data } = await axios.get(`${API}/messages/${otherId}`, { withCredentials: true });
      setMessages(data);
    } catch {}
  }, []);

  // ─── Init: start conversation polling ─────────────────────────────────────
  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchConversations(true);
    pollConvRef.current = setInterval(() => fetchConversations(false), 2500);
    // Fetch studio ID for studio owners
    if (user.role === "studio_owner") {
      axios.get(`${API}/dashboard/stats`, { withCredentials: true })
        .then(({ data }) => { if (data.studio?.studio_id) setStudioId(data.studio.studio_id); })
        .catch(() => {});
    }
    return () => {
      clearInterval(pollConvRef.current);
      clearInterval(pollMsgRef.current);
      clearInterval(pollTypingRef.current);
    };
  }, []);

  // ─── When active conversation changes: start message + typing polling ─────
  useEffect(() => {
    clearInterval(pollMsgRef.current);
    clearInterval(pollTypingRef.current);
    setOtherIsTyping(false);

    if (!activeConv?.other_id) return;

    fetchMessages(activeConv.other_id);

    // Poll messages every 2s using ref to avoid stale closure
    pollMsgRef.current = setInterval(() => {
      if (activeConvRef.current?.other_id) fetchMessages(activeConvRef.current.other_id);
    }, 2000);

    // Poll typing every 1.5s
    pollTypingRef.current = setInterval(async () => {
      const otherId = activeConvRef.current?.other_id;
      if (!otherId) return;
      try {
        const { data } = await axios.get(`${API}/messages/${otherId}/typing-status`, { withCredentials: true });
        setOtherIsTyping(data.is_typing || false);
      } catch {}
    }, 1500);

    return () => {
      clearInterval(pollMsgRef.current);
      clearInterval(pollTypingRef.current);
    };
  }, [activeConv?.other_id]);

  // ─── Scroll to bottom on new messages ────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherIsTyping]);

  // ─── Send message (uses refs to avoid stale closure) ─────────────────────
  const sendMessage = useCallback(async () => {
    const currentText = textRef.current.trim();
    const currentImage = imageUrlRef.current;
    const conv = activeConvRef.current;

    if (!currentText && !currentImage) return;
    if (!conv?.other_id) return;

    setSending(true);
    // Optimistic clear
    setText("");
    textRef.current = "";
    setImageUrl("");
    imageUrlRef.current = "";
    setImagePreview(null);

    try {
      await axios.post(`${API}/messages`, {
        recipient_id: conv.other_id,
        content: currentText,
        image_url: currentImage || ""
      }, { withCredentials: true });
      // Fetch updated messages immediately
      await fetchMessages(conv.other_id);
      fetchConversations(false);
    } catch {
      // On error, restore text
      setText(currentText);
      textRef.current = currentText;
    } finally {
      setSending(false);
    }
  }, [fetchMessages, fetchConversations]);

  // ─── Enter key: send (Shift+Enter = newline) ──────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // ─── Typing indicator ─────────────────────────────────────────────────────
  const handleTextChange = (e) => {
    setText(e.target.value);
    const conv = activeConvRef.current;
    if (!conv?.other_id) return;
    clearTimeout(typingTimeoutRef.current);
    axios.post(`${API}/messages/${conv.other_id}/typing`, {}, { withCredentials: true }).catch(() => {});
  };

  // ─── Image upload ─────────────────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await axios.post(`${API}/upload/image`, formData, { withCredentials: true });
      setImageUrl(data.url);
      imageUrlRef.current = data.url;
      const reader = new FileReader();
      reader.onload = ev => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    } catch {}
  };

  // ─── Slot offer helpers ───────────────────────────────────────────────────
  const fetchAvailableSlots = useCallback(async (sid) => {
    const id = sid || studioId;
    if (!id) return;
    setLoadingSlots(true);
    try {
      const { data } = await axios.get(`${API}/studios/${id}/slots`, { withCredentials: true });
      const today = new Date().toISOString().split("T")[0];
      setAvailableSlots(data.filter(s => s.date >= today));
    } catch {} finally { setLoadingSlots(false); }
  }, [studioId]);

  const sendSlotOffer = async () => {
    const conv = activeConvRef.current;
    if (!conv?.other_id || !studioId) return;
    setSendingSlot(true);
    try {
      let slotId, slotData;
      if (slotPanelMode === "existing" && selectedExistingSlot) {
        slotId = selectedExistingSlot.slot_id;
        slotData = selectedExistingSlot;
      } else {
        const { data: newSlot } = await axios.post(
          `${API}/studios/${studioId}/slots`,
          { ...slotForm, duration_minutes: 60 },
          { withCredentials: true }
        );
        slotId = newSlot.slot_id;
        slotData = newSlot;
      }
      await axios.post(`${API}/messages`, {
        recipient_id: conv.other_id,
        content: "",
        image_url: "",
        slot_offer: {
          slot_id: slotId,
          studio_id: studioId,
          date: slotData.date,
          start_time: slotData.start_time,
          end_time: slotData.end_time,
          slot_type: slotData.slot_type || slotForm.slot_type,
          status: "available"
        }
      }, { withCredentials: true });
      await fetchMessages(conv.other_id);
      fetchConversations(false);
      setShowSlotPanel(false);
      setSelectedExistingSlot(null);
      setSlotForm({ date: "", start_time: "", end_time: "", slot_type: "tattoo" });
    } catch (e) {
      alert(e.response?.data?.detail || "Fehler beim Senden des Terminvorschlags");
    } finally { setSendingSlot(false); }
  };

  const bookSlotFromChat = async (messageId) => {
    setBookingMsgId(messageId);
    try {
      await axios.post(`${API}/messages/${messageId}/book-slot`, {}, { withCredentials: true });
      await fetchMessages(activeConvRef.current?.other_id);
      fetchConversations(false);
    } catch (e) {
      alert(e.response?.data?.detail || "Buchung fehlgeschlagen");
    } finally { setBookingMsgId(null); }
  };

  // ─── Delete conversation ──────────────────────────────────────────────────
  const deleteConversation = async () => {
    const conv = activeConvRef.current;
    if (!conv?.other_id) return;
    setDeletingConv(true);
    try {
      await axios.delete(`${API}/conversations/${conv.other_id}`, { withCredentials: true });
      await fetchConversations(false);
      setActiveConv(null);
      setShowDeleteConfirm(false);
    } catch (e) {
      alert(e.response?.data?.detail || "Fehler beim Löschen");
    } finally { setDeletingConv(false); }
  };

  // Active conv's data from the list (includes deleted_by)
  const activeConvData = conversations.find(c => c.other_user_id === activeConv?.other_id);
  const isEndedByOther = !!(activeConvData?.deleted_by && Object.keys(activeConvData.deleted_by).length > 0);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const openConvFromData = (conv) => {
    setActiveConv({
      other_id: conv.other_user_id,
      other_name: conv.other_name || conv.last_sender_name || "Nutzer",
      other_role: conv.other_role || "customer",
      conv_id: conv.conv_id
    });
  };

  const fmt = (iso) => new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const fmtConv = (iso) => {
    if (!iso) return "";
    const d = new Date(iso), now = new Date();
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  };
  const fmtDateSep = (iso) => {
    const d = new Date(iso);
    if (d.toDateString() === new Date().toDateString()) return "Heute";
    const yd = new Date(); yd.setDate(yd.getDate() - 1);
    if (d.toDateString() === yd.toDateString()) return "Gestern";
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
  };
  const initials = (n) => n?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const avatarBg = (n) => ["bg-zinc-800","bg-stone-700","bg-neutral-700","bg-slate-700"][(n?.charCodeAt(0)||0)%4];

  // Group messages by date
  const grouped = messages.reduce((acc, msg) => {
    const key = new Date(msg.created_at).toDateString();
    if (!acc[key]) acc[key] = { date: msg.created_at, msgs: [] };
    acc[key].msgs.push(msg);
    return acc;
  }, {});

  if (loading) return (
    <div className="min-h-screen bg-zinc-50"><Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-stretch max-w-6xl mx-auto w-full px-4 md:px-6 py-4 md:py-6" style={{ minHeight: 0 }}>
        <div className="flex w-full rounded-2xl overflow-hidden border border-black/[0.04] shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-white" style={{ height: "calc(100vh - 130px)" }}>

          {/* ── Sidebar ─────────────────────────────────────────────────────── */}
          <div className={`flex-shrink-0 border-r border-zinc-100 flex flex-col bg-white ${activeConv ? "hidden md:flex" : "flex"}`} style={{ width: 300 }}>
            <div className="px-5 py-4 border-b border-zinc-100">
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
                const name = conv.other_name || "Nutzer";
                return (
                  <button key={conv.conv_id} onClick={() => openConvFromData(conv)}
                    className={`w-full text-left px-4 py-3.5 border-b border-zinc-50 transition-all duration-150 ${isActive ? "bg-zinc-100" : "hover:bg-zinc-50"}`}
                    data-testid={`conv-${conv.conv_id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${avatarBg(name)} text-white rounded-full flex items-center justify-center text-sm font-bold font-inter flex-shrink-0`}>
                        {initials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-inter font-semibold text-sm text-zinc-900 truncate">{name}</p>
                          <span className="text-xs text-zinc-400 font-inter flex-shrink-0 ml-2">{fmtConv(conv.last_message_at)}</span>
                        </div>
                        <p className="text-xs text-zinc-400 font-inter truncate">{conv.last_message || "Starte eine Unterhaltung"}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Chat Area ───────────────────────────────────────────────────── */}
          <div className={`flex flex-col flex-1 min-w-0 ${!activeConv ? "hidden md:flex" : "flex"}`} style={{ background: "rgba(249,249,249,1)" }}>
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
                <div className="px-5 py-3.5 bg-white border-b border-zinc-100 flex items-center gap-3 shadow-[0_2px_8px_rgb(0,0,0,0.04)] flex-shrink-0">
                  <button onClick={() => setActiveConv(null)} className="md:hidden p-1.5 rounded-xl hover:bg-zinc-100 transition-colors text-zinc-500">
                    <ArrowLeft size={16} strokeWidth={1.5} />
                  </button>
                  <div className={`w-9 h-9 ${avatarBg(activeConv.other_name)} text-white rounded-full flex items-center justify-center text-sm font-bold font-inter flex-shrink-0`}>
                    {initials(activeConv.other_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-inter font-semibold text-zinc-900 text-sm leading-tight truncate">{activeConv.other_name}</p>
                    <AnimatePresence mode="wait">
                      {otherIsTyping ? (
                        <motion.p key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-xs text-emerald-500 font-inter leading-tight font-medium" data-testid="typing-status-header">
                          tippt...
                        </motion.p>
                      ) : isEndedByOther ? (
                        <motion.p key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-xs text-red-400 font-inter leading-tight">
                          Unterhaltung beendet
                        </motion.p>
                      ) : (
                        <motion.p key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-xs text-zinc-400 font-inter leading-tight">
                          {activeConv.other_role === "studio_owner" ? "Tattoo Studio" : "Kunde"}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  {/* Delete conversation button */}
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                    data-testid="delete-conv-btn"
                    title="Gespräch löschen"
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
                  style={{ backgroundImage: "radial-gradient(circle at 1px 1px,rgba(0,0,0,0.03) 1px,transparent 0)", backgroundSize: "20px 20px" }}>

                  {Object.values(grouped).map(group => (
                    <div key={group.date}>
                      <div className="flex justify-center my-3">
                        <span className="text-xs text-zinc-500 font-inter bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-zinc-100">
                          {fmtDateSep(group.date)}
                        </span>
                      </div>

                      {group.msgs.map((msg, i) => {
                        // ── System messages (centered, no avatar) ─────────────
                        if (msg.is_system) {
                          return (
                            <div key={msg.message_id} className="flex justify-center my-3" data-testid={`system-msg-${msg.message_id}`}>
                              <span className="text-xs text-zinc-400 font-inter bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-zinc-200 max-w-xs text-center italic">
                                {msg.content}
                              </span>
                            </div>
                          );
                        }

                        const isMine = msg.sender_id === userId;
                        const isFirst = i === 0 || group.msgs[i - 1]?.sender_id !== msg.sender_id;
                        return (
                          <motion.div key={msg.message_id}
                            initial={{ opacity: 0, y: 4, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.15 }}
                            className={`flex ${isMine ? "justify-end" : "justify-start"} mb-0.5`}
                            data-testid={`msg-${msg.message_id}`}
                          >
                            {!isMine && isFirst && (
                              <div className={`w-7 h-7 ${avatarBg(msg.sender_name)} text-white rounded-full flex items-center justify-center text-xs font-bold font-inter flex-shrink-0 self-end mr-2 mb-1`}>
                                {initials(msg.sender_name || activeConv.other_name)}
                              </div>
                            )}
                            {!isMine && !isFirst && <div className="w-7 mr-2" />}

                            <div className={`max-w-[70%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                              {!isMine && isFirst && (
                                <p className="text-xs text-zinc-500 font-inter font-semibold mb-1 px-1">
                                  {msg.sender_name || activeConv.other_name}
                                </p>
                              )}
                              {/* Slot Offer Bubble */}
                              {msg.slot_offer && (
                                <div className={`w-72 rounded-2xl overflow-hidden shadow-sm border mb-1 ${isMine ? "border-zinc-700 bg-zinc-800" : "border-zinc-100 bg-white"}`}
                                  data-testid={`slot-offer-${msg.message_id}`}>
                                  {/* Header */}
                                  <div className={`px-4 py-3 border-b flex items-center gap-3 ${isMine ? "border-zinc-700" : "border-zinc-100"}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.slot_offer.status === "booked" ? "bg-emerald-100" : (isMine ? "bg-zinc-700" : "bg-zinc-100")}`}>
                                      <Calendar size={14} className={msg.slot_offer.status === "booked" ? "text-emerald-600" : (isMine ? "text-zinc-300" : "text-zinc-600")} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                      <p className={`text-xs font-inter font-semibold leading-tight ${msg.slot_offer.status === "booked" ? "text-emerald-600" : (isMine ? "text-zinc-100" : "text-zinc-900")}`}>
                                        {msg.slot_offer.status === "booked" ? "Termin gebucht" : "Terminvorschlag"}
                                      </p>
                                      <p className={`text-xs font-inter leading-tight ${isMine ? "text-zinc-400" : "text-zinc-500"}`}>
                                        {new Date(msg.slot_offer.date + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" })}
                                      </p>
                                    </div>
                                  </div>
                                  {/* Details */}
                                  <div className="px-4 py-3">
                                    <p className={`text-base font-inter font-bold mb-0.5 ${isMine ? "text-white" : "text-zinc-900"}`}>
                                      {msg.slot_offer.start_time} – {msg.slot_offer.end_time}
                                    </p>
                                    <p className={`text-xs font-inter ${isMine ? "text-zinc-400" : "text-zinc-500"}`}>
                                      {msg.slot_offer.slot_type === "consultation" ? "Beratungsgespräch" : "Tattoo-Session"}
                                    </p>
                                    {msg.slot_offer.status === "booked" && (
                                      <p className="text-xs font-inter text-emerald-600 font-medium flex items-center gap-1 mt-1">
                                        <CheckCheck size={12} strokeWidth={2} />
                                        Gebucht{msg.slot_offer.booked_by_name ? ` von ${msg.slot_offer.booked_by_name}` : ""}
                                      </p>
                                    )}
                                  </div>
                                  {/* Book button – only for customer, available slots */}
                                  {!isMine && msg.slot_offer.status !== "booked" && user?.role !== "studio_owner" && (
                                    <div className="px-4 pb-4">
                                      <button
                                        onClick={() => bookSlotFromChat(msg.message_id)}
                                        disabled={bookingMsgId === msg.message_id}
                                        className="w-full py-2.5 bg-zinc-900 text-white rounded-xl font-inter font-semibold text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        data-testid={`book-slot-chat-${msg.message_id}`}
                                      >
                                        {bookingMsgId === msg.message_id
                                          ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Wird gebucht...</>
                                          : <><Calendar size={14} strokeWidth={1.5} /> Jetzt buchen</>}
                                      </button>
                                    </div>
                                  )}
                                  {/* Studio view – show sent status */}
                                  {isMine && msg.slot_offer.status !== "booked" && (
                                    <div className="px-4 pb-3">
                                      <span className="text-xs font-inter text-zinc-500 flex items-center gap-1">
                                        <Check size={11} strokeWidth={2} /> Terminvorschlag gesendet
                                      </span>
                                    </div>
                                  )}
                                  <div className="px-4 pb-3">
                                    <span className={`text-xs font-inter ${isMine ? "text-zinc-600" : "text-zinc-400"}`}>{fmt(msg.created_at)}</span>
                                  </div>
                                </div>
                              )}
                              {msg.image_url && (
                                <img
                                  src={msg.image_url} alt=""
                                  className="max-w-[220px] max-h-[220px] object-cover rounded-2xl mb-1 shadow-sm cursor-zoom-in hover:opacity-90 transition-opacity"
                                  onClick={() => setLightboxImg(msg.image_url)}
                                  data-testid={`chat-img-${msg.message_id}`}
                                />
                              )}
                              {msg.content && (
                                <div className={`px-3.5 py-2.5 shadow-sm ${
                                  isMine
                                    ? "bg-zinc-900 text-white rounded-2xl rounded-br-sm"
                                    : "bg-white text-zinc-900 rounded-2xl rounded-bl-sm border border-zinc-100"
                                }`}>
                                  <p className="font-inter text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                  <div className="flex items-center gap-1 mt-0.5 justify-end">
                                    <span className="text-xs font-inter text-zinc-400">{fmt(msg.created_at)}</span>
                                    {isMine && (msg.read
                                      ? <CheckCheck size={12} className="text-blue-400" strokeWidth={2} />
                                      : <Check size={12} className="text-zinc-400" strokeWidth={2} />
                                    )}
                                  </div>
                                </div>
                              )}
                              {!msg.content && msg.image_url && (
                                <span className="text-xs text-zinc-400 font-inter mt-0.5">{fmt(msg.created_at)}</span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}

                  {/* Typing indicator */}
                  <AnimatePresence>
                    {otherIsTyping && (
                      <motion.div key="typing"
                        initial={{ opacity: 0, y: 8, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="flex justify-start items-end gap-2 mb-1"
                        data-testid="typing-indicator"
                      >
                        <div className={`w-7 h-7 ${avatarBg(activeConv.other_name)} text-white rounded-full flex items-center justify-center text-xs font-bold font-inter flex-shrink-0`}>
                          {initials(activeConv.other_name)}
                        </div>
                        <div className="bg-white border border-zinc-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                          {[0, 1, 2].map(i => (
                            <motion.span key={i} className="w-2 h-2 bg-zinc-400 rounded-full block"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }} />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </div>

                {/* Slot Offer Panel – studio only */}
                <AnimatePresence>
                  {showSlotPanel && user?.role === "studio_owner" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="bg-white border-t border-zinc-100 flex-shrink-0 overflow-hidden">
                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-inter font-semibold text-sm text-zinc-900 flex items-center gap-2">
                            <CalendarPlus size={15} strokeWidth={1.5} className="text-zinc-500" />
                            Terminvorschlag senden
                          </p>
                          <button onClick={() => setShowSlotPanel(false)} className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors">
                            <X size={14} strokeWidth={2} />
                          </button>
                        </div>
                        {/* Mode Tabs */}
                        <div className="flex gap-1 mb-4 bg-zinc-100 p-1 rounded-xl w-fit">
                          <button onClick={() => { setSlotPanelMode("existing"); fetchAvailableSlots(); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-inter font-medium transition-all ${slotPanelMode === "existing" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
                            data-testid="slot-tab-existing">
                            Bestehender Slot
                          </button>
                          <button onClick={() => setSlotPanelMode("new")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-inter font-medium transition-all ${slotPanelMode === "new" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}
                            data-testid="slot-tab-new">
                            Neuer Slot
                          </button>
                        </div>

                        {/* Existing Slots */}
                        {slotPanelMode === "existing" && (
                          <div>
                            {loadingSlots ? (
                              <div className="flex items-center justify-center py-4">
                                <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
                              </div>
                            ) : availableSlots.length === 0 ? (
                              <p className="text-xs text-zinc-400 font-inter py-2 text-center bg-zinc-50 rounded-xl px-3">
                                Keine freien Slots vorhanden. Erstelle zuerst Slots im Dashboard.
                              </p>
                            ) : (
                              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                                {availableSlots.map(slot => (
                                  <button key={slot.slot_id}
                                    onClick={() => setSelectedExistingSlot(selectedExistingSlot?.slot_id === slot.slot_id ? null : slot)}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-center gap-3 ${
                                      selectedExistingSlot?.slot_id === slot.slot_id
                                        ? "bg-zinc-900 text-white border-zinc-900"
                                        : "border-zinc-100 hover:border-zinc-300 bg-white"
                                    }`}
                                    data-testid={`slot-pick-${slot.slot_id}`}
                                  >
                                    <Calendar size={13} strokeWidth={1.5} className="flex-shrink-0 opacity-70" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-inter font-semibold">
                                        {new Date(slot.date + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short" })} · {slot.start_time} – {slot.end_time}
                                      </p>
                                      <p className={`text-xs font-inter ${selectedExistingSlot?.slot_id === slot.slot_id ? "text-zinc-300" : "text-zinc-400"}`}>
                                        {slot.slot_type === "consultation" ? "Beratung" : "Tattoo"}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* New Slot */}
                        {slotPanelMode === "new" && (
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="col-span-2">
                              <label className="block text-xs text-zinc-400 font-inter font-semibold uppercase tracking-wider mb-1">Datum</label>
                              <input type="date" value={slotForm.date}
                                onChange={e => setSlotForm(p => ({...p, date: e.target.value}))}
                                min={new Date().toISOString().split("T")[0]}
                                className="w-full px-3 py-2 text-sm font-inter border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 bg-zinc-50"
                                data-testid="new-slot-date" />
                            </div>
                            <div>
                              <label className="block text-xs text-zinc-400 font-inter font-semibold uppercase tracking-wider mb-1">Von</label>
                              <input type="time" value={slotForm.start_time}
                                onChange={e => setSlotForm(p => ({...p, start_time: e.target.value}))}
                                className="w-full px-3 py-2 text-sm font-inter border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 bg-zinc-50"
                                data-testid="new-slot-start" />
                            </div>
                            <div>
                              <label className="block text-xs text-zinc-400 font-inter font-semibold uppercase tracking-wider mb-1">Bis</label>
                              <input type="time" value={slotForm.end_time}
                                onChange={e => setSlotForm(p => ({...p, end_time: e.target.value}))}
                                className="w-full px-3 py-2 text-sm font-inter border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 bg-zinc-50"
                                data-testid="new-slot-end" />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs text-zinc-400 font-inter font-semibold uppercase tracking-wider mb-1">Art</label>
                              <div className="flex gap-2">
                                {[{v:"tattoo",l:"Tattoo"},{v:"consultation",l:"Beratung"}].map(t => (
                                  <button key={t.v} type="button" onClick={() => setSlotForm(p => ({...p, slot_type: t.v}))}
                                    className={`px-4 py-2 text-xs font-inter font-medium rounded-xl border transition-all ${slotForm.slot_type === t.v ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 hover:border-zinc-400 text-zinc-600"}`}
                                    data-testid={`slot-type-${t.v}`}>
                                    {t.l}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Send Button */}
                        <div className="flex justify-end mt-4">
                          <button
                            onClick={sendSlotOffer}
                            disabled={sendingSlot ||
                              (slotPanelMode === "existing" && !selectedExistingSlot) ||
                              (slotPanelMode === "new" && (!slotForm.date || !slotForm.start_time || !slotForm.end_time))}
                            className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-inter font-semibold text-sm hover:bg-zinc-700 transition-colors disabled:opacity-40 flex items-center gap-2"
                            data-testid="send-slot-offer-btn"
                          >
                            <CalendarPlus size={14} strokeWidth={1.5} />
                            {sendingSlot ? "Wird gesendet..." : "Terminvorschlag senden"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Image preview */}
                <AnimatePresence>
                  {imagePreview && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="px-4 py-2 bg-white border-t border-zinc-100 flex-shrink-0">
                      <div className="inline-flex items-center gap-2 p-2 bg-zinc-50 rounded-xl border border-zinc-200">
                        <img src={imagePreview} alt="" className="w-12 h-12 object-cover rounded-lg" />
                        <div>
                          <p className="text-xs font-inter text-zinc-600 font-medium">Bild ausgewählt</p>
                          <button onClick={() => { setImagePreview(null); setImageUrl(""); imageUrlRef.current = ""; }}
                            className="text-xs text-red-500 font-inter flex items-center gap-1 mt-0.5">
                            <X size={10} /> Entfernen
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input Area – blocked if other party ended conversation */}
                {isEndedByOther ? (
                  <div className="px-4 py-5 bg-white border-t border-zinc-100 flex-shrink-0 text-center" data-testid="conv-ended-banner">
                    <p className="text-sm text-zinc-500 font-inter mb-1.5">Diese Unterhaltung wurde beendet. Du kannst keine neuen Nachrichten senden.</p>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-xs text-red-500 font-inter hover:text-red-700 underline underline-offset-2 transition-colors"
                      data-testid="delete-conv-ended-btn"
                    >
                      Auch für mich löschen
                    </button>
                  </div>
                ) : (
                <div className="px-4 py-3 bg-white border-t border-zinc-100 flex-shrink-0">
                  <div className="flex items-end gap-2">
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" data-testid="chat-file-input" />
                    {/* Image upload button */}
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="p-2.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all flex-shrink-0 mb-0.5"
                      data-testid="chat-image-btn">
                      <ImageIcon size={18} strokeWidth={1.5} />
                    </button>
                    {/* Slot offer button – studio only */}
                    {user?.role === "studio_owner" && (
                      <button type="button"
                        onClick={() => { setShowSlotPanel(p => { if (!p) fetchAvailableSlots(); return !p; }); }}
                        className={`p-2.5 rounded-xl transition-all flex-shrink-0 mb-0.5 ${showSlotPanel ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"}`}
                        data-testid="slot-offer-btn"
                        title="Terminvorschlag senden">
                        <CalendarPlus size={18} strokeWidth={1.5} />
                      </button>
                    )}
                    <div className="flex-1">
                      <textarea
                        value={text}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Nachricht schreiben... (Enter senden, Shift+Enter neue Zeile)"
                        rows={1}
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl font-inter text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all resize-none overflow-hidden"
                        style={{ lineHeight: "1.5", maxHeight: "112px", overflowY: "auto" }}
                        data-testid="chat-input"
                      />
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={sendMessage}
                      disabled={sending || (!text.trim() && !imageUrl)}
                      className="p-2.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 disabled:opacity-40 transition-all flex-shrink-0 mb-0.5"
                      data-testid="chat-send-btn"
                    >
                      <Send size={16} strokeWidth={1.5} />
                    </motion.button>
                  </div>
                </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Conversation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
            data-testid="delete-conv-modal-overlay"
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
              data-testid="delete-conv-modal"
            >
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} className="text-red-600" strokeWidth={1.5} />
              </div>
              <h3 className="font-playfair font-semibold text-lg text-zinc-900 text-center mb-2">Gespräch löschen?</h3>
              <p className="text-sm text-zinc-500 font-inter text-center mb-5">
                Die andere Person wird über die Löschung informiert. Du siehst diese Unterhaltung danach nicht mehr.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 border border-zinc-200 text-zinc-700 rounded-xl font-inter font-medium text-sm hover:bg-zinc-50 transition-colors"
                  data-testid="delete-conv-cancel">
                  Abbrechen
                </button>
                <button onClick={deleteConversation}
                  disabled={deletingConv}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-inter font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="delete-conv-confirm">
                  {deletingConv
                    ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Löschen...</>
                    : <><Trash2 size={14} strokeWidth={1.5} /> Löschen</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setLightboxImg(null)}
            data-testid="chat-lightbox"
          >
            <motion.img
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              src={lightboxImg}
              alt=""
              className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              data-testid="chat-lightbox-close"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
