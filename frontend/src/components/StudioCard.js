import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Star, MapPin, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const priceLabels = { budget: "€", medium: "€€", premium: "€€€", luxury: "€€€€" };
const styleColors = ["bg-zinc-100 text-zinc-600", "bg-zinc-100 text-zinc-600", "bg-zinc-100 text-zinc-600"];

export default function StudioCard({ studio, index = 0 }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group bg-white rounded-2xl border border-black/[0.04] shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={() => navigate(`/studios/${studio.studio_id}`)}
      data-testid={`studio-card-${studio.studio_id}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-zinc-100">
        {studio.images?.[0] ? (
          <img src={studio.images[0]} alt={studio.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-apple" />
        ) : (
          <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
            <span className="text-zinc-300 text-4xl font-playfair">{studio.name[0]}</span>
          </div>
        )}
        {studio.is_verified && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg"
            style={{ background: "linear-gradient(135deg, #1d6ef7 0%, #0047d9 100%)", boxShadow: "0 4px 14px rgba(29,110,247,0.45)" }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="5.5" cy="5.5" r="5" fill="rgba(255,255,255,0.2)" />
              <path d="M2.5 5.5L4.5 7.5L8.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] font-inter font-bold text-white tracking-wide">Verifiziert</span>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-soft">
          <span className="text-xs font-inter font-bold text-zinc-600">{priceLabels[studio.price_range] || "€€"}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-playfair font-semibold text-zinc-900 text-[17px] leading-snug">{studio.name}</h3>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <span className="flex items-center gap-1 text-xs text-zinc-400 font-inter">
            <MapPin size={11} strokeWidth={1.5} /> {studio.city}
          </span>
          <span className="flex items-center gap-1 text-xs font-inter font-medium text-zinc-700">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            {studio.avg_rating?.toFixed(1)}
            <span className="text-zinc-400 font-normal">({studio.review_count})</span>
          </span>
        </div>

        <p className="text-[13px] text-zinc-500 font-inter line-clamp-2 mb-4 leading-relaxed">{studio.description}</p>

        {/* Styles */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {studio.styles?.slice(0, 3).map((s, i) => (
            <span key={s} className="text-xs px-2.5 py-1 bg-zinc-50 text-zinc-600 rounded-full font-inter border border-zinc-100">{s}</span>
          ))}
          {studio.styles?.length > 3 && <span className="text-xs px-2.5 py-1 text-zinc-400 font-inter">+{studio.styles.length - 3}</span>}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          className="w-full py-2.5 bg-zinc-900 text-white text-sm font-inter font-medium rounded-xl hover:bg-zinc-800 hover:shadow-btn transition-all duration-300"
          data-testid={`book-studio-btn-${studio.studio_id}`}
          onClick={(e) => { e.stopPropagation(); navigate(`/studios/${studio.studio_id}`); }}
        >
          {t("studio.book")}
        </motion.button>
      </div>
    </motion.div>
  );
}
