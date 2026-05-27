import { Star, Heart, Share2, ChevronLeft, ChevronRight, Award, Clock, CreditCard, Shield, MapPin, Check, User, Calendar } from "lucide-react";

const ARTISTS = [
  { name: "Marco V.", specialty: "Traditional · Blackwork", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80" },
  { name: "Lena K.", specialty: "Fine Line · Minimalist", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" },
  { name: "Tim R.", specialty: "Realism · Portrait", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
];

const REVIEWS = [
  { name: "Sophie M.", date: "Oktober 2025", avatar: "S", text: "Absolut beeindruckendes Studio! Marco hat mein Sleeve genau so umgesetzt wie ich es mir vorgestellt habe. Sehr professionell und einfühlsam.", rating: 5 },
  { name: "Julian K.", date: "September 2025", avatar: "J", text: "Top Hygiene, freundliches Team und das Ergebnis übertrifft alle Erwartungen. Kann ich wärmstens empfehlen!", rating: 5 },
  { name: "Anna B.", date: "August 2025", avatar: "A", text: "Lena hat ein wunderschönes Fine-Line-Tattoo gemacht. Die Beratung war super ausführlich. Definitiv wiederkommen.", rating: 5 },
  { name: "Felix W.", date: "Juli 2025", avatar: "F", text: "Sehr angenehme Atmosphäre, Tim ist ein echtes Talent bei Portrait-Tattoos. Der Preis ist fair für die Qualität.", rating: 4 },
];

const TIMES = ["10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
const DAYS = [
  { day: "Mo", date: 2, avail: true },
  { day: "Di", date: 3, avail: false },
  { day: "Mi", date: 4, avail: true },
  { day: "Do", date: 5, avail: true },
  { day: "Fr", date: 6, avail: true },
  { day: "Sa", date: 7, avail: true },
  { day: "So", date: 8, avail: false },
];

export function StudioDetail() {
  return (
    <div className="min-h-screen bg-white font-['Inter',sans-serif]">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#18181b] flex items-center justify-center">
              <span className="text-white text-xs font-bold font-['Playfair_Display']">I</span>
            </div>
            <span className="text-lg font-bold text-[#18181b] font-['Playfair_Display']">InkBook</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
              <Share2 size={14} /> Teilen
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
              <Heart size={14} /> Merken
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-24">
        {/* ── Title ── */}
        <div className="pt-8 pb-5">
          <h1 className="text-[28px] font-bold text-gray-900 font-['Playfair_Display'] mb-2">Black Needle Studio</h1>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm">
            <div className="flex items-center gap-1">
              <Star size={13} className="fill-gray-900 text-gray-900" />
              <span className="font-semibold text-gray-900">4.97</span>
              <span className="text-gray-500">(312 Bewertungen)</span>
            </div>
            <span className="text-gray-300">·</span>
            <span className="font-semibold text-gray-700 underline cursor-pointer flex items-center gap-1">
              <Award size={13} /> Superhosts
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-500 flex items-center gap-1">
              <MapPin size={13} /> Berlin · Mitte
            </span>
          </div>
        </div>

        {/* ── Photo gallery ── */}
        <div className="grid grid-cols-2 gap-3 rounded-2xl overflow-hidden mb-10 h-[440px]">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80"
              alt="Studio"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-rows-2 gap-3">
            <img
              src="https://images.unsplash.com/photo-1590246814883-57c511e72735?w=600&q=80"
              alt="Studio"
              className="w-full h-full object-cover rounded-tr-none"
            />
            <img
              src="https://images.unsplash.com/photo-1543332164-6e82f355badc?w=600&q=80"
              alt="Studio"
              className="w-full h-full object-cover"
            />
          </div>
          <button className="absolute bottom-4 right-4 bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:shadow-md transition-shadow">
            Alle Fotos anzeigen
          </button>
        </div>

        {/* ── Content grid ── */}
        <div className="grid grid-cols-[1fr_380px] gap-16">
          {/* Left column */}
          <div>
            {/* Studio intro */}
            <div className="flex items-start justify-between pb-6 border-b border-gray-200 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Tattoo Studio in Berlin · Mitte</h2>
                <p className="text-gray-500 text-sm">3 Künstler · Traditional · Blackwork · Fine Line</p>
              </div>
              <div className="flex -space-x-2 flex-shrink-0">
                {ARTISTS.map((a) => (
                  <img key={a.name} src={a.img} alt={a.name} className="w-12 h-12 rounded-full border-2 border-white object-cover" />
                ))}
              </div>
            </div>

            {/* Highlights */}
            <div className="space-y-5 pb-7 border-b border-gray-200 mb-7">
              {[
                { icon: <Award size={24} className="text-gray-700" />, title: "Superhost", desc: "Superhosts sind erfahrene, hoch bewertete Studios." },
                { icon: <Shield size={24} className="text-gray-700" />, title: "Sicher buchen", desc: "Deine Zahlung ist über InkBook abgesichert." },
                { icon: <Clock size={24} className="text-gray-700" />, title: "Anzahlung in 24h", desc: "Sicher deinen Termin mit einer kleinen Anzahlung." },
              ].map((h) => (
                <div key={h.title} className="flex items-start gap-4">
                  {h.icon}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{h.title}</p>
                    <p className="text-sm text-gray-500">{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="pb-7 border-b border-gray-200 mb-7">
              <p className="text-gray-700 leading-relaxed text-[15px]">
                Willkommen im Black Needle Studio — einem der führenden Tattoo-Studios in Berlin. Mit über 10 Jahren Erfahrung spezialisieren wir uns auf Traditional, Blackwork und Fine-Line-Tattoos. Unser Team aus drei leidenschaftlichen Künstlern arbeitet in einem stilvollen, hygienischen Ambiente.
              </p>
              <button className="mt-3 text-sm font-semibold text-gray-900 underline">Mehr anzeigen →</button>
            </div>

            {/* Artists */}
            <div className="pb-7 border-b border-gray-200 mb-7">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Unsere Künstler</h3>
              <div className="grid grid-cols-3 gap-4">
                {ARTISTS.map((a) => (
                  <div key={a.name} className="text-center cursor-pointer group">
                    <img src={a.img} alt={a.name} className="w-20 h-20 rounded-full object-cover mx-auto mb-2 group-hover:ring-2 group-hover:ring-gray-900 transition-all" />
                    <p className="text-sm font-semibold text-gray-900">{a.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.specialty}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="mb-7">
              <div className="flex items-center gap-3 mb-6">
                <Star size={20} className="fill-gray-900 text-gray-900" />
                <span className="text-xl font-bold text-gray-900">4.97</span>
                <span className="text-gray-500 text-sm">· 312 Bewertungen</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {REVIEWS.map((r) => (
                  <div key={r.name}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">{r.avatar}</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                        <p className="text-xs text-gray-500">{r.date}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Booking card ── */}
          <div className="relative">
            <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl shadow-xl p-6">
              {/* Price */}
              <div className="flex items-baseline justify-between mb-5">
                <div>
                  <span className="text-2xl font-bold text-gray-900">ab €150</span>
                  <span className="text-gray-500 text-base"> / Session</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={13} className="fill-gray-900 text-gray-900" />
                  <span className="text-sm font-semibold">4.97</span>
                  <span className="text-xs text-gray-500">(312)</span>
                </div>
              </div>

              {/* Date picker */}
              <div className="border border-gray-300 rounded-xl overflow-hidden mb-3">
                <div className="grid grid-cols-2 divide-x divide-gray-300">
                  <div className="p-3">
                    <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wider mb-0.5">Datum</p>
                    <p className="text-sm text-gray-500">Wählen</p>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wider mb-0.5">Uhrzeit</p>
                    <p className="text-sm text-gray-500">Wählen</p>
                  </div>
                </div>
                <div className="border-t border-gray-300 p-3">
                  <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wider mb-0.5">Künstler</p>
                  <p className="text-sm text-gray-500">Beliebig</p>
                </div>
              </div>

              {/* Mini calendar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <button className="p-1 hover:bg-gray-100 rounded-full">
                    <ChevronLeft size={16} className="text-gray-600" />
                  </button>
                  <p className="text-sm font-semibold text-gray-900">Juni 2026</p>
                  <button className="p-1 hover:bg-gray-100 rounded-full">
                    <ChevronRight size={16} className="text-gray-600" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map((d) => (
                    <button
                      key={d.day}
                      disabled={!d.avail}
                      className={`flex flex-col items-center py-2 px-1 rounded-xl text-xs transition-colors ${
                        d.date === 4
                          ? "bg-gray-900 text-white"
                          : d.avail
                          ? "hover:bg-gray-100 text-gray-700"
                          : "text-gray-300 cursor-not-allowed line-through"
                      }`}
                    >
                      <span className="text-[10px] mb-0.5">{d.day}</span>
                      <span className="font-semibold">{d.date}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slots */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {TIMES.map((t) => (
                  <button
                    key={t}
                    className={`py-2 rounded-xl border text-sm font-medium transition-colors ${
                      t === "13:00"
                        ? "bg-gray-900 text-white border-gray-900"
                        : "border-gray-200 text-gray-700 hover:border-gray-700"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* CTA */}
              <button className="w-full py-3.5 bg-gradient-to-r from-[#FF385C] to-[#E31C5F] text-white font-bold rounded-xl hover:opacity-90 transition-opacity text-sm">
                Jetzt buchen
              </button>

              <p className="text-center text-xs text-gray-400 mt-3">Es wird noch nichts berechnet</p>

              {/* Price breakdown */}
              <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>€150 × 1 Session</span>
                  <span>€150</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="underline cursor-pointer">Plattformgebühr</span>
                  <span>€7.50</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-100 pt-2">
                  <span>Gesamt</span>
                  <span>€157.50</span>
                </div>
              </div>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Shield size={12} className="text-gray-400" />
                  Sicher bezahlen
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <CreditCard size={12} className="text-gray-400" />
                  Stripe
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
