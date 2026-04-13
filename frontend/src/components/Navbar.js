import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Menu, X, Globe, User, ChevronDown } from "lucide-react";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === "de" ? "en" : "de");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const dashboardPath = user?.role === "studio_owner" ? "/studio-dashboard" : "/dashboard";

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" data-testid="nav-logo">
            <div className="w-8 h-8 bg-black flex items-center justify-center">
              <span className="text-white font-bold text-sm font-playfair">I</span>
            </div>
            <span className="text-xl font-bold tracking-tight font-playfair text-black">InkBook</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/search"
              className="text-sm font-medium text-gray-700 hover:text-black transition-colors font-outfit"
              data-testid="nav-search-link"
            >
              {t("nav.search")}
            </Link>
            <Link
              to="/ai-advisor"
              className="text-sm font-medium text-gray-700 hover:text-black transition-colors font-outfit"
              data-testid="nav-ai-link"
            >
              {t("nav.aiAdvisor")}
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-black transition-colors px-2 py-1 border border-gray-200 hover:border-black"
              data-testid="language-toggle"
            >
              <Globe size={12} />
              {i18n.language.toUpperCase()}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 hover:border-black transition-colors text-sm font-outfit"
                  data-testid="user-menu-btn"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:block max-w-24 truncate">{user.name}</span>
                  <ChevronDown size={12} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 shadow-lg z-50">
                    <Link
                      to={dashboardPath}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-outfit"
                      onClick={() => setUserMenuOpen(false)}
                      data-testid="nav-dashboard-link"
                    >
                      {t("nav.dashboard")}
                    </Link>
                    {user.role !== "studio_owner" && (
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-outfit"
                        onClick={() => setUserMenuOpen(false)}
                        data-testid="nav-bookings-link"
                      >
                        {t("nav.myBookings")}
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-outfit"
                      data-testid="nav-logout-btn"
                    >
                      {t("nav.logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-1.5 text-sm font-outfit text-gray-700 hover:text-black border border-gray-200 hover:border-black transition-colors"
                  data-testid="nav-login-btn"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm font-outfit bg-black text-white hover:bg-neutral-800 transition-colors"
                  data-testid="nav-register-btn"
                >
                  {t("nav.register")}
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              data-testid="mobile-menu-btn"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-3">
            <Link to="/search" className="block text-sm font-outfit text-gray-700 py-2" onClick={() => setMobileOpen(false)}>{t("nav.search")}</Link>
            <Link to="/ai-advisor" className="block text-sm font-outfit text-gray-700 py-2" onClick={() => setMobileOpen(false)}>{t("nav.aiAdvisor")}</Link>
            {!user && (
              <>
                <Link to="/login" className="block text-sm font-outfit py-2" onClick={() => setMobileOpen(false)}>{t("nav.login")}</Link>
                <Link to="/register" className="block text-sm font-outfit py-2" onClick={() => setMobileOpen(false)}>{t("nav.register")}</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
