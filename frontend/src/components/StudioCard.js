import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Star, MapPin, CheckCircle } from "lucide-react";

const priceLabels = { budget: "€", medium: "€€", premium: "€€€", luxury: "€€€€" };

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function StudioCard({ studio }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const priceColor = {
    budget: "text-green-600",
    medium: "text-blue-600",
    premium: "text-purple-600",
    luxury: "text-amber-600"
  };

  return (
    <div
      className="group bg-white border border-gray-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => navigate(`/studios/${studio.studio_id}`)}
      data-testid={`studio-card-${studio.studio_id}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {studio.images?.[0] ? (
          <img
            src={studio.images[0]}
            alt={studio.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-4xl font-playfair">{studio.name[0]}</span>
          </div>
        )}
        {studio.is_verified && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 flex items-center gap-1">
            <CheckCircle size={12} className="text-black" />
            <span className="text-xs font-outfit font-semibold text-black">{t("studio.verified")}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-playfair font-semibold text-lg text-black leading-tight">{studio.name}</h3>
          <span className={`text-sm font-bold font-outfit ${priceColor[studio.price_range] || "text-gray-600"}`}>
            {priceLabels[studio.price_range] || "€€"}
          </span>
        </div>

        <div className="flex items-center gap-1 mb-3">
          <MapPin size={13} className="text-gray-400" />
          <span className="text-sm text-gray-500 font-outfit">{studio.city}</span>
          <span className="ml-auto flex items-center gap-1">
            <Star size={13} className="text-amber-400 fill-amber-400" />
            <span className="text-sm font-semibold font-outfit">{studio.avg_rating?.toFixed(1)}</span>
            <span className="text-xs text-gray-400 font-outfit">({studio.review_count})</span>
          </span>
        </div>

        <p className="text-sm text-gray-600 font-outfit line-clamp-2 mb-4">{studio.description}</p>

        {/* Styles */}
        <div className="flex flex-wrap gap-1 mb-4">
          {studio.styles?.slice(0, 3).map(s => (
            <span key={s} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 font-outfit border border-gray-200">
              {s}
            </span>
          ))}
          {studio.styles?.length > 3 && (
            <span className="text-xs px-2 py-0.5 text-gray-400 font-outfit">+{studio.styles.length - 3}</span>
          )}
        </div>

        <button
          className="w-full py-2 bg-black text-white text-sm font-outfit font-medium hover:bg-neutral-800 transition-colors"
          data-testid={`book-studio-btn-${studio.studio_id}`}
          onClick={(e) => { e.stopPropagation(); navigate(`/studios/${studio.studio_id}`); }}
        >
          {t("studio.book")}
        </button>
      </div>
    </div>
  );
}
