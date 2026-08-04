import "./i18n";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import CookieBanner from "./components/CookieBanner";
import SupportChat from "./components/SupportChat";
import PWAInstallBanner from "./components/PWAInstallBanner";
import AuthCallback from "./pages/AuthCallback";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import StudioPage from "./pages/StudioPage";
import NotFoundPage from "./pages/NotFoundPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerSettingsPage from "./pages/CustomerSettingsPage";
import StudioDashboard from "./pages/StudioDashboard";
import MessagesPage from "./pages/MessagesPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import AdminPage from "./pages/AdminPage";
import ImpressumPage from "./pages/ImpressumPage";
import VideoTemplate from "./components/video/VideoTemplate.js";
import StudioGuide from "./pages/StudioGuide";
import DatenschutzPage from "./pages/DatenschutzPage";
import AGBPage from "./pages/AGBPage";
import FAQPage from "./pages/FAQPage";
import UeberUnsPage from "./pages/UeberUnsPage";
import ActivatePage from "./pages/ActivatePage";
import ConsentFormPage from "./pages/ConsentFormPage";
import { InkNotifyMount } from "./components/InkNotify";
import "./App.css";

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <>
      <Routes>
        <Route path="/"              element={<LandingPage />} />
        <Route path="/home"          element={<LandingPage />} />
        <Route path="/search"        element={<Navigate to="/" replace />} />
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/register"      element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/studios/:studioId" element={<StudioPage />} />
        <Route path="/s/:slug" element={<StudioPage />} />
        <Route path="/impressum"     element={<ImpressumPage />} />
        <Route path="/datenschutz"   element={<DatenschutzPage />} />
        <Route path="/agb"           element={<AGBPage />} />
        <Route path="/faq"           element={<FAQPage />} />
        <Route path="/ueber-uns"     element={<UeberUnsPage />} />
        <Route path="/activate"      element={<ActivatePage />} />
        <Route path="/consent/:bookingId" element={
          <ProtectedRoute><ConsentFormPage /></ProtectedRoute>
        } />
        <Route path="/messages" element={
          <ProtectedRoute><MessagesPage /></ProtectedRoute>
        } />
        <Route path="/messages/:recipientId" element={
          <ProtectedRoute><MessagesPage /></ProtectedRoute>
        } />
        <Route path="/subscription" element={
          <ProtectedRoute requiredRole="studio_owner"><SubscriptionPage /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><CustomerDashboard /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute><CustomerSettingsPage /></ProtectedRoute>
        } />
        <Route path="/studio-dashboard" element={
          <ProtectedRoute requiredRole="studio_owner"><StudioDashboard /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin"><AdminPage /></ProtectedRoute>
        } />
        <Route path="/video" element={<VideoTemplate />} />
        <Route path="/guide" element={<StudioGuide />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <CookieBanner />
      <SupportChat />
      <PWAInstallBanner />
      <InkNotifyMount />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
