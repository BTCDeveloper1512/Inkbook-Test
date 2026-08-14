import "./i18n";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PWAInstallBanner from "./components/PWAInstallBanner";
import CookieBanner from "./components/CookieBanner";
import LandingPage from "./pages/LandingPage";
import PublicStudioPage from "./pages/PublicStudioPage";
import PublicStudioAccountPage from "./pages/PublicStudioAccountPage";
import CustomerStudioPicker from "./pages/CustomerStudioPicker";
import StudioOsLoginPage from "./pages/os/StudioOsLoginPage";
import StudioOsDashboard from "./pages/os/StudioOsDashboard";
import StudioOnboardingPage from "./pages/os/StudioOnboardingPage";
import StudioOsMfaGate from "./pages/os/StudioOsMfaGate";
import StudioOsAdminPage from "./pages/os/StudioOsAdminPage";
import { StudioOsForgotPasswordPage, StudioOsNewPasswordPage } from "./pages/os/StudioOsPasswordResetPage";
import StudioOsEmailConfirmedPage from "./pages/os/StudioOsEmailConfirmedPage";
import CustomerEmailConfirmedPage from "./pages/CustomerEmailConfirmedPage";
import NotFoundPage from "./pages/NotFoundPage";
import ImpressumPage from "./pages/ImpressumPage";
import DatenschutzPage from "./pages/DatenschutzPage";
import AGBPage from "./pages/AGBPage";
import UeberUnsPage from "./pages/UeberUnsPage";
import FAQPage from "./pages/FAQPage";
import { InkNotifyMount } from "./components/InkNotify";
import "./App.css";

/**
 * Nur noch StudioOS. Das alte FastAPI-Produkt aus der Replit-Zeit ist samt
 * eigener Anmeldung (AuthContext), eigenem Backend-Ordner und allen zugehörigen
 * Seiten entfernt — es gibt jetzt genau ein Produkt, eine Anmeldung und einen
 * Session-Begriff.
 *
 * Alte Pfade leiten weiter statt zu 404en: Lesezeichen und geteilte Links aus
 * der Zeit davor landen dort, wo die Sache heute lebt.
 */
function AppRouter() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<LandingPage />} />

        {/* Öffentliche Studioseite — der einzige Weg zu einem Studio, es gibt
            bewusst keine Suche und kein Verzeichnis. */}
        <Route path="/t/:slug" element={<PublicStudioPage />} />
        <Route path="/t/:slug/konto" element={<PublicStudioAccountPage />} />
        <Route path="/konto" element={<CustomerStudioPicker />} />
        {/* Ziel des Links aus der Bestätigungs-E-Mail — generisch, nicht
            Studio-gebunden, weil die Kunden-Identität studioübergreifend ist. */}
        <Route path="/konto/email-bestaetigt" element={<CustomerEmailConfirmedPage />} />

        {/* Studio-Seite. Alles hinter dem Login läuft durch StudioOsMfaGate,
            weil Zwei-Faktor für jedes Studio-Konto Pflicht ist. */}
        <Route path="/os/login" element={<StudioOsLoginPage />} />
        <Route path="/os/passwort-vergessen" element={<StudioOsForgotPasswordPage />} />
        {/* Ziel des Links aus der Wiederherstellungs-E-Mail (redirectTo im Backend). */}
        <Route path="/os/passwort-neu" element={<StudioOsNewPasswordPage />} />
        {/* Ziel des Links aus der Registrierungs-Bestätigungs-E-Mail. */}
        <Route path="/os/email-bestaetigt" element={<StudioOsEmailConfirmedPage />} />
        <Route
          path="/os/dashboard"
          element={
            <StudioOsMfaGate>
              <StudioOsDashboard />
            </StudioOsMfaGate>
          }
        />
        <Route
          path="/os/onboarding"
          element={
            <StudioOsMfaGate>
              <StudioOnboardingPage />
            </StudioOsMfaGate>
          }
        />

        {/* Auch der Adminbereich geht durch das MFA-Gate — ein Konto mit
            Zugriff auf alle Studios ist ein lohnenderes Ziel als eines. */}
        <Route
          path="/os/admin"
          element={
            <StudioOsMfaGate>
              <StudioOsAdminPage />
            </StudioOsMfaGate>
          }
        />

        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/datenschutz" element={<DatenschutzPage />} />
        <Route path="/agb" element={<AGBPage />} />
        <Route path="/ueber-uns" element={<UeberUnsPage />} />
        <Route path="/faq" element={<FAQPage />} />

        {/* Pfade des alten Produkts. Sie standen für eine andere Datenwelt mit
            eigener Anmeldung — wer noch einen Link hat, soll nicht ins Leere
            laufen, sondern beim heutigen Gegenstück ankommen. */}
        <Route path="/dashboard" element={<Navigate to="/konto" replace />} />
        <Route path="/settings" element={<Navigate to="/konto" replace />} />
        <Route path="/studio-dashboard" element={<Navigate to="/os/dashboard" replace />} />
        <Route path="/subscription" element={<Navigate to="/os/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/os/login" replace />} />
        <Route path="/register" element={<Navigate to="/os/login" replace />} />
        <Route path="/reset-password" element={<Navigate to="/os/passwort-vergessen" replace />} />
        <Route path="/messages" element={<Navigate to="/" replace />} />
        <Route path="/messages/:recipientId" element={<Navigate to="/" replace />} />
        <Route path="/admin" element={<Navigate to="/" replace />} />
        <Route path="/search" element={<Navigate to="/" replace />} />
        <Route path="/guide" element={<Navigate to="/" replace />} />
        <Route path="/studios/:studioId" element={<Navigate to="/" replace />} />
        <Route path="/s/:slug" element={<Navigate to="/" replace />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <CookieBanner />
      <PWAInstallBanner />
      <InkNotifyMount />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
