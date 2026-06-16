import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, MoreVertical, Plus } from "lucide-react";

/**
 * PWAInstallBanner
 * – Android: Listens for `beforeinstallprompt`, shows a custom "Installieren" button
 * – iOS Safari: Detects iOS + standalone=false, shows step-by-step share sheet instructions
 * – Dismissed state is stored in localStorage (once dismissed, never shows again)
 */
export default function PWAInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState(null); // Android deferred prompt
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState(""); // "android" | "ios"

  useEffect(() => {
    // Don't show if already dismissed or already installed
    if (localStorage.getItem("pwa-install-dismissed")) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (window.navigator.standalone === true) return; // iOS standalone

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      setPlatform("ios");
      // Only show on Safari (not Chrome iOS)
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isSafari) {
        // Slight delay so it doesn't distract on first load
        setTimeout(() => setVisible(true), 3500);
      }
    } else if (isAndroid) {
      setPlatform("android");
    }

    // Android: intercept the native install prompt
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setPlatform("android");
      setTimeout(() => setVisible(true), 2500);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setShowIOSHint(false);
    localStorage.setItem("pwa-install-dismissed", "1");
  };

  const handleAndroidInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
      localStorage.setItem("pwa-install-dismissed", "1");
    }
    setInstallPrompt(null);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="pwa-banner"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        data-testid="pwa-install-banner"
        style={{
          position: "fixed",
          bottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
          left: 16,
          right: 16,
          zIndex: 9990,
          background: "rgba(12,12,12,0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          padding: "16px 18px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <img
            src="/logo192.png"
            alt="StudioOS"
            style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.92)" }}>
              StudioOS installieren
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "Inter, sans-serif", marginTop: 2 }}>
              Zum Home-Bildschirm hinzufügen
            </p>
          </div>
          <button
            onClick={handleDismiss}
            data-testid="pwa-dismiss-btn"
            style={{
              width: 28, height: 28, borderRadius: 8, border: "none",
              background: "rgba(255,255,255,0.08)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={14} strokeWidth={1.5} style={{ color: "rgba(255,255,255,0.5)" }} />
          </button>
        </div>

        {/* Android: Install Button */}
        {platform === "android" && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAndroidInstall}
            data-testid="pwa-install-btn"
            style={{
              width: "100%", padding: "11px 0", borderRadius: 12, border: "none",
              background: "rgba(255,255,255,0.95)", cursor: "pointer",
              fontSize: 14, fontWeight: 600, fontFamily: "Inter, sans-serif",
              color: "#090909",
            }}
          >
            App installieren
          </motion.button>
        )}

        {/* iOS: Step-by-step hint */}
        {platform === "ios" && (
          <div>
            {!showIOSHint ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowIOSHint(true)}
                data-testid="pwa-ios-howto-btn"
                style={{
                  width: "100%", padding: "11px 0", borderRadius: 12, border: "none",
                  background: "rgba(255,255,255,0.95)", cursor: "pointer",
                  fontSize: 14, fontWeight: 600, fontFamily: "Inter, sans-serif",
                  color: "#090909",
                }}
              >
                Wie installieren?
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                {[
                  { icon: <Share size={15} strokeWidth={1.5} />, text: 'Tippe auf das Teilen-Symbol unten in Safari' },
                  { icon: <Plus size={15} strokeWidth={1.5} />, text: 'Wähle „Zum Home-Bildschirm"' },
                  { icon: <span style={{ fontSize: 14 }}>✓</span>, text: 'Tippe „Hinzufügen" – fertig!' },
                ].map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: "rgba(255,255,255,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "rgba(255,255,255,0.7)",
                    }}>
                      {step.icon}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "Inter, sans-serif", lineHeight: 1.4 }}>
                      {step.text}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
