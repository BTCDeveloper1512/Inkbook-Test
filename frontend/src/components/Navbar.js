import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Menu, X, Globe, ChevronDown, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getPushPermission, registerPushNotifications } from "../utils/pushNotifications";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState("");

  const toggleLang = () => i18n.changeLanguage(i18n.language === "de" ? "en" : "de");
  const handleLogout = async () => { await logout(); navigate("/"); setUserMenuOpen(false); };
  const dashboardPath = user?.role === "studio_owner" ? "/studio-dashboard" : user?.role === "admin" ? "/admin" : "/dashboard";

  const handlePushToggle = async () => {
    const permission = await getPushPermission();
    if (permission === 'granted') { setPushStatus("active"); return; }
    const result = await registerPushNotifications();
    setPushStatus(result.success ? "active" : "denied");
    setTimeout(() => setPushStatus(""), 3000);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="flex items-center justify-between h-[60px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" data-testid="nav-logo">
            <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center shadow-soft group-hover:shadow-btn transition-all duration-300">
              <span className="text-white font-playfair font-bold text-sm">I</span>
            </div>
            <span className="text-lg font-playfair font-semibold tracking-tight text-zinc-900">InkBook</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {[
            { to: "/", label: t("nav.search") },
              { to: "/ai-advisor", label: t("nav.aiAdvisor") },
              ...(user ? [{ to: "/messages", label: t("nav.messages") }] : [])
            ].map(link => (
              <Link key={link.to} to={link.to} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full font-inter transition-all duration-200" data-testid={`nav-${link.to.slice(1)}-link`}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button onClick={toggleLang} className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all" data-testid="language-toggle">
              <Globe size={12} strokeWidth={1.5} /> {i18n.language.toUpperCase()}
            </button>

            {user ? (
              <>
                <button onClick={handlePushToggle} className="p-2 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all relative" title="Push-Benachrichtigungen" data-testid="push-toggle-btn">
                  <Bell size={16} strokeWidth={1.5} />
                  {pushStatus === "active" && <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>}
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
                        {user.role === "admin" && <Link to="/admin" className="flex items-center px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 font-inter" onClick={() => setUserMenuOpen(false)} data-testid="nav-admin-link">Admin Panel</Link>}
                        <div className="h-px bg-zinc-100 my-1" />
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-inter" data-testid="nav-logout-btn">{t("nav.logout")}</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
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
                { to: "/", label: t("nav.search") },
                { to: "/ai-advisor", label: t("nav.aiAdvisor") },
                ...(user ? [{ to: "/messages", label: t("nav.messages") }, { to: dashboardPath, label: t("nav.dashboard") }] : [
                  { to: "/login", label: t("nav.login") },
                  { to: "/register", label: t("nav.register") }
                ])
              ].map(link => (
                <Link key={link.to} to={link.to} className="block px-3 py-2.5 text-sm font-inter text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl" onClick={() => setMobileOpen(false)}>{link.label}</Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Push notification feedback */}
      {pushStatus && pushStatus !== "active" && (
        <div className="push-banner">
          {pushStatus === "denied" ? "Benachrichtigungen blockiert – Bitte in Browser-Einstellungen erlauben" : "Benachrichtigungen aktiviert!"}
        </div>
      )}
    </nav>
  );
}
