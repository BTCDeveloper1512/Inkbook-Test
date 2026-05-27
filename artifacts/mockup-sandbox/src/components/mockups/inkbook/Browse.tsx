import { Search, Heart, Star, SlidersHorizontal, Globe, Menu, User, ChevronLeft, ChevronRight } from "lucide-react";

const DOMAIN = "https://90cbaa4c-83f2-48cc-8b6a-12a058981075-00-2g32bywufcl16.riker.replit.dev";

const CATEGORIES = [
  { label: "Alle", emoji: "✦" },
  { label: "Traditional", emoji: "🌹" },
  { label: "Realism", emoji: "🎨" },
  { label: "Minimalist", emoji: "◻" },
  { label: "Blackwork", emoji: "◼" },
  { label: "Neo-Trad", emoji: "🦋" },
  { label: "Watercolor", emoji: "💧" },
  { label: "Geometric", emoji: "△" },
  { label: "Japanisch", emoji: "🌊" },
  { label: "Fine Line", emoji: "✒" },
];

const STUDIOS = [
  {
    id: 1,
    name: "Black Needle Studio",
    city: "Berlin · Mitte",
    rating: 4.97,
    reviews: 312,
    price: 150,
    style: "Traditional · Blackwork",
    saved: false,
    img: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80",
  },
  {
    id: 2,
    name: "Ink & Soul",
    city: "Hamburg · Altona",
    rating: 4.92,
    reviews: 187,
    price: 120,
    style: "Realism · Portrait",
    saved: true,
    img: "https://images.unsplash.com/photo-1590246814883-57c511e72735?w=600&q=80",
  },
  {
    id: 3,
    name: "Realismus Atelier",
    city: "München · Schwabing",
    rating: 4.95,
    reviews: 241,
    price: 180,
    style: "Fine Line · Minimalist",
    saved: false,
    img: "https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=600&q=80",
  },
  {
    id: 4,
    name: "Ink Rebels",
    city: "Köln · Ehrenfeld",
    rating: 4.88,
    reviews: 156,
    price: 140,
    style: "Neo-Trad · Geometric",
    saved: false,
    img: "https://images.unsplash.com/photo-1543332164-6e82f355badc?w=600&q=80",
  },
  {
    id: 5,
    name: "Sacred Lines",
    city: "Frankfurt · Sachsenhausen",
    rating: 4.90,
    reviews: 203,
    price: 160,
    style: "Japanisch · Traditional",
    saved: true,
    img: "https://images.unsplash.com/photo-1565058379802-bbe93b2f703a?w=600&q=80",
  },
  {
    id: 6,
    name: "Ghost Ink Studio",
    city: "Stuttgart · Mitte",
    rating: 4.84,
    reviews: 98,
    price: 130,
    style: "Watercolor · Geometric",
    saved: false,
    img: "https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=600&q=80",
  },
];

function StudioCard({ studio }: { studio: typeof STUDIOS[0] }) {
  return (
    <div className="group cursor-pointer">
      {/* Image */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-3">
        <img
          src={studio.img}
          alt={studio.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <button
          className="absolute top-3 right-3 p-1.5 rounded-full"
          aria-label="Merken"
        >
          <Heart
            size={22}
            className={studio.saved ? "fill-[#FF385C] text-[#FF385C]" : "fill-white/30 text-white drop-shadow"}
            strokeWidth={1.8}
          />
        </button>
      </div>

      {/* Info */}
      <div className="space-y-0.5">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-[15px] text-gray-900 truncate pr-2">{studio.name}</p>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star size={13} className="fill-gray-900 text-gray-900" />
            <span className="text-[13px] font-medium text-gray-900">{studio.rating}</span>
          </div>
        </div>
        <p className="text-gray-500 text-[14px]">{studio.style}</p>
        <p className="text-gray-500 text-[14px]">{studio.city}</p>
        <p className="text-[14px] text-gray-900 pt-1">
          <span className="font-semibold">ab €{studio.price}</span>
          <span className="text-gray-500 font-normal"> / Session</span>
        </p>
      </div>
    </div>
  );
}

export function Browse() {
  return (
    <div className="min-h-screen bg-white font-['Inter',sans-serif]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          {/* Top row */}
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#18181b] flex items-center justify-center">
                <span className="text-white text-sm font-bold font-['Playfair_Display']">I</span>
              </div>
              <span className="text-xl font-bold text-[#18181b] hidden md:block font-['Playfair_Display']">InkBook</span>
            </div>

            {/* Search pill */}
            <button className="flex items-center gap-0 border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-shadow divide-x divide-gray-300 overflow-hidden">
              <span className="px-5 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">Stadt</span>
              <span className="px-5 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">Datum</span>
              <span className="px-5 py-3 text-sm text-gray-400 whitespace-nowrap">Stil</span>
              <div className="px-3 py-2">
                <div className="w-8 h-8 bg-[#FF385C] rounded-full flex items-center justify-center">
                  <Search size={14} className="text-white" strokeWidth={2.5} />
                </div>
              </div>
            </button>

            {/* Right nav */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="hidden md:flex text-sm font-semibold text-gray-800 px-4 py-2.5 rounded-full hover:bg-gray-100 transition-colors whitespace-nowrap">
                Als Studio registrieren
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Globe size={16} className="text-gray-700" />
              </button>
              <button className="flex items-center gap-2.5 border border-gray-300 rounded-full px-3 py-2 hover:shadow-md transition-shadow">
                <Menu size={16} className="text-gray-700" />
                <div className="w-7 h-7 bg-gray-500 rounded-full flex items-center justify-center">
                  <User size={14} className="text-white" />
                </div>
              </button>
            </div>
          </div>

          {/* Category chips row */}
          <div className="flex items-center gap-2 pb-4 overflow-x-auto scrollbar-hide">
            <button className="flex-shrink-0 p-1.5 border border-gray-300 rounded-full hover:border-gray-700 transition-colors">
              <SlidersHorizontal size={16} className="text-gray-700" />
            </button>
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat.label}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                  i === 0
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Results count */}
        <p className="text-sm text-gray-500 mb-6">
          <span className="font-semibold text-gray-900">247 Studios</span> in Deutschland
        </p>

        {/* Studio grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
          {STUDIOS.map((studio) => (
            <StudioCard key={studio.id} studio={studio} />
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-3 mt-16">
          <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-700 transition-colors">
            <ChevronLeft size={18} className="text-gray-700" />
          </button>
          {[1, 2, 3, "...", 12].map((p, i) => (
            <button
              key={i}
              className={`w-10 h-10 rounded-full text-sm font-medium flex items-center justify-center transition-colors ${
                p === 1
                  ? "bg-gray-900 text-white"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {p}
            </button>
          ))}
          <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-700 transition-colors">
            <ChevronRight size={18} className="text-gray-700" />
          </button>
        </div>
      </main>

      {/* ── Footer bar ── */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-6 py-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex gap-4">
          <span>© 2026 InkBook</span>
          <span>·</span>
          <a href="#" className="hover:underline">Datenschutz</a>
          <span>·</span>
          <a href="#" className="hover:underline">AGB</a>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1 font-semibold text-gray-800">
            <Globe size={13} /> Deutsch
          </button>
          <span>·</span>
          <button className="font-semibold text-gray-800">€ EUR</button>
        </div>
      </div>
    </div>
  );
}
