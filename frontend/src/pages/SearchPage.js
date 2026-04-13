import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StudioCard from "../components/StudioCard";
import { Search, SlidersHorizontal, X } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STYLES = ["Fine Line", "Blackwork", "Traditional", "Neo-Traditional", "Japanese", "Realism", "Portrait", "Geometric", "Watercolor", "Tribal", "Minimalist", "Color", "Abstract", "Surrealism", "Illustrative", "Black & Grey"];
const PRICES = ["budget", "medium", "premium", "luxury"];

export default function SearchPage() {
  const { t } = useTranslation();
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [style, setStyle] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [minRating, setMinRating] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchStudios = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (city) params.city = city;
      if (style) params.style = style;
      if (priceRange) params.price_range = priceRange;
      if (minRating) params.min_rating = minRating;
      const { data } = await axios.get(`${API}/studios`, { params });
      setStudios(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudios();
  }, [style, priceRange, minRating, city]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStudios();
  };

  const clearFilters = () => {
    setStyle(""); setPriceRange(""); setMinRating(""); setCity(""); setSearch("");
  };

  const activeFilters = [style, priceRange, minRating, city].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Search Header */}
      <div className="bg-black text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-playfair font-bold mb-6">{t("search.title")}</h1>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t("hero.searchPlaceholder")}
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-white font-outfit"
                data-testid="search-input"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-4 bg-white text-black font-outfit font-medium hover:bg-gray-100 transition-colors"
              data-testid="search-submit-btn"
            >
              {t("hero.searchBtn")}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Filters Bar */}
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border text-sm font-outfit transition-colors ${showFilters ? "bg-black text-white border-black" : "border-gray-300 hover:border-black"}`}
            data-testid="filter-toggle-btn"
          >
            <SlidersHorizontal size={14} />
            {t("search.filters")}
            {activeFilters > 0 && <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{activeFilters}</span>}
          </button>

          {activeFilters > 0 && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-500 hover:text-black font-outfit" data-testid="clear-filters-btn">
              <X size={14} /> Filter zurücksetzen
            </button>
          )}

          <span className="ml-auto text-sm text-gray-500 font-outfit">
            {studios.length} Studios gefunden
          </span>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-6 bg-gray-50 border border-gray-200">
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">{t("search.city")}</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                onBlur={fetchStudios}
                placeholder="Berlin, Hamburg..."
                className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit"
                data-testid="city-filter"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">{t("search.style")}</label>
              <select
                value={style}
                onChange={e => setStyle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit bg-white"
                data-testid="style-filter"
              >
                <option value="">{t("search.allStyles")}</option>
                {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">{t("search.price")}</label>
              <select
                value={priceRange}
                onChange={e => setPriceRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit bg-white"
                data-testid="price-filter"
              >
                <option value="">{t("search.allPrices")}</option>
                {PRICES.map(p => <option key={p} value={p}>{t(`price.${p}`)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2 font-outfit">{t("search.minRating")}</label>
              <select
                value={minRating}
                onChange={e => setMinRating(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit bg-white"
                data-testid="rating-filter"
              >
                <option value="">Alle</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="4.5">4.5+</option>
              </select>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-80 bg-gray-100 animate-pulse"></div>
            ))}
          </div>
        ) : studios.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <h3 className="text-xl font-playfair mb-2">{t("search.noResults")}</h3>
            <p className="text-gray-500 font-outfit text-sm">Versuche andere Filter oder Suchbegriffe</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="studios-grid">
            {studios.map(studio => (
              <StudioCard key={studio.studio_id} studio={studio} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
