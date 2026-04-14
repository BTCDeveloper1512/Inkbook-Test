import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";
import { Send, ImagePlus, ArrowLeft, MessageSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { recipientId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const messagesEndRef = useRef(null);
  const fileRef = useRef();
  const pollRef = useRef(null);
  const userId = user?.id || user?.user_id;

  useEffect(() => {
    fetchConversations();
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.recipient_id);
      clearInterval(pollRef.current);
      pollRef.current = setInterval(() => fetchMessages(activeConv.recipient_id), 5000);
    }
    return () => clearInterval(pollRef.current);
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const { data } = await axios.get(`${API}/messages`, { withCredentials: true });
      setConversations(data);
      if (recipientId && data.length === 0) {
        setActiveConv({ recipient_id: recipientId, recipient_name: "Studio", recipient_avatar: "" });
      } else if (recipientId) {
        const conv = data.find(c => c.participants.includes(recipientId));
        if (conv) {
          const otherId = conv.participants.find(p => p !== userId);
          setActiveConv({ recipient_id: otherId, recipient_name: conv.last_sender_name || "Studio", recipient_avatar: "" });
        } else {
          setActiveConv({ recipient_id: recipientId, recipient_name: "Studio", recipient_avatar: "" });
        }
      }
    } catch { navigate("/login"); }
  };

  const fetchMessages = async (otherId) => {
    try {
      const { data } = await axios.get(`${API}/messages/${otherId}`, { withCredentials: true });
      setMessages(data);
    } catch {}
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imageUrl) return;
    setSending(true);
    try {
      await axios.post(`${API}/messages`, {
        recipient_id: activeConv.recipient_id,
        content: text.trim() || (imageUrl ? "📷 Bild" : ""),
        image_url: imageUrl
      }, { withCredentials: true });
      setText("");
      setImageUrl("");
      setImagePreview(null);
      fetchMessages(activeConv.recipient_id);
      fetchConversations();
    } catch {} finally { setSending(false); }
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

  const openConversation = (conv) => {
    const otherId = conv.participants.find(p => p !== userId);
    setActiveConv({ recipient_id: otherId, recipient_name: conv.last_sender_name || "Nutzer", recipient_avatar: "" });
  };

  const formatTime = (iso) => new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (iso) => {
    const d = new Date(iso);
    if (d.toDateString() === new Date().toDateString()) return "Heute";
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-4 md:py-6">
        <div className="flex h-[calc(100vh-130px)] bg-white rounded-2xl border border-black/[0.04] shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden">

          {/* Conversations Sidebar */}
          <div className={`w-full md:w-72 border-r border-zinc-100 flex flex-col flex-shrink-0 ${activeConv ? "hidden md:flex" : "flex"}`}>
            <div className="px-5 py-4 border-b border-zinc-100">
              <h2 className="font-playfair font-semibold text-lg text-zinc-900">Nachrichten</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
                  <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mb-3">
                    <MessageSquare size={20} className="text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-zinc-500 font-inter text-sm font-medium">Noch keine Gespräche</p>
                  <p className="text-zinc-400 font-inter text-xs mt-1">Buche einen Termin und schreibe dem Studio</p>
                </div>
              ) : conversations.map(conv => {
                const otherId = conv.participants.find(p => p !== userId);
                const isActive = activeConv?.recipient_id === otherId;
                return (
                  <button
                    key={conv.conv_id}
                    onClick={() => openConversation(conv)}
                    className={`w-full text-left px-4 py-3.5 border-b border-zinc-50 transition-colors ${
                      isActive ? "bg-zinc-100" : "hover:bg-zinc-50"
                    }`}
                    data-testid={`conv-item-${conv.conv_id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-zinc-900 text-white rounded-full flex items-center justify-center text-sm font-bold font-inter flex-shrink-0">
                        {conv.last_sender_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="font-inter font-semibold text-sm text-zinc-900 truncate">{conv.last_sender_name || "Nutzer"}</p>
                          <span className="text-xs text-zinc-400 font-inter flex-shrink-0 ml-2">{formatDate(conv.last_message_at)}</span>
                        </div>
                        <p className="text-xs text-zinc-400 font-inter truncate mt-0.5">{conv.last_message}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col min-w-0 ${!activeConv ? "hidden md:flex" : "flex"}`}>
            {!activeConv ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare size={24} className="text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-zinc-500 font-inter text-sm">Wähle ein Gespräch aus</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-3">
                  <button onClick={() => setActiveConv(null)} className="md:hidden p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-500 transition-colors">
                    <ArrowLeft size={16} strokeWidth={1.5} />
                  </button>
                  <div className="w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center text-sm font-bold font-inter">
                    {activeConv.recipient_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-inter font-semibold text-sm text-zinc-900">{activeConv.recipient_name}</p>
                    <p className="text-xs text-zinc-400 font-inter">Chat</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-zinc-400 font-inter text-sm">Schreibe die erste Nachricht</p>
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const isMine = msg.sender_id === userId;
                    const showDate = i === 0 || formatDate(messages[i - 1]?.created_at) !== formatDate(msg.created_at);
                    return (
                      <div key={msg.message_id}>
                        {showDate && (
                          <div className="text-center my-4">
                            <span className="text-xs text-zinc-400 font-inter bg-zinc-100 px-3 py-1 rounded-full">{formatDate(msg.created_at)}</span>
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                          data-testid={`message-${msg.message_id}`}
                        >
                          <div className={`max-w-xs lg:max-w-md flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
                            {msg.image_url && (
                              <img src={msg.image_url} alt="Bild" className="max-w-[200px] max-h-[200px] object-cover rounded-2xl" />
                            )}
                            {msg.content && msg.content !== "📷 Bild" && (
                              <div className={`px-4 py-2.5 font-inter text-sm leading-relaxed ${
                                isMine
                                  ? "bg-zinc-900 text-white rounded-2xl rounded-tr-sm"
                                  : "bg-zinc-100 text-zinc-900 rounded-2xl rounded-tl-sm"
                              }`}>
                                {msg.content}
                              </div>
                            )}
                            <span className="text-xs text-zinc-400 font-inter px-1">{formatTime(msg.created_at)}</span>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Image Preview */}
                <AnimatePresence>
                  {imagePreview && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="px-5 pb-2 flex items-center gap-2"
                    >
                      <div className="relative inline-block">
                        <img src={imagePreview} alt="" className="h-16 w-16 object-cover rounded-xl border border-zinc-200" />
                        <button onClick={() => { setImagePreview(null); setImageUrl(""); }} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-900 text-white rounded-full flex items-center justify-center">
                          <X size={9} />
                        </button>
                      </div>
                      <span className="text-xs text-zinc-400 font-inter">Bild wird gesendet</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input */}
                <form onSubmit={handleSend} className="px-5 py-4 border-t border-zinc-100 flex items-center gap-2">
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" data-testid="chat-image-input" />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all flex-shrink-0"
                    data-testid="chat-image-btn"
                  >
                    <ImagePlus size={18} strokeWidth={1.5} />
                  </button>
                  <input
                    type="text"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Nachricht schreiben..."
                    className="flex-1 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-inter text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100 transition-all"
                    data-testid="chat-text-input"
                  />
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    type="submit"
                    disabled={sending || (!text.trim() && !imageUrl)}
                    className="p-2.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 disabled:opacity-40 transition-all flex-shrink-0"
                    data-testid="chat-send-btn"
                  >
                    <Send size={16} strokeWidth={1.5} />
                  </motion.button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
