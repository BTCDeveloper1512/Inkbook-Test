import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS
export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { googleLogin } = useAuth();
  const { t } = useTranslation();
  const [error, setError] = useState(null);

  useEffect(() => {
    const hash = location.hash;
    const match = hash.match(/session_id=([^&]+)/);
    if (!match) {
      navigate("/login");
      return;
    }
    const sessionId = match[1];
    googleLogin(sessionId)
      .then((user) => {
        navigate(user.role === "studio_owner" ? "/studio-dashboard" : "/dashboard");
      })
      .catch((e) => {
        setError("Google Login fehlgeschlagen");
        setTimeout(() => navigate("/login"), 2000);
      });
  }, []);

  if (error) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-600">{error}</p></div>;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-outfit">{t("common.loading")}</p>
      </div>
    </div>
  );
}
