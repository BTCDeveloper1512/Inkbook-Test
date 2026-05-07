import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Menu, X, Globe, ChevronDown, Bell, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getPushPermission, registerPushNotifications } from "../utils/pushNotifications";
import axios from "axios";
import BlurText from "./BlurText/BlurText";

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
  const pollRef = useRef(null);

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

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    fetchUnreadCount();
    if (location.pathname.startsWith("/messages")) setUnreadCount(0);
    pollRef.current = setInterval(fetchUnreadCount, 8000);
    return () => clearInterval(pollRef.current);
  }, [user, location.pathname]);

  const isMessagesPage = location.pathname.startsWith("/messages");
  const countToShow = isMessagesPage ? 0 : unreadCount;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="flex items-center justify-between h-[60px]">
          {/* Logo – nur Schriftzug mit BlurText */}
          <Link to="/" className="flex items-center" data-testid="nav-logo">
            <BlurText
              text="InkBook"
              animateBy="characters"
              direction="top"
              delay={60}
              stepDuration={0.32}
              className="text-xl font-playfair font-semibold tracking-tight text-zinc-900 select-none"
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { to: "/search", label: t("nav.search") },
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full font-inter transition-all duration-200"
                data-testid={`nav-${link.to.replace("/", "") || "home"}-link`}
              >
                {link.label}
              </Link>
            ))}

            {user && (
              <Link
                to="/messages"
                className="relative px-4 py-2 text-sm text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full font-inter transition-all duration-200 flex items-center gap-1.5"
                data-testid="nav-messages-link"
              >
                {t("nav.messages")}
                <AnimatePresence>
                  {countToShow > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="text-[10px] text-emerald-600 font-inter font-semibold"
                      data-testid="unread-badge"
                    >
                      {countToShow === 1 ? "Neue Nachricht" : "Neue Nachrichten"}
                    </motion.span>
                  )}
                </AnimatePresence>
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
                <Link to="/messages" className="md:hidden relative p-2 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all" data-testid="mobile-messages-btn">
                  <MessageSquare size={18} strokeWidth={1.5} />
                  {countToShow > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse" data-testid="mobile-unread-badge" />
                  )}
                </Link>

                <button onClick={handlePushToggle} className="p-2 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all relative" title="Push-Benachrichtigungen" data-testid="push-toggle-btn" style={{display:'none'}}>
                  <Bell size={16} strokeWidth={1.5} />
                  {pushStatus === "active" && <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />}
                </button>

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
                        <Link to="/messages" className="flex items-center justify-between px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 font-inter" onClick={() => setUserMenuOpen(false)} data-testid="nav-messages-dropdown-link">
                          <span>{t("nav.messages")}</span>
                          {countToShow > 0 && (
                            <span className="text-[10px] text-emerald-600 font-inter font-semibold" data-testid="dropdown-unread-badge">
                              {countToShow === 1 ? "Neue Nachricht" : "Neue Nachrichten"}
                            </span>
                          )}
                        </Link>
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
                <Link to="/register" className="btn-primary text-sm px-5 py-2" data-testid="nav-register-btn">{t("nav.register")}</Link>
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
                ...(user ? [{ to: dashboardPath, label: t("nav.dashboard") }] : [
                  { to: "/login", label: t("nav.login") },
                  { to: "/register", label: t("nav.register") }
                ])
              ].map(link => (
                <Link key={link.to} to={link.to} className="block px-3 py-2.5 text-sm font-inter text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl" onClick={() => setMobileOpen(false)}>
                  {link.label}
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
