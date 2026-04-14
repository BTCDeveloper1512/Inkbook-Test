import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Navbar from "../components/Navbar";
import { Send, ImagePlus, ArrowLeft, MessageSquare, X } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MessagesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { recipientId } = useParams(); // optional - open specific conversation
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null); // { recipient_id, recipient_name, recipient_avatar }
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
      // Auto-open if recipientId provided
      if (recipientId && data.length === 0) {
        setActiveConv({ recipient_id: recipientId, recipient_name: "Studio", recipient_avatar: "" });
      } else if (recipientId) {
        const conv = data.find(c => c.participants.includes(recipientId));
        if (conv) {
          const otherId = conv.participants.find(p => p !== userId);
          setActiveConv({ recipient_id: otherId, recipient_name: "Studio", recipient_avatar: "" });
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

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Heute";
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <div className="flex h-[calc(100vh-140px)] bg-white border border-gray-200 overflow-hidden">

          {/* Conversations Sidebar */}
          <div className={`w-full md:w-72 border-r border-gray-200 flex flex-col ${activeConv ? "hidden md:flex" : "flex"}`}>
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-gray-600" />
                <h2 className="font-playfair font-bold text-lg">Nachrichten</h2>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <MessageSquare size={40} className="text-gray-200 mb-3" />
                  <p className="text-gray-400 font-outfit text-sm">Noch keine Gespräche</p>
                  <p className="text-gray-300 font-outfit text-xs mt-1">Buche einen Termin und schreibe dem Studio</p>
                </div>
              ) : conversations.map(conv => {
                const otherId = conv.participants.find(p => p !== userId);
                const isActive = activeConv?.recipient_id === otherId;
                return (
                  <button
                    key={conv.conv_id}
                    onClick={() => openConversation(conv)}
                    className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${isActive ? "bg-gray-100" : ""}`}
                    data-testid={`conv-item-${conv.conv_id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold font-outfit flex-shrink-0">
                        {conv.last_sender_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="font-outfit font-semibold text-sm truncate">{conv.last_sender_name || "Nutzer"}</p>
                          <span className="text-xs text-gray-400 font-outfit flex-shrink-0 ml-2">{formatDate(conv.last_message_at)}</span>
                        </div>
                        <p className="text-xs text-gray-400 font-outfit truncate mt-0.5">{conv.last_message}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${!activeConv ? "hidden md:flex" : "flex"}`}>
            {!activeConv ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare size={48} className="text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-outfit">Wähle ein Gespräch aus</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                  <button onClick={() => setActiveConv(null)} className="md:hidden p-1 text-gray-500">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {activeConv.recipient_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-outfit font-semibold text-sm">{activeConv.recipient_name}</p>
                    <p className="text-xs text-gray-400 font-outfit">Online</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-300 font-outfit text-sm">Schreibe die erste Nachricht</p>
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const isMine = msg.sender_id === userId;
                    const showDate = i === 0 || formatDate(messages[i-1]?.created_at) !== formatDate(msg.created_at);
                    return (
                      <div key={msg.message_id}>
                        {showDate && (
                          <div className="text-center my-3">
                            <span className="text-xs text-gray-400 font-outfit bg-gray-100 px-3 py-1">{formatDate(msg.created_at)}</span>
                          </div>
                        )}
                        <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-xs lg:max-w-md ${isMine ? "items-end" : "items-start"} flex flex-col gap-1`} data-testid={`message-${msg.message_id}`}>
                            {msg.image_url && (
                              <img src={msg.image_url} alt="Bild" className={`max-w-48 max-h-48 object-cover ${isMine ? "rounded-tl-lg rounded-bl-lg rounded-tr-sm" : "rounded-tr-lg rounded-br-lg rounded-tl-sm"}`} />
                            )}
                            {msg.content && msg.content !== "📷 Bild" && (
                              <div className={`px-4 py-2.5 font-outfit text-sm leading-relaxed ${
                                isMine
                                  ? "bg-black text-white rounded-tl-2xl rounded-bl-2xl rounded-tr-sm"
                                  : "bg-gray-100 text-gray-900 rounded-tr-2xl rounded-br-2xl rounded-tl-sm"
                              }`}>
                                {msg.content}
                              </div>
                            )}
                            <span className="text-xs text-gray-400 font-outfit px-1">{formatTime(msg.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="px-4 pb-2 flex items-center gap-2">
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="" className="h-16 w-16 object-cover border border-gray-200" />
                      <button onClick={() => { setImagePreview(null); setImageUrl(""); }} className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center">
                        <X size={10} />
                      </button>
                    </div>
                    <span className="text-xs text-gray-400 font-outfit">Bild wird gesendet</span>
                  </div>
                )}

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-gray-200 flex items-center gap-2">
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" data-testid="chat-image-input" />
                  <button type="button" onClick={() => fileRef.current?.click()} className="p-2 text-gray-400 hover:text-black transition-colors flex-shrink-0" data-testid="chat-image-btn">
                    <ImagePlus size={18} />
                  </button>
                  <input
                    type="text"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Nachricht schreiben..."
                    className="flex-1 px-4 py-2.5 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit"
                    data-testid="chat-text-input"
                  />
                  <button
                    type="submit"
                    disabled={sending || (!text.trim() && !imageUrl)}
                    className="p-2.5 bg-black text-white hover:bg-neutral-800 disabled:opacity-40 transition-colors flex-shrink-0"
                    data-testid="chat-send-btn"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
