import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Search, Star, MapPin, ChevronRight, CheckCircle, Sparkles, Calendar } from "lucide-react";

const FEATURED_STUDIOS = [
  {
    studio_id: "studio_demo001",
    name: "Black Needle Studio",
    city: "Berlin",
    avg_rating: 4.8,
    review_count: 124,
    price_range: "premium",
    styles: ["Fine Line", "Blackwork", "Geometric"],
    images: ["https://images.unsplash.com/photo-1753259789341-808371092e19?w=600&q=80"],
    is_verified: true,
    description: "Spezialisiert auf Fine-Line und Blackwork Tattoos im Herzen von Berlin."
  },
  {
    studio_id: "studio_demo002",
    name: "Ink & Soul Hamburg",
    city: "Hamburg",
    avg_rating: 4.6,
    review_count: 89,
    price_range: "medium",
    styles: ["Traditional", "Japanese", "Color"],
    images: ["https://images.unsplash.com/photo-1753259669126-660f46975072?w=600&q=80"],
    is_verified: true,
    description: "Traditional und Neo-Traditional Tattoos mit Soul."
  },
  {
    studio_id: "studio_demo003",
    name: "Realismus Atelier München",
    city: "München",
    avg_rating: 4.9,
    review_count: 67,
    price_range: "luxury",
    styles: ["Realism", "Portrait", "Black & Grey"],
    images: ["https://static.prod-images.emergentagent.com/jobs/fb00eb6e-6246-4f6c-a06b-60ac2c5daad3/images/cf804c7f5972bdc1c3d43b1412ac2a5ede08617136c3cb6cc4242e80caad2940.png"],
    is_verified: true,
    description: "Fotorealistische Portraits und hyperdetaillierte Tattoos."
  }
];

const priceLabels = { budget: "€", medium: "€€", premium: "€€€", luxury: "€€€€" };

export default function LandingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search${searchInput ? `?search=${encodeURIComponent(searchInput)}` : ""}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black text-white min-h-[90vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1753259789341-808371092e19?w=1400&q=80"
            alt="Tattoo Studio"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/20 text-xs font-outfit tracking-widest uppercase mb-8 text-gray-300">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              Premium Tattoo-Buchungsplattform
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-playfair font-bold leading-none mb-6">
              {t("hero.title")}
              <span className="block text-gray-400">wartet.</span>
            </h1>

            <p className="text-lg text-gray-300 font-outfit mb-10 max-w-lg">
              {t("hero.subtitle")} – von Fine Line bis Realism, von Berlin bis München.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-8">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder={t("hero.searchPlaceholder")}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-white font-outfit backdrop-blur-sm"
                  data-testid="hero-search-input"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-4 bg-white text-black font-outfit font-semibold hover:bg-gray-100 transition-colors"
                data-testid="hero-search-btn"
              >
                {t("hero.searchBtn")}
              </button>
            </form>

            {/* Stats */}
            <div className="flex gap-8">
              {[
                { value: "500+", label: t("hero.stats.studios") },
                { value: "12k+", label: t("hero.stats.bookings") },
                { value: "300+", label: t("hero.stats.artists") }
              ].map((stat, i) => (
                <div key={i} data-testid={`stat-${i}`}>
                  <p className="text-2xl font-playfair font-bold">{stat.value}</p>
                  <p className="text-xs text-gray-400 font-outfit uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs tracking-widest uppercase text-gray-400 font-outfit mb-3">So funktioniert es</p>
            <h2 className="text-4xl font-playfair font-bold">In 3 Schritten zum Termin</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Studio finden", desc: "Suche nach Stil, Stadt und Verfügbarkeit. Vergleiche Profile und Bewertungen.", icon: <Search size={24} /> },
              { step: "02", title: "Termin buchen", desc: "Wähle direkt einen freien Slot und buche mit Anzahlung in Sekunden.", icon: <Calendar size={24} /> },
              { step: "03", title: "Tattoo genießen", desc: "Erscheine zum Termin – dein Künstler wartet bereits auf dich.", icon: <CheckCircle size={24} /> }
            ].map((step, i) => (
              <div key={i} className="relative" data-testid={`step-${i}`}>
                <div className="text-5xl font-playfair font-bold text-gray-100 mb-4">{step.step}</div>
                <div className="w-10 h-10 border border-gray-200 flex items-center justify-center text-gray-600 mb-4">{step.icon}</div>
                <h3 className="font-playfair font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 font-outfit text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Studios */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <p className="text-xs tracking-widest uppercase text-gray-400 font-outfit mb-2">Top Studios</p>
              <h2 className="text-4xl font-playfair font-bold">Empfohlene Studios</h2>
            </div>
            <Link to="/search" className="flex items-center gap-2 text-sm font-outfit hover:gap-3 transition-all" data-testid="view-all-studios-btn">
              {t("common.viewAll")} <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED_STUDIOS.map(studio => (
              <div
                key={studio.studio_id}
                className="group bg-white border border-gray-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/studios/${studio.studio_id}`)}
                data-testid={`featured-studio-${studio.studio_id}`}
              >
                <div className="relative h-52 overflow-hidden">
                  <img src={studio.images[0]} alt={studio.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {studio.is_verified && (
                    <div className="absolute top-3 right-3 bg-white/90 px-2 py-1 flex items-center gap-1">
                      <CheckCircle size={10} className="text-black" />
                      <span className="text-xs font-outfit font-semibold">Verifiziert</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-playfair font-bold text-lg">{studio.name}</h3>
                    <span className="text-sm font-bold text-gray-500 font-outfit">{priceLabels[studio.price_range]}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3 text-sm text-gray-500 font-outfit">
                    <span className="flex items-center gap-1"><MapPin size={12} />{studio.city}</span>
                    <span className="flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" />{studio.avg_rating}</span>
                  </div>
                  <p className="text-xs text-gray-500 font-outfit line-clamp-2 mb-3">{studio.description}</p>
                  <div className="flex gap-1 flex-wrap">
                    {studio.styles.map(s => <span key={s} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 font-outfit">{s}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Feature Banner */}
      <section className="py-20 px-6 bg-black text-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/20 text-xs font-outfit tracking-widest uppercase mb-6 text-gray-300">
                <Sparkles size={12} /> KI-Feature
              </div>
              <h2 className="text-4xl font-playfair font-bold mb-4">KI-Stilberater</h2>
              <p className="text-gray-300 font-outfit leading-relaxed mb-8">
                Nicht sicher, welcher Tattoo-Stil zu dir passt? Unser KI-Stilberater analysiert deine Referenzbilder und gibt dir professionelle Empfehlungen.
              </p>
              <Link
                to="/ai-advisor"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-outfit font-medium hover:bg-gray-100 transition-colors"
                data-testid="ai-advisor-cta-btn"
              >
                Jetzt ausprobieren <ChevronRight size={16} />
              </Link>
            </div>
            <div className="relative">
              <img
                src="https://static.prod-images.emergentagent.com/jobs/fb00eb6e-6246-4f6c-a06b-60ac2c5daad3/images/e1125944dcae8af3e2d20f5bca294493ae515f1d80eae1e9fbcd05482c067a20.png"
                alt="AI Tattoo Advisor"
                className="w-full h-72 object-cover opacity-60"
              />
            </div>
          </div>
        </div>
      </section>

      {/* For Studios Banner */}
      {!user && (
        <section className="py-16 px-6 bg-white border-t border-gray-100">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs tracking-widest uppercase text-gray-400 font-outfit mb-3">Für Studios</p>
            <h2 className="text-3xl font-playfair font-bold mb-4">Bist du Tattoo-Artist oder Studio-Inhaber?</h2>
            <p className="text-gray-500 font-outfit mb-8">Verwalte dein Studio, Termine und Kunden – alles an einem Ort.</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-outfit font-medium hover:bg-neutral-800 transition-colors"
              data-testid="studio-register-cta-btn"
            >
              Studio registrieren <ChevronRight size={16} />
            </Link>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
