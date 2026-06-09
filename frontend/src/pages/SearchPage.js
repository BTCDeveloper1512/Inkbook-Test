import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StudioCard from "../components/StudioCard";
import {
  Search, SlidersHorizontal, X, MapPin, Calendar, Palette,
  Star, ChevronDown
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;


const PRICE_OPTIONS = [
  { value: "budget", label: "Bis €100", sub: "Einstiegspreise" },
  { value: "medium", label: "€100 – €200", sub: "Mittleres Segment" },
  { value: "premium", label: "€200 – €400", sub: "Gehobene Studios" },
  { value: "luxury", label: "Ab €400", sub: "Premium" },
];

const RATING_OPTIONS = [
  { value: "4.9", label: "4.9+" },
  { value: "4.8", label: "4.8+" },
  { value: "4.5", label: "4.5+" },
  { value: "4.0", label: "4.0+" },
  { value: "3.5", label: "3.5+" },
  { value: "3.0", label: "3.0+" },
];

const AVAIL_OPTIONS = ["Diese Woche", "Nächste Woche", "Diesen Monat", "Flexible Termine"];

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

export default function SearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(searchParams.get("search") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [city, setCity] = useState("");
  const [activeStyles, setActiveStyles] = useState([]);
  const [priceRange, setPriceRange] = useState("");
  const [minRating, setMinRating] = useState("");
  const [openPanel, setOpenPanel] = useState(null);
  const [sortBy, setSortBy] = useState("recommended");
  const [filterData, setFilterData] = useState({ cities: [], styles: [] });

  // Populate filter options from all studios on mount
  useEffect(() => {
    axios.get(`${API}/studios`).then(({ data }) => {
      const cities = [...new Set(data.map((s) => s.city).filter(Boolean))].sort();
      const styleCounts = {};
      data.forEach((s) =>
        (s.styles || []).forEach((st) => {
          styleCounts[st] = (styleCounts[st] || 0) + 1;
        })
      );
      const styles = Object.entries(styleCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({ label, count }));
      setFilterData({ cities, styles });
    }).catch(() => {});
  }, []);

  // Single effect — re-runs whenever any filter changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (city) params.city = city;
    if (activeStyles.length > 0) params.style = activeStyles[0];
    if (priceRange) params.price_range = priceRange;
    if (minRating) params.min_rating = minRating;
    axios.get(`${API}/studios`, { params })
      .then(({ data }) => { if (!cancelled) setStudios(data); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [search, city, activeStyles, priceRange, minRating]);

  const toggleStyle = (s) => {
    setActiveStyles((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const toggle = (name) => setOpenPanel((p) => (p === name ? null : name));

  const clearAll = () => {
    setCity(""); setActiveStyles([]); setPriceRange(""); setMinRating("");
    setSearch(""); setInputValue("");
  };

  const activeCount = [city, priceRange, minRating].filter(Boolean).length + activeStyles.length;

  const sortedStudios = [...studios].sort((a, b) => {
    if (sortBy === "rating") return (b.avg_rating || 0) - (a.avg_rating || 0);
    if (sortBy === "price_asc") return (a.starting_price || 0) - (b.starting_price || 0);
    if (sortBy === "price_desc") return (b.starting_price || 0) - (a.starting_price || 0);
    return 0;
  });

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

          {/* Search pill */}
          <div className="inline-flex items-center rounded-full border border-zinc-200 shadow-md hover:shadow-lg transition-shadow overflow-hidden bg-white">
            <span className="flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold text-zinc-700 border-r border-zinc-100">
              <MapPin size={14} className="text-zinc-400" />
              {city || "Stadt"}
            </span>
            <span className="flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold text-zinc-700 border-r border-zinc-100">
              <Calendar size={14} className="text-zinc-400" />
              Datum
            </span>
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setSearch(inputValue)}
              placeholder="Stil oder Studio..."
              className="px-5 py-3.5 text-sm text-zinc-500 placeholder-zinc-400 outline-none bg-transparent min-w-36"
            />
            <button
              onClick={() => setSearch(inputValue)}
              className="m-1.5 w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors shrink-0"
            >
              <Search size={15} className="text-white" strokeWidth={2.5} />
            </button>
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
                <button
                  onClick={() => setActiveStyles([])}
                  className="text-xs font-semibold text-zinc-900 underline"
                >
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

          {/* Price */}
          <DropPanel
            label={priceRange ? PRICE_OPTIONS.find((p) => p.value === priceRange)?.label : "Preis"}
            icon={<span className="text-xs font-bold">€</span>}
            open={openPanel === "price"}
            onToggle={() => toggle("price")}
          >
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Startpreis</p>
            <button
              onClick={() => { setPriceRange(""); setOpenPanel(null); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm mb-1 transition-colors ${
                !priceRange ? "bg-zinc-900 text-white font-semibold" : "hover:bg-zinc-50 text-zinc-700"
              }`}
            >
              Alle Preise
            </button>
            {PRICE_OPTIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => { setPriceRange(p.value); setOpenPanel(null); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors ${
                  priceRange === p.value ? "bg-zinc-900 text-white" : ""
                }`}
              >
                <p className="text-sm font-semibold text-inherit">{p.label}</p>
                <p className="text-xs text-zinc-400">{p.sub}</p>
              </button>
            ))}
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

          {/* Availability (UI only for now) */}
          <DropPanel
            label="Verfügbarkeit"
            icon={<Calendar size={13} />}
            open={openPanel === "avail"}
            onToggle={() => toggle("avail")}
          >
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Termin</p>
            {AVAIL_OPTIONS.map((a) => (
              <button
                key={a}
                onClick={() => setOpenPanel(null)}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-50 text-sm text-zinc-700 transition-colors"
              >
                {a}
              </button>
            ))}
          </DropPanel>

          {/* All filters / clear */}
          <button
            onClick={() => toggle("all")}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border border-zinc-200 text-sm font-medium text-zinc-700 hover:border-zinc-500 transition-colors"
          >
            <SlidersHorizontal size={13} />
            Alle Filter
            {activeCount > 0 && (
              <span className="bg-zinc-900 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {(activeStyles.length > 0 || city || priceRange || minRating) && (
        <div className="max-w-7xl mx-auto px-6 pt-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-400">Filter:</span>
          {city && (
            <span className="flex items-center gap-1.5 bg-zinc-900 text-white text-xs font-medium px-3 py-1.5 rounded-full">
              {city}
              <button onClick={() => setCity("")}>
                <X size={10} />
              </button>
            </span>
          )}
          {activeStyles.map((s) => (
            <span key={s} className="flex items-center gap-1.5 bg-zinc-900 text-white text-xs font-medium px-3 py-1.5 rounded-full">
              {s}
              <button onClick={() => toggleStyle(s)}><X size={10} /></button>
            </span>
          ))}
          {priceRange && (
            <span className="flex items-center gap-1.5 bg-zinc-900 text-white text-xs font-medium px-3 py-1.5 rounded-full">
              {PRICE_OPTIONS.find((p) => p.value === priceRange)?.label}
              <button onClick={() => setPriceRange("")}>
                <X size={10} />
              </button>
            </span>
          )}
          {minRating && (
            <span className="flex items-center gap-1.5 bg-zinc-900 text-white text-xs font-medium px-3 py-1.5 rounded-full">
              {minRating}+ ★
              <button onClick={() => setMinRating("")}>
                <X size={10} />
              </button>
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
                <span className="font-semibold text-zinc-900">{sortedStudios.length} Studios</span> gefunden
                {city && <span className="text-zinc-400"> in {city}</span>}
              </>
            )}
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs border border-zinc-200 rounded-xl px-3 py-2 text-zinc-600 outline-none focus:border-zinc-400 font-inter"
          >
            <option value="recommended">Empfohlen</option>
            <option value="rating">Beste Bewertung</option>
            <option value="price_asc">Niedrigster Preis</option>
            <option value="price_desc">Höchster Preis</option>
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[4/3] bg-zinc-100 rounded-2xl animate-pulse" />
                <div className="h-4 bg-zinc-100 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-zinc-100 rounded animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        ) : sortedStudios.length === 0 ? (
          <div className="text-center py-24">
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
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {sortedStudios.map((studio, i) => (
              <StudioCard key={studio.studio_id} studio={studio} index={i} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
