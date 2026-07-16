import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StudioCard from "../components/StudioCard";
import { useAuth } from "../context/AuthContext";
import {
  Search, SlidersHorizontal, X, MapPin, Palette,
  Star, ChevronDown
} from "lucide-react";
import { getStudiosCache, setStudiosCache, fetchStudios } from "../utils/studiosCache";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;


const RATING_OPTIONS = [
  { value: "4.9", label: "4.9+" },
  { value: "4.8", label: "4.8+" },
  { value: "4.5", label: "4.5+" },
  { value: "4.0", label: "4.0+" },
  { value: "3.5", label: "3.5+" },
  { value: "3.0", label: "3.0+" },
];

function DropPanel({ label, icon, open, onToggle, children }) {
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const [rect, setRect] = useState(null);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      setRect(btnRef.current.getBoundingClientRect());
    }
    onToggle();
  };

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      const clickedBtn = btnRef.current?.contains(e.target);
      const clickedPanel = panelRef.current?.contains(e.target);
      if (!clickedBtn && !clickedPanel) onToggle();
    };
    const handleScroll = () => {
      if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    };
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, onToggle]);

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
          open
            ? "border-zinc-900 bg-zinc-900 text-white"
            : "border-zinc-200 text-zinc-700 hover:border-zinc-400 bg-white"
        }`}
      >
        {icon}
        {label}
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && rect && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            top: rect.bottom + 8,
            left: rect.left,
            zIndex: 9999,
          }}
          className="bg-white border border-zinc-200 rounded-2xl shadow-xl min-w-56 p-4"
        >
          {children}
        </div>
      )}
    </div>
  );
}

function buildFilterData(data) {
  const cities = [...new Set(data.map((s) => s.city).filter(Boolean))].sort();
  const styleCounts = {};
  data.forEach((s) => (s.styles || []).forEach((st) => { styleCounts[st] = (styleCounts[st] || 0) + 1; }));
  const styles = Object.entries(styleCounts).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
  return { cities, styles };
}

export default function SearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initialise from module-level cache → zero loading flash on return visits
  const cached = getStudiosCache();
  const [allStudios, setAllStudios] = useState(cached || null);
  const [loading, setLoading] = useState(!cached);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [city, setCity] = useState("");
  const [activeStyles, setActiveStyles] = useState([]);
  const [minRating, setMinRating] = useState("");
  const [openPanel, setOpenPanel] = useState(null);
  const [filterData, setFilterData] = useState(cached ? buildFilterData(cached) : { cities: [], styles: [] });
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const { user } = useAuth();

  useEffect(() => {
    fetchStudios().then((data) => {
      if (!data) return;
      setStudiosCache(data);
      setAllStudios(data);
      setFilterData(buildFilterData(data));
      setLoading(false);
    });
  }, []);

  // Fetch favorites for logged-in users
  useEffect(() => {
    if (!user) { setFavoriteIds(new Set()); return; }
    axios.get(`${API}/favorites`, { withCredentials: true })
      .then(({ data }) => setFavoriteIds(new Set(data.favorites || [])))
      .catch(() => {});
  }, [user]);

  // PostHog tracking when search params change
  useEffect(() => {
    if (!allStudios || !(search || city || activeStyles.length > 0 || minRating)) return;
    if (window.posthog) {
      window.posthog.capture("search_performed", {
        query: search || null, city: city || null,
        styles: activeStyles.length > 0 ? activeStyles : null,
        min_rating: minRating || null,
      });
    }
  }, [search, city, activeStyles, minRating, allStudios]);

  // Client-side filtering with improved search — instant, zero extra network calls
  const studios = useMemo(() => {
    if (!allStudios) return [];
    return allStudios.filter((s) => {
      if (search) {
        const q = search.toLowerCase().trim();
        const searchableText = [
          s.name,
          s.city,
          s.address,
          s.description,
          ...(s.styles || []),
        ].filter(Boolean).map(f => f.toLowerCase());
        if (!searchableText.some(f => f.includes(q))) return false;
      }
      if (city && s.city?.toLowerCase() !== city.toLowerCase()) return false;
      if (activeStyles.length > 0) {
        const sStyles = (s.styles || []).map((x) => x.toLowerCase());
        if (!activeStyles.some((st) => sStyles.includes(st.toLowerCase()))) return false;
      }
      if (minRating && (s.avg_rating || 0) < parseFloat(minRating)) return false;
      return true;
    }).sort((a, b) => {
      // Relevance: exact name match first, then by rating
      if (search) {
        const q = search.toLowerCase().trim();
        const aNameMatch = a.name?.toLowerCase().startsWith(q) ? 1 : 0;
        const bNameMatch = b.name?.toLowerCase().startsWith(q) ? 1 : 0;
        if (aNameMatch !== bNameMatch) return bNameMatch - aNameMatch;
      }
      return (b.avg_rating || 0) - (a.avg_rating || 0);
    });
  }, [allStudios, search, city, activeStyles, minRating]);

  const toggleStyle = (s) => {
    setActiveStyles((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const toggle = (name) => setOpenPanel((p) => (p === name ? null : name));

  const clearAll = () => {
    setCity(""); setActiveStyles([]); setMinRating(""); setSearch("");
  };

  const activeCount = [city, minRating].filter(Boolean).length + activeStyles.length;

  const handleFavoriteToggle = (studioId, isFav) => {
    setFavoriteIds(prev => {
      const next = new Set(prev);
      isFav ? next.add(studioId) : next.delete(studioId);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Search hero ── */}
      <div className="bg-white border-b border-zinc-100 py-10 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-[0.2em] uppercase text-zinc-400 font-inter mb-2">
            Tattoo Studios entdecken
          </p>
          <h1 className="text-4xl md:text-5xl font-playfair font-semibold text-zinc-900 mb-6">
            Dein perfektes Studio.
          </h1>

          {/* Search pill — live as-you-type */}
          <div className="inline-flex items-center rounded-full border border-zinc-200 shadow-md hover:shadow-lg transition-shadow overflow-hidden bg-white max-w-lg w-full">
            <Search size={15} className="ml-5 text-zinc-400 shrink-0" strokeWidth={2} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Studioname, Stil oder Stadt..."
              className="flex-1 px-4 py-3.5 text-sm text-zinc-700 placeholder-zinc-400 outline-none bg-transparent"
            />
            {search && (
              <button onClick={() => setSearch("")} className="mr-3 text-zinc-400 hover:text-zinc-700 transition-colors shrink-0">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="sticky top-[65px] z-30 bg-white border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 overflow-x-auto">
          {/* City */}
          <DropPanel
            label={city || "Stadt"}
            icon={<MapPin size={13} />}
            open={openPanel === "city"}
            onToggle={() => toggle("city")}
          >
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Stadt</p>
            <button
              onClick={() => { setCity(""); setOpenPanel(null); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors mb-1 ${
                !city ? "bg-zinc-900 text-white font-semibold" : "hover:bg-zinc-50 text-zinc-700"
              }`}
            >
              Alle Städte
            </button>
            {filterData.cities.map((c) => (
              <button
                key={c}
                onClick={() => { setCity(c); setOpenPanel(null); }}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                  city === c ? "bg-zinc-900 text-white font-semibold" : "hover:bg-zinc-50 text-zinc-700"
                }`}
              >
                {c}
              </button>
            ))}
          </DropPanel>

          {/* Style */}
          <DropPanel
            label={activeStyles.length > 0 ? `Stil (${activeStyles.length})` : "Stil"}
            icon={<Palette size={13} />}
            open={openPanel === "style"}
            onToggle={() => toggle("style")}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tätowierstil</p>
              {activeStyles.length > 0 && (
                <button onClick={() => setActiveStyles([])} className="text-xs font-semibold text-zinc-900 underline">
                  Löschen
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5 w-72">
              {filterData.styles.map((s) => (
                <button
                  key={s.label}
                  onClick={() => toggleStyle(s.label)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition-all ${
                    activeStyles.includes(s.label)
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-700 hover:border-zinc-400"
                  }`}
                >
                  <span className="font-medium">{s.label}</span>
                  <span className="text-[10px] opacity-50">{s.count}</span>
                </button>
              ))}
            </div>
          </DropPanel>

          {/* Rating */}
          <DropPanel
            label={minRating ? `${minRating}+ ★` : "Bewertung"}
            icon={<Star size={13} />}
            open={openPanel === "rating"}
            onToggle={() => toggle("rating")}
          >
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
              Mindestbewertung
            </p>
            <button
              onClick={() => { setMinRating(""); setOpenPanel(null); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm mb-1 transition-colors ${
                !minRating ? "bg-zinc-900 text-white font-semibold" : "hover:bg-zinc-50 text-zinc-700"
              }`}
            >
              Alle
            </button>
            {RATING_OPTIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => { setMinRating(r.value); setOpenPanel(null); }}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm flex items-center gap-2 transition-colors ${
                  minRating === r.value ? "bg-zinc-900 text-white" : "hover:bg-zinc-50 text-zinc-700"
                }`}
              >
                <Star size={11} className={minRating === r.value ? "fill-white text-white" : "fill-zinc-800 text-zinc-800"} />
                {r.label}
              </button>
            ))}
          </DropPanel>

          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full border border-zinc-200 text-xs font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <X size={11} />
              Filter löschen
            </button>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {(activeStyles.length > 0 || city || minRating) && (
        <div className="max-w-7xl mx-auto px-6 pt-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-400">Filter:</span>
          {city && (
            <span className="flex items-center gap-1.5 bg-zinc-900 text-white text-xs font-medium px-3 py-1.5 rounded-full">
              {city}
              <button onClick={() => setCity("")}><X size={10} /></button>
            </span>
          )}
          {activeStyles.map((s) => (
            <span key={s} className="flex items-center gap-1.5 bg-zinc-900 text-white text-xs font-medium px-3 py-1.5 rounded-full">
              {s}
              <button onClick={() => toggleStyle(s)}><X size={10} /></button>
            </span>
          ))}
          {minRating && (
            <span className="flex items-center gap-1.5 bg-zinc-900 text-white text-xs font-medium px-3 py-1.5 rounded-full">
              {minRating}+ ★
              <button onClick={() => setMinRating("")}><X size={10} /></button>
            </span>
          )}
          <button onClick={clearAll} className="text-xs text-zinc-400 hover:text-zinc-700 underline">
            Alle löschen
          </button>
        </div>
      )}

      {/* ── Results ── */}
      <main className="max-w-7xl mx-auto px-6 py-8 pb-20">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-zinc-500">
            {loading ? (
              <span>Suche läuft…</span>
            ) : (
              <>
                <span className="font-semibold text-zinc-900">{studios.length} Studios</span> gefunden
                {city && <span className="text-zinc-400"> in {city}</span>}
              </>
            )}
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative flex items-center justify-center">
              <svg className="animate-spin" width="52" height="52" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="22" stroke="#e4e4e7" strokeWidth="3" />
                <path d="M26 4a22 22 0 0 1 22 22" stroke="#18181b" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span className="absolute font-playfair font-semibold text-zinc-900 text-[11px] tracking-tight select-none">OS</span>
            </div>
            <p className="text-sm font-inter text-zinc-400">Studios werden geladen…</p>
          </div>
        ) : studios.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center py-24"
          >
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-zinc-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-playfair font-semibold text-zinc-900 mb-2">
              {t("search.noResults")}
            </h3>
            <p className="text-zinc-500 font-inter text-sm">
              Versuche andere Filter oder Suchbegriffe
            </p>
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="mt-4 px-6 py-2.5 border border-zinc-300 rounded-xl text-sm font-semibold text-zinc-700 hover:border-zinc-500 transition-colors"
              >
                Filter zurücksetzen
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key={`${search}-${city}-${activeStyles.join()}-${minRating}`}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10"
          >
            {studios.map((studio, i) => (
              <motion.div
                key={studio.studio_id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: Math.min(i * 0.07, 0.5),
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <StudioCard
                  studio={studio}
                  index={i}
                  favorited={favoriteIds.has(studio.studio_id)}
                  onToggleFavorite={handleFavoriteToggle}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
