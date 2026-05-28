import { Search, Heart, Star, SlidersHorizontal, Globe, ChevronDown, X, MapPin, Calendar, Palette } from "lucide-react";
import { useState } from "react";

const STYLES = [
  { label: "Traditional", count: 48 },
  { label: "Realism", count: 61 },
  { label: "Minimalist", count: 73 },
  { label: "Blackwork", count: 55 },
  { label: "Neo-Traditional", count: 34 },
  { label: "Watercolor", count: 29 },
  { label: "Geometric", count: 41 },
  { label: "Japanisch", count: 38 },
  { label: "Fine Line", count: 67 },
  { label: "Lettering", count: 22 },
  { label: "Tribal", count: 18 },
  { label: "Illustrativ", count: 45 },
];

const CITIES = ["Alle Städte", "Berlin", "Hamburg", "München", "Köln", "Frankfurt", "Stuttgart", "Düsseldorf"];

const STUDIOS = [
  {
    id: 1,
    name: "Black Needle Studio",
    city: "Berlin",
    district: "Mitte",
    rating: 4.97,
    reviews: 312,
    price: 150,
    styles: ["Traditional", "Blackwork"],
    saved: false,
    img: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80",
  },
  {
    id: 2,
    name: "Ink & Soul",
    city: "Hamburg",
    district: "Altona",
    rating: 4.92,
    reviews: 187,
    price: 120,
    styles: ["Realism", "Portrait"],
    saved: true,
    img: "https://images.unsplash.com/photo-1590246814883-57c511e72735?w=600&q=80",
  },
  {
    id: 3,
    name: "Realismus Atelier",
    city: "München",
    district: "Schwabing",
    rating: 4.95,
    reviews: 241,
    price: 180,
    styles: ["Fine Line", "Minimalist"],
    saved: false,
    img: "https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=600&q=80",
  },
  {
    id: 4,
    name: "Ink Rebels",
    city: "Köln",
    district: "Ehrenfeld",
    rating: 4.88,
    reviews: 156,
    price: 140,
    styles: ["Neo-Traditional", "Geometric"],
    saved: false,
    img: "https://images.unsplash.com/photo-1543332164-6e82f355badc?w=600&q=80",
  },
  {
    id: 5,
    name: "Sacred Lines",
    city: "Frankfurt",
    district: "Sachsenhausen",
    rating: 4.90,
    reviews: 203,
    price: 160,
    styles: ["Japanisch", "Traditional"],
    saved: true,
    img: "https://images.unsplash.com/photo-1565058379802-bbe93b2f703a?w=600&q=80",
  },
  {
    id: 6,
    name: "Ghost Ink Studio",
    city: "Stuttgart",
    district: "Mitte",
    rating: 4.84,
    reviews: 98,
    price: 130,
    styles: ["Watercolor", "Illustrativ"],
    saved: false,
    img: "https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=600&q=80",
  },
];

function StudioCard({ studio }: { studio: typeof STUDIOS[0] }) {
  const [saved, setSaved] = useState(studio.saved);
  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 mb-3" style={{ aspectRatio: "4/3" }}>
        <img
          src={studio.img}
          alt={studio.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <button
          onClick={(e) => { e.stopPropagation(); setSaved(!saved); }}
          className="absolute top-3 right-3 p-1.5 rounded-full"
        >
          <Heart
            size={20}
            className={saved ? "fill-gray-900 text-gray-900" : "fill-white/40 text-white drop-shadow-sm"}
            strokeWidth={1.8}
          />
        </button>
        <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
          {studio.styles.map((s) => (
            <span key={s} className="bg-white/90 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full">
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-0.5">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm text-gray-900 truncate pr-2">{studio.name}</p>
          <div className="flex items-center gap-1 shrink-0">
            <Star size={12} className="fill-gray-900 text-gray-900" />
            <span className="text-xs font-medium text-gray-900">{studio.rating}</span>
            <span className="text-xs text-gray-400">({studio.reviews})</span>
          </div>
        </div>
        <p className="text-gray-400 text-xs">{studio.city} · {studio.district}</p>
        <p className="text-sm text-gray-900 pt-1 font-semibold">ab €{studio.price}</p>
      </div>
    </div>
  );
}

function DropPanel({ label, icon, open, onToggle, children }: {
  label: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative shrink-0">
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
          open ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:border-gray-400 bg-white"
        }`}
      >
        {icon}
        {label}
        <ChevronDown size={13} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>
      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl min-w-56 p-4">
          {children}
        </div>
      )}
    </div>
  );
}

export function Browse() {
  const [activeCity, setActiveCity] = useState("Alle Städte");
  const [activeStyles, setActiveStyles] = useState<string[]>([]);
  const [openPanel, setOpenPanel] = useState<string | null>(null);

  const toggleStyle = (s: string) =>
    setActiveStyles((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const toggle = (name: string) => setOpenPanel((p) => p === name ? null : name);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-8">
          {/* Top row */}
          <div className="flex items-center justify-between h-16 gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                <span className="text-white text-xs font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>I</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden md:block" style={{ fontFamily: "'Playfair Display', serif" }}>InkBook</span>
            </div>

            {/* Search pill */}
            <button className="flex items-center rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              <span className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-gray-700 border-r border-gray-100 hover:bg-gray-50">
                <MapPin size={12} className="text-gray-400" />Stadt
              </span>
              <span className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-gray-700 border-r border-gray-100 hover:bg-gray-50">
                <Calendar size={12} className="text-gray-400" />Datum
              </span>
              <span className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-gray-400 hover:bg-gray-50">
                <Palette size={12} />Stil
              </span>
              <div className="px-2.5 py-2">
                <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <Search size={13} className="text-white" strokeWidth={2.5} />
                </div>
              </div>
            </button>

            {/* Right */}
            <div className="flex items-center gap-1 shrink-0">
              <button className="hidden lg:block text-xs font-semibold text-gray-600 px-4 py-2.5 rounded-full hover:bg-gray-50 transition-colors whitespace-nowrap">
                Studio eintragen
              </button>
              <button className="p-2.5 rounded-full hover:bg-gray-50 transition-colors">
                <Globe size={15} className="text-gray-500" />
              </button>
              <button className="flex items-center gap-2 border border-gray-200 rounded-full px-3 py-2 hover:shadow-md transition-shadow ml-1">
                <div className="flex flex-col gap-[3px]">
                  <div className="w-3 h-px bg-gray-600 rounded" />
                  <div className="w-3 h-px bg-gray-600 rounded" />
                  <div className="w-3 h-px bg-gray-600 rounded" />
                </div>
                <div className="w-7 h-7 bg-gray-200 rounded-full" />
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-2 pb-4 overflow-x-auto">
            {/* City */}
            <DropPanel label={activeCity} icon={<MapPin size={12} />} open={openPanel === "city"} onToggle={() => toggle("city")}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Stadt</p>
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => { setActiveCity(c); setOpenPanel(null); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                    activeCity === c ? "bg-gray-900 text-white font-semibold" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {c}
                </button>
              ))}
            </DropPanel>

            {/* Style */}
            <DropPanel
              label={activeStyles.length > 0 ? `Stil (${activeStyles.length})` : "Stil"}
              icon={<Palette size={12} />}
              open={openPanel === "style"}
              onToggle={() => toggle("style")}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tätowierstil</p>
                {activeStyles.length > 0 && (
                  <button onClick={() => setActiveStyles([])} className="text-xs font-semibold text-gray-900 underline">
                    Löschen
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5 w-72">
                {STYLES.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => toggleStyle(s.label)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition-all ${
                      activeStyles.includes(s.label)
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <span className="font-medium">{s.label}</span>
                    <span className={activeStyles.includes(s.label) ? "text-gray-400 text-[10px]" : "text-gray-400 text-[10px]"}>{s.count}</span>
                  </button>
                ))}
              </div>
            </DropPanel>

            {/* Price */}
            <DropPanel label="Preis" icon={<span className="text-xs font-bold">€</span>} open={openPanel === "price"} onToggle={() => toggle("price")}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Startpreis</p>
              {[
                { label: "Bis €100", sub: "Einstiegspreise" },
                { label: "€100 – €200", sub: "Mittleres Segment" },
                { label: "€200 – €400", sub: "Gehobene Studios" },
                { label: "Ab €400", sub: "Premium" },
              ].map((p) => (
                <button key={p.label} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <p className="text-sm font-semibold text-gray-800">{p.label}</p>
                  <p className="text-xs text-gray-400">{p.sub}</p>
                </button>
              ))}
            </DropPanel>

            {/* Rating */}
            <DropPanel label="Bewertung" icon={<Star size={12} />} open={openPanel === "rating"} onToggle={() => toggle("rating")}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Mindestbewertung</p>
              {["Alle", "4.0+", "4.5+", "4.8+", "4.9+"].map((r) => (
                <button key={r} className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50 text-sm text-gray-700 transition-colors flex items-center gap-2">
                  {r !== "Alle" && <Star size={11} className="fill-gray-800 text-gray-800" />}
                  {r}
                </button>
              ))}
            </DropPanel>

            {/* Availability */}
            <DropPanel label="Verfügbarkeit" icon={<Calendar size={12} />} open={openPanel === "avail"} onToggle={() => toggle("avail")}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Termin</p>
              {["Diese Woche", "Nächste Woche", "Diesen Monat", "Flexible Termine"].map((a) => (
                <button key={a} className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                  {a}
                </button>
              ))}
            </DropPanel>

            {/* All filters */}
            <button className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-500 transition-colors ml-auto">
              <SlidersHorizontal size={13} />
              Alle Filter
            </button>
          </div>
        </div>
      </header>

      {/* Active style pills */}
      {activeStyles.length > 0 && (
        <div className="max-w-7xl mx-auto px-8 py-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 mr-1">Filter:</span>
          {activeStyles.map((s) => (
            <span key={s} className="flex items-center gap-1.5 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-full">
              {s}
              <button onClick={() => toggleStyle(s)}><X size={10} /></button>
            </span>
          ))}
          <button onClick={() => setActiveStyles([])} className="text-xs text-gray-400 hover:text-gray-700 underline">
            Alle löschen
          </button>
        </div>
      )}

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-8 py-8 pb-20">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">247 Studios</span> gefunden
            {activeCity !== "Alle Städte" && <span className="text-gray-400"> in {activeCity}</span>}
          </p>
          <select className="text-xs border border-gray-200 rounded-xl px-3 py-2 text-gray-600 outline-none focus:border-gray-400">
            <option>Empfohlen</option>
            <option>Beste Bewertung</option>
            <option>Niedrigster Preis</option>
            <option>Höchster Preis</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-x-6 gap-y-10">
          {STUDIOS.map((studio) => (
            <StudioCard key={studio.id} studio={studio} />
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mt-14">
          {[1, 2, 3, 4, "…", 12].map((p, i) => (
            <button
              key={i}
              className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                p === 1 ? "bg-gray-900 text-white" : "hover:bg-gray-100 text-gray-500"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-8 py-3 flex items-center justify-between text-xs text-gray-400">
        <div className="flex gap-4">
          <span>© 2026 InkBook</span>
          <span>·</span>
          <a href="#" className="hover:text-gray-700">Datenschutz</a>
          <span>·</span>
          <a href="#" className="hover:text-gray-700">AGB</a>
        </div>
        <button className="flex items-center gap-1 font-medium text-gray-500 hover:text-gray-900">
          <Globe size={11} /> Deutsch
        </button>
      </footer>
    </div>
  );
}
