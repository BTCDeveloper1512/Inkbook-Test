import "./i18n";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthCallback from "./pages/AuthCallback";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SearchPage from "./pages/SearchPage";
import StudioPage from "./pages/StudioPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import StudioDashboard from "./pages/StudioDashboard";
import AIAdvisorPage from "./pages/AIAdvisorPage";
import MessagesPage from "./pages/MessagesPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import AdminPage from "./pages/AdminPage";
import "./App.css";

function AppRouter() {
  const location = useLocation();
  // Detect OAuth callback synchronously before ProtectedRoute runs
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/home" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/studios/:studioId" element={<StudioPage />} />
      <Route path="/ai-advisor" element={<AIAdvisorPage />} />
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
        <ProtectedRoute>
          <CustomerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/studio-dashboard" element={
        <ProtectedRoute requiredRole="studio_owner">
          <StudioDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <AdminPage />
        </ProtectedRoute>
      } />
      <Route path="*" element={<SearchPage />} />
    </Routes>
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
