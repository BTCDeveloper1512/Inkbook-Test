import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StudioCard from "../components/StudioCard";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STYLES = ["Fine Line", "Blackwork", "Traditional", "Neo-Traditional", "Japanese", "Realism", "Portrait", "Geometric", "Watercolor", "Tribal", "Minimalist", "Color", "Abstract", "Surrealism", "Illustrative", "Black & Grey"];
const PRICES = ["budget", "medium", "premium", "luxury"];

export default function SearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [city, setCity] = useState("");
  const [style, setStyle] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [minRating, setMinRating] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchStudios = async (overrides = {}) => {
    setLoading(true);
    try {
      const params = {};
      const s = overrides.search !== undefined ? overrides.search : search;
      const c = overrides.city !== undefined ? overrides.city : city;
      const st = overrides.style !== undefined ? overrides.style : style;
      const pr = overrides.priceRange !== undefined ? overrides.priceRange : priceRange;
      const mr = overrides.minRating !== undefined ? overrides.minRating : minRating;
      if (s) params.search = s;
      if (c) params.city = c;
      if (st) params.style = st;
      if (pr) params.price_range = pr;
      if (mr) params.min_rating = mr;
      const { data } = await axios.get(`${API}/studios`, { params });
      setStudios(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudios(); }, [style, priceRange, minRating, city]);

  const handleSearch = (e) => { e.preventDefault(); fetchStudios(); };

  const clearFilters = () => {
    setStyle(""); setPriceRange(""); setMinRating(""); setCity("");
    fetchStudios({ style: "", priceRange: "", minRating: "", city: "" });
  };

  const activeFilters = [style, priceRange, minRating, city].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      {/* Search Header */}
      <div className="bg-white border-b border-zinc-100 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-xs tracking-[0.2em] uppercase text-zinc-400 font-inter mb-2">Tattoo Studios entdecken</p>
            <h1 className="text-4xl md:text-5xl font-playfair font-semibold text-zinc-900 mb-2">Dein perfektes Studio.</h1>
            <p className="text-zinc-400 font-inter text-sm mb-7">Suche, vergleiche und buche Tattoo-Studios in deiner Nähe.</p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" strokeWidth={1.5} />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t("hero.searchPlaceholder")}
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl font-inter text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white focus:ring-4 focus:ring-zinc-100 transition-all"
                  data-testid="search-input"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                className="btn-primary px-6"
                data-testid="search-submit-btn"
              >
                {t("hero.searchBtn")}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Filters Bar */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-inter transition-all duration-200 ${
              showFilters ? "bg-zinc-900 text-white border-zinc-900" : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400"
            }`}
            data-testid="filter-toggle-btn"
          >
            <SlidersHorizontal size={14} strokeWidth={1.5} />
            {t("search.filters")}
            {activeFilters > 0 && (
              <span className="bg-white text-zinc-900 text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold ml-0.5">{activeFilters}</span>
            )}
          </button>

          {activeFilters > 0 && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 font-inter transition-colors" data-testid="clear-filters-btn">
              <X size={13} /> Filter zurücksetzen
            </button>
          )}

          <span className="ml-auto text-sm text-zinc-400 font-inter">
            {loading ? "Suche..." : `${studios.length} Studios gefunden`}
          </span>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-5 bg-white rounded-2xl border border-zinc-100 shadow-[0_4px_16px_rgb(0,0,0,0.04)]">
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">{t("search.city")}</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    onBlur={() => fetchStudios()}
                    placeholder="Berlin, Hamburg..."
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-inter focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition-all"
                    data-testid="city-filter"
                  />
                </div>
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">{t("search.style")}</label>
                  <select
                    value={style}
                    onChange={e => setStyle(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-inter focus:outline-none focus:border-zinc-400 transition-all appearance-none"
                    data-testid="style-filter"
                  >
                    <option value="">{t("search.allStyles")}</option>
                    {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">{t("search.price")}</label>
                  <select
                    value={priceRange}
                    onChange={e => setPriceRange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-inter focus:outline-none focus:border-zinc-400 transition-all appearance-none"
                    data-testid="price-filter"
                  >
                    <option value="">{t("search.allPrices")}</option>
                    {PRICES.map(p => <option key={p} value={p}>{t(`price.${p}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">{t("search.minRating")}</label>
                  <select
                    value={minRating}
                    onChange={e => setMinRating(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-inter focus:outline-none focus:border-zinc-400 transition-all appearance-none"
                    data-testid="rating-filter"
                  >
                    <option value="">Alle</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                    <option value="4.5">4.5+</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-72 bg-zinc-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : studios.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-zinc-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-playfair font-semibold text-zinc-900 mb-2">{t("search.noResults")}</h3>
            <p className="text-zinc-500 font-inter text-sm">Versuche andere Filter oder Suchbegriffe</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="studios-grid"
          >
            {studios.map((studio, i) => (
              <motion.div
                key={studio.studio_id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <StudioCard studio={studio} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
