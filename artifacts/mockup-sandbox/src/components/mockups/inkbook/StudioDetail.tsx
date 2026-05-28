import { Star, Heart, Share2, ChevronLeft, ChevronRight, Award, Clock, Shield, MapPin, Check, Globe, CreditCard } from "lucide-react";
import { useState } from "react";

const ARTISTS = [
  { name: "Marco V.", specialty: "Traditional · Blackwork", exp: "12 Jahre Erfahrung", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80" },
  { name: "Lena K.", specialty: "Fine Line · Minimalist", exp: "8 Jahre Erfahrung", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80" },
  { name: "Tim R.", specialty: "Realism · Portrait", exp: "10 Jahre Erfahrung", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80" },
];

const REVIEWS = [
  { name: "Sophie M.", date: "Oktober 2025", avatar: "S", text: "Absolut beeindruckendes Studio! Marco hat mein Sleeve genau so umgesetzt wie ich es mir vorgestellt habe. Sehr professionell.", rating: 5 },
  { name: "Julian K.", date: "September 2025", avatar: "J", text: "Top Hygiene, freundliches Team und das Ergebnis übertrifft alle Erwartungen. Wärmste Empfehlung!", rating: 5 },
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

const STUDIO_STYLES = ["Traditional", "Blackwork", "Fine Line", "Geometric"];

export function StudioDetail() {
  const [saved, setSaved] = useState(false);
  const [selectedDate, setSelectedDate] = useState(4);
  const [selectedTime, setSelectedTime] = useState("13:00");
  const [selectedArtist, setSelectedArtist] = useState("Beliebig");

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-8 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
              <span className="text-white text-[13px] font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>I</span>
            </div>
            <span className="text-[22px] font-bold tracking-tight text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>InkBook</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <Share2 size={14} /> Teilen
            </button>
            <button
              onClick={() => setSaved(!saved)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Heart size={14} className={saved ? "fill-gray-900 text-gray-900" : ""} />
              {saved ? "Gespeichert" : "Merken"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 pb-24">
        {/* ── Title ── */}
        <div className="pt-8 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Black Needle Studio
          </h1>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-2 text-sm">
            <div className="flex items-center gap-1.5">
              <Star size={13} className="fill-gray-900 text-gray-900" />
              <span className="font-semibold text-gray-900">4.97</span>
              <span className="text-gray-400">·</span>
              <button className="text-gray-700 font-semibold underline underline-offset-2">312 Bewertungen</button>
            </div>
            <span className="text-gray-200">|</span>
            <span className="flex items-center gap-1 text-gray-600 font-semibold">
              <Award size={13} className="text-gray-700" /> Superhost
            </span>
            <span className="text-gray-200">|</span>
            <span className="flex items-center gap-1 text-gray-500">
              <MapPin size={13} /> Berlin · Mitte
            </span>
          </div>

          {/* Style tags */}
          <div className="flex items-center gap-2 mt-4">
            {STUDIO_STYLES.map(s => (
              <span key={s} className="border border-gray-200 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* ── Photo gallery ── */}
        <div className="grid grid-cols-2 gap-3 rounded-3xl overflow-hidden mb-12 h-[460px] relative">
          <img
            src="https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80"
            alt="Studio"
            className="w-full h-full object-cover"
          />
          <div className="grid grid-rows-2 gap-3">
            <img
              src="https://images.unsplash.com/photo-1590246814883-57c511e72735?w=600&q=80"
              alt="Studio"
              className="w-full h-full object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1543332164-6e82f355badc?w=600&q=80"
              alt="Studio"
              className="w-full h-full object-cover"
            />
          </div>
          <button className="absolute bottom-4 right-4 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:shadow-md transition-shadow">
            Alle Fotos · 24
          </button>
        </div>

        {/* ── Content grid ── */}
        <div className="grid grid-cols-[1fr_360px] gap-16">
          {/* Left column */}
          <div>
            {/* Studio intro */}
            <div className="flex items-start justify-between pb-7 border-b border-gray-100 mb-7">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Tattoo Studio · Berlin Mitte</h2>
                <p className="text-gray-500 text-sm">3 Künstler · Traditional · Blackwork · Fine Line</p>
              </div>
              <div className="flex -space-x-3">
                {ARTISTS.map((a) => (
                  <img key={a.name} src={a.img} alt={a.name} className="w-12 h-12 rounded-full border-2 border-white object-cover" />
                ))}
              </div>
            </div>

            {/* Highlights */}
            <div className="space-y-5 pb-7 border-b border-gray-100 mb-7">
              {[
                { icon: <Award size={22} className="text-gray-700 flex-shrink-0" />, title: "Superhost", desc: "Erfahrene, hoch bewertete Studios mit bestem Service." },
                { icon: <Shield size={22} className="text-gray-700 flex-shrink-0" />, title: "Sichere Buchung", desc: "Deine Zahlung ist über InkBook vollständig abgesichert." },
                { icon: <Clock size={22} className="text-gray-700 flex-shrink-0" />, title: "Anzahlung möglich", desc: "Sichere deinen Wunschtermin mit einer kleinen Anzahlung." },
              ].map((h) => (
                <div key={h.title} className="flex items-start gap-4">
                  {h.icon}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{h.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="pb-7 border-b border-gray-100 mb-7">
              <p className="text-gray-600 leading-relaxed text-[15px]">
                Willkommen im Black Needle Studio — einem der führenden Tattoo-Studios in Berlin. Mit über 10 Jahren Erfahrung spezialisieren wir uns auf Traditional, Blackwork und Fine-Line-Tattoos. Unser Team aus drei leidenschaftlichen Künstlern arbeitet in einem stilvollen, hygienischen Ambiente im Herzen von Berlin-Mitte.
              </p>
              <button className="mt-4 text-sm font-semibold text-gray-900 underline underline-offset-2 hover:text-gray-600">
                Mehr lesen →
              </button>
            </div>

            {/* Artists */}
            <div className="pb-7 border-b border-gray-100 mb-7">
              <h3 className="text-lg font-bold text-gray-900 mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>Unsere Künstler</h3>
              <div className="grid grid-cols-3 gap-5">
                {ARTISTS.map((a) => (
                  <div key={a.name} className="group cursor-pointer">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3">
                      <img src={a.img} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-900">{a.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.specialty}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.exp}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="mb-7">
              <div className="flex items-center gap-3 mb-6">
                <Star size={18} className="fill-gray-900 text-gray-900" />
                <span className="text-2xl font-bold text-gray-900">4.97</span>
                <span className="text-gray-400 text-sm">· 312 Bewertungen</span>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-7">
                {REVIEWS.map((r) => (
                  <div key={r.name}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-sm font-bold text-white">{r.avatar}</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                        <p className="text-xs text-gray-400">{r.date}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{r.text}</p>
                  </div>
                ))}
              </div>
              <button className="mt-6 px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:border-gray-500 transition-colors">
                Alle 312 Bewertungen anzeigen
              </button>
            </div>
          </div>

          {/* ── Right: Booking card ── */}
          <div>
            <div className="sticky top-24 bg-white border border-gray-200 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] p-7">
              {/* Price */}
              <div className="flex items-baseline justify-between mb-6">
                <div>
                  <span className="text-[28px] font-bold text-gray-900">ab €150</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star size={13} className="fill-gray-900 text-gray-900" />
                  <span className="font-semibold text-gray-900">4.97</span>
                  <span className="text-gray-400">(312)</span>
                </div>
              </div>

              {/* Selection fields */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden mb-4">
                <div className="grid grid-cols-2 divide-x divide-gray-200 border-b border-gray-200">
                  <div className="p-3.5 cursor-pointer hover:bg-gray-50 transition-colors">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Datum</p>
                    <p className="text-sm font-semibold text-gray-800">4. Jun 2026</p>
                  </div>
                  <div className="p-3.5 cursor-pointer hover:bg-gray-50 transition-colors">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Uhrzeit</p>
                    <p className="text-sm font-semibold text-gray-800">{selectedTime}</p>
                  </div>
                </div>
                <div className="p-3.5 cursor-pointer hover:bg-gray-50 transition-colors">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Künstler</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedArtist}</p>
                </div>
              </div>

              {/* Mini calendar */}
              <div className="mb-4 bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors">
                    <ChevronLeft size={15} className="text-gray-600" />
                  </button>
                  <p className="text-sm font-bold text-gray-900">Juni 2026</p>
                  <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors">
                    <ChevronRight size={15} className="text-gray-600" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map((d) => (
                    <button
                      key={d.day}
                      disabled={!d.avail}
                      onClick={() => d.avail && setSelectedDate(d.date)}
                      className={`flex flex-col items-center py-2 px-1 rounded-xl text-xs transition-all ${
                        selectedDate === d.date
                          ? "bg-gray-900 text-white"
                          : d.avail
                          ? "hover:bg-gray-200 text-gray-700"
                          : "text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      <span className={`text-[9px] mb-1 ${selectedDate === d.date ? "text-gray-300" : "text-gray-400"}`}>{d.day}</span>
                      <span className="font-bold">{d.date}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slots */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {TIMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`py-2.5 rounded-xl border text-[13px] font-semibold transition-all ${
                      selectedTime === t
                        ? "bg-gray-900 text-white border-gray-900"
                        : "border-gray-200 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* CTA */}
              <button className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-700 transition-colors text-sm tracking-wide">
                Jetzt buchen
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">Es wird noch nichts berechnet</p>

              {/* Price breakdown */}
              <div className="mt-5 space-y-2.5 border-t border-gray-100 pt-5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Startpreis</span>
                  <span className="font-medium">ab €150</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <button className="underline underline-offset-2 hover:text-gray-800">Plattformgebühr</button>
                  <span className="font-medium">€7.50</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-100 pt-3">
                  <span>Gesamt (Schätzung)</span>
                  <span>ab €157.50</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 mt-5 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Shield size={12} /> Sichere Zahlung
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <CreditCard size={12} /> Stripe
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
