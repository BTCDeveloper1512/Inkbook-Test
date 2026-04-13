import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Upload, Sparkles, X, ChevronRight } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AIAdvisorPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState("");
  const [description, setDescription] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();
  const { i18n } = useTranslation();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64Full = ev.target.result;
      const b64 = b64Full.split(",")[1];
      setImage(b64Full);
      setImageBase64(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!user) { navigate("/login"); return; }
    if (!description && !imageBase64) {
      setError("Bitte lade ein Bild hoch oder beschreibe deine Idee.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/ai/style-advisor`, {
        image_base64: imageBase64 || null,
        description: description,
        language: i18n.language
      }, { withCredentials: true });
      setRecommendation(data.recommendation);
    } catch (e) {
      setError(e.response?.data?.detail || "KI-Analyse fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden bg-black text-white py-20 px-6">
        <img
          src="https://static.prod-images.emergentagent.com/jobs/fb00eb6e-6246-4f6c-a06b-60ac2c5daad3/images/e1125944dcae8af3e2d20f5bca294493ae515f1d80eae1e9fbcd05482c067a20.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/20 text-xs font-outfit tracking-widest uppercase mb-6">
            <Sparkles size={12} /> KI-Powered
          </div>
          <h1 className="text-5xl sm:text-6xl font-playfair font-bold mb-4">{t("ai.title")}</h1>
          <p className="text-gray-300 font-outfit text-lg">{t("ai.subtitle")}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed p-10 text-center cursor-pointer transition-colors mb-6 ${image ? "border-black bg-gray-50" : "border-gray-300 hover:border-black hover:bg-gray-50"}`}
          onClick={() => fileRef.current?.click()}
          data-testid="image-upload-area"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            className="hidden"
            data-testid="image-file-input"
          />
          {image ? (
            <div className="relative inline-block">
              <img src={image} alt="Upload" className="max-h-48 max-w-full mx-auto object-contain" />
              <button
                onClick={(e) => { e.stopPropagation(); setImage(null); setImageBase64(""); }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center hover:bg-red-600"
                data-testid="remove-image-btn"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div>
              <Upload size={32} className="mx-auto mb-3 text-gray-400" />
              <p className="font-outfit text-gray-600 mb-1">{t("ai.uploadImage")}</p>
              <p className="text-xs text-gray-400 font-outfit">JPEG, PNG, WEBP bis 10MB</p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-xs font-semibold tracking-widest uppercase text-gray-500 mb-3 font-outfit">Oder beschreibe deine Idee</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder={t("ai.describe")}
            className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-sm font-outfit resize-none"
            data-testid="ai-description-input"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-outfit mb-6" data-testid="ai-error">
            {error}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading || (!imageBase64 && !description)}
          className="w-full py-4 bg-black text-white font-outfit font-medium text-lg hover:bg-neutral-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-3"
          data-testid="analyze-btn"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {t("ai.analyzing")}
            </>
          ) : (
            <>
              <Sparkles size={20} />
              {t("ai.analyze")}
            </>
          )}
        </button>

        {/* Recommendation */}
        {recommendation && (
          <div className="mt-8 border border-gray-200 overflow-hidden" data-testid="ai-recommendation">
            <div className="bg-black text-white px-6 py-4 flex items-center gap-2">
              <Sparkles size={16} />
              <span className="font-outfit font-semibold tracking-wider uppercase text-sm">{t("ai.recommendation")}</span>
            </div>
            <div className="p-6">
              <div className="prose prose-sm max-w-none">
                {recommendation.split("\n").map((line, i) => {
                  if (line.startsWith("###") || line.startsWith("##") || line.startsWith("#")) {
                    return <h3 key={i} className="font-playfair font-bold text-lg mt-4 mb-2">{line.replace(/^#+\s/, "")}</h3>;
                  }
                  if (line.startsWith("**") && line.endsWith("**")) {
                    return <p key={i} className="font-semibold font-outfit mt-3">{line.replace(/\*\*/g, "")}</p>;
                  }
                  if (line.startsWith("- ") || line.startsWith("• ")) {
                    return <p key={i} className="flex gap-2 text-sm font-outfit text-gray-700 my-1"><span className="text-black mt-0.5">•</span><span>{line.replace(/^[-•]\s/, "")}</span></p>;
                  }
                  if (line.trim() === "") return <br key={i} />;
                  return <p key={i} className="text-sm font-outfit text-gray-700 leading-relaxed">{line}</p>;
                })}
              </div>
            </div>
            <div className="px-6 pb-6">
              <a href="/search" className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white text-sm font-outfit hover:bg-neutral-800 transition-colors">
                Passende Studios finden <ChevronRight size={14} />
              </a>
            </div>
          </div>
        )}

        {/* Info Cards */}
        {!recommendation && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            {[
              { title: "Stil-Analyse", desc: "Erkenne deinen Tattoo-Stil basierend auf deinen Referenzbildern" },
              { title: "Künstler-Match", desc: "Wir empfehlen passende Studios und Künstler für deinen Stil" },
              { title: "Pflegetipps", desc: "Erhalte spezifische Pflegeempfehlungen für deinen Tattoo-Stil" }
            ].map((card, i) => (
              <div key={i} className="border border-gray-200 p-5">
                <h4 className="font-playfair font-semibold mb-2">{card.title}</h4>
                <p className="text-xs text-gray-500 font-outfit leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
