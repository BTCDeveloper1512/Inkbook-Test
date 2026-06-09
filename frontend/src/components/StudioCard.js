import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Heart } from "lucide-react";

const priceStarting = { budget: 80, medium: 150, premium: 280, luxury: 450 };

export default function StudioCard({ studio, index = 0 }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const startingPrice = studio.starting_price || priceStarting[studio.price_range] || null;
  const imageSrc = studio.banner_image || studio.images?.[0] || null;

  return (
    <div
      className="group cursor-pointer"
      onClick={() => navigate(`/studios/${studio.studio_id}`)}
      data-testid={`studio-card-${studio.studio_id}`}
    >
      {/* Photo */}
      <div
        className="relative rounded-2xl overflow-hidden bg-zinc-100 mb-3"
        style={{ aspectRatio: "4/3" }}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={studio.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-100">
            <span className="text-zinc-300 text-5xl font-playfair">{studio.name?.[0]}</span>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={(e) => { e.stopPropagation(); setSaved(!saved); }}
          className="absolute top-3 right-3 p-1.5 rounded-full"
          aria-label={saved ? "Gespeichert" : "Speichern"}
        >
          <Heart
            size={20}
            className={
              saved
                ? "fill-zinc-900 text-zinc-900"
                : "fill-white/40 text-white drop-shadow-sm"
            }
            strokeWidth={1.8}
          />
        </button>

        {/* Style badges */}
        {studio.styles?.length > 0 && (
          <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
            {studio.styles.slice(0, 2).map((s) => (
              <span
                key={s}
                className="bg-white/90 text-zinc-800 text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {s}
              </span>
            ))}
            {studio.styles.length > 2 && (
              <span className="bg-white/90 text-zinc-600 text-xs font-medium px-2.5 py-1 rounded-full">
                +{studio.styles.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Verified badge */}
        {studio.is_verified && (
          <div
            className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full"
            style={{
              background: "linear-gradient(135deg, #1d6ef7 0%, #0047d9 100%)",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
              <circle cx="5.5" cy="5.5" r="5" fill="rgba(255,255,255,0.2)" />
              <path
                d="M2.5 5.5L4.5 7.5L8.5 3.5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[9px] font-bold text-white tracking-wide">Verifiziert</span>
          </div>
        )}
      </div>

      {/* Info row */}
      <div className="space-y-0.5">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm text-zinc-900 truncate pr-2">{studio.name}</p>
          {studio.avg_rating > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <Star size={12} className="fill-zinc-900 text-zinc-900" />
              <span className="text-xs font-medium text-zinc-900">
                {studio.avg_rating?.toFixed(2)}
              </span>
              <span className="text-xs text-zinc-400">({studio.review_count})</span>
            </div>
          )}
        </div>
        <p className="text-zinc-400 text-xs">{studio.city}</p>
        {startingPrice && (
          <p className="text-sm text-zinc-900 pt-0.5 font-semibold">ab €{startingPrice}</p>
        )}
      </div>
    </div>
  );
}
