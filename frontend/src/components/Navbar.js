import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Menu, X, Globe, ChevronDown, Bell, MessageSquare, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getPushPermission, registerPushNotifications } from "../utils/pushNotifications";
import { prefetchStudios } from "../utils/studiosCache";
import axios from "axios";
import BlurText from "./BlurText/BlurText";
import { StudioOSMark } from "./StudioOSLogo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingRefunds, setPendingRefunds] = useState([]);
  const [refundsOpen, setRefundsOpen] = useState(false);
  const [refundingId, setRefundingId] = useState("");
  const pollRef = useRef(null);
  const refundsPollRef = useRef(null);
  const refundsRef = useRef(null);

  const toggleLang = () => i18n.changeLanguage(i18n.language === "de" ? "en" : "de");
  const handleLogout = async () => { await logout(); navigate("/"); setUserMenuOpen(false); };
  const dashboardPath = user?.role === "studio_owner" ? "/studio-dashboard" : user?.role === "admin" ? "/admin" : "/dashboard";

  const handlePushToggle = async () => {
    const permission = await getPushPermission();
    if (permission === "granted") { setPushStatus("active"); return; }
    const result = await registerPushNotifications();
    setPushStatus(result.success ? "active" : "denied");
    setTimeout(() => setPushStatus(""), 3000);
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const { data } = await axios.get(`${API}/messages/unread-count`, { withCredentials: true });
      setUnreadCount(data.count || 0);
    } catch {}
  };

  const fetchPendingRefunds = async () => {
    if (!user || user.role !== "studio_owner") return;
    try {
      const { data } = await axios.get(`${API}/studios/my/pending-refunds`, { withCredentials: true });
      setPendingRefunds(data.bookings || []);
    } catch {}
  };

  const handleRefundDeposit = async (bookingId) => {
    setRefundingId(bookingId);
    try {
      await axios.post(`${API}/bookings/${bookingId}/refund-deposit`, {}, { withCredentials: true });
      setPendingRefunds(prev => prev.filter(b => b.booking_id !== bookingId));
    } catch (e) {
      alert(e.response?.data?.detail || "Fehler bei der Rückzahlung");
    } finally { setRefundingId(""); }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (refundsRef.current && !refundsRef.current.contains(e.target)) setRefundsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    fetchUnreadCount();
    if (location.pathname.startsWith("/messages")) setUnreadCount(0);
    pollRef.current = setInterval(fetchUnreadCount, 8000);
    return () => clearInterval(pollRef.current);
  }, [user, location.pathname]);

  useEffect(() => {
    if (!user || user.role !== "studio_owner") { setPendingRefunds([]); return; }
    fetchPendingRefunds();
    refundsPollRef.current = setInterval(fetchPendingRefunds, 15000);
    return () => clearInterval(refundsPollRef.current);
  }, [user]);

  const isMessagesPage = location.pathname.startsWith("/messages");
  const countToShow = isMessagesPage ? 0 : unreadCount;

  const noBackPaths = ["/", "/login", "/register"];
  const showBack = !noBackPaths.includes(location.pathname);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="flex items-center justify-between h-[60px]">
          {/* Left: back button + logo */}
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {showBack && (
                <motion.button
                  key="back-btn"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => navigate(-1)}
                  whileTap={{ scale: 0.88 }}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
                  data-testid="back-btn"
                  aria-label="Zurück"
                >
                  <ArrowLeft size={17} strokeWidth={2} />
                </motion.button>
              )}
            </AnimatePresence>
            <Link to="/" className="flex items-center gap-2 select-none" data-testid="nav-logo">
              <StudioOSMark size={26} />
              <span className="text-xl font-playfair font-semibold tracking-tight text-zinc-900">
                Studio<span className="font-bold">OS</span>
              </span>
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { to: "/search", label: t("nav.search") },
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                onMouseEnter={link.to === "/search" ? prefetchStudios : undefined}
                className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full font-inter transition-all duration-200"
                data-testid={`nav-${link.to.replace("/", "") || "home"}-link`}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link to="/messages" className="relative px-4 py-2 text-sm text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full font-inter transition-all duration-200 flex items-center gap-1.5" data-testid="nav-messages-link">
                <MessageSquare size={14} strokeWidth={1.5} />
                Nachrichten
                {countToShow > 0 && (
                  <span className="absolute -top-0.5 right-1.5 min-w-[17px] h-[17px] px-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none" data-testid="nav-unread-badge">
                    {countToShow > 9 ? "9+" : countToShow}
                  </span>
                )}
              </Link>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button onClick={toggleLang} className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all" data-testid="language-toggle">
              <Globe size={12} strokeWidth={1.5} /> {i18n.language.toUpperCase()}
            </button>

            {user ? (
              <>
                <button onClick={handlePushToggle} className="p-2 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all relative" title="Push-Benachrichtigungen" data-testid="push-toggle-btn" style={{display:'none'}}>
                  <Bell size={16} strokeWidth={1.5} />
                  {pushStatus === "active" && <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />}
                </button>

                {/* ── Pending Refunds Bell (studio_owner only) ── */}
                {user.role === "studio_owner" && (
                  <div className="relative" ref={refundsRef}>
                    <button
                      onClick={() => setRefundsOpen(o => !o)}
                      className="p-2 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all relative"
                      data-testid="refunds-bell-btn"
                      title="Rückzahlungen"
                    >
                      <Bell size={16} strokeWidth={1.5} />
                      {pendingRefunds.length > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none animate-pulse">
                          {pendingRefunds.length > 9 ? "9+" : pendingRefunds.length}
                        </span>
                      )}
                    </button>
                    <AnimatePresence>
                      {refundsOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-black/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden z-50"
                          data-testid="refunds-dropdown"
                        >
                          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
                            <span className="text-sm font-inter font-semibold text-zinc-900">Ausstehende Rückzahlungen</span>
                            {pendingRefunds.length > 0 && (
                              <span className="text-xs font-inter font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{pendingRefunds.length}</span>
                            )}
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                            {pendingRefunds.length === 0 ? (
                              <div className="py-8 flex flex-col items-center text-center px-4">
                                <Bell size={22} className="text-zinc-200 mb-2" strokeWidth={1.5} />
                                <p className="text-sm font-inter text-zinc-400">Keine ausstehenden Rückzahlungen</p>
                              </div>
                            ) : (
                              pendingRefunds.map(b => {
                                const deposit = parseFloat(b.offer_deposit_amount || b.deposit_amount || 0);
                                return (
                                  <div key={b.booking_id} className="px-4 py-3 border-b border-zinc-50 last:border-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-inter font-semibold text-zinc-900 truncate">{b.user_name}</p>
                                        <p className="text-xs font-inter text-zinc-500 mt-0.5">
                                          {b.date ? new Date(b.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""}
                                          {b.start_time ? ` · ${b.start_time}` : ""}
                                        </p>
                                        {deposit > 0 && <p className="text-xs font-inter font-semibold text-emerald-700 mt-0.5">€&thinsp;{deposit.toFixed(2)} zurückzahlen</p>}
                                      </div>
                                      <button
                                        onClick={() => handleRefundDeposit(b.booking_id)}
                                        disabled={refundingId === b.booking_id}
                                        className="flex-shrink-0 px-3 py-1.5 bg-zinc-900 text-white text-xs font-inter font-semibold rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50"
                                        data-testid={`nav-refund-btn-${b.booking_id}`}
                                      >
                                        {refundingId === b.booking_id ? (
                                          <span className="flex items-center gap-1"><span className="w-3 h-3 border border-white/50 border-t-transparent rounded-full animate-spin" />...</span>
                                        ) : "Rückzahlen"}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-all text-sm font-inter" data-testid="user-menu-btn">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs font-bold">{user.name?.[0]?.toUpperCase()}</div>
                    )}
                    <span className="hidden sm:block max-w-[100px] truncate text-zinc-700">{user.name?.split(" ")[0]}</span>
                    <ChevronDown size={12} className="text-zinc-400" />
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.96 }} transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-black/[0.06] shadow-card overflow-hidden z-50 py-1">
                        <Link to={dashboardPath} className="flex items-center px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 font-inter" onClick={() => setUserMenuOpen(false)} data-testid="nav-dashboard-link">{t("nav.dashboard")}</Link>
                        {user.role === "admin" && (
                          <Link to="/admin" className="flex items-center px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 font-inter" onClick={() => setUserMenuOpen(false)} data-testid="nav-admin-link">Admin Panel</Link>
                        )}
                        <div className="h-px bg-zinc-100 my-1" />
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-inter" data-testid="nav-logout-btn">{t("nav.logout")}</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-inter text-zinc-600 hover:text-zinc-900 transition-colors" data-testid="nav-login-btn">{t("nav.login")}</Link>
                <Link to="/register?role=studio" className="btn-primary text-sm px-5 py-2" data-testid="nav-register-btn">Als Studio registrieren</Link>
              </div>
            )}

            <button className="md:hidden p-2 rounded-full hover:bg-zinc-100 transition-all" onClick={() => setMobileOpen(!mobileOpen)} data-testid="mobile-menu-btn">
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden border-t border-zinc-100 py-3 space-y-1 overflow-hidden">
              {[
                { to: "/search", label: t("nav.search") },
                ...(user ? [
                  { to: dashboardPath, label: t("nav.dashboard") },
                  { to: "/messages", label: "Nachrichten", badge: countToShow }
                ] : [
                  { to: "/login", label: t("nav.login") },
                  { to: "/register?role=studio", label: "Als Studio registrieren" }
                ]),
              ].map(link => (
                <Link key={link.to} to={link.to} className="block px-3 py-2.5 text-sm font-inter text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl flex items-center justify-between" onClick={() => setMobileOpen(false)}>
                  <span>{link.label}</span>
                  {link.badge > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                      {link.badge > 9 ? "9+" : link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {pushStatus && pushStatus !== "active" && (
        <div className="push-banner">
          {pushStatus === "denied" ? "Benachrichtigungen blockiert – Bitte in Browser-Einstellungen erlauben" : "Benachrichtigungen aktiviert!"}
        </div>
      )}
    </nav>
  );
}
