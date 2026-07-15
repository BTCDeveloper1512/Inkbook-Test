import React, { useState, useEffect, useRef, useCallback } from "react";
import { notify } from "../components/InkNotify";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Plus, Calendar, TrendingUp, Clock, CheckCircle, AlertCircle, Trash2, Save, X, MessageSquare, Upload, HelpCircle, Video, FileText, Search, Download, CreditCard, Link2, Copy, ExternalLink, LayoutGrid, BookOpen, Inbox, CalendarPlus, Users, Settings2, Tag, Eye, Banknote, Send, Receipt, ChevronLeft, ChevronRight, Sparkles, Bell, Camera, Image, ChevronDown, ChevronUp, Lock, Unlock, ShoppingBag, Package, Gift, ToggleLeft, ToggleRight } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ArtistsTab from "../components/ArtistsTab";
import { lookupIban, formatIban } from "../utils/ibanLookup";
import VideoCallModal from "../components/VideoCallModal";
import VideoCountdownTimer from "../components/VideoCountdownTimer";
import DashboardHeroSmoke from "../components/DashboardHeroSmoke";
import BorderGlow from "../components/BorderGlow/BorderGlow";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STYLES_LIST = ["Fine Line", "Blackwork", "Traditional", "Neo-Traditional", "Japanese", "Realism", "Portrait", "Geometric", "Watercolor", "Tribal", "Minimalist", "Color", "Abstract", "Surrealism", "Illustrative", "Black & Grey"];
const statusColors = {
  pending:               "bg-amber-50 text-amber-700 border-amber-200",
  pending_studio_review: "bg-amber-50 text-amber-700 border-amber-200",
  under_review:          "bg-blue-50 text-blue-700 border-blue-200",
  offer_sent:            "bg-violet-50 text-violet-700 border-violet-200",
  waiting_for_deposit:   "bg-orange-50 text-orange-700 border-orange-200",
  deposit_pending:       "bg-orange-50 text-orange-600 border-orange-200",
  confirmed:             "bg-green-50 text-green-700 border-green-200",
  completed:             "bg-zinc-100 text-zinc-500 border-zinc-200",
  cancelled:             "bg-red-50 text-red-700 border-red-200",
  customer_cancelled:    "bg-red-50 text-red-700 border-red-200",
  studio_cancelled:      "bg-red-50 text-red-700 border-red-200",
  no_show:               "bg-zinc-100 text-zinc-500 border-zinc-200",
};
const statusLabels = {
  pending:               "Ausstehend",
  pending_studio_review: "Neue Anfrage",
  under_review:          "In Prüfung",
  offer_sent:            "Angebot gesendet",
  waiting_for_deposit:   "Wartet auf Anzahlung",
  deposit_pending:       "Zahlung läuft",
  confirmed:             "Bestätigt",
  completed:             "Abgeschlossen",
  cancelled:             "Storniert",
  customer_cancelled:    "Vom Kunden storniert",
  studio_cancelled:      "Vom Studio storniert",
  no_show:               "Nicht erschienen",
};

function DepositCountdown({ deadlineAt }) {
  const [remaining, setRemaining] = React.useState("");
  const [urgent, setUrgent] = React.useState(false);
  React.useEffect(() => {
    const calc = () => {
      const diff = new Date(deadlineAt) - Date.now();
      if (diff <= 0) { setRemaining("Abgelaufen"); setUrgent(true); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setUrgent(diff < 3600000 * 6);
      setRemaining(h > 0 ? `${h} Std. ${m} Min.` : `${m} Min.`);
    };
    calc();
    const t = setInterval(calc, 30000);
    return () => clearInterval(t);
  }, [deadlineAt]);
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-inter font-semibold px-2 py-0.5 rounded-full border ${urgent ? "bg-red-50 text-red-600 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
      ⏱ Frist: {remaining}
    </span>
  );
}

export default function StudioDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isNewRegistration = new URLSearchParams(location.search).get("stripe") === "setup";
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [studioWaitlist, setStudioWaitlist] = useState([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [betaBannerOpen, setBetaBannerOpen] = useState(true);
  // Calendar blocks (manual studio blocking)
  const [calBlocks, setCalBlocks] = useState([]);
  const [calCapData, setCalCapData] = useState({});
  const [dayCapacity, setDayCapacity] = useState(8);
  const [sizeCapacity, setSizeCapacity] = useState({ mini: 1, small: 2, medium: 3, large: 5, xl: 8 });
  const [dayCapInput, setDayCapInput] = useState(8);
  const [dayCapSaving, setDayCapSaving] = useState(false);
  const [calBlockPickCap, setCalBlockPickCap] = useState(""); // per-day custom capacity override
  const [showBlockRestriction, setShowBlockRestriction] = useState(false); // show/hide block type section in modal
  const now0rev = new Date();
  const [revenueNavYear, setRevenueNavYear] = useState(now0rev.getFullYear());
  const [revenueNavMonth, setRevenueNavMonth] = useState(now0rev.getMonth() + 1);
  const [invNavYear, setInvNavYear] = useState(now0rev.getFullYear());
  const [invNavMonth, setInvNavMonth] = useState(now0rev.getMonth() + 1);
  const [invNavAll, setInvNavAll] = useState(false);
  const now0 = new Date();
  const [calBlockMonth, setCalBlockMonth] = useState(now0.getMonth() + 1);
  const [calBlockYear, setCalBlockYear] = useState(now0.getFullYear());
  const [calBlockPickDate, setCalBlockPickDate] = useState(null);
  const [calBlockPickModal, setCalBlockPickModal] = useState(false);
  const [calBlockPickType, setCalBlockPickType] = useState("full");
  const [calBlockPickNote, setCalBlockPickNote] = useState("");
  const [calBlockSaving, setCalBlockSaving] = useState(false);
  const [calSelectedDates, setCalSelectedDates] = useState(new Set());
  const [visibleUntil, setVisibleUntil] = useState("");
  const [visibleUntilSaving, setVisibleUntilSaving] = useState(false);
  const [kalenderView, setKalenderView] = useState("termine"); // "termine" | "capacity"
  const [studioArtists, setStudioArtists] = useState([]);
  const [calArtistId, setCalArtistId] = useState(null); // null = studio-wide view
  // Refs for stale-closure-safe polling
  const calArtistIdRef    = useRef(null);
  const calBlockYearRef   = useRef(now0.getFullYear());
  const calBlockMonthRef  = useRef(now0.getMonth() + 1);
  const [calViewMonth, setCalViewMonth] = useState(now0.getMonth() + 1);
  const [calViewYear, setCalViewYear] = useState(now0.getFullYear());
  const [calViewSelected, setCalViewSelected] = useState(new Date().toISOString().split("T")[0]);
  // Bookings calendar (unused states kept for compatibility)
  const [bookCalMonth, setBookCalMonth] = useState(now0.getMonth() + 1);
  const [bookCalYear, setBookCalYear] = useState(now0.getFullYear());
  const [bookCalSelected, setBookCalSelected] = useState(null);
  const [showCreateStudio, setShowCreateStudio] = useState(false);
  const [studioForm, setStudioForm] = useState({ name: "", description: "", address: "", city: "", phone: "", email: "", website: "", styles: [], price_range: "medium", images: [] });
  // Edit profile
  const [editForm, setEditForm] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const isPro = true; // All features unlocked – subscription model coming later
  const isFullStudio = true;
  const [videoCallBooking, setVideoCallBooking] = useState(null);
  const [studioBookingsTab, setStudioBookingsTab] = useState("active");
  const [tick, setTick] = useState(0);
  const [notesModal, setNotesModal] = useState(null);
  const [notesLightbox, setNotesLightbox] = useState(null);
  const [bookingSearch, setBookingSearch] = useState("");
  const [revenueInputs, setRevenueInputs] = useState({});
  const [finalPayModal, setFinalPayModal] = useState(null);
  const [finalPayAmount, setFinalPayAmount] = useState("");
  const [finalPayMethod, setFinalPayMethod] = useState("cash");
  const [finalPayLoading, setFinalPayLoading] = useState(false);
  const [checkPayLoading, setCheckPayLoading] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [connectStatus, setConnectStatus] = useState(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [stripeConnectError, setStripeConnectError] = useState(null);
  const [accountForm, setAccountForm] = useState({ name: "", email: "", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [accountMsg, setAccountMsg] = useState(null);
  const [accountLoading, setAccountLoading] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [inquiries, setInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const inquiriesInitialized = React.useRef(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [expandedInquiry, setExpandedInquiry] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showDepositPopup, setShowDepositPopup] = useState(false);
  const [stripeWindowOpened, setStripeWindowOpened] = useState(() => !!localStorage.getItem("inkbook_stripe_window_opened"));
  const [offerModal, setOfferModal] = useState(null);
  const [offerForm, setOfferForm] = useState({ offer_date: "", offer_time: "", offer_duration_min: 120, offer_total_price: "", offer_deposit_amount: "", offer_notes: "" });
  const [offerLoading, setOfferLoading] = useState(false);
  const [refundModal, setRefundModal] = useState(null); // booking object with paid deposit
  const [refundLoading, setRefundLoading] = useState(false);
  const [depositRefundLoading, setDepositRefundLoading] = useState("");
  const [pageAnalytics, setPageAnalytics] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [clientStyleFilter, setClientStyleFilter] = useState(null);
  const [clientDateFilter, setClientDateFilter] = useState("all");
  const [clientsList, setClientsList] = useState([]);
  const [clientsTotal, setClientsTotal] = useState(0);
  const [clientsSkip, setClientsSkip] = useState(0);
  const CLIENTS_PAGE_SIZE = 50;
  const [clientsLoading, setClientsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientCard, setClientCard] = useState(null);
  const [clientCardLoading, setClientCardLoading] = useState(false);
  const clientNotesTimerRef = useRef(null);
  const [clientNotesSaving, setClientNotesSaving] = useState(false);
  const [clientTagInput, setClientTagInput] = useState("");
  const [photoUploadLoading, setPhotoUploadLoading] = useState({});
  const [photoLightbox, setPhotoLightbox] = useState(null);

  // ── Shop state ────────────────────────────────────────────────────────────
  const [shopProducts, setShopProducts] = useState([]);
  const [shopOrders, setShopOrders] = useState([]);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopSubTab, setShopSubTab] = useState("products"); // "products" | "orders"
  const [shopProductModal, setShopProductModal] = useState(null); // null | product obj (empty = new)
  const [shopProductForm, setShopProductForm] = useState({ type: "flash", title: "", description: "", price_cents: 0, stock: "", image_data: null, active: true });
  const [shopProductSaving, setShopProductSaving] = useState(false);
  const [shopProductDeleting, setShopProductDeleting] = useState({});
  const [shopImageUploading, setShopImageUploading] = useState(false);

  const FITZPATRICK = [
    { scale: 1, label: "Typ I",   bg: "#FDDCBC", desc: "Sehr hell" },
    { scale: 2, label: "Typ II",  bg: "#F5C797", desc: "Hell" },
    { scale: 3, label: "Typ III", bg: "#D4A574", desc: "Mittel" },
    { scale: 4, label: "Typ IV",  bg: "#A0724A", desc: "Olivfarben" },
    { scale: 5, label: "Typ V",   bg: "#6B4226", desc: "Braun" },
    { scale: 6, label: "Typ VI",  bg: "#3D1F0D", desc: "Dunkelbraun" },
  ];

  const fetchClients = async (studioId, skip = 0, append = false) => {
    setClientsLoading(true);
    try {
      const { data } = await axios.get(`${API}/studios/${studioId}/clients?skip=${skip}&limit=${CLIENTS_PAGE_SIZE}`, { withCredentials: true });
      const clients = data?.clients || data || [];
      setClientsList(prev => append ? [...prev, ...clients] : clients);
      setClientsTotal(data?.total ?? clients.length);
      setClientsSkip(skip + clients.length);
    } catch { if (!append) setClientsList([]); } finally { setClientsLoading(false); }
  };

  const fetchClientCard = async (studioId, userId) => {
    setClientCardLoading(true);
    try {
      const { data } = await axios.get(`${API}/studios/${studioId}/clients/${userId}`, { withCredentials: true });
      setClientCard(data);
    } catch { notify.error("Karteikarte konnte nicht geladen werden."); } finally { setClientCardLoading(false); }
  };

  const handleClientCardField = async (studioId, userId, field, value) => {
    setClientCard(prev => prev ? { ...prev, [field]: value } : prev);
    if (field === "internal_notes") {
      clearTimeout(clientNotesTimerRef.current);
      clientNotesTimerRef.current = setTimeout(async () => {
        setClientNotesSaving(true);
        try {
          await axios.put(`${API}/studios/${studioId}/clients/${userId}`, { internal_notes: value }, { withCredentials: true });
        } catch {} finally { setClientNotesSaving(false); }
      }, 1200);
    } else {
      try {
        await axios.put(`${API}/studios/${studioId}/clients/${userId}`, { [field]: value }, { withCredentials: true });
      } catch { notify.error("Speichern fehlgeschlagen."); }
    }
  };

  const resizeImageToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const maxPx = 800;
        let w = img.width, h = img.height;
        if (w > maxPx || h > maxPx) {
          if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
          else { w = Math.round(w * maxPx / h); h = maxPx; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handlePhotoUpload = async (bookingId, files, label) => {
    if (!files || !files.length) return;
    setPhotoUploadLoading(prev => ({ ...prev, [bookingId]: true }));
    try {
      const photos = await Promise.all(Array.from(files).slice(0, 5).map(async f => ({
        photo_data: await resizeImageToBase64(f),
        label: label || "after",
      })));
      const studioId = stats?.studio?.studio_id;
      await axios.post(`${API}/bookings/${bookingId}/photos`, { photos }, { withCredentials: true });
      if (selectedClient && studioId) await fetchClientCard(studioId, selectedClient.user_id);
      notify.success(`${photos.length} Foto(s) hochgeladen.`);
    } catch (e) {
      notify.error(e.response?.data?.detail || "Foto-Upload fehlgeschlagen.");
    } finally {
      setPhotoUploadLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleDeletePhoto = async (bookingId, photoId) => {
    try {
      await axios.delete(`${API}/bookings/${bookingId}/photos/${photoId}`, { withCredentials: true });
      setClientCard(prev => prev ? {
        ...prev,
        bookings: prev.bookings.map(b => b.booking_id === bookingId
          ? { ...b, before_after_photos: (b.before_after_photos || []).filter(p => p.photo_id !== photoId) }
          : b
        )
      } : prev);
    } catch { notify.error("Foto konnte nicht gelöscht werden."); }
  };

  const handleTogglePhotoVisibility = async (bookingId, photoId, visible) => {
    try {
      await axios.patch(`${API}/bookings/${bookingId}/photos/${photoId}/release?visible=${visible}`, {}, { withCredentials: true });
      setClientCard(prev => prev ? {
        ...prev,
        bookings: prev.bookings.map(b => b.booking_id === bookingId
          ? { ...b, before_after_photos: (b.before_after_photos || []).map(p =>
              p.photo_id === photoId ? { ...p, visible_to_customer: visible } : p) }
          : b
        )
      } : prev);
    } catch { notify.error("Sichtbarkeit konnte nicht geändert werden."); }
  };

  const fetchUnreadMessages = async () => {
    try {
      const { data } = await axios.get(`${API}/messages/unread-count`, { withCredentials: true });
      setUnreadMessages(data?.unread_count || 0);
    } catch {}
  };

  const fetchAnalytics = async (studioId) => {
    if (!studioId) return;
    try {
      const { data } = await axios.get(`${API}/studios/${studioId}/analytics`, { withCredentials: true });
      setPageAnalytics(data);
    } catch {}
  };

  useEffect(() => {
    fetchStats();
    fetchSubscription();
    fetchUnreadMessages();
    // Poll every 8s for live updates (new bookings pop up fast)
    const pollInterval = setInterval(fetchStats, 8000);
    // Poll unread messages every 15s
    const msgInterval = setInterval(fetchUnreadMessages, 15000);
    // Re-evaluate time checks every 60s
    const tickInterval = setInterval(() => setTick(t => t + 1), 60000);
    return () => { clearInterval(pollInterval); clearInterval(msgInterval); clearInterval(tickInterval); };
  }, []);

  // Handle returning from Stripe onboarding (?stripe=done)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const stripeParam = params.get("stripe");
    if (stripeParam === "done") {
      navigate("/studio-dashboard", { replace: true });
      notify.success("Stripe-Onboarding abgeschlossen! Status wird geprüft…");
      // Stripe takes a moment to enable charges — retry up to 5× every 2 s
      let attempts = 0;
      const checkUntilComplete = async () => {
        try {
          const { data } = await axios.get(`${API}/stripe/connect/status`, { withCredentials: true });
          if (data?.status === "complete") {
            localStorage.setItem("inkbook_deposit_popup_dismissed", "1");
            localStorage.removeItem("inkbook_stripe_window_opened");
            setStripeWindowOpened(false);
            setConnectStatus(data);
            setShowDepositPopup(false);
            return;
          }
        } catch {}
        attempts++;
        if (attempts < 5) setTimeout(checkUntilComplete, 2000);
      };
      setTimeout(checkUntilComplete, 1000);
    }
  }, []); // eslint-disable-line

  useEffect(() => { calArtistIdRef.current   = calArtistId;   }, [calArtistId]);
  useEffect(() => { calBlockYearRef.current  = calBlockYear;  }, [calBlockYear]);
  useEffect(() => { calBlockMonthRef.current = calBlockMonth; }, [calBlockMonth]);

  useEffect(() => {
    const studioId = stats?.studio?.studio_id;
    if (studioId) {
      fetchCalCapacity(studioId, calBlockYear, calBlockMonth, calArtistId);
      fetchCalBlocks(studioId, calArtistId);
    }
  }, [calBlockMonth, calBlockYear, stats?.studio?.studio_id, calArtistId]); // eslint-disable-line

  useEffect(() => {
    const studioId = stats?.studio?.studio_id;
    if (studioId) fetchStudioArtists(studioId);
  }, [stats?.studio?.studio_id]); // eslint-disable-line

  useEffect(() => {
    if (activeTab === "invoices") fetchInvoices();
    if (activeTab === "waitlist") {
      setWaitlistLoading(true);
      axios.get(`${API}/studios/my/waitlist`, { withCredentials: true })
        .then(r => setStudioWaitlist(r.data?.entries || []))
        .catch(() => setStudioWaitlist([]))
        .finally(() => setWaitlistLoading(false));
    }
    if (activeTab === "clients") {
      const sid = stats?.studio?.studio_id;
      if (sid) fetchClients(sid);
      setSelectedClient(null);
      setClientCard(null);
      setClientSearch("");
    }
    if (activeTab === "shop") {
      const sid = stats?.studio?.studio_id;
      if (sid) { fetchShopProducts(sid); fetchShopOrders(sid); }
    }
  }, [activeTab]); // eslint-disable-line

  const fetchShopProducts = async (studioId) => {
    setShopLoading(true);
    try {
      const { data } = await axios.get(`${API}/studios/${studioId}/shop?include_inactive=true`, { withCredentials: true });
      setShopProducts(data || []);
    } catch { setShopProducts([]); } finally { setShopLoading(false); }
  };

  const fetchShopOrders = async (studioId) => {
    try {
      const { data } = await axios.get(`${API}/studios/${studioId}/shop/orders`, { withCredentials: true });
      setShopOrders(data || []);
    } catch { setShopOrders([]); }
  };

  const handleShopProductSave = async () => {
    const studioId = stats?.studio?.studio_id;
    if (!studioId || !shopProductForm.title.trim() || !shopProductForm.price_cents) return;
    setShopProductSaving(true);
    const payload = {
      type: shopProductForm.type,
      title: shopProductForm.title.trim(),
      description: shopProductForm.description.trim(),
      price_cents: parseInt(Math.round(parseFloat(shopProductForm.price_cents) * 100)) || 0,
      stock: shopProductForm.stock !== "" ? parseInt(shopProductForm.stock) : null,
      image_data: shopProductForm.image_data || null,
      active: shopProductForm.active,
    };
    try {
      if (shopProductModal?.product_id) {
        await axios.put(`${API}/studios/${studioId}/shop/${shopProductModal.product_id}`, payload, { withCredentials: true });
      } else {
        await axios.post(`${API}/studios/${studioId}/shop`, payload, { withCredentials: true });
      }
      setShopProductModal(null);
      await fetchShopProducts(studioId);
      notify.success(shopProductModal?.product_id ? "Produkt aktualisiert." : "Produkt erstellt.");
    } catch (e) {
      notify.error(e.response?.data?.detail || "Fehler beim Speichern.");
    } finally { setShopProductSaving(false); }
  };

  const handleShopProductDelete = async (productId) => {
    const studioId = stats?.studio?.studio_id;
    if (!studioId) return;
    setShopProductDeleting(prev => ({ ...prev, [productId]: true }));
    try {
      await axios.delete(`${API}/studios/${studioId}/shop/${productId}`, { withCredentials: true });
      setShopProducts(prev => prev.filter(p => p.product_id !== productId));
      notify.success("Produkt gelöscht.");
    } catch (e) {
      notify.error(e.response?.data?.detail || "Fehler beim Löschen.");
    } finally { setShopProductDeleting(prev => ({ ...prev, [productId]: false })); }
  };

  const handleShopToggleActive = async (product) => {
    const studioId = stats?.studio?.studio_id;
    try {
      await axios.put(`${API}/studios/${studioId}/shop/${product.product_id}`, { active: !product.active }, { withCredentials: true });
      setShopProducts(prev => prev.map(p => p.product_id === product.product_id ? { ...p, active: !product.active } : p));
    } catch { notify.error("Fehler beim Ändern."); }
  };

  const shopResizeImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const maxPx = 1200;
        let w = img.width, h = img.height;
        if (w > maxPx || h > maxPx) {
          if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
          else { w = Math.round(w * maxPx / h); h = maxPx; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const fetchSubscription = async () => {
    try {
      const { data } = await axios.get(`${API}/subscriptions/status`, { withCredentials: true });
      setSubscription(data?.subscription);
    } catch {}
  };

  const generateRevenuePDF = () => {
    const doc = new jsPDF();
    const studioName = stats?.studio?.name || "Studio";
    const now = new Date();
    const monthLabel = now.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
    const typeLabels = { tattoo: "Tattoo", consultation: "Beratung", full_day: "Ganztag", video_consultation: "Videoberatung" };

    // Sort completed bookings for current month by date asc
    const rows = completedBookings
      .filter(b => b.date >= firstDayOfMonth)
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    // ── Header ────────────────────────────────────────────────
    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, 210, 36, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text("StudioOS", 14, 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.text("Umsatzbericht", 14, 25);

    // ── Meta ──────────────────────────────────────────────────
    doc.setTextColor(24, 24, 27);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Monatsumsatz · ${monthLabel}`, 14, 48);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(studioName, 14, 56);
    doc.text(
      `Erstellt am ${now.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}`,
      14, 63
    );

    // ── Summary boxes ─────────────────────────────────────────
    const sumBoxes = [
      { label: "Abgeschlossene Termine", value: String(rows.length) },
      { label: "Monatsumsatz", value: `\u20AC ${monthRevenue.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    ];
    const boxW = 86; const boxH = 16; const boxY = 70;
    sumBoxes.forEach((b, i) => {
      const x = 14 + i * (boxW + 6);
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(x, boxY, boxW, boxH, 3, 3, "F");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(b.label, x + 4, boxY + 6);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(24, 24, 27);
      doc.text(b.value, x + 4, boxY + 13);
      doc.setFont("helvetica", "normal");
    });

    // ── Table ─────────────────────────────────────────────────
    autoTable(doc, {
      startY: 94,
      head: [["Datum", "Uhrzeit", "Kunde", "Art des Termins", "Zahlungsart", "Betrag"]],
      body: rows.length > 0
        ? rows.map(b => [
            b.date ? new Date(b.date + "T12:00:00").toLocaleDateString("de-DE") : "–",
            b.start_time && b.end_time ? `${b.start_time} – ${b.end_time}` : b.start_time || "–",
            b.user_name || "–",
            typeLabels[b.booking_type] || b.booking_type || "–",
            b.payment_method === "stripe" ? "Stripe" : b.payment_method === "cash" ? "Bar" : "–",
            `\u20AC ${(b.revenue || 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          ])
        : [["–", "–", "Keine abgeschlossenen Termine in diesem Monat", "", "", ""]],
      foot: rows.length > 0
        ? [["", "", "", "", "Gesamt", `\u20AC ${monthRevenue.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]]
        : undefined,
      styles: { font: "helvetica", fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      footStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [249, 249, 249] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 26 },
        2: { cellWidth: 42 },
        3: { cellWidth: 30 },
        4: { cellWidth: 28 },
        5: { cellWidth: 28, halign: "right" },
      },
      tableLineColor: [235, 235, 235],
      tableLineWidth: 0.1,
    });

    // ── Footer ────────────────────────────────────────────────
    const pageH = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text("Erstellt mit StudioOS · inkbook.io", 14, pageH - 8);

    const fname = `inkbook-monatsumsatz-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.pdf`;
    doc.save(fname);
  };

  const handleRefundDeposit = async (bookingId) => {
    setDepositRefundLoading(bookingId);
    try {
      await axios.post(`${API}/bookings/${bookingId}/refund-deposit`, {}, { withCredentials: true });
      notify.success("Rückerstattung eingeleitet! Der Kunde erhält eine E-Mail-Bestätigung.");
      fetchStats();
    } catch (e) {
      notify.error(e.response?.data?.detail || "Fehler bei der Rückzahlung");
    } finally { setDepositRefundLoading(""); }
  };

  const handleCheckFinalPayment = async (bookingId) => {
    setCheckPayLoading(prev => ({ ...prev, [bookingId]: true }));
    try {
      const { data } = await axios.post(`${API}/bookings/${bookingId}/check-final-payment`, {}, { withCredentials: true });
      if (data.status === "paid") {
        notify.success(`Zahlung bestätigt! € ${parseFloat(data.amount || 0).toFixed(2)} als Umsatz gebucht.`);
        fetchStats();
      } else if (data.status === "pending") {
        notify.info("Zahlung noch nicht eingegangen. Kunde hat den Link noch nicht bezahlt.");
      } else if (data.status === "already_paid") {
        notify.info("Zahlung war bereits gebucht.");
        fetchStats();
      } else {
        notify.warn("Kein Zahlungslink für diesen Termin gefunden.");
      }
    } catch (e) {
      notify.error(e.response?.data?.detail || "Stripe-Abfrage fehlgeschlagen.");
    } finally {
      setCheckPayLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleFinalPayment = async () => {
    if (!finalPayModal) return;
    const amount = parseFloat(finalPayAmount || 0);
    if (amount <= 0) { notify.error("Bitte einen Betrag eingeben."); return; }
    setFinalPayLoading(true);
    try {
      if (finalPayMethod === "cash") {
        await axios.put(`${API}/bookings/${finalPayModal.booking_id}/complete`, { revenue: amount, payment_method: "cash" }, { withCredentials: true });
        notify.success(`€ ${amount.toFixed(2)} als Bareinnahme gespeichert.`);
      } else {
        const { data } = await axios.post(`${API}/bookings/${finalPayModal.booking_id}/send-final-payment`, { amount, origin_url: window.location.origin }, { withCredentials: true });
        notify.success(`Zahlungslink an ${data.email_sent_to || "Kunde"} gesendet!`);
      }
      setFinalPayModal(null);
      setFinalPayAmount("");
      setFinalPayMethod("cash");
      fetchStats();
    } catch (e) {
      notify.error(e.response?.data?.detail || "Fehler bei der Zahlung.");
    } finally { setFinalPayLoading(false); }
  };

  const handleCompleteBooking = async (bookingId) => {    const revenue = parseFloat(revenueInputs[bookingId] || 0);
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/bookings/${bookingId}/complete`,
        { revenue },
        { withCredentials: true }
      );
      setRevenueInputs(prev => { const n = { ...prev }; delete n[bookingId]; return n; });
      fetchStats();
    } catch (e) {
      notify.error("Fehler beim Abschließen des Termins.");
    }
  };

  const handleCreateOffer = async () => {
    if (!offerModal) return;
    if (!offerForm.offer_date || !offerForm.offer_time || !offerForm.offer_total_price || !offerForm.offer_deposit_amount) {
      notify.error("Bitte alle Pflichtfelder ausfüllen (Datum, Uhrzeit, Gesamtpreis, Anzahlung).");
      return;
    }
    setOfferLoading(true);
    const isInquiry = !!offerModal._inquiry_id;
    try {
      const url = isInquiry
        ? `${API}/inquiries/${offerModal._inquiry_id}/offer`
        : `${API}/bookings/${offerModal.booking_id}/offer`;
      await axios.post(url, {
        offer_date: offerForm.offer_date,
        offer_time: offerForm.offer_time,
        offer_duration_min: parseInt(offerForm.offer_duration_min) || 120,
        offer_total_price: parseFloat(offerForm.offer_total_price) || 0,
        offer_deposit_amount: parseFloat(offerForm.offer_deposit_amount) || 0,
        offer_notes: offerForm.offer_notes,
      }, { withCredentials: true });
      setOfferModal(null);
      setOfferForm({ offer_date: "", offer_time: "", offer_duration_min: 120, offer_total_price: "", offer_deposit_amount: "", offer_notes: "" });
      fetchStats();
      if (isInquiry) fetchInquiries(stats?.studio?.studio_id, false);
    } catch (e) {
      notify.error(e.response?.data?.detail || "Fehler beim Erstellen des Angebots");
    } finally { setOfferLoading(false); }
  };

  const handleContactCustomer = async (booking) => {
    if (booking.status === "pending") {
      const studioName = stats?.studio?.name || "unser Studio";
      const firstName = (booking.user_name || "").split(" ")[0] || booking.user_name;
      const dateStr = booking.date
        ? new Date(booking.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })
        : "";
      const typeMap = { tattoo: "Tattoo-Termin", consultation: "Beratung", full_day: "Ganztages-Termin", video_consultation: "Videoberatung" };
      const typeStr = typeMap[booking.booking_type] || "Termin";
      const msg = `Hallo ${firstName} 👋\n\nHier meldet sich ${studioName} zu deiner Buchung:\n\n📅 ${dateStr} · ${booking.start_time} – ${booking.end_time}\n✏️ ${typeStr}\n\nBei Fragen oder Wünschen, schreib mir gerne hier. Bis bald! 🎨`;
      navigate(`/messages/${booking.user_id}`, {
        state: { recipientName: booking.user_name, recipientRole: "customer", initialMessage: msg }
      });
    } else {
      navigate(`/messages/${booking.user_id}`, {
        state: { recipientName: booking.user_name, recipientRole: "customer" }
      });
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API}/dashboard/stats`, { withCredentials: true });
      setStats(data);
      if (data.has_studio && data.studio) {
        fetchCalBlocks(data.studio.studio_id, calArtistIdRef.current);
        fetchCalCapacity(data.studio.studio_id, calBlockYearRef.current, calBlockMonthRef.current, calArtistIdRef.current);
        fetchConnectStatus();
        fetchAnalytics(data.studio.studio_id);
        const firstLoad = !inquiriesInitialized.current;
        if (firstLoad) inquiriesInitialized.current = true;
        fetchInquiries(data.studio.studio_id, firstLoad);
        const studio = data.studio;
        const ibanLookup = studio.bank_iban ? lookupIban(studio.bank_iban) : null;
        setEditForm(prev => prev === null ? { ...studio, bank_institution: ibanLookup ? ibanLookup.name : "" } : prev);
      }
    } catch { navigate("/login"); } finally { setLoading(false); }
  };

  const fetchInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    try {
      const { data } = await axios.get(`${API}/studios/my/invoices`, { withCredentials: true });
      setInvoices(data.invoices || []);
    } catch { /* ignore */ } finally { setInvoicesLoading(false); }
  }, []);

  const fetchConnectStatus = async () => {
    const isNew = new URLSearchParams(window.location.search).get("stripe") === "setup";
    try {
      const { data } = await axios.get(`${API}/stripe/connect/status`, { withCredentials: true });
      setConnectStatus(data);
      if (data?.status === "complete") {
        // Onboarding done — close popup and mark dismissed so it never reappears
        localStorage.setItem("inkbook_deposit_popup_dismissed", "1");
        localStorage.removeItem("inkbook_stripe_window_opened");
        setStripeWindowOpened(false);
        setShowDepositPopup(false);
      } else {
        const dismissed = localStorage.getItem("inkbook_deposit_popup_dismissed");
        if (!dismissed) {
          setTimeout(() => setShowDepositPopup(true), isNew ? 0 : 800);
        }
      }
    } catch (e) {
      // 404 = kein Stripe-Account → definitiv nicht verbunden → Popup zeigen
      const status = e?.response?.status;
      if (status === 404 || status === undefined) {
        setConnectStatus(null);
        const dismissed = localStorage.getItem("inkbook_deposit_popup_dismissed");
        if (!dismissed) setTimeout(() => setShowDepositPopup(true), isNew ? 0 : 800);
      }
    }
  };

  const dismissDepositPopup = (permanent = false) => {
    if (permanent) localStorage.setItem("inkbook_deposit_popup_dismissed", "1");
    setShowDepositPopup(false);
  };

  const fetchInquiries = async (studioId, isFirstLoad = false) => {
    if (!studioId) return;
    if (isFirstLoad) setInquiriesLoading(true);
    try {
      const { data } = await axios.get(`${API}/studios/${studioId}/inquiries`, { withCredentials: true });
      setInquiries(data || []);
    } catch {} finally { if (isFirstLoad) setInquiriesLoading(false); }
  };

  const updateInquiryStatus = async (inquiryId, status) => {
    try {
      await axios.patch(`${API}/inquiries/${inquiryId}/status`, { status }, { withCredentials: true });
      setInquiries(prev => prev.map(i => i.inquiry_id === inquiryId ? { ...i, status } : i));
    } catch {}
  };

  const handleDeleteInquiry = async () => {
    if (!rejectModal) return;
    setRejectLoading(true);
    try {
      await axios.delete(`${API}/inquiries/${rejectModal.inquiry_id}`, {
        data: { reason: rejectReason.trim() },
        withCredentials: true,
      });
      setInquiries(prev => prev.filter(i => i.inquiry_id !== rejectModal.inquiry_id));
      setRejectModal(null);
      setRejectReason("");
    } catch (err) {
      notify.error(err.response?.data?.detail || "Fehler beim Löschen.");
    } finally { setRejectLoading(false); }
  };

  const handleConnectStripe = async () => {
    setConnectLoading(true);
    setStripeConnectError(null);
    try {
      const { data } = await axios.post(`${API}/stripe/connect/create`, {}, { withCredentials: true });
      if (data.onboarding_url) {
        window.open(data.onboarding_url, "_blank", "noopener,noreferrer");
        localStorage.setItem("inkbook_stripe_window_opened", "1");
        setStripeWindowOpened(true);
        setTimeout(() => fetchConnectStatus(), 3000);
      } else if (data.status === "complete") {
        fetchConnectStatus();
      }
    } catch (e) {
      const detail = e.response?.data?.detail;
      if (detail === "STRIPE_CONNECT_NOT_ENABLED") {
        setStripeConnectError("not_enabled");
      } else {
        setStripeConnectError(detail || "Stripe-Fehler");
      }
    } finally { setConnectLoading(false); }
  };

  const fetchStudioArtists = async (studioId) => {
    try {
      const { data } = await axios.get(`${API}/studios/${studioId}/artists`);
      setStudioArtists(data || []);
    } catch {}
  };

  const fetchCalBlocks = async (studioId, artistId = null) => {
    try {
      const params = artistId ? { artist_id: artistId } : {};
      const { data } = await axios.get(`${API}/studios/${studioId}/calendar-blocks`, { params });
      setCalBlocks(data);
    } catch {}
  };

  const fetchCalCapacity = async (studioId, year, month, artistId = null) => {
    try {
      const params = { year, month, ...(artistId ? { artist_id: artistId } : {}) };
      const { data } = await axios.get(`${API}/studios/${studioId}/capacity-calendar`, { params });
      setCalCapData(data.dates || {});
      if (data.slots_visible_until !== undefined) setVisibleUntil(data.slots_visible_until || "");
      if (data.day_capacity) { setDayCapacity(data.day_capacity); setDayCapInput(data.day_capacity); }
      if (data.size_capacity) setSizeCapacity(data.size_capacity);
    } catch {}
  };

  const handleSaveDayCapacity = async () => {
    const studioId = stats?.studio?.studio_id;
    if (!studioId) return;
    setDayCapSaving(true);
    try {
      const { data } = await axios.put(`${API}/studios/my/day-capacity`, { day_capacity: Number(dayCapInput) }, { withCredentials: true });
      setDayCapacity(data.day_capacity);
      notify.success("Tageskapazität gespeichert");
      await fetchCalCapacity(studioId, calBlockYear, calBlockMonth, calArtistId);
    } catch (e) { notify.error(e.response?.data?.detail || "Fehler"); }
    finally { setDayCapSaving(false); }
  };

  const handleSaveCalBlock = async () => {
    if (calSelectedDates.size === 0) return;
    const studioId = stats?.studio?.studio_id;
    const customCap = calBlockPickCap !== "" && Number(calBlockPickCap) > 0 ? Number(calBlockPickCap) : null;
    // If no restriction is shown, we save as "available" (no blocking, just capacity override if set)
    const blockType = showBlockRestriction ? calBlockPickType : "available";
    if (!showBlockRestriction && !customCap) { notify.error("Bitte Kapazität eingeben oder eine Einschränkung wählen."); return; }
    setCalBlockSaving(true);
    try {
      await Promise.all([...calSelectedDates].map(date =>
        axios.post(`${API}/studios/${studioId}/calendar-blocks`, {
          date,
          block_type: blockType,
          note: calBlockPickNote,
          artist_id: calArtistId || null,
          custom_capacity: customCap,
        }, { withCredentials: true })
      ));
      await Promise.all([fetchCalBlocks(studioId, calArtistId), fetchCalCapacity(studioId, calBlockYear, calBlockMonth, calArtistId)]);
      setCalBlockPickModal(false);
      setCalSelectedDates(new Set());
      setCalBlockPickNote("");
    } catch (e) {
      notify.error(e.response?.data?.detail || "Fehler beim Speichern");
    } finally { setCalBlockSaving(false); }
  };

  const handleDeleteCalBlock = async (blockId) => {
    const studioId = stats?.studio?.studio_id;
    try {
      await axios.delete(`${API}/studios/${studioId}/calendar-blocks/${blockId}`, { withCredentials: true });
      await Promise.all([fetchCalBlocks(studioId, calArtistId), fetchCalCapacity(studioId, calBlockYear, calBlockMonth, calArtistId)]);
    } catch {}
  };

  const handleSaveVisibleUntil = async (cutoffValue) => {
    const studioId = stats?.studio?.studio_id;
    if (!studioId) return;
    setVisibleUntilSaving(true);
    try {
      await axios.put(`${API}/studios/my/visibility-cutoff`, { slots_visible_until: cutoffValue ?? null }, { withCredentials: true });
      notify.success("Sichtbarkeit gespeichert");
      await fetchCalCapacity(studioId, calBlockYear, calBlockMonth, calArtistId);
    } catch { notify.error("Fehler beim Speichern"); }
    finally { setVisibleUntilSaving(false); }
  };

  const handleCreateStudio = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/studios`, studioForm, { withCredentials: true });
      setShowCreateStudio(false);
      fetchStats();
    } catch (err) { notify.error(err.response?.data?.detail || "Fehler beim Erstellen"); }
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      await axios.put(`${API}/bookings/${bookingId}/status`, null, { params: { status: "confirmed" }, withCredentials: true });
      fetchStats();
    } catch {}
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const { bank_institution, ...payload } = editForm;
      await axios.put(`${API}/studios/${stats.studio.studio_id}`, payload, { withCredentials: true });
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3000);
      fetchStats();
    } catch (err) { notify.error(err.response?.data?.detail || "Fehler"); } finally { setEditLoading(false); }
  };

  const handleChangeName = async () => {
    if (!accountForm.name.trim()) return;
    setAccountLoading("name");
    setAccountMsg(null);
    try {
      await axios.put(`${API}/users/me`, { name: accountForm.name.trim() }, { withCredentials: true });
      setAccountMsg({ type: "success", text: "Name erfolgreich geändert." });
      setAccountForm(f => ({ ...f, name: "" }));
    } catch (e) { setAccountMsg({ type: "error", text: e.response?.data?.detail || "Fehler" }); }
    finally { setAccountLoading(""); }
  };

  const handleChangePassword = async () => {
    if (!accountForm.currentPassword || !accountForm.newPassword) return;
    if (accountForm.newPassword !== accountForm.confirmPassword) {
      setAccountMsg({ type: "error", text: "Neue Passwörter stimmen nicht überein." });
      return;
    }
    setAccountLoading("password");
    setAccountMsg(null);
    try {
      await axios.put(`${API}/users/me/password`, { current_password: accountForm.currentPassword, new_password: accountForm.newPassword }, { withCredentials: true });
      setAccountMsg({ type: "success", text: "Passwort erfolgreich geändert." });
      setAccountForm(f => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (e) { setAccountMsg({ type: "error", text: e.response?.data?.detail || "Fehler" }); }
    finally { setAccountLoading(""); }
  };

  const handleDeleteAccount = async () => {
    try {
      await axios.delete(`${API}/users/me`, { withCredentials: true });
      window.location.href = "/";
    } catch (e) { setAccountMsg({ type: "error", text: e.response?.data?.detail || "Fehler beim Löschen" }); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImg(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await axios.post(`${API}/upload/image`, formData, { withCredentials: true });
      setEditForm(prev => ({ ...prev, images: [...(prev.images || []), data.url] }));
    } catch {} finally { setUploadingImg(false); }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingBanner(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await axios.post(`${API}/upload/image`, formData, { withCredentials: true });
      setEditForm(prev => ({ ...prev, banner_image: data.url }));
    } catch {} finally { setUploadingBanner(false); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await axios.post(`${API}/upload/image`, formData, { withCredentials: true });
      setEditForm(prev => ({ ...prev, logo_image: data.url }));
    } catch {} finally { setUploadingLogo(false); }
  };

  const toggleStyle = (style) => {
    setEditForm(prev => ({
      ...prev,
      styles: prev.styles?.includes(style) ? prev.styles.filter(s => s !== style) : [...(prev.styles || []), style]
    }));
  };

  const toggleCreateStyle = (style) => {
    setStudioForm(prev => ({
      ...prev,
      styles: prev.styles.includes(style) ? prev.styles.filter(s => s !== style) : [...prev.styles, style]
    }));
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-50"><Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <motion.div key={i}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
              className="w-2 h-2 rounded-full bg-zinc-400"
            />
          ))}
        </div>
      </div>
    </div>
  );

  if (!stats?.has_studio && !showCreateStudio) {
    return (
      <div className="min-h-screen bg-zinc-50"><Navbar />
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Plus size={24} className="text-zinc-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-playfair font-semibold mb-3">Studio erstellen</h2>
          <p className="text-zinc-500 font-inter mb-8">Richte dein Studio-Profil ein und starte mit Buchungen.</p>
          <button onClick={() => setShowCreateStudio(true)} className="btn-primary" data-testid="create-studio-btn">
            Studio erstellen
          </button>
        </div>
      </div>
    );
  }

  if (showCreateStudio) {
    return (
      <div className="min-h-screen bg-zinc-50"><Navbar />
        <div className="max-w-2xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-playfair font-semibold mb-8">Studio erstellen</h2>
          <form onSubmit={handleCreateStudio} className="space-y-5">
            <div>
              <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Studio-Name *</label>
              <input type="text" value={studioForm.name} onChange={e => setStudioForm({...studioForm, name: e.target.value})} required className="input-base w-full" data-testid="studio-name-input" />
            </div>
            <div>
              <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Beschreibung *</label>
              <textarea value={studioForm.description} onChange={e => setStudioForm({...studioForm, description: e.target.value})} required rows={3} className="input-base w-full resize-none" data-testid="studio-description-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Adresse *</label>
                <input type="text" value={studioForm.address} onChange={e => setStudioForm({...studioForm, address: e.target.value})} required className="input-base w-full" data-testid="studio-address-input" />
              </div>
              <div>
                <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Stadt *</label>
                <input type="text" value={studioForm.city} onChange={e => setStudioForm({...studioForm, city: e.target.value})} required className="input-base w-full" data-testid="studio-city-input" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Tattoo-Stile</label>
              <div className="flex flex-wrap gap-2">
                {STYLES_LIST.map(s => (
                  <button key={s} type="button" onClick={() => toggleCreateStyle(s)} className={`px-3 py-1.5 text-xs rounded-full border font-inter transition-all ${studioForm.styles.includes(s) ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 hover:border-zinc-400"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Telefon</label>
                <input type="text" value={studioForm.phone} onChange={e => setStudioForm({...studioForm, phone: e.target.value})} className="input-base w-full" />
              </div>
              <div>
                <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Preisklasse</label>
                <select value={studioForm.price_range} onChange={e => setStudioForm({...studioForm, price_range: e.target.value})} className="input-base w-full" data-testid="studio-price-select">
                  <option value="budget">Günstig</option><option value="medium">Mittel</option><option value="premium">Premium</option><option value="luxury">Luxus</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full justify-center" data-testid="submit-create-studio-btn">Studio erstellen</button>
          </form>
        </div>
      </div>
    );
  }

  const studio = stats?.studio;
  const upcomingBookings = stats?.upcoming_bookings || [];
  const allStudioBookings = stats?.all_bookings || [];

  // Local date (not UTC!) to avoid timezone bugs for German users
  const nowTime = new Date();
  const todayStr = `${nowTime.getFullYear()}-${String(nowTime.getMonth()+1).padStart(2,'0')}-${String(nowTime.getDate()).padStart(2,'0')}`;
  const now = nowTime;
  const isBookingPast = (b) => {
    if (!b.date || !b.end_time) return false;
    return now > new Date(`${b.date}T${b.end_time}:00`);
  };
  const isBookingToday = (b) => b.date === todayStr;

  // Use allStudioBookings (not limited upcoming_bookings) for the overview
  const STUDIO_ACTIVE = ["pending","pending_studio_review","under_review","offer_sent","waiting_for_deposit","deposit_pending","confirmed"];
  const STUDIO_CLOSED = ["cancelled","customer_cancelled","studio_cancelled","completed","no_show"];
  const allActiveBookings = allStudioBookings.filter(b => STUDIO_ACTIVE.includes(b.status));
  const todayUpcoming = allActiveBookings
    .filter(b => isBookingToday(b) && !isBookingPast(b) && b.status === "confirmed")
    .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
  const futureUpcoming = allActiveBookings
    .filter(b => (b.date || "") > todayStr && ["confirmed","waiting_for_deposit","deposit_pending"].includes(b.status))
    .sort((a, b) => a.date === b.date ? (a.start_time || "").localeCompare(b.start_time || "") : a.date.localeCompare(b.date));
  const newRequests = allStudioBookings.filter(b => ["pending_studio_review","under_review","pending"].includes(b.status));

  // For bookings tab
  const activeBookings = allStudioBookings.filter(b =>
    STUDIO_ACTIVE.includes(b.status) && !isBookingPast(b)
  );
  const pastStudioBookings = allStudioBookings.filter(b =>
    isBookingPast(b) || STUDIO_CLOSED.includes(b.status)
  );

  // Revenue calculations (only completed bookings)
  const completedBookings = allStudioBookings.filter(b => b.status === "completed");
  const todayRevenue = completedBookings
    .filter(b => b.date === todayStr)
    .reduce((s, b) => s + (b.revenue || 0), 0);
  const totalRevenue = completedBookings.reduce((s, b) => s + (b.revenue || 0), 0);

  // Navigable month revenue
  const revenueMonthPrefix = `${revenueNavYear}-${String(revenueNavMonth).padStart(2,'0')}`;
  const isCurrentMonth = revenueNavYear === nowTime.getFullYear() && revenueNavMonth === nowTime.getMonth() + 1;
  const revenueMonthLabel = new Date(revenueNavYear, revenueNavMonth - 1, 1).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
  const monthRevenue = completedBookings
    .filter(b => (b.date || "").startsWith(revenueMonthPrefix))
    .reduce((s, b) => s + (b.revenue || 0), 0);
  const handleRevenueMonthPrev = () => {
    if (revenueNavMonth === 1) { setRevenueNavMonth(12); setRevenueNavYear(y => y - 1); }
    else setRevenueNavMonth(m => m - 1);
  };
  const handleRevenueMonthNext = () => {
    if (revenueNavMonth === 12) { setRevenueNavMonth(1); setRevenueNavYear(y => y + 1); }
    else setRevenueNavMonth(m => m + 1);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      {/* ── Dashboard Layout ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="flex gap-6 items-start">

          {/* ── Sidebar ── */}
          <aside className="w-52 flex-shrink-0 sticky top-20 hidden md:flex flex-col gap-3">
            {/* Studio card */}
            <div className="bg-zinc-900 rounded-2xl p-4 relative overflow-hidden">
              <DashboardHeroSmoke />
              <div className="relative">
                <p className="text-[9px] tracking-widest uppercase font-inter mb-1.5" style={{ color: "rgba(255,255,255,0.28)" }}>Studio Dashboard</p>
                <h2 className="font-playfair font-bold text-white text-base leading-tight">{studio?.name}</h2>
                {studio?.is_verified && (
                  <span className="text-[9px] font-inter mt-1 block" style={{ color: "rgba(255,255,255,0.45)" }}>● Verifiziert</span>
                )}
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <p className="text-sm font-playfair font-semibold text-white">{stats?.total_bookings || 0}</p>
                    <p className="text-[9px] font-inter mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Buchungen</p>
                  </div>
                  <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <p className="text-sm font-playfair font-semibold text-white">{stats?.pending_bookings || 0}</p>
                    <p className="text-[9px] font-inter mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Ausstehend</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-2 space-y-0.5">
              {[
                { id: "overview",  icon: <LayoutGrid    size={15} strokeWidth={1.5} />, label: "Übersicht",    badge: 0 },
                { id: "bookings",  icon: <BookOpen      size={15} strokeWidth={1.5} />, label: "Buchungen",    badge: activeBookings.filter(b => ["pending","pending_studio_review","under_review"].includes(b.status)).length },
                { id: "inquiries", icon: <Inbox         size={15} strokeWidth={1.5} />, label: "Anfragen",     badge: inquiries.filter(i => i.status === "pending").length },
                { id: "kalender",  icon: <CalendarPlus  size={15} strokeWidth={1.5} />, label: "Kalender",     badge: 0 },
                { id: "waitlist",  icon: <Bell          size={15} strokeWidth={1.5} />, label: "Warteliste",   badge: studioWaitlist.filter(e => e.status === "active").length },
                { id: "artists",   icon: <Users         size={15} strokeWidth={1.5} />, label: "Artists",      badge: 0 },
                { id: "clients",   icon: <Camera        size={15} strokeWidth={1.5} />, label: "Kunden",        badge: 0 },
                { id: "shop",      icon: <ShoppingBag   size={15} strokeWidth={1.5} />, label: "Shop",          badge: 0 },
                { id: "invoices",  icon: <Receipt       size={15} strokeWidth={1.5} />, label: "Rechnungen",   badge: 0 },
                { id: "messages",  icon: <MessageSquare size={15} strokeWidth={1.5} />, label: "Nachrichten",  badge: unreadMessages, href: "/messages" },
                { id: "profile",   icon: <Settings2     size={15} strokeWidth={1.5} />, label: "Profil & Link",badge: 0 },
              ].map(item => (
                <button key={item.id}
                  onClick={() => item.href ? navigate(item.href) : setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-inter font-medium transition-all ${activeTab === item.id ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}`}
                  data-testid={`studio-tab-${item.id}`}
                >
                  {item.icon}
                  <span className="flex-1 text-left text-xs">{item.label}</span>
                  {item.badge > 0 && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${activeTab === item.id ? "bg-white/20 text-white" : "bg-zinc-900 text-white"}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Beta-Hinweis Sidebar */}
            <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-md bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={11} className="text-violet-600" />
                </div>
                <span className="text-[10px] font-inter font-bold text-violet-700 tracking-wide uppercase">Beta</span>
              </div>
              <p className="text-xs font-inter text-zinc-600 leading-relaxed mb-2">
                Du nutzt StudioOS in der <strong>Beta-Phase</strong> — kostenlos und ohne Einschränkungen.
              </p>
              <p className="text-xs font-inter text-zinc-500 leading-relaxed">
                Weitere Features wie erweiterte Analytics, priorisiertes Listing und mehr kommen bald — dann mit optionalem Abo-Modell.
              </p>
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            {/* Mobile tab bar */}
            <div className="flex gap-1 mb-5 md:hidden bg-white rounded-2xl border border-black/[0.04] shadow-[0_2px_10px_rgb(0,0,0,0.04)] p-1.5 overflow-x-auto">
              {[
                { id: "overview",  label: "Übersicht",  badge: 0 },
                { id: "bookings",  label: "Buchungen",  badge: activeBookings.filter(b => ["pending","pending_studio_review","under_review"].includes(b.status)).length },
                { id: "inquiries", label: "Anfragen",   badge: inquiries.filter(i => i.status === "pending").length },
                { id: "kalender",  label: "Kalender",   badge: 0 },
                { id: "artists",   label: "Artists",    badge: 0 },
                { id: "clients",   label: "Kunden",     badge: 0 },
                { id: "shop",      label: "Shop",       badge: 0 },
                { id: "messages",  label: "Nachrichten", badge: unreadMessages, href: "/messages" },
                { id: "profile",   label: "Profil",     badge: 0 },
              ].map(tab => (
                <button key={tab.id}
                  onClick={() => tab.href ? navigate(tab.href) : setActiveTab(tab.id)}
                  className={`relative flex-shrink-0 px-3 py-2 rounded-xl text-xs font-inter font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}`}
                  data-testid={`studio-tab-${tab.id}`}
                >
                  {tab.label}
                  {tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

        {/* Beta Banner — mobile + oben im Hauptbereich */}
        <AnimatePresence>
          {betaBannerOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="mb-5 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-violet-50 px-5 py-4 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles size={14} className="text-violet-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-inter font-bold text-violet-700">Beta-Version</span>
                    <span className="text-[10px] font-inter px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 font-semibold">Kostenlos</span>
                  </div>
                  <p className="text-xs font-inter text-zinc-600 leading-relaxed">
                    Du nutzt StudioOS in der Beta-Phase — alle aktuellen Features sind <strong>kostenlos</strong>. Erweiterte Features wie Analytics, priorisiertes Listing und mehr kommen bald mit einem optionalen Abo-Modell.
                  </p>
                </div>
              </div>
              <button onClick={() => setBetaBannerOpen(false)} className="text-zinc-300 hover:text-zinc-500 transition-colors flex-shrink-0 mt-0.5">
                <X size={16} strokeWidth={2} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="space-y-5"
          >
            {/* Stats grid */}
            <motion.div
              initial="hidden" animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3"
            >
              {[
                { label: "Buchungen",     value: stats?.total_bookings    || 0, icon: <Calendar    size={16} strokeWidth={1.5} /> },
                { label: "Ausstehend",    value: stats?.pending_bookings  || 0, icon: <Clock       size={16} strokeWidth={1.5} /> },
                { label: "Bestätigt",     value: stats?.confirmed_bookings|| 0, icon: <CheckCircle size={16} strokeWidth={1.5} /> },
                { label: "Abgeschlossen", value: completedBookings.length,      icon: <TrendingUp  size={16} strokeWidth={1.5} /> }
              ].map((stat, i) => (
                <motion.div key={i}
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 22 } } }}
                  whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.08)" }}
                  className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-4 cursor-default"
                >
                  <div className="text-zinc-400 mb-2">{stat.icon}</div>
                  <p className="text-2xl font-playfair font-semibold text-zinc-900">{stat.value}</p>
                  <p className="text-xs text-zinc-500 font-inter mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Umsatz & Zahlungen — unified card */}
            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center">
                    <TrendingUp size={14} className="text-white" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-inter font-semibold text-zinc-900">Umsatz &amp; Zahlungen</p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button whileTap={{ scale: 0.96 }} onClick={generateRevenuePDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 rounded-full font-inter text-xs text-zinc-600 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all"
                    data-testid="pdf-export-btn">
                    <Download size={12} strokeWidth={1.8} /> PDF
                  </motion.button>
                  <span className="text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 bg-zinc-50 px-2.5 py-1 rounded-full border border-zinc-100">Live</span>
                </div>
              </div>
              {/* Monat — navigierbar */}
              <div className="bg-zinc-900 rounded-xl p-4 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={handleRevenueMonthPrev} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                    <ChevronLeft size={15} strokeWidth={2} />
                  </button>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-inter font-semibold tracking-widest uppercase text-white/50">{revenueMonthLabel}</p>
                    {isCurrentMonth && (
                      <span className="text-[9px] font-inter font-semibold bg-white/10 text-white/60 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Aktuell</span>
                    )}
                  </div>
                  <button onClick={handleRevenueMonthNext} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                    <ChevronRight size={15} strokeWidth={2} />
                  </button>
                </div>
                <p className="text-3xl font-playfair font-semibold text-white text-center">€&thinsp;{monthRevenue.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-white/30 font-inter mt-1 text-center">abgeschlossene Termine</p>
              </div>
              {/* 3 cards: Bar gesamt · Stripe gesamt · Insgesamt */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-50 rounded-xl p-4" data-testid="revenue-card-0">
                  <p className="text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Bar</p>
                  <p className="text-2xl font-playfair font-semibold text-zinc-900">€&thinsp;{(stats?.cash_revenue_total ?? 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-zinc-400 font-inter mt-1">Barzahlungen gesamt</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-4" data-testid="revenue-card-1">
                  <p className="text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Stripe</p>
                  <p className="text-2xl font-playfair font-semibold text-zinc-900">€&thinsp;{(stats?.stripe_revenue_total ?? 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-zinc-400 font-inter mt-1">Kartenzahlungen gesamt</p>
                </div>
                <div className="bg-zinc-900 rounded-xl p-4" data-testid="revenue-card-2">
                  <p className="text-[10px] font-inter font-semibold tracking-widest uppercase text-white/40 mb-1.5">Insgesamt</p>
                  <p className="text-2xl font-playfair font-semibold text-white">€&thinsp;{totalRevenue.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-white/30 font-inter mt-1">bar &amp; stripe</p>
                </div>
              </div>
            </div>

            {/* Heutige Termine – Dark Inverted Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05, type: "spring", stiffness: 280, damping: 22 }}
              className="bg-zinc-900 rounded-2xl p-6 relative overflow-hidden"
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "linear", repeatDelay: 4 }}
              />
              <div className="flex items-center gap-2 mb-4 relative">
                <div className="relative flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div className="w-4 h-4 rounded-full bg-emerald-400/20 animate-ping absolute -top-1 -left-1" />
                </div>
                <h3 className="font-playfair font-semibold text-lg text-white">Heutige Termine</h3>
                <span className="text-xs font-inter font-medium text-white/40 bg-white/10 px-2 py-0.5 rounded-full">{todayUpcoming.length}</span>
              </div>
              {todayUpcoming.length === 0 ? (
                <div className="py-8 flex flex-col items-center text-center">
                  <p className="font-playfair text-lg text-white/70 mb-1">Keine Termine heute</p>
                  <p className="text-xs text-white/40 font-inter">Freier Tag – genieße die Ruhe</p>
                </div>
              ) : (
                <div className="space-y-3 relative">
                  {todayUpcoming.map((b, idx) => (
                    <motion.div key={b.booking_id}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08, type: "spring", stiffness: 300, damping: 22 }}
                      className={`flex flex-wrap items-start justify-between gap-3 p-4 rounded-xl ${idx === 0 ? "bg-white/10 border border-white/10" : "bg-white/5 border border-white/5"}`}
                    >
                      <div>
                        <p className="font-inter font-semibold text-sm text-white">{b.user_name}</p>
                        <p className="text-xs text-white/50 font-inter mt-0.5">{b.start_time} – {b.end_time} · {b.booking_type === "video_consultation" ? "Videoberatung" : b.booking_type === "consultation" ? "Beratung" : "Tattoo"}</p>
                        {(b.size_category || b.body_part) && (
                          <p className="text-[11px] text-white/40 font-inter mt-0.5 flex items-center gap-1.5 flex-wrap">
                            {b.size_category && <span className="bg-white/10 px-1.5 py-0.5 rounded-full">{b.size_category}</span>}
                            {b.body_part && <span className="bg-white/10 px-1.5 py-0.5 rounded-full">{b.body_part}</span>}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {b.status === "pending" && b.deposit_required && b.payment_status !== "paid"
                          ? <span className="text-xs px-2.5 py-1 rounded-full border font-inter bg-amber-50 text-amber-700 border-amber-200">Warte auf Anzahlung</span>
                          : <span className={`text-xs px-2.5 py-1 rounded-full border font-inter ${statusColors[b.status]}`}>{b.status === "pending" ? "Ausstehend" : "Bestätigt"}</span>
                        }
                        {b.status === "confirmed" && b.payment_status === "paid" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border font-inter bg-emerald-50 text-emerald-600 border-emerald-200 flex items-center gap-1"><CheckCircle size={9} strokeWidth={2} /> Anzahlung bezahlt</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Kommende Termine */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 22 }}
              className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6"
            >
              <h3 className="font-playfair font-semibold text-lg mb-4 text-zinc-900">Kommende Termine</h3>
              {futureUpcoming.length === 0 ? (
                <div className="py-12 flex flex-col items-center text-center">
                  <Calendar size={28} className="text-zinc-200 mb-3" strokeWidth={1.5} />
                  <p className="font-playfair text-lg text-zinc-900 mb-1">Keine Buchungen</p>
                  <p className="text-xs text-zinc-400 font-inter">Neue Buchungen erscheinen hier automatisch</p>
                </div>
              ) : (
                <div className="space-y-2 px-1">
                  {futureUpcoming.map((b, idx) => (
                    <motion.div key={b.booking_id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06, type: "spring", stiffness: 300, damping: 22 }}
                      whileHover={{ y: -1, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}
                      className="group relative flex flex-wrap items-start justify-between gap-2 p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 transition-colors hover:bg-white cursor-default"
                    >
                      <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-zinc-900 rounded-r-full scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center" />
                      <div className="pl-1.5">
                        <p className="font-inter font-semibold text-sm text-zinc-900">{b.user_name}</p>
                        <p className="text-xs text-zinc-500 font-inter mt-0.5 group-hover:text-zinc-700 transition-colors">{b.date ? new Date(b.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""} · {b.start_time} – {b.end_time} · {b.booking_type === "video_consultation" ? "Videoberatung" : b.booking_type === "consultation" ? "Beratung" : "Tattoo"}</p>
                        {(b.size_category || b.body_part) && (
                          <p className="text-[11px] text-zinc-400 font-inter mt-0.5 flex items-center gap-1.5 flex-wrap">
                            {b.size_category && <span className="bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full">{b.size_category}</span>}
                            {b.body_part && <span className="bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full">{b.body_part}</span>}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {b.status === "pending" && b.deposit_required && b.payment_status !== "paid"
                          ? <span className="text-xs px-2.5 py-1 rounded-full border font-inter bg-amber-50 text-amber-700 border-amber-200">Warte auf Anzahlung</span>
                          : <span className={`text-xs px-2.5 py-1 rounded-full border font-inter ${statusColors[b.status]}`}>{b.status === "pending" ? "Ausstehend" : "Bestätigt"}</span>
                        }
                        {b.status === "confirmed" && b.payment_status === "paid" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border font-inter bg-emerald-50 text-emerald-600 border-emerald-200 flex items-center gap-1"><CheckCircle size={9} strokeWidth={2} /> Anzahlung bezahlt</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Page Analytics Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 280, damping: 22 }}
              className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center">
                  <Eye size={14} className="text-white" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-inter font-semibold text-zinc-900">Seitenanalyse</p>
                <span className="text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 bg-zinc-50 px-2.5 py-1 rounded-full border border-zinc-100 ml-auto">Letzte 30 Tage</span>
              </div>

              {/* Funnel metrics */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-zinc-50 rounded-xl p-3.5">
                  <p className="text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Seitenaufrufe</p>
                  <p className="text-2xl font-playfair font-semibold text-zinc-900">{pageAnalytics?.page_views ?? "—"}</p>
                  <p className="text-xs text-zinc-400 font-inter mt-0.5">Besucher</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3.5">
                  <p className="text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Anfragen</p>
                  <p className="text-2xl font-playfair font-semibold text-zinc-900">{pageAnalytics?.inquiries_received ?? "—"}</p>
                  <p className="text-xs text-zinc-400 font-inter mt-0.5">Eingegangen</p>
                </div>
                <div className="bg-zinc-900 rounded-xl p-3.5">
                  <p className="text-[10px] font-inter font-semibold tracking-widest uppercase text-white/40 mb-1.5">Buchungen</p>
                  <p className="text-2xl font-playfair font-semibold text-white">{pageAnalytics?.bookings_confirmed ?? "—"}</p>
                  <p className="text-xs text-white/40 font-inter mt-0.5">Bestätigt</p>
                </div>
              </div>

            </motion.div>

          </motion.div>
        )}

        {/* Kalender Tab — manual calendar blocking */}
        {activeTab === "kalender" && (() => {
          const BLOCK_TYPES = [
            { id: "available", label: "Verfügbar",   desc: "Kapazität freigeben / erzwingen", dot: "bg-teal-400"    },
            { id: "limited",   label: "Begrenzt",    desc: "Begrenzte Kapazität",             dot: "bg-yellow-400"  },
            { id: "small_only",label: "Nur klein",   desc: "Nur kleine Tattoos möglich",      dot: "bg-indigo-400"  },
            { id: "full",      label: "Blockiert",   desc: "Tag vollständig blockieren",      dot: "bg-rose-400"    },
            { id: "vacation",  label: "Urlaub",      desc: "Urlaub / geschlossen",            dot: "bg-violet-400"  },
          ];
          const dotCls  = { available: "bg-teal-400", limited: "bg-yellow-400", small_only: "bg-indigo-400", full: "bg-rose-400", vacation: "bg-violet-400", busy: "bg-rose-400", private: "bg-rose-400" };
          const bgCls   = { available: "bg-teal-50 border-teal-200", limited: "bg-yellow-50 border-yellow-200", small_only: "bg-indigo-50 border-indigo-200", full: "bg-rose-50 border-rose-200", vacation: "bg-violet-50 border-violet-200", busy: "bg-rose-50 border-rose-200", private: "bg-rose-50 border-rose-200" };
          const textCls = { available: "text-teal-800", limited: "text-yellow-800", small_only: "text-indigo-800", full: "text-rose-700", vacation: "text-violet-800", busy: "text-rose-700", private: "text-rose-700" };

          // Capacity dot color from API status (for non-blocked days)
          const capDotCls = (status) => {
            if (status === "available")  return "bg-emerald-400";
            if (status === "limited")    return "bg-amber-400";
            if (status === "small_only") return "bg-blue-400";
            if (status === "full")       return "bg-zinc-300";
            if (status === "vacation")   return "bg-orange-300";
            return "bg-emerald-400";
          };

          const blocksByDate = {};
          calBlocks.forEach(b => { blocksByDate[b.date] = b; });

          const daysInMonth = new Date(calBlockYear, calBlockMonth, 0).getDate();
          const firstWeekday = new Date(calBlockYear, calBlockMonth - 1, 1).getDay();
          const offset = (firstWeekday + 6) % 7; // Mon=0
          const todayIso = new Date().toISOString().split("T")[0];
          const monthLabel = new Date(calBlockYear, calBlockMonth - 1, 1)
            .toLocaleDateString("de-DE", { month: "long", year: "numeric" });

          const prevMonth = () => {
            if (calBlockMonth === 1) { setCalBlockMonth(12); setCalBlockYear(y => y - 1); }
            else setCalBlockMonth(m => m - 1);
          };
          const nextMonth = () => {
            if (calBlockMonth === 12) { setCalBlockMonth(1); setCalBlockYear(y => y + 1); }
            else setCalBlockMonth(m => m + 1);
          };

          const openDay = (iso) => {
            setCalSelectedDates(prev => {
              const next = new Set(prev);
              if (next.has(iso)) next.delete(iso); else next.add(iso);
              return next;
            });
          };

          const openBulkModal = () => {
            const firstDate = [...calSelectedDates][0];
            const existing = firstDate ? blocksByDate[firstDate] : null;
            const capDay = firstDate ? calCapData[firstDate] : null;
            const existingBlockType = existing?.block_type;
            // If block is "available" with custom capacity, treat as capacity-only
            const isCapacityOnly = !existingBlockType || existingBlockType === "available";
            setCalBlockPickType(existing && !isCapacityOnly ? existingBlockType : "full");
            setCalBlockPickNote(existing?.note || "");
            setCalBlockPickCap(capDay?.custom_capacity ? String(capDay.custom_capacity) : "");
            setShowBlockRestriction(!!existing && !isCapacityOnly);
            setCalBlockPickModal(true);
          };

          const cells = [];
          for (let i = 0; i < offset; i++) cells.push(null);
          for (let d = 1; d <= daysInMonth; d++) cells.push(d);

          const todayIsoKal = new Date().toISOString().split("T")[0];
          const todayBookings = [...activeBookings, ...pastStudioBookings]
            .filter(b => b.date === todayIsoKal)
            .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
          const todayLabel = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

          return (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 22 }} className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-playfair font-semibold text-xl text-zinc-900">Kalender</h3>
                  <p className="text-xs text-zinc-500 font-inter mt-0.5 capitalize">{monthLabel}</p>
                </div>
                {kalenderView === "capacity" && (
                  <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition-colors">‹</button>
                    <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition-colors">›</button>
                  </div>
                )}
              </div>

              {/* View toggle */}
              <div className="flex gap-1 bg-white rounded-2xl border border-black/[0.04] shadow-[0_2px_10px_rgb(0,0,0,0.04)] p-1.5 w-fit">
                {[
                  { id: "termine",  label: "Termine" },
                  { id: "capacity", label: "Kapazität festlegen" },
                ].map(v => (
                  <motion.button key={v.id} onClick={() => setKalenderView(v.id)} whileTap={{ scale: 0.96 }}
                    className={`px-4 py-2 rounded-xl text-sm font-inter font-medium transition-all whitespace-nowrap ${kalenderView === v.id ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}`}>
                    {v.label}
                  </motion.button>
                ))}
              </div>

              {/* Artist selector — only shown in capacity view if studio has artists */}
              {kalenderView === "capacity" && studioArtists.length > 0 && (
                <div>
                  <p className="text-[11px] font-inter font-semibold text-zinc-400 uppercase tracking-widest mb-2">Kalender für</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setCalArtistId(null)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-inter font-semibold transition-all border ${calArtistId === null ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"}`}
                    >
                      <span className="w-2 h-2 rounded-full bg-zinc-400 opacity-60" />
                      Ganzes Studio
                    </button>
                    {studioArtists.map(a => (
                      <button
                        key={a.artist_id}
                        onClick={() => setCalArtistId(a.artist_id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-inter font-semibold transition-all border ${calArtistId === a.artist_id ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"}`}
                      >
                        {a.profile_image ? (
                          <img src={a.profile_image} alt="" className="w-4 h-4 rounded-full object-cover" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-zinc-200 flex items-center justify-center text-[8px] font-bold text-zinc-500">{(a.name||"?")[0]}</span>
                        )}
                        {a.name}
                      </button>
                    ))}
                  </div>
                  {calArtistId && (
                    <p className="text-[10px] font-inter text-zinc-400 mt-1.5">Blöcke gelten nur für {studioArtists.find(a => a.artist_id === calArtistId)?.name}. Studio-weite Blöcke bleiben aktiv.</p>
                  )}
                </div>
              )}

              {/* ── Termine view ─────────────────────────────────────────── */}
              {kalenderView === "termine" && (() => {
                const allBks = [...activeBookings, ...pastStudioBookings];
                const bksByDate = {};
                allBks.forEach(b => {
                  if (b.date) { if (!bksByDate[b.date]) bksByDate[b.date] = []; bksByDate[b.date].push(b); }
                });
                const dim = new Date(calViewYear, calViewMonth, 0).getDate();
                const off = (new Date(calViewYear, calViewMonth - 1, 1).getDay() + 6) % 7;
                const todayIsoV = new Date().toISOString().split("T")[0];
                const vMonthLabel = new Date(calViewYear, calViewMonth - 1, 1).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
                const prevVMo = () => { if (calViewMonth === 1) { setCalViewMonth(12); setCalViewYear(y => y-1); } else setCalViewMonth(m => m-1); };
                const nextVMo = () => { if (calViewMonth === 12) { setCalViewMonth(1); setCalViewYear(y => y+1); } else setCalViewMonth(m => m+1); };
                const vCells = [];
                for (let i=0;i<off;i++) vCells.push(null);
                for (let d=1;d<=dim;d++) vCells.push(d);
                const selBks = calViewSelected ? (bksByDate[calViewSelected] || []).slice().sort((a,b)=>(a.start_time||"").localeCompare(b.start_time||"")) : [];
                const selLabel = calViewSelected ? new Date(calViewSelected+"T12:00:00").toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}) : "";
                return (
                  <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden">
                    {/* Mini calendar */}
                    <div className="px-4 pt-4 pb-3 border-b border-zinc-50">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-inter font-semibold text-sm text-zinc-900 capitalize">{vMonthLabel}</p>
                        <div className="flex items-center gap-1">
                          <button onClick={prevVMo} className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition-colors text-sm">‹</button>
                          <button onClick={() => { setCalViewMonth(now0.getMonth()+1); setCalViewYear(now0.getFullYear()); setCalViewSelected(todayIsoV); }} className="px-2 py-0.5 text-[10px] font-inter font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors">Heute</button>
                          <button onClick={nextVMo} className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition-colors text-sm">›</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 mb-1">
                        {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d => (
                          <div key={d} className="text-center text-[10px] font-inter font-semibold text-zinc-400 pb-1">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-0.5">
                        {vCells.map((day, i) => {
                          if (!day) return <div key={`e-${i}`} />;
                          const iso = `${calViewYear}-${String(calViewMonth).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                          const bks = bksByDate[iso] || [];
                          const isToday = iso === todayIsoV;
                          const isSel = calViewSelected === iso;
                          const confCnt      = bks.filter(b => b.status === "confirmed").length;
                          const pendCnt      = bks.filter(b => ["pending","pending_studio_review","under_review","offer_sent"].includes(b.status)).length;
                          const cancelCnt    = bks.filter(b => ["cancelled","customer_cancelled","studio_cancelled","no_show"].includes(b.status)).length;
                          const completedCnt = bks.filter(b => b.status === "completed").length;
                          const activeCnt    = confCnt + pendCnt;
                          const onlyClosed   = bks.length > 0 && activeCnt === 0 && cancelCnt === 0; // only completed
                          const hasCancel    = cancelCnt > 0 && activeCnt === 0;                      // only cancels (no active)
                          const dayBg = isSel
                            ? "bg-zinc-900 shadow-md"
                            : isToday
                              ? "ring-2 ring-zinc-900 ring-offset-1"
                              : hasCancel
                                ? "bg-red-50 ring-1 ring-red-200 hover:bg-red-100"
                                : onlyClosed
                                  ? "bg-zinc-100 hover:bg-zinc-150 opacity-60"
                                  : confCnt > 0
                                    ? "bg-emerald-100 ring-1 ring-emerald-300 hover:bg-emerald-200"
                                    : pendCnt > 0
                                      ? "bg-amber-100 ring-1 ring-amber-300 hover:bg-amber-200"
                                      : "hover:bg-zinc-50";
                          const numCls = isSel ? "text-white" : hasCancel ? "text-red-700" : onlyClosed ? "text-zinc-400" : confCnt > 0 ? "text-emerald-800" : pendCnt > 0 ? "text-amber-800" : "text-zinc-700";
                          return (
                            <button key={iso} onClick={() => setCalViewSelected(iso)}
                              className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${dayBg}`}>
                              <span className={`text-xs font-inter font-semibold leading-none ${numCls}`}>{day}</span>
                              {bks.length > 0 && (
                                <div className="flex gap-0.5 mt-0.5">
                                  {Array.from({length:Math.min(confCnt,3)}).map((_,k)=><span key={`c${k}`} className={`w-1 h-1 rounded-full ${isSel?"bg-emerald-300":"bg-emerald-600"}`}/>)}
                                  {Array.from({length:Math.min(pendCnt,3)}).map((_,k)=><span key={`p${k}`} className={`w-1 h-1 rounded-full ${isSel?"bg-amber-300":"bg-amber-600"}`}/>)}
                                  {Array.from({length:Math.min(cancelCnt,3)}).map((_,k)=><span key={`x${k}`} className={`w-1 h-1 rounded-full ${isSel?"bg-red-300":"bg-red-400"}`}/>)}
                                  {Array.from({length:Math.min(completedCnt,3)}).map((_,k)=><span key={`d${k}`} className={`w-1 h-1 rounded-full ${isSel?"bg-zinc-300":"bg-zinc-400"}`}/>)}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"/><span className="text-[10px] font-inter text-zinc-400">Bestätigt</span></div>
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"/><span className="text-[10px] font-inter text-zinc-400">Ausstehend</span></div>
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"/><span className="text-[10px] font-inter text-zinc-400">Storniert</span></div>
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-zinc-400"/><span className="text-[10px] font-inter text-zinc-400">Abgeschlossen</span></div>
                      </div>
                    </div>
                    {/* Selected day detail */}
                    {calViewSelected && (
                      <>
                        <div className="px-5 py-2.5 bg-zinc-50/80 flex items-center justify-between">
                          <p className="text-[11px] font-inter font-semibold text-zinc-600 capitalize">{selLabel}</p>
                          <span className="text-[10px] font-inter text-zinc-400">{selBks.length} Termin{selBks.length !== 1 ? "e" : ""}</span>
                        </div>
                        {selBks.length === 0 ? (
                          <div className="px-5 py-8 flex flex-col items-center gap-2 text-center">
                            <p className="text-2xl">📅</p>
                            <p className="text-sm font-inter font-semibold text-zinc-400">Keine Termine</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-zinc-50">
                            {selBks.map(b => {
                              const isConf      = b.status === "confirmed";
                              const isPend      = ["pending","pending_studio_review","under_review"].includes(b.status);
                              const isOffer     = b.status === "offer_sent";
                              const isCompleted = b.status === "completed";
                              const isCancelled = ["cancelled","customer_cancelled","studio_cancelled","no_show"].includes(b.status);
                              const deposit = b.offer_deposit_amount ?? b.deposit_amount;
                              const barColor = isCancelled ? "bg-red-400" : isCompleted ? "bg-zinc-300" : isConf ? "bg-emerald-400" : isOffer ? "bg-violet-400" : isPend ? "bg-amber-400" : "bg-zinc-200";
                              const badgeCls = isCancelled ? "bg-red-100 text-red-700" : isCompleted ? "bg-zinc-100 text-zinc-400" : isConf ? "bg-emerald-100 text-emerald-700" : isOffer ? "bg-violet-100 text-violet-700" : isPend ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-500";
                              const rowCls   = isCancelled ? "opacity-70 bg-red-50/40" : isCompleted ? "opacity-50" : "";
                              return (
                                <div key={b.booking_id} className={`px-5 py-4 space-y-2 ${rowCls}`}>
                                  <div className="flex items-center gap-3">
                                    <div className={`w-1 h-10 rounded-full flex-shrink-0 ${barColor}`} />
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-inter font-semibold ${isCompleted ? "text-zinc-400" : isCancelled ? "text-zinc-500" : "text-zinc-900"}`}>{b.user_name}</p>
                                      <p className="text-[11px] text-zinc-400 font-inter">
                                        {b.start_time ? `⏰ ${b.start_time} Uhr` : "⏰ Zeit ausstehend"}
                                        {b.size_category && ` · ${b.size_category}`}
                                      </p>
                                    </div>
                                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-inter font-medium flex-shrink-0 ${badgeCls}`}>{statusLabels[b.status]||b.status}</span>
                                  </div>
                                  <div className="ml-4 grid grid-cols-2 gap-x-6 gap-y-1">
                                    {b.artist_name && <><span className="text-[10px] font-inter text-zinc-400">Artist</span><span className="text-[10px] font-inter font-semibold text-violet-700">🎨 {b.artist_name}</span></>}
                                    {b.offer_deposit_amount != null && b.offer_deposit_amount !== "" && <><span className="text-[10px] font-inter text-zinc-400">Anzahlung</span><span className="text-[10px] font-inter font-semibold text-zinc-700">{parseFloat(b.offer_deposit_amount)===0?"Kostenlos":`€ ${parseFloat(b.offer_deposit_amount).toFixed(0)}`}</span></>}
                                    {(b.preferred_time_from || b.preferred_time_to) && <><span className="text-[10px] font-inter text-zinc-400">Wunschzeit</span><span className="text-[10px] font-inter font-semibold text-zinc-700">{b.preferred_time_from||"?"} – {b.preferred_time_to||"?"}</span></>}
                                    {b.body_part && <><span className="text-[10px] font-inter text-zinc-400">Körperstelle</span><span className="text-[10px] font-inter font-semibold text-zinc-700">{b.body_part}</span></>}
                                  </div>
                                  {/* Bemerkung */}
                                  {b.notes && (
                                    <div className="ml-4 bg-zinc-50 rounded-xl px-3 py-2 border border-zinc-100">
                                      <p className="text-[10px] font-inter font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">Bemerkung</p>
                                      <p className="text-[11px] font-inter text-zinc-600 italic">"{b.notes}"</p>
                                    </div>
                                  )}
                                  {/* Referenzbilder */}
                                  {b.reference_images?.length > 0 && (
                                    <div className="ml-4">
                                      <p className="text-[10px] font-inter font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Referenzbilder</p>
                                      <div className="flex gap-1.5 flex-wrap">
                                        {b.reference_images.map((img, ri) => (
                                          <a key={ri} href={img} target="_blank" rel="noreferrer">
                                            <img src={img} alt={`ref-${ri}`} className="w-14 h-14 object-cover rounded-xl border border-zinc-200 hover:opacity-80 transition-opacity" />
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {/* Chat-Button */}
                                  {b.user_id && (
                                    <div className="ml-4">
                                      <button
                                        onClick={() => navigate(`/messages/${b.user_id}`, { state: { recipientName: b.user_name, recipientRole: "customer" } })}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-700 text-white text-[11px] font-inter font-semibold transition-colors"
                                      >
                                        <MessageSquare size={11} strokeWidth={2} /> Chat öffnen
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}

              {/* ── Kapazität festlegen view ─────────────────────────────── */}
              {kalenderView === "capacity" && <>

              {/* Legend — same as customer view */}
              <div className="flex flex-wrap gap-2">
                {BLOCK_TYPES.map(bt => (
                  <div key={bt.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-100 shadow-sm">
                    <span className={`w-2 h-2 rounded-full ${bt.dot}`} />
                    <span className="text-[11px] font-inter text-zinc-600">{bt.label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-zinc-100 shadow-sm opacity-60">
                  <span className="text-[11px] font-inter text-zinc-400 italic">= wie Kunden sehen</span>
                </div>
              </div>

              {/* Visibility cutoff setting */}
              <div className="bg-white rounded-2xl border border-black/[0.04] shadow-sm p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-inter font-semibold text-zinc-900 mb-0.5">Termine sichtbar bis</p>
                    <p className="text-[11px] text-zinc-400 font-inter">Kunden sehen Slots nur bis zu diesem Datum. Tage danach erscheinen als „Bald verfügbar".</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      type="date" value={visibleUntil}
                      onChange={e => setVisibleUntil(e.target.value)}
                      className="border border-zinc-200 rounded-xl px-3 py-2 text-sm font-inter text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                    <button onClick={() => handleSaveVisibleUntil(visibleUntil || null)} disabled={visibleUntilSaving}
                      className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm font-inter font-semibold hover:bg-zinc-700 transition-colors disabled:opacity-60">
                      {visibleUntilSaving ? "…" : "Speichern"}
                    </button>
                    {visibleUntil && (
                      <button onClick={() => { setVisibleUntil(""); handleSaveVisibleUntil(null); }}
                        className="w-8 h-8 flex items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 hover:bg-zinc-50 transition-colors text-sm">
                        <X size={13} strokeWidth={2} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Calendar grid */}
              <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d => (
                    <div key={d} className="text-center text-[11px] font-inter font-semibold text-zinc-400 py-1">{d}</div>
                  ))}
                </div>
                {/* Cells */}
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((day, i) => {
                    if (!day) return <div key={`empty-${i}`} />;
                    const iso = `${calBlockYear}-${String(calBlockMonth).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                    const block = blocksByDate[iso];
                    const capDay = calCapData[iso];
                    const isToday = iso === todayIso;
                    const isPast = iso < todayIso;
                    const isSelected = calSelectedDates.has(iso);
                    const isAfterCutoff = !isPast && visibleUntil && iso > visibleUntil;
                    const dotColor = block
                      ? dotCls[block.block_type] || "bg-zinc-400"
                      : capDay
                        ? capDotCls(capDay.status)
                        : isPast ? "bg-zinc-200" : "bg-emerald-400";
                    const blockType = block?.block_type;
                    const hasBg = !!block && !isSelected;
                    const blockLabel = block ? (BLOCK_TYPES.find(t => t.id === blockType)?.label || blockType) : null;
                    const tooltipLines = !isPast && !isSelected ? (() => {
                      if (block) {
                        const lines = [blockLabel];
                        if (block.note) lines.push(block.note);
                        if (capDay) lines.push(`${capDay.used}/${capDay.effective_cap} Punkte`);
                        return lines;
                      }
                      if (isAfterCutoff) return ["Nicht buchbar für Kunden", "Liegt nach deinem Sichtbarkeits-Limit"];
                      if (capDay?.status === "vacation") return ["Urlaub / geschlossen"];
                      if (capDay?.status === "full") return [`Ausgebucht`, `${capDay.used}/${capDay.effective_cap} Punkte belegt`];
                      if (capDay) return [`${capDay.used}/${capDay.effective_cap} Punkte belegt`];
                      return null;
                    })() : null;
                    return (
                      <div key={iso} className="relative group">
                        <button
                          onClick={() => openDay(iso)}
                          className={`relative w-full aspect-square rounded-xl flex flex-col items-center justify-center transition-all text-sm font-inter
                            ${isPast ? "opacity-40 cursor-default" : "hover:scale-105 cursor-pointer"}
                            ${isSelected
                              ? "bg-zinc-900 text-white ring-2 ring-zinc-900 ring-offset-1"
                              : hasBg
                                ? `${bgCls[blockType]} border`
                                : isToday
                                  ? "bg-zinc-800 text-white"
                                  : isAfterCutoff
                                    ? "bg-zinc-50 border border-dashed border-zinc-300"
                                    : "hover:bg-zinc-50 border border-transparent"}
                          `}
                          disabled={isPast}
                        >
                          <span className={`text-xs font-semibold leading-none ${isSelected ? "text-white" : hasBg ? textCls[blockType] : isToday ? "text-white" : isAfterCutoff ? "text-zinc-400" : "text-zinc-700"}`}>{day}</span>
                          {!isPast && !isAfterCutoff && capDay && !["full","vacation"].includes(capDay.status) && (
                            <span className={`text-[8px] font-inter leading-none mt-0.5 ${isSelected ? "text-white/70" : isToday && !hasBg ? "text-white/70" : hasBg ? textCls[blockType] + " opacity-70" : "text-zinc-400"}`}>{capDay.used}/{capDay.effective_cap}</span>
                          )}
                          {!isPast && !isAfterCutoff && <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? "bg-white/60" : isToday && !hasBg ? "bg-white/60" : dotColor}`} />}
                          {!isPast && isAfterCutoff && <span className="text-[8px] mt-0.5 text-zinc-400 font-inter leading-none">bald</span>}
                        </button>
                        {tooltipLines && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out w-max max-w-[160px]">
                            <div className="bg-zinc-900 text-white text-[10px] font-inter rounded-xl px-3 py-2 shadow-xl leading-snug text-center whitespace-normal">
                              {tooltipLines.map((line, li) => (
                                <p key={li} className={li > 0 ? "opacity-60 mt-0.5" : "font-semibold"}>{line}</p>
                              ))}
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-900" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>


              {/* Multi-select floating action bar */}
              <AnimatePresence>
                {calSelectedDates.size > 0 && !calBlockPickModal && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3"
                  >
                    <span className="text-sm font-inter font-semibold whitespace-nowrap">
                      {calSelectedDates.size} Tag{calSelectedDates.size > 1 ? "e" : ""} ausgewählt
                    </span>
                    <button onClick={openBulkModal}
                      className="px-4 py-1.5 rounded-xl bg-white text-zinc-900 text-sm font-inter font-semibold hover:bg-zinc-100 transition-colors whitespace-nowrap">
                      Bearbeiten
                    </button>
                    <button onClick={() => setCalSelectedDates(new Set())}
                      className="p-1.5 rounded-xl hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white">
                      <X size={14} strokeWidth={2} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Block pick modal */}
              <AnimatePresence>
                {calBlockPickModal && calSelectedDates.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 flex items-center justify-center p-6"
                    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", zIndex: 9999 }}
                    onClick={() => setCalBlockPickModal(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.93, y: 16, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.93, y: 16, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 24 }}
                      className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-playfair font-semibold text-lg text-zinc-900">
                          {calSelectedDates.size === 1 ? "Tag bearbeiten" : `${calSelectedDates.size} Tage bearbeiten`}
                        </h3>
                        <button onClick={() => setCalBlockPickModal(false)} className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 transition-colors"><X size={16} strokeWidth={2} /></button>
                      </div>
                      <p className="text-[11px] font-inter text-zinc-400 mb-1 truncate">
                        {calSelectedDates.size === 1
                          ? new Date([...calSelectedDates][0] + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
                          : [...calSelectedDates].sort().map(d => new Date(d + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })).join(", ")
                        }
                      </p>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-inter font-semibold mb-4 ${calArtistId ? "bg-zinc-100 text-zinc-700" : "bg-blue-50 text-blue-700"}`}>
                        {calArtistId ? (
                          <>
                            {studioArtists.find(a => a.artist_id === calArtistId)?.profile_image
                              ? <img src={studioArtists.find(a => a.artist_id === calArtistId)?.profile_image} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                              : <span className="w-3.5 h-3.5 rounded-full bg-zinc-300 flex items-center justify-center text-[7px]">{(studioArtists.find(a => a.artist_id === calArtistId)?.name || "?")[0]}</span>
                            }
                            {studioArtists.find(a => a.artist_id === calArtistId)?.name}
                          </>
                        ) : (<>🏠 Ganzes Studio</>)}
                      </div>

                      {/* ── PRIMARY: Kapazität ── */}
                      <div className="mb-4">
                        <p className="text-[11px] font-inter font-semibold text-zinc-500 uppercase tracking-wider mb-2">Kapazität für diesen Tag</p>
                        <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
                          <input
                            type="number" min={1} max={200} value={calBlockPickCap}
                            onChange={e => setCalBlockPickCap(e.target.value)}
                            placeholder={String(dayCapacity)}
                            className="w-16 text-center text-xl font-inter font-bold text-zinc-900 bg-transparent focus:outline-none"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-inter font-semibold text-zinc-700">Punkte / Tag</p>
                            <p className="text-[11px] text-zinc-400 font-inter">
                              {calBlockPickCap && Number(calBlockPickCap) !== dayCapacity
                                ? <span className="text-amber-600 font-semibold">Abweichend vom Standard ({dayCapacity} Pt.)</span>
                                : `Standard: ${dayCapacity} Punkte`
                              }
                            </p>
                          </div>
                          {calBlockPickCap && (
                            <button onClick={() => setCalBlockPickCap("")} className="text-zinc-300 hover:text-zinc-500 transition-colors">
                              <X size={13} strokeWidth={2} />
                            </button>
                          )}
                        </div>

                        {/* Größen-Referenz */}
                        <div className="mt-2 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
                          <div className="grid grid-cols-5 gap-1 mb-2">
                            {[
                              { label: "Mini",   pts: 1, desc: "Schriftzug, Symbol" },
                              { label: "Small",  pts: 2, desc: "ca. 5 cm" },
                              { label: "Medium", pts: 3, desc: "ca. 10 cm" },
                              { label: "Large",  pts: 5, desc: "z.B. Unterarm" },
                              { label: "XL",     pts: 8, desc: "Rücken, Sleeve" },
                            ].map(({ label, pts, desc }) => (
                              <div key={label} className="flex flex-col items-center text-center gap-0.5">
                                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide leading-none">{label}</span>
                                <span className="text-base font-bold text-zinc-800 leading-none">{pts}</span>
                                <span className="text-[9px] text-zinc-400 leading-tight">{desc}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-zinc-400 leading-snug border-t border-zinc-200 pt-2">
                            Du kannst deine Kapazität frei anpassen — arbeitest du schneller, erhöhe den Wert, damit dein Kalender für Kunden mehr Verfügbarkeit zeigt. <span className="text-zinc-500 font-medium">8 Punkte ist der Standard.</span>
                          </p>
                        </div>
                      </div>

                      {/* ── SECONDARY: Verfügbarkeit einschränken (optional) ── */}
                      <div className="mb-4">
                        <button
                          onClick={() => setShowBlockRestriction(v => !v)}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-zinc-200 hover:border-zinc-400 transition-all bg-white"
                        >
                          <div className="flex items-center gap-2">
                            {showBlockRestriction
                              ? <span className={`w-2.5 h-2.5 rounded-full ${dotCls[calBlockPickType] || "bg-zinc-400"}`} />
                              : <span className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                            }
                            <span className="text-sm font-inter font-semibold text-zinc-800">
                              {showBlockRestriction ? (BLOCK_TYPES.find(b => b.id === calBlockPickType)?.label || "Einschränkung") : "Verfügbarkeit einschränken"}
                            </span>
                          </div>
                          <span className="text-zinc-400 text-xs font-inter">{showBlockRestriction ? "entfernen ×" : "optional →"}</span>
                        </button>
                        {showBlockRestriction && (
                          <div className="space-y-1.5 mt-2">
                            {BLOCK_TYPES.map(bt => (
                              <button
                                key={bt.id}
                                onClick={() => {
                                  setCalBlockPickType(bt.id);
                                  if (bt.id === "small_only") setCalBlockPickCap("2");
                                  else if (bt.id === "limited") setCalBlockPickCap("3");
                                  else if (bt.id === "full" || bt.id === "vacation") setCalBlockPickCap("");
                                  else if (bt.id === "available") setCalBlockPickCap("");
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${calBlockPickType === bt.id ? "border-zinc-900 bg-zinc-50" : "border-zinc-100 hover:border-zinc-200"}`}
                              >
                                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${dotCls[bt.id]}`} />
                                <div className="text-left flex-1">
                                  <p className="text-sm font-inter font-semibold text-zinc-900">{bt.label}</p>
                                  <p className="text-xs text-zinc-400 font-inter">{bt.desc}</p>
                                </div>
                                {calBlockPickType === bt.id && <CheckCircle size={14} className="text-zinc-900" strokeWidth={2} />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Note */}
                      <div className="mb-4">
                        <label className="text-xs font-inter font-semibold text-zinc-400 mb-1.5 block">Notiz <span className="font-normal">(optional)</span></label>
                        <input
                          type="text" value={calBlockPickNote} onChange={e => setCalBlockPickNote(e.target.value)}
                          placeholder="z. B. Workshop, Messe, privat..."
                          className="input-base w-full"
                        />
                      </div>

                      <div className="flex gap-2">
                        {[...calSelectedDates].some(d => blocksByDate[d]) && (
                          <button
                            onClick={async () => {
                              await Promise.all([...calSelectedDates].filter(d => blocksByDate[d]).map(d => handleDeleteCalBlock(blocksByDate[d].block_id)));
                              setCalBlockPickModal(false);
                              setCalSelectedDates(new Set());
                            }}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-inter hover:bg-red-50 transition-colors"
                          >
                            Entfernen
                          </button>
                        )}
                        <button
                          onClick={handleSaveCalBlock}
                          disabled={calBlockSaving}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-inter font-semibold hover:bg-zinc-700 transition-colors disabled:opacity-60"
                        >
                          {calBlockSaving ? "Speichern…" : "Speichern"}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              </>}
            </motion.div>
          );
        })()}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 22 }} className="space-y-5">

            {/* Mini bookings calendar — REMOVED */}
            {false && (() => {
              const daysInMonth = new Date(bookCalYear, bookCalMonth, 0).getDate();
              const firstWeekday = new Date(bookCalYear, bookCalMonth - 1, 1).getDay();
              const offset = (firstWeekday + 6) % 7;
              const todayIso = new Date().toISOString().split("T")[0];
              const monthLabel = new Date(bookCalYear, bookCalMonth - 1, 1)
                .toLocaleDateString("de-DE", { month: "long", year: "numeric" });

              const allBookings = [...activeBookings, ...pastStudioBookings];
              const bookingsByDate = {};
              allBookings.forEach(b => {
                if (b.date) {
                  if (!bookingsByDate[b.date]) bookingsByDate[b.date] = [];
                  bookingsByDate[b.date].push(b);
                }
              });

              const prevMo = () => { if (bookCalMonth === 1) { setBookCalMonth(12); setBookCalYear(y => y - 1); } else setBookCalMonth(m => m - 1); };
              const nextMo = () => { if (bookCalMonth === 12) { setBookCalMonth(1); setBookCalYear(y => y + 1); } else setBookCalMonth(m => m + 1); };

              const cells = [];
              for (let i = 0; i < offset; i++) cells.push(null);
              for (let d = 1; d <= daysInMonth; d++) cells.push(d);

              const totalMonth = allBookings.filter(b => b.date?.startsWith(`${bookCalYear}-${String(bookCalMonth).padStart(2,"0")}`)).length;
              const confirmedMonth = allBookings.filter(b => b.date?.startsWith(`${bookCalYear}-${String(bookCalMonth).padStart(2,"0")}`) && b.status === "confirmed").length;

              return (
                <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden">
                  {/* Calendar header */}
                  <div className="px-5 pt-4 pb-3 border-b border-zinc-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-playfair font-semibold text-base text-zinc-900 capitalize">{monthLabel}</p>
                        {totalMonth > 0 && (
                          <p className="text-[11px] font-inter text-zinc-400 mt-0.5">
                            <span className="text-emerald-600 font-semibold">{confirmedMonth}</span> bestätigt · <span className="text-amber-600 font-semibold">{totalMonth - confirmedMonth}</span> ausstehend
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={prevMo} className="w-8 h-8 flex items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition-colors">‹</button>
                        <button onClick={() => { setBookCalMonth(new Date().getMonth()+1); setBookCalYear(new Date().getFullYear()); setBookCalSelected(null); }} className="px-2.5 py-1 text-[10px] font-inter font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors">Heute</button>
                        <button onClick={nextMo} className="w-8 h-8 flex items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition-colors">›</button>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pt-3 pb-2">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 mb-1">
                      {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d => (
                        <div key={d} className="text-center text-[10px] font-inter font-semibold text-zinc-400 pb-1.5">{d}</div>
                      ))}
                    </div>
                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-1">
                      {cells.map((day, i) => {
                        if (!day) return <div key={`e-${i}`} />;
                        const iso = `${bookCalYear}-${String(bookCalMonth).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                        const bks = bookingsByDate[iso] || [];
                        const isToday = iso === todayIso;
                        const isSelected = bookCalSelected === iso;
                        const confirmedCount = bks.filter(b => b.status === "confirmed").length;
                        const pendingCount  = bks.filter(b => ["pending","pending_studio_review","under_review","offer_sent"].includes(b.status)).length;
                        const hasBookings = bks.length > 0;
                        const cellBg = isSelected
                          ? "bg-zinc-900 shadow-md scale-105"
                          : isToday
                            ? "ring-2 ring-zinc-900 ring-offset-1 font-bold"
                            : confirmedCount > 0
                              ? "bg-emerald-100 ring-1 ring-emerald-300 hover:bg-emerald-200"
                              : pendingCount > 0
                                ? "bg-amber-100 ring-1 ring-amber-300 hover:bg-amber-200"
                                : "hover:bg-zinc-50";
                        return (
                          <button
                            key={iso}
                            onClick={() => setBookCalSelected(isSelected ? null : iso)}
                            className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all text-xs font-inter ${cellBg}`}
                          >
                            <span className={`font-semibold leading-none ${isSelected ? "text-white" : isToday ? "text-zinc-900" : confirmedCount > 0 ? "text-emerald-800" : pendingCount > 0 ? "text-amber-800" : "text-zinc-700"}`}>{day}</span>
                            {hasBookings && (
                              <div className="flex gap-0.5 mt-1">
                                {Array.from({length: Math.min(confirmedCount, 3)}).map((_,k) => (
                                  <span key={`c${k}`} className={`w-1 h-1 rounded-full ${isSelected ? "bg-emerald-300" : "bg-emerald-600"}`} />
                                ))}
                                {Array.from({length: Math.min(pendingCount, 3)}).map((_,k) => (
                                  <span key={`p${k}`} className={`w-1 h-1 rounded-full ${isSelected ? "bg-amber-300" : "bg-amber-600"}`} />
                                ))}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="px-5 pb-3 flex items-center gap-3">
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] font-inter text-zinc-400">Bestätigt</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-[10px] font-inter text-zinc-400">Ausstehend</span></div>
                  </div>

                  {/* Selected day details */}
                  {bookCalSelected && bookingsByDate[bookCalSelected]?.length > 0 && (
                    <div className="border-t border-zinc-100">
                      <div className="px-5 py-2.5 bg-zinc-50/80 flex items-center justify-between">
                        <p className="text-[11px] font-inter font-semibold text-zinc-600 capitalize">
                          {new Date(bookCalSelected + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" })}
                        </p>
                        <span className="text-[10px] font-inter text-zinc-400">{bookingsByDate[bookCalSelected].length} Buchung{bookingsByDate[bookCalSelected].length !== 1 ? "en" : ""}</span>
                      </div>
                      <div className="divide-y divide-zinc-50">
                        {bookingsByDate[bookCalSelected].map(b => {
                          const isConf = b.status === "confirmed";
                          const isPend = b.status === "pending";
                          const statusLabel = statusLabels[b.status] || b.status;
                          const deposit = b.offer_deposit_amount ?? b.deposit_amount;
                          return (
                            <div key={b.booking_id} className="px-5 py-3.5 space-y-2">
                              {/* Row 1: color bar + name + status */}
                              <div className="flex items-center gap-3">
                                <div className={`w-1 h-10 rounded-full flex-shrink-0 ${isConf ? "bg-emerald-400" : isPend ? "bg-amber-400" : "bg-zinc-200"}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-inter font-semibold text-zinc-900">{b.user_name}</p>
                                  <p className="text-[11px] text-zinc-500 font-inter">
                                    {b.start_time ? `⏰ ${b.start_time} Uhr` : "⏰ Zeit ausstehend"}
                                    {b.size_category && ` · ${b.size_category}`}
                                  </p>
                                </div>
                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-inter font-medium flex-shrink-0 ${
                                  isConf ? "bg-emerald-100 text-emerald-700" :
                                  isPend ? "bg-amber-100 text-amber-700" :
                                  "bg-zinc-100 text-zinc-500"
                                }`}>{statusLabel}</span>
                              </div>
                              {/* Row 2: details grid */}
                              <div className="ml-4 grid grid-cols-2 gap-x-4 gap-y-1">
                                {b.artist_name && (
                                  <>
                                    <span className="text-[10px] font-inter text-zinc-400">Artist</span>
                                    <span className="text-[10px] font-inter font-semibold text-violet-700">🎨 {b.artist_name}</span>
                                  </>
                                )}
                                {b.offer_deposit_amount != null && b.offer_deposit_amount !== "" && (
                                  <>
                                    <span className="text-[10px] font-inter text-zinc-400">Anzahlung</span>
                                    <span className="text-[10px] font-inter font-semibold text-zinc-700">
                                      {parseFloat(b.offer_deposit_amount) === 0 ? "Kostenlos" : `€ ${parseFloat(b.offer_deposit_amount).toFixed(0)}`}
                                    </span>
                                  </>
                                )}
                                {(b.preferred_time_from || b.preferred_time_to) && (
                                  <>
                                    <span className="text-[10px] font-inter text-zinc-400">Wunschzeit</span>
                                    <span className="text-[10px] font-inter font-semibold text-zinc-700">{b.preferred_time_from||"?"} – {b.preferred_time_to||"?"}</span>
                                  </>
                                )}
                                {b.body_part && (
                                  <>
                                    <span className="text-[10px] font-inter text-zinc-400">Motiv / Stelle</span>
                                    <span className="text-[10px] font-inter font-semibold text-zinc-700 truncate">{b.body_part}</span>
                                  </>
                                )}
                                {b.notes && (
                                  <>
                                    <span className="text-[10px] font-inter text-zinc-400 pt-0.5">Anmerkung</span>
                                    <span className="text-[10px] font-inter text-zinc-600 italic col-span-1">"{b.notes}"</span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {bookCalSelected && !bookingsByDate[bookCalSelected]?.length && (
                    <div className="border-t border-zinc-100 px-5 py-4 text-center">
                      <p className="text-xs font-inter text-zinc-400">Keine Buchungen an diesem Tag</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Search bar */}
            <div className="relative">
              <Search size={15} strokeWidth={1.8} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={bookingSearch}
                onChange={e => setBookingSearch(e.target.value)}
                placeholder="Suchen nach Name, Datum, Art oder Status..."
                className="w-full pl-9 pr-10 py-2.5 bg-white border border-zinc-200 rounded-2xl font-inter text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-all"
                data-testid="booking-search-input"
              />
              {bookingSearch && (
                <button onClick={() => setBookingSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors">
                  <X size={14} strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 bg-white rounded-2xl border border-black/[0.04] shadow-[0_2px_10px_rgb(0,0,0,0.04)] p-1.5 w-fit">
              {[
                { id: "active", label: `Aktuelle Buchungen (${activeBookings.length})` },
                { id: "past", label: `Vergangene Termine (${pastStudioBookings.length})` }
              ].map(t => (
                <motion.button key={t.id} onClick={() => setStudioBookingsTab(t.id)} whileTap={{ scale: 0.96 }}
                  className={`px-4 py-2 rounded-xl text-sm font-inter font-medium transition-all whitespace-nowrap ${studioBookingsTab === t.id ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}`}
                  data-testid={`studio-bookings-${t.id}-tab`}>
                  {t.label}
                </motion.button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="divide-y divide-zinc-50">
                {(() => {
                  const typeMap = { tattoo: "tattoo", consultation: "beratung", full_day: "ganztag", video_consultation: "video" };
                  const statusMap = { pending: "ausstehend", confirmed: "bestätigt", cancelled: "abgesagt" };
                  const q = bookingSearch.toLowerCase().trim();
                  const base = studioBookingsTab === "active" ? activeBookings : pastStudioBookings;
                  const filtered = q ? base.filter(b => {
                    const dateStr = b.date ? new Date(b.date + "T12:00:00").toLocaleDateString("de-DE") : "";
                    return (
                      (b.user_name || "").toLowerCase().includes(q) ||
                      (b.user_email || "").toLowerCase().includes(q) ||
                      dateStr.includes(q) ||
                      (typeMap[b.booking_type] || b.booking_type || "").includes(q) ||
                      (b.booking_type || "").toLowerCase().includes(q) ||
                      (statusMap[b.status] || b.status || "").includes(q) ||
                      (b.start_time || "").includes(q) ||
                      (b.notes || "").toLowerCase().includes(q)
                    );
                  }) : base;

                  if (filtered.length === 0) return (
                    <div className="py-20 flex flex-col items-center text-center">
                      <Calendar size={28} className="text-zinc-200 mb-4" strokeWidth={1.5} />
                      <h3 className="font-playfair text-lg text-zinc-900 mb-1">{q ? "Keine Ergebnisse" : "Keine Buchungen"}</h3>
                      <p className="text-xs text-zinc-400 font-inter">
                        {q ? `Keine Buchungen für "${bookingSearch}" gefunden` : studioBookingsTab === "active" ? "Aktive Buchungen erscheinen hier" : "Vergangene Termine werden hier angezeigt"}
                      </p>
                      {q && <button onClick={() => setBookingSearch("")} className="mt-3 text-xs text-zinc-500 underline font-inter hover:text-zinc-900">Filter zurücksetzen</button>}
                    </div>
                  );

                  return filtered.map((b, idx) => {
                  const isPast = isBookingPast(b);
                  return (
                    <motion.div key={b.booking_id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, type: "spring", stiffness: 300, damping: 22 }}
                      whileHover={{ y: -1, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}
                      className={`group relative px-5 py-4 rounded-xl mx-1 my-0.5 transition-colors hover:bg-zinc-50 cursor-default ${isPast && b.status !== "completed" ? "opacity-75" : ""}`}
                      data-testid={`studio-booking-${b.booking_id}`}
                    >
                      <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-zinc-900 rounded-r-full scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center" />
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-inter font-semibold text-zinc-900">{b.user_name}</p>
                          <p className="text-sm text-zinc-500 font-inter">{b.user_email}</p>
                          <p className="text-xs text-zinc-400 font-inter mt-1">{b.date ? new Date(b.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""} · {b.start_time ? `${b.start_time} – ${b.end_time}` : "Zeit ausstehend"} · {b.booking_type === "video_consultation" ? "Videoberatung" : b.booking_type === "consultation" ? "Beratung" : "Tattoo"}</p>
                          {(b.preferred_time_from || b.preferred_time_to) && (
                            <p className="text-xs text-zinc-400 font-inter mt-0.5">
                              <span className="text-zinc-500 font-medium">Wunschzeit:</span>{" "}
                              {b.preferred_time_from || "?"} – {b.preferred_time_to || "?"}
                            </p>
                          )}
                          {(b.size_category || b.body_part) && (
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              {b.size_category && <span className="text-[11px] font-inter bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{b.size_category}</span>}
                              {b.body_part && <span className="text-[11px] font-inter bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{b.body_part}</span>}
                            </div>
                          )}
                          {b.notes && <p className="text-xs text-zinc-400 font-inter mt-1 italic">"{b.notes}"</p>}
                          {b.reference_images?.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {b.reference_images.slice(0, 3).map((img, i) => (
                                <img key={i} src={img} alt="" className="w-12 h-12 object-cover rounded-xl border border-zinc-200" />
                              ))}
                            </div>
                          )}
                          {b.deposit_deadline_at && b.payment_status !== "paid" && b.status !== "cancelled" && (
                            <div className="mt-2">
                              <DepositCountdown deadlineAt={b.deposit_deadline_at} />
                            </div>
                          )}
                          {b.cancellation_reason && (
                            <p className="text-xs text-red-500 font-inter mt-1">Grund: {b.cancellation_reason}</p>
                          )}
                        </div>
                        {/* ── Right action panel ── */}
                        <div className="flex flex-col gap-1.5 min-w-[158px] bg-zinc-50 border border-zinc-200 rounded-xl p-2.5">

                          {/* Status row */}
                          <div className="flex flex-col gap-1 pb-2 border-b border-zinc-200">
                            <span className={`text-xs px-2.5 py-1 rounded-full border font-inter text-center ${statusColors[b.status] || statusColors.pending}`}>
                              {statusLabels[b.status] || b.status}
                            </span>
                            {b.status === "confirmed" && b.payment_status === "paid" && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full border font-inter bg-emerald-50 text-emerald-600 border-emerald-200 flex items-center justify-center gap-1">
                                <CheckCircle size={9} strokeWidth={2} /> Anzahlung bezahlt
                              </span>
                            )}
                            {b.consent_status === "submitted" && (
                              <span className="flex items-center gap-1">
                                <span className="text-[10px] px-2 py-0.5 rounded-full border font-inter bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center justify-center gap-1" title={`Einverständnis eingereicht${b.consent_submitted_at ? " am " + b.consent_submitted_at.slice(0,10) : ""}`}>
                                  <CheckCircle size={9} strokeWidth={2} /> Einverständnis ✓
                                </span>
                                <button
                                  type="button"
                                  title="Einverständnis PDF herunterladen"
                                  onClick={async () => {
                                    try {
                                      const res = await axios.get(`${API}/bookings/${b.booking_id}/consent/download`, { withCredentials: true });
                                      const pdfData = res.data?.pdf_data || "";
                                      if (pdfData) {
                                        const link = document.createElement("a");
                                        link.href = pdfData;
                                        link.download = `einverstaendnis-${b.booking_id}.pdf`;
                                        link.click();
                                      } else {
                                        notify.info("Kein PDF gespeichert – das Formular wurde mit einer älteren Version eingereicht.");
                                      }
                                    } catch (err) {
                                      notify.error("PDF konnte nicht geladen werden.");
                                    }
                                  }}
                                  className="text-[10px] px-1.5 py-0.5 rounded-full border font-inter bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-800 transition-colors flex items-center gap-0.5"
                                >
                                  <Download size={8} strokeWidth={2} /> PDF
                                </button>
                              </span>
                            )}
                            {b.consent_status === "required" && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full border font-inter bg-amber-50 text-amber-700 border-amber-200 flex items-center justify-center gap-1 animate-pulse">
                                ⚠️ Formular ausstehend
                              </span>
                            )}
                            {b.refund_pending && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full border font-inter bg-amber-50 text-amber-700 border-amber-200 flex items-center justify-center gap-1 animate-pulse">
                                ⚠️ Rückzahlung ausstehend
                              </span>
                            )}
                            {!b.refund_pending && (b.refund_status === "refunded" || b.refund_status === "manual") && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full border font-inter bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center justify-center gap-1">
                                <CheckCircle size={9} strokeWidth={2} /> Rückzahlung eingeleitet
                              </span>
                            )}
                            {b.status === "completed" && (b.revenue || 0) > 0 && (
                              <span className="text-sm font-playfair font-semibold text-emerald-600 text-center" data-testid={`revenue-display-${b.booking_id}`}>
                                + €&thinsp;{(b.revenue).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>

                          {/* Confirmed: payment actions */}
                          {b.status === "confirmed" && (
                            <>
                              <motion.button whileTap={{ scale: 0.97 }}
                                onClick={() => { setFinalPayModal(b); setFinalPayAmount(""); setFinalPayMethod("cash"); }}
                                className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-inter hover:bg-emerald-700 transition-colors"
                                data-testid={`complete-booking-btn-${b.booking_id}`}
                              >
                                <CreditCard size={11} strokeWidth={2} /> Zahlung erfassen
                              </motion.button>
                              <motion.button whileTap={{ scale: 0.97 }}
                                onClick={() => handleCheckFinalPayment(b.booking_id)}
                                disabled={checkPayLoading[b.booking_id]}
                                className="w-full flex items-center justify-center gap-1.5 text-[11px] px-3 py-1.5 bg-violet-50 border border-violet-200 text-violet-700 rounded-lg font-inter hover:bg-violet-100 hover:border-violet-400 transition-all disabled:opacity-50"
                              >
                                {checkPayLoading[b.booking_id]
                                  ? <><div className="w-2.5 h-2.5 border border-violet-400 border-t-transparent rounded-full animate-spin" /> Wird geprüft…</>
                                  : <><CheckCircle size={10} strokeWidth={2} /> Zahlungseingang prüfen</>
                                }
                              </motion.button>
                              {isPast && (
                                <motion.button whileTap={{ scale: 0.97 }}
                                  onClick={async () => {
                                    const ok = await notify.confirm("Kunde als No-Show markieren?", "Die Anzahlung wird einbehalten.");
                                    if (!ok) return;
                                    try { await axios.post(`${API}/bookings/${b.booking_id}/no-show`, {}, { withCredentials: true }); fetchStats(); } catch (e) { notify.error(e.response?.data?.detail || "Fehler"); }
                                  }}
                                  className="w-full flex items-center justify-center gap-1.5 text-[11px] px-3 py-1.5 border border-zinc-200 text-zinc-500 rounded-lg font-inter hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all"
                                  data-testid={`no-show-btn-${b.booking_id}`}
                                >
                                  ⚠️ No-Show markieren
                                </motion.button>
                              )}
                            </>
                          )}

                          {/* Pending deposit refund */}
                          {b.refund_pending && (
                            <motion.button whileTap={{ scale: 0.97 }}
                              onClick={() => handleRefundDeposit(b.booking_id)}
                              disabled={depositRefundLoading === b.booking_id}
                              className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg font-inter font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
                              data-testid={`refund-deposit-btn-${b.booking_id}`}
                            >
                              {depositRefundLoading === b.booking_id
                                ? <><div className="w-2.5 h-2.5 border border-white/50 border-t-transparent rounded-full animate-spin" />&nbsp;Wird gebucht…</>
                                : "💳 Anzahlung zurückzahlen"
                              }
                            </motion.button>
                          )}

                          {/* Pending: offer button */}
                          {["pending_studio_review","under_review","pending"].includes(b.status) && !isPast && (
                            <motion.button whileTap={{ scale: 0.97 }}
                              onClick={() => { setOfferModal(b); setOfferForm(f => ({ ...f, offer_date: b.date || "", offer_notes: "" })); }}
                              className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 bg-violet-600 text-white rounded-lg font-inter hover:bg-violet-700 transition-colors"
                              data-testid={`create-offer-btn-${b.booking_id}`}
                            >
                              📋 Angebot erstellen
                            </motion.button>
                          )}

                          {/* Divider before utility actions */}
                          <div className="border-t border-zinc-200 pt-1.5 flex flex-col gap-1.5">
                            {/* Cancel */}
                            {STUDIO_ACTIVE.includes(b.status) && (!isPast || isBookingToday(b)) && (
                              <motion.button whileTap={{ scale: 0.97 }}
                                onClick={async () => {
                                  if (b.payment_status === "paid") {
                                    setRefundModal(b);
                                  } else {
                                    const ok = await notify.confirm("Buchung wirklich stornieren?", "Diese Aktion kann nicht rückgängig gemacht werden.");
                                    if (!ok) return;
                                    axios.put(`${API}/bookings/${b.booking_id}/status`, null, { params: { status: "studio_cancelled" }, withCredentials: true }).then(fetchStats).catch(() => {});
                                  }
                                }}
                                className="w-full flex items-center justify-center gap-1.5 text-[11px] px-3 py-1.5 border border-zinc-200 text-zinc-500 rounded-lg font-inter hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
                                data-testid={`cancel-booking-studio-${b.booking_id}`}
                              >
                                {b.payment_status === "paid" ? "Stornieren & Rückzahlen" : "Stornieren"}
                              </motion.button>
                            )}
                            {/* Notes */}
                            <motion.button whileTap={{ scale: 0.97 }}
                              onClick={() => setNotesModal(b)}
                              className="w-full flex items-center justify-center gap-1.5 text-[11px] px-3 py-1.5 border border-zinc-200 text-zinc-500 rounded-lg font-inter hover:bg-zinc-100 hover:text-zinc-700 transition-all"
                              data-testid={`notes-btn-booking-${b.booking_id}`}
                            >
                              <FileText size={11} strokeWidth={1.5} /> Bemerkungen
                            </motion.button>
                            {/* Contact */}
                            <motion.button whileTap={{ scale: 0.97 }}
                              onClick={() => handleContactCustomer(b)}
                              className="w-full flex items-center justify-center gap-1.5 text-[11px] px-3 py-1.5 border border-zinc-200 text-zinc-600 rounded-lg font-inter hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all"
                              data-testid={`contact-customer-booking-${b.booking_id}`}
                            >
                              <MessageSquare size={11} strokeWidth={1.5} /> Kunde kontaktieren
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                  }); // end filtered.map
                })()} {/* end IIFE */}
              </div>
            </div>
          </motion.div>
        )}

        {/* Inquiries Tab */}
        {activeTab === "inquiries" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 22 }} className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-playfair font-semibold text-xl text-zinc-900">Gäste-Anfragen</h3>
                <p className="text-xs text-zinc-500 font-inter mt-0.5">Anfragen von Kunden ohne Account — direkt vom Studio-Profil</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => fetchInquiries(stats?.studio?.studio_id, false)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-inter text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 6A4 4 0 1 1 6 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 2v4H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Aktualisieren
                </button>
              </div>
            </div>

            {inquiriesLoading ? (
              <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-zinc-50 last:border-0">
                    <div className="w-20 h-5 bg-zinc-100 animate-pulse rounded-full" />
                    <div className="w-32 h-4 bg-zinc-100 animate-pulse rounded" />
                    <div className="flex-1 h-4 bg-zinc-100 animate-pulse rounded" />
                    <div className="w-16 h-4 bg-zinc-100 animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : (() => {
              const visible = inquiries;
              if (visible.length === 0) return (
                <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-12 text-center">
                  <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <MessageSquare size={20} className="text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <p className="font-inter font-semibold text-zinc-600 text-sm mb-1">Noch keine Anfragen</p>
                  <p className="text-xs text-zinc-400 font-inter">Wenn Kunden über dein Studio-Profil eine Anfrage senden, erscheinen sie hier.</p>
                </div>
              );

              const statusMap = {
                pending:    { label: "Neu",               bg: "bg-amber-50 text-amber-700 border-amber-200" },
                contacted:  { label: "Kontaktiert",       bg: "bg-blue-50 text-blue-700 border-blue-200" },
                closed:     { label: "Abgeschlossen",     bg: "bg-zinc-100 text-zinc-500 border-zinc-200" },
                offer_sent: { label: "Angebot gesendet",  bg: "bg-violet-50 text-violet-700 border-violet-200" },
              };

              return (
                <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[90px_180px_1fr_90px_100px] gap-3 px-5 py-2.5 bg-zinc-50 border-b border-zinc-100">
                    <span className="text-[10px] font-inter font-semibold uppercase tracking-wider text-zinc-400">Status</span>
                    <span className="text-[10px] font-inter font-semibold uppercase tracking-wider text-zinc-400">Kunde</span>
                    <span className="text-[10px] font-inter font-semibold uppercase tracking-wider text-zinc-400">Anfrage</span>
                    <span className="text-[10px] font-inter font-semibold uppercase tracking-wider text-zinc-400">Datum</span>
                    <span className="text-[10px] font-inter font-semibold uppercase tracking-wider text-zinc-400 text-right">Aktionen</span>
                  </div>

                  {visible.map((inq, idx) => {
                    const s = statusMap[inq.status] || statusMap.pending;
                    const dateStr = inq.created_at ? new Date(inq.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short" }) : "";
                    const imgs = inq.reference_images || [];
                    const isExpanded = expandedInquiry === inq.inquiry_id;

                    return (
                      <motion.div key={inq.inquiry_id} layout className="border-b border-zinc-50 last:border-0">
                        {/* Compact row */}
                        <div
                          className="grid grid-cols-[90px_180px_1fr_90px_100px] gap-3 px-5 py-3 items-center cursor-pointer hover:bg-zinc-50/60 transition-colors"
                          onClick={() => setExpandedInquiry(isExpanded ? null : inq.inquiry_id)}
                        >
                          <span className={`text-[10px] font-inter font-semibold px-2 py-0.5 rounded-full border w-fit ${s.bg}`}>{s.label}</span>

                          <div className="min-w-0">
                            <p className="font-inter font-medium text-zinc-900 text-xs truncate">{inq.user_name}</p>
                            <p className="text-[10px] text-zinc-400 font-inter truncate">{inq.user_email}</p>
                          </div>

                          <div className="min-w-0 flex items-center gap-2">
                            <p className="text-xs font-inter text-zinc-600 truncate flex-1">{inq.tattoo_description}</p>
                            {(inq.size || inq.body_part) && (
                              <div className="hidden lg:flex gap-1 flex-shrink-0">
                                {inq.size && <span className="text-[10px] font-inter bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full whitespace-nowrap">{inq.size}</span>}
                                {inq.body_part && <span className="text-[10px] font-inter bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full whitespace-nowrap">{inq.body_part}</span>}
                              </div>
                            )}
                            {imgs.length > 0 && <span className="text-[10px] text-zinc-400 flex-shrink-0">📷 {imgs.length}</span>}
                          </div>

                          <span className="text-[11px] font-inter text-zinc-400 whitespace-nowrap">{dateStr}</span>

                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            {inq.status !== "offer_sent" && (
                              <button
                                onClick={() => {
                                  setOfferModal({ _inquiry_id: inq.inquiry_id, user_name: inq.user_name, notes: inq.tattoo_description });
                                  setOfferForm(f => ({ ...f, offer_date: "", offer_notes: "" }));
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                                title="Angebot erstellen & per E-Mail senden"
                              >
                                <Tag size={11} strokeWidth={1.5} />
                              </button>
                            )}
                            <button
                              onClick={() => navigate(`/messages/${inq.user_id}`, { state: { recipientName: inq.user_name, recipientRole: "customer" } })}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 transition-colors"
                              title="Nachricht senden"
                            >
                              <MessageSquare size={11} strokeWidth={1.5} />
                            </button>
                            <button
                              onClick={() => { setRejectModal(inq); setRejectReason(""); }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                              title="Ablehnen & löschen"
                            >
                              <Trash2 size={11} strokeWidth={2} />
                            </button>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.18 }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 pb-4 pt-1 bg-zinc-50/50 border-t border-zinc-100">
                                <p className="text-xs font-inter text-zinc-700 leading-relaxed mb-3">{inq.tattoo_description}</p>
                                {(inq.size || inq.body_part) && (
                                  <div className="flex gap-2 mb-3 flex-wrap">
                                    {inq.size && <span className="text-[11px] font-inter bg-white border border-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full">{inq.size}</span>}
                                    {inq.body_part && <span className="text-[11px] font-inter bg-white border border-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full">{inq.body_part}</span>}
                                  </div>
                                )}
                                {(inq.wished_date_from || inq.wished_date_to || inq.wished_time) && (
                                  <div className="flex items-center gap-1.5 mb-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl flex-wrap">
                                    <Calendar size={11} className="text-blue-500 shrink-0" strokeWidth={1.5} />
                                    <span className="text-[11px] font-inter font-semibold text-blue-700">Wunschzeitraum:</span>
                                    {inq.wished_date_from && <span className="text-[11px] font-inter text-blue-700">{new Date(inq.wished_date_from + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>}
                                    {inq.wished_date_to && inq.wished_date_to !== inq.wished_date_from && <><span className="text-[11px] text-blue-400">–</span><span className="text-[11px] font-inter text-blue-700">{new Date(inq.wished_date_to + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}</span></>}
                                    {inq.wished_time && <span className="text-[11px] font-inter text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">{inq.wished_time}</span>}
                                  </div>
                                )}
                                {imgs.length > 0 && (
                                  <div className="flex gap-2 mb-3 flex-wrap">
                                    {imgs.map((img, i) => (
                                      <button key={i} type="button" onClick={() => setNotesLightbox(img)} className="focus:outline-none">
                                        <img src={img} alt="" className="w-14 h-14 object-cover rounded-xl border border-zinc-200 hover:opacity-80 transition-opacity cursor-zoom-in" />
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 flex-wrap">
                                  {inq.status !== "offer_sent" && (
                                    <button
                                      onClick={() => {
                                        setOfferModal({ _inquiry_id: inq.inquiry_id, user_name: inq.user_name, notes: inq.tattoo_description });
                                        setOfferForm(f => ({ ...f, offer_date: "", offer_notes: "" }));
                                      }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs font-inter font-medium rounded-xl hover:bg-violet-700 transition-colors"
                                    >
                                      <Tag size={11} strokeWidth={1.5} /> Angebot erstellen
                                    </button>
                                  )}
                                  <button
                                    onClick={() => navigate(`/messages/${inq.user_id}`, { state: { recipientName: inq.user_name, recipientRole: "customer" } })}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-xs font-inter font-medium rounded-xl hover:bg-zinc-700 transition-colors"
                                  >
                                    <MessageSquare size={11} strokeWidth={1.5} /> Nachricht senden
                                  </button>
                                  {inq.status === "pending" && (
                                    <button onClick={() => updateInquiryStatus(inq.inquiry_id, "contacted")}
                                      className="px-3 py-1.5 text-xs font-inter text-zinc-600 border border-zinc-200 rounded-xl hover:bg-white transition-colors">
                                      Als kontaktiert markieren
                                    </button>
                                  )}
                                  {inq.status === "contacted" && (
                                    <button onClick={() => updateInquiryStatus(inq.inquiry_id, "closed")}
                                      className="px-3 py-1.5 text-xs font-inter text-zinc-500 border border-zinc-200 rounded-xl hover:bg-white transition-colors">
                                      Abschließen
                                    </button>
                                  )}
                                  {inq.status !== "pending" && (
                                    <button onClick={() => updateInquiryStatus(inq.inquiry_id, "pending")}
                                      className="px-3 py-1.5 text-xs font-inter text-zinc-400 hover:text-zinc-600 transition-colors">
                                      Zurücksetzen
                                    </button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Invoices Tab */}
        {activeTab === "invoices" && (() => {
          const payTypeLabel = { deposit: "Anzahlung", final: "Abschluss", cash: "Barzahlung" };
          const payMethodLabel = { stripe: "Stripe", cash: "Bar" };
          const typeLabels = { tattoo: "Tattoo-Sitzung", consultation: "Beratung", full_day: "Ganztag", video_consultation: "Videoberatung" };
          const payMethodFull = { stripe: "Stripe (Karte)", cash: "Barzahlung" };
          const payTypeFull = { deposit: "Anzahlung", final: "Abschlusszahlung", cash: "Barzahlung" };

          const downloadInvoicePDF = (inv) => {
            const doc = new jsPDF();
            const taxModel = stats?.studio?.tax_model || "standard";
            const taxNumber = stats?.studio?.tax_number || "";
            const sName = inv.studio_name || stats?.studio?.name || "Studio";
            const cName = inv.user_name || "Kunde";
            const invNum = inv.invoice_number || "INK-?";
            const dateStr = inv.created_at ? new Date(inv.created_at).toLocaleDateString("de-DE") : "–";
            const bDateStr = inv.booking_date ? new Date(inv.booking_date + "T12:00:00").toLocaleDateString("de-DE") : "–";
            const timeStr = inv.booking_time ? ` · ${inv.booking_time}` : "";
            const tLabel = typeLabels[inv.booking_type] || "Tattoo-Sitzung";
            const pMethod = payMethodFull[inv.payment_method] || inv.payment_method || "–";
            const pType = payTypeFull[inv.payment_type] || inv.payment_type || "–";
            const gross = inv.amount || 0;
            const fmt = (n) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            // Tax calculations
            const isStandard = taxModel !== "kleinunternehmer";
            const vatRate = 0.19;
            const net = isStandard ? gross / (1 + vatRate) : gross;
            const vat = isStandard ? gross - net : 0;

            // Header
            doc.setFillColor(24, 24, 27);
            doc.rect(0, 0, 210, 36, "F");
            doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(255, 255, 255);
            doc.text("StudioOS", 14, 16);
            doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(180, 180, 180);
            doc.text("Tattoo Studio Booking", 14, 25);

            // Title
            doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(24, 24, 27);
            doc.text("Rechnung", 14, 52);
            doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(113, 113, 122);
            doc.text(`Nr. ${invNum}`, 14, 60);

            // Date (right)
            doc.setFontSize(9); doc.text("Erstellt am", 196, 52, { align: "right" });
            doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(24, 24, 27);
            doc.text(dateStr, 196, 59, { align: "right" });

            // Studio / Kunde boxes — slightly taller to fit tax number
            const studioBoxH = taxNumber ? 28 : 22;
            doc.setFillColor(244, 244, 245);
            doc.roundedRect(14, 67, 85, studioBoxH, 3, 3, "F");
            doc.roundedRect(111, 67, 85, studioBoxH, 3, 3, "F");
            doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(113, 113, 122);
            doc.text("STUDIO", 18, 73); doc.text("KUNDE", 115, 73);
            doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(24, 24, 27);
            doc.text(sName, 18, 82, { maxWidth: 77 });
            doc.text(cName, 115, 82, { maxWidth: 77 });
            if (taxNumber) {
              doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(113, 113, 122);
              doc.text(taxNumber, 18, 91, { maxWidth: 77 });
            }

            const tableStartY = 67 + studioBoxH + 6;

            // Table
            autoTable(doc, {
              startY: tableStartY,
              head: [["Leistung", "Termin", "Typ", isStandard ? "Nettobetrag" : "Betrag"]],
              body: [[tLabel, `${bDateStr}${timeStr}`, pType, `\u20AC ${fmt(net)}`]],
              styles: { font: "helvetica", fontSize: 10, cellPadding: 5 },
              headStyles: { fillColor: [244, 244, 245], textColor: [113, 113, 122], fontStyle: "bold", fontSize: 8 },
              columnStyles: {
                0: { cellWidth: 55 }, 1: { cellWidth: 58 }, 2: { cellWidth: 42 }, 3: { cellWidth: 35, halign: "right" },
              },
              tableLineColor: [235, 235, 235], tableLineWidth: 0.1,
            });

            const finalY = doc.lastAutoTable.finalY + 8;

            if (isStandard) {
              // MwSt breakdown: Netto + MwSt + Brutto
              const rowH = 7;
              doc.setFillColor(248, 248, 248);
              doc.roundedRect(110, finalY, 86, rowH * 3 + 10, 3, 3, "F");
              doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(113, 113, 122);
              doc.text("Nettobetrag", 116, finalY + rowH);
              doc.text("MwSt. 19%", 116, finalY + rowH * 2);
              doc.setFont("helvetica", "bold"); doc.setTextColor(24, 24, 27);
              doc.text("Bruttobetrag", 116, finalY + rowH * 3 + 2);
              doc.setFont("helvetica", "normal"); doc.setTextColor(113, 113, 122);
              doc.text(`\u20AC ${fmt(net)}`, 192, finalY + rowH, { align: "right" });
              doc.text(`\u20AC ${fmt(vat)}`, 192, finalY + rowH * 2, { align: "right" });

              // Total block
              const totalY = finalY + rowH * 3 + 14;
              doc.setFillColor(24, 24, 27);
              doc.roundedRect(14, totalY, 182, 24, 4, 4, "F");
              doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(161, 161, 170);
              doc.text(`Zahlungsart: ${pMethod}`, 20, totalY + 10);
              doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(255, 255, 255);
              doc.text(`\u20AC ${fmt(gross)}`, 192, totalY + 16, { align: "right" });
            } else {
              // Kleinunternehmer — plain total + §19 note
              doc.setFillColor(24, 24, 27);
              doc.roundedRect(14, finalY, 182, 24, 4, 4, "F");
              doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(161, 161, 170);
              doc.text(`Zahlungsart: ${pMethod}`, 20, finalY + 10);
              doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(255, 255, 255);
              doc.text(`\u20AC ${fmt(gross)}`, 192, finalY + 16, { align: "right" });

              // §19 note
              doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(113, 113, 122);
              doc.text(
                "Kein Ausweis von Umsatzsteuer gem\u00e4\u00df \u00a719 UStG.",
                14, finalY + 32
              );
            }

            // Footer
            const pageH = doc.internal.pageSize.height;
            doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(180, 180, 180);
            doc.text("Erstellt mit StudioOS \u00b7 inkbook.io", 14, pageH - 8);
            doc.text(invNum, 196, pageH - 8, { align: "right" });

            doc.save(`${invNum}.pdf`);
          };

          const invMonthPrefix = `${invNavYear}-${String(invNavMonth).padStart(2,"0")}`;
          const invMonthLabel = new Date(invNavYear, invNavMonth - 1, 1).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
          const filteredInvoices = invNavAll ? invoices : invoices.filter(inv => (inv.created_at || "").startsWith(invMonthPrefix));
          const handleInvPrev = () => { if (invNavMonth === 1) { setInvNavMonth(12); setInvNavYear(y => y - 1); } else setInvNavMonth(m => m - 1); };
          const handleInvNext = () => { if (invNavMonth === 12) { setInvNavMonth(1); setInvNavYear(y => y + 1); } else setInvNavMonth(m => m + 1); };

          return (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-playfair font-bold text-xl text-zinc-900">Rechnungen</h2>
                  <p className="text-xs text-zinc-400 font-inter mt-0.5">Alle ausgestellten Rechnungen deines Studios</p>
                </div>
                {/* Month filter nav */}
                <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-xl px-1.5 py-1">
                  <button onClick={() => setInvNavAll(true)} className={`text-[11px] font-inter font-semibold px-2.5 py-1 rounded-lg transition-all ${invNavAll ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-800"}`}>Alle</button>
                  <div className="w-px h-4 bg-zinc-200" />
                  <button onClick={() => { setInvNavAll(false); handleInvPrev(); }} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
                    <ChevronLeft size={13} strokeWidth={2} />
                  </button>
                  <button onClick={() => setInvNavAll(false)} className={`text-[11px] font-inter font-semibold px-2 py-1 rounded-lg min-w-[96px] text-center transition-all ${!invNavAll ? "text-zinc-900" : "text-zinc-400"}`}>{invMonthLabel}</button>
                  <button onClick={() => { setInvNavAll(false); handleInvNext(); }} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
                    <ChevronRight size={13} strokeWidth={2} />
                  </button>
                </div>
              </div>
              {invoicesLoading ? (
                <div className="flex items-center justify-center py-16 text-zinc-400">
                  <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin mr-3" />
                  <span className="text-sm font-inter">Lade Rechnungen…</span>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="bg-white rounded-2xl border border-black/[0.04] shadow-sm p-12 text-center">
                  <Receipt size={32} className="mx-auto mb-3 text-zinc-300" />
                  <p className="font-inter text-sm text-zinc-500">{invNavAll ? "Noch keine Rechnungen vorhanden." : `Keine Rechnungen für ${invMonthLabel}.`}</p>
                  <p className="font-inter text-xs text-zinc-400 mt-1">{invNavAll ? "Rechnungen werden automatisch erstellt, sobald Zahlungen eingehen." : "Navigiere zu einem anderen Monat oder wähle 'Alle'."}</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden">
                  <div className="grid grid-cols-[120px_1fr_1fr_100px_90px_90px_40px] gap-0 border-b border-zinc-100 px-5 py-3">
                    {["Nr.", "Datum", "Kunde", "Typ", "Zahlungsart", "Betrag", ""].map((h, idx) => (
                      <p key={idx} className="text-[10px] font-inter font-semibold uppercase tracking-wider text-zinc-400">{h}</p>
                    ))}
                  </div>
                  {filteredInvoices.map((inv, i) => {
                    const dateStr = inv.created_at ? new Date(inv.created_at).toLocaleDateString("de-DE") : "–";
                    const amtStr = `€\u2009${(inv.amount || 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    return (
                      <div key={inv.invoice_id} className={`grid grid-cols-[120px_1fr_1fr_100px_90px_90px_40px] gap-0 px-5 py-3.5 items-center ${i % 2 === 1 ? "bg-zinc-50/60" : ""} ${i < filteredInvoices.length - 1 ? "border-b border-zinc-100" : ""}`}>
                        <p className="text-xs font-mono font-semibold text-zinc-700">{inv.invoice_number}</p>
                        <p className="text-xs font-inter text-zinc-600">{dateStr}</p>
                        <p className="text-xs font-inter text-zinc-600 truncate">{inv.user_name || "–"}</p>
                        <span className="text-[10px] font-inter font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 w-fit">
                          {payTypeLabel[inv.payment_type] || inv.payment_type || "–"}
                        </span>
                        <span className={`text-[10px] font-inter font-semibold px-2 py-0.5 rounded-full w-fit ${inv.payment_method === "stripe" ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {payMethodLabel[inv.payment_method] || inv.payment_method || "–"}
                        </span>
                        <p className="text-xs font-inter font-semibold text-zinc-900">{amtStr}</p>
                        <button
                          onClick={() => downloadInvoicePDF(inv)}
                          title="PDF herunterladen"
                          className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-500 transition-all"
                        >
                          <Download size={13} strokeWidth={1.8} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* Waitlist Tab */}
        {activeTab === "waitlist" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-playfair font-bold text-xl text-zinc-900">Warteliste</h2>
                <p className="text-xs text-zinc-400 font-inter mt-0.5">Kunden die auf einen freien Platz warten</p>
              </div>
              <span className="text-xs font-inter font-semibold px-3 py-1.5 rounded-full bg-violet-100 text-violet-700">
                {studioWaitlist.filter(e => e.status === "active").length} aktiv
              </span>
            </div>

            {waitlistLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-zinc-100 rounded-2xl animate-pulse" />)}</div>
            ) : studioWaitlist.length === 0 ? (
              <div className="bg-white border border-zinc-100 rounded-2xl p-10 text-center shadow-sm">
                <Bell size={28} className="text-zinc-300 mx-auto mb-3" strokeWidth={1.5} />
                <p className="font-inter font-semibold text-zinc-600 text-sm">Keine Wartelisten-Einträge</p>
                <p className="text-xs text-zinc-400 font-inter mt-1">Kunden können sich eintragen, wenn ein Tag ausgebucht ist.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {studioWaitlist.map(entry => {
                  const sizeLabel = { mini: "Mini", small: "Small", medium: "Medium", large: "Large", xl: "XL" }[entry.size_category] || entry.size_category;
                  const dateLabel = entry.date
                    ? new Date(entry.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })
                    : (() => { try { const [y,m] = entry.month.split("-"); return new Date(y,m-1,1).toLocaleDateString("de-DE",{month:"long",year:"numeric"}); } catch { return entry.month; } })();
                  return (
                    <div key={entry.waitlist_id} className={`bg-white rounded-2xl border shadow-sm p-4 flex items-start justify-between gap-4 ${entry.status === "notified" ? "border-violet-200" : "border-zinc-100"}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-inter font-semibold text-sm text-zinc-900">{entry.user_name}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${entry.status === "notified" ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {entry.status === "notified" ? "Benachrichtigt" : "Wartet"}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 font-inter">{entry.user_email}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-xs font-inter text-zinc-600">📅 {entry.date ? "Am" : "Im"} {dateLabel}</span>
                          <span className="text-xs font-inter text-zinc-600">📐 {sizeLabel}</span>
                          {entry.notes && <span className="text-xs font-inter text-zinc-400 truncate max-w-[180px]">"{entry.notes}"</span>}
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-inter whitespace-nowrap mt-1">
                        {new Date(entry.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Artists Tab */}
        {activeTab === "artists" && stats?.studio && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}>
            <ArtistsTab studioId={stats.studio.studio_id} />
          </motion.div>
        )}

        {/* Kunden Tab */}
        {activeTab === "clients" && (() => {
          const studioId = stats?.studio?.studio_id;
          const labelMap = { before: "Vorher", after: "Nachher", healed: "Verheilt" };
          const statusLabelMap = { confirmed: "Bestätigt", completed: "Abgeschlossen", pending: "Ausstehend", cancelled: "Storniert", customer_cancelled: "Storniert", studio_cancelled: "Storniert" };

          const allStyles = [...new Set(clientsList.flatMap(c => c.styles || []))].sort();
          const now = new Date();
          const filteredClients = clientsList.filter(c => {
            if (clientSearch && !(
              c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
              c.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
              (c.tags || []).some(t => t.toLowerCase().includes(clientSearch.toLowerCase()))
            )) return false;
            if (clientStyleFilter && !(c.styles || []).includes(clientStyleFilter)) return false;
            if (clientDateFilter !== "all" && c.last_visit) {
              const lv = new Date(c.last_visit + "T12:00:00");
              const diffDays = (now - lv) / (1000 * 60 * 60 * 24);
              if (clientDateFilter === "30" && diffDays > 30) return false;
              if (clientDateFilter === "90" && diffDays > 90) return false;
              if (clientDateFilter === "365" && diffDays > 365) return false;
            } else if (clientDateFilter !== "all" && !c.last_visit) return false;
            return true;
          });

          return (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  {selectedClient && (
                    <button onClick={() => { setSelectedClient(null); setClientCard(null); setClientTagInput(""); }}
                      className="flex items-center gap-1.5 text-xs font-inter text-zinc-500 hover:text-zinc-900 transition-colors px-2.5 py-1.5 rounded-xl hover:bg-zinc-100">
                      <ChevronLeft size={14} strokeWidth={2} /> Zurück
                    </button>
                  )}
                  <div>
                    <h2 className="font-playfair font-bold text-xl text-zinc-900">
                      {selectedClient ? clientCard?.name || selectedClient.name : "Kundenkartei"}
                    </h2>
                    <p className="text-xs text-zinc-400 font-inter mt-0.5">
                      {selectedClient ? (clientCard?.email || selectedClient.email) : `${clientsList.length} Kunden insgesamt`}
                    </p>
                  </div>
                </div>
                {!selectedClient && (
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" strokeWidth={1.5} />
                    <input
                      value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                      placeholder="Name, E-Mail oder Tag..."
                      className="pl-8 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-inter text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-all w-64"
                    />
                  </div>
                )}
              </div>

              {/* Filter chips (style + date) */}
              {!selectedClient && (allStyles.length > 0 || clientDateFilter !== "all" || clientStyleFilter) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {/* Date filter */}
                  {[{v:"all",l:"Alle Zeiträume"},{v:"30",l:"Letzten 30 Tage"},{v:"90",l:"Letztes Quartal"},{v:"365",l:"Dieses Jahr"}].map(opt => (
                    <button key={opt.v} onClick={() => setClientDateFilter(opt.v)}
                      className={`px-3 py-1 rounded-full text-xs font-inter transition-all border ${clientDateFilter === opt.v ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"}`}>
                      {opt.l}
                    </button>
                  ))}
                  {/* Style filter chips */}
                  {allStyles.map(s => (
                    <button key={s} onClick={() => setClientStyleFilter(clientStyleFilter === s ? null : s)}
                      className={`px-3 py-1 rounded-full text-xs font-inter transition-all border ${clientStyleFilter === s ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Client List */}
              {!selectedClient && (
                <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden">
                  {clientsLoading ? (
                    <div className="p-8 flex flex-col gap-3">
                      {[1,2,3,4].map(i => <div key={i} className="h-14 bg-zinc-100 rounded-xl animate-pulse" />)}
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4">
                        <Users size={26} className="text-zinc-300" strokeWidth={1.5} />
                      </div>
                      <h3 className="font-playfair text-lg text-zinc-900 mb-1">
                        {clientSearch ? "Kein Treffer" : "Noch keine Kunden"}
                      </h3>
                      <p className="text-zinc-400 font-inter text-sm text-center max-w-xs">
                        {clientSearch ? "Kein Kunde passt zur Suche." : "Sobald ein Kunde eine Buchung erstellt hat, erscheint er hier."}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-50">
                      {filteredClients.map((client, i) => {
                        const fitz = FITZPATRICK.find(f => f.scale === client.fitzpatrick_scale);
                        return (
                          <motion.div key={client.user_id}
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 22 }}
                            onClick={() => {
                              setSelectedClient(client);
                              setClientTagInput("");
                              fetchClientCard(studioId, client.user_id);
                            }}
                            className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 cursor-pointer transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-playfair font-bold text-base text-white"
                              style={{ background: fitz?.bg || "#94a3b8" }}>
                              {(client.name || "?")[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-inter font-semibold text-sm text-zinc-900">{client.name || "Unbekannt"}</span>
                                {(client.tags || []).map(t => (
                                  <span key={t} className="text-[10px] font-inter px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full">{t}</span>
                                ))}
                                {fitz && (
                                  <span className="flex items-center gap-1 text-[10px] font-inter text-zinc-500">
                                    <span className="w-3 h-3 rounded-full inline-block border border-black/10" style={{ background: fitz.bg }} />
                                    {fitz.label}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-400 font-inter mt-0.5 truncate">{client.email}</p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <p className="text-xs font-inter font-semibold text-zinc-700">{client.visit_count} {client.visit_count === 1 ? "Besuch" : "Besuche"}</p>
                              {client.last_visit && (
                                <p className="text-xs text-zinc-400 font-inter">
                                  {new Date(client.last_visit + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}
                                </p>
                              )}
                            </div>
                            <ChevronRight size={14} className="text-zinc-300 group-hover:text-zinc-500 transition-colors flex-shrink-0" strokeWidth={1.5} />
                          </motion.div>
                        );
                      })}
                      {/* Load more */}
                      {!clientSearch && !clientStyleFilter && clientDateFilter === "all" && clientsSkip < clientsTotal && (
                        <div className="px-5 py-3 flex justify-center">
                          <button onClick={() => fetchClients(studioId, clientsSkip, true)}
                            disabled={clientsLoading}
                            className="text-xs font-inter text-zinc-500 hover:text-zinc-900 border border-zinc-200 px-4 py-1.5 rounded-xl hover:border-zinc-400 transition-all disabled:opacity-50">
                            {clientsLoading ? "Lade…" : `Weitere laden (${clientsTotal - clientsSkip} verbleibend)`}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Client Card Detail */}
              {selectedClient && (
                <div className="space-y-4">
                  {clientCardLoading ? (
                    <div className="bg-white rounded-2xl border border-black/[0.04] p-8 flex flex-col gap-3">
                      {[1,2,3].map(i => <div key={i} className="h-14 bg-zinc-100 rounded-xl animate-pulse" />)}
                    </div>
                  ) : clientCard ? (
                    <>
                      {/* Card Header */}
                      <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5 space-y-5">
                        {/* Fitzpatrick */}
                        <div>
                          <p className="text-[10px] font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2.5">Hauttonkategorie (Fitzpatrick)</p>
                          <div className="flex gap-2 flex-wrap">
                            {FITZPATRICK.map(f => (
                              <button key={f.scale}
                                onClick={() => handleClientCardField(studioId, selectedClient.user_id, "fitzpatrick_scale", f.scale)}
                                title={`${f.label} – ${f.desc}`}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-inter transition-all ${clientCard.fitzpatrick_scale === f.scale ? "border-zinc-900 bg-zinc-50 font-semibold text-zinc-900" : "border-zinc-200 text-zinc-500 hover:border-zinc-400"}`}
                              >
                                <span className="w-4 h-4 rounded-full flex-shrink-0 border border-black/10" style={{ background: f.bg }} />
                                {f.label}
                              </button>
                            ))}
                            {clientCard.fitzpatrick_scale && (
                              <button onClick={() => handleClientCardField(studioId, selectedClient.user_id, "fitzpatrick_scale", null)}
                                className="px-3 py-2 rounded-xl border border-zinc-100 text-xs font-inter text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 transition-all">
                                <X size={12} strokeWidth={2} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Tags */}
                        <div>
                          <p className="text-[10px] font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400 mb-2">Tags</p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {(clientCard.tags || []).map(t => (
                              <span key={t} className="flex items-center gap-1 text-xs font-inter px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-full">
                                {t}
                                <button onClick={() => handleClientCardField(studioId, selectedClient.user_id, "tags", (clientCard.tags || []).filter(x => x !== t))}
                                  className="hover:text-red-500 transition-colors ml-0.5">
                                  <X size={10} strokeWidth={2} />
                                </button>
                              </span>
                            ))}
                            <div className="flex items-center gap-1">
                              <input
                                value={clientTagInput} onChange={e => setClientTagInput(e.target.value)}
                                onKeyDown={e => {
                                  if ((e.key === "Enter" || e.key === ",") && clientTagInput.trim()) {
                                    e.preventDefault();
                                    const newTag = clientTagInput.trim().replace(/,/g, "");
                                    if (newTag && !(clientCard.tags || []).includes(newTag)) {
                                      handleClientCardField(studioId, selectedClient.user_id, "tags", [...(clientCard.tags || []), newTag]);
                                    }
                                    setClientTagInput("");
                                  }
                                }}
                                placeholder="Tag hinzufügen…"
                                className="px-3 py-1 border border-dashed border-zinc-300 rounded-full text-xs font-inter text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 bg-transparent w-36"
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-inter">Enter oder Komma zum Hinzufügen · z.B. „Stammkunde", „Erstbesuch"</p>
                        </div>

                        {/* Notes */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-inter font-semibold tracking-[0.15em] uppercase text-zinc-400">Interne Notizen</p>
                            {clientNotesSaving && <span className="text-[10px] text-zinc-400 font-inter animate-pulse">Wird gespeichert…</span>}
                          </div>
                          <textarea
                            value={clientCard.internal_notes || ""}
                            onChange={e => handleClientCardField(studioId, selectedClient.user_id, "internal_notes", e.target.value)}
                            rows={4}
                            placeholder="Allergien, bevorzugte Stile, besondere Hinweise…"
                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl font-inter text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all resize-none"
                          />
                          <p className="text-[10px] text-zinc-400 font-inter mt-1">Nur für dein Studio sichtbar · wird automatisch gespeichert</p>
                        </div>
                      </div>

                      {/* Booking Timeline */}
                      <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-50">
                          <h3 className="font-inter font-semibold text-sm text-zinc-900">Buchungshistorie</h3>
                          <p className="text-xs text-zinc-400 font-inter mt-0.5">{(clientCard.bookings || []).length} {(clientCard.bookings || []).length === 1 ? "Termin" : "Termine"}</p>
                        </div>
                        {(clientCard.bookings || []).length === 0 ? (
                          <div className="py-12 flex flex-col items-center justify-center">
                            <p className="text-zinc-400 font-inter text-sm">Noch keine Buchungen vorhanden.</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-zinc-50">
                            {(clientCard.bookings || []).map((booking, bi) => {
                              const photos = booking.before_after_photos || [];
                              const typeLabels = { tattoo: "Tattoo-Session", consultation: "Beratung", full_day: "Ganztag", video_consultation: "Videoberatung" };
                              return (
                                <div key={booking.booking_id} className="p-5">
                                  {/* Booking header */}
                                  <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-start gap-3">
                                      <div className="w-10 h-10 bg-zinc-900 rounded-xl flex-shrink-0 flex items-center justify-center">
                                        <Calendar size={14} className="text-white" strokeWidth={1.5} />
                                      </div>
                                      <div>
                                        <p className="font-inter font-semibold text-sm text-zinc-900">
                                          {(booking.offer_date || booking.date)
                                            ? new Date((booking.offer_date || booking.date) + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })
                                            : "Datum unbekannt"}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                          <span className="text-xs text-zinc-400 font-inter">{typeLabels[booking.booking_type] || booking.booking_type}</span>
                                          {booking.artist_name && <span className="text-xs text-zinc-400 font-inter">· {booking.artist_name}</span>}
                                          {booking.revenue != null && booking.revenue > 0 && (
                                            <span className="text-xs text-emerald-600 font-inter font-semibold">€ {parseFloat(booking.revenue).toLocaleString("de-DE", { minimumFractionDigits: 2 })}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-inter font-semibold ${statusColors[booking.status] || "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
                                      {statusLabelMap[booking.status] || booking.status}
                                    </span>
                                  </div>

                                  {/* Photos section */}
                                  <div className="mt-3">
                                    {photos.length > 0 && (
                                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                                        {photos.map(ph => (
                                          <div key={ph.photo_id} className="relative group aspect-square rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 cursor-pointer"
                                            onClick={() => setPhotoLightbox(ph)}>
                                            <img src={ph.photo_data} alt={ph.label}
                                              className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                            {/* Visible-to-customer indicator (always shown) */}
                                            <div className="absolute top-1 left-1">
                                              {ph.visible_to_customer
                                                ? <span title="Für Kunden sichtbar" className="flex items-center gap-0.5 bg-emerald-500/90 text-white text-[8px] font-inter px-1.5 py-0.5 rounded-full"><Unlock size={7} strokeWidth={2.5} />Freigegeben</span>
                                                : <span title="Nur für Studio sichtbar" className="flex items-center gap-0.5 bg-zinc-800/70 text-white text-[8px] font-inter px-1.5 py-0.5 rounded-full"><Lock size={7} strokeWidth={2.5} />Intern</span>
                                              }
                                            </div>
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end justify-between p-1.5 opacity-0 group-hover:opacity-100">
                                              <span className="text-[9px] font-inter font-semibold text-white bg-black/60 px-1.5 py-0.5 rounded-full">
                                                {labelMap[ph.label] || ph.label}
                                              </span>
                                              <div className="flex gap-1">
                                                <button title={ph.visible_to_customer ? "Freigabe aufheben" : "Für Kunde freigeben"}
                                                  onClick={e => { e.stopPropagation(); handleTogglePhotoVisibility(booking.booking_id, ph.photo_id, !ph.visible_to_customer); }}
                                                  className={`p-0.5 rounded-full text-white transition-colors ${ph.visible_to_customer ? "bg-emerald-500 hover:bg-emerald-600" : "bg-zinc-600 hover:bg-zinc-700"}`}>
                                                  {ph.visible_to_customer ? <Unlock size={9} strokeWidth={2.5} /> : <Lock size={9} strokeWidth={2.5} />}
                                                </button>
                                                <button
                                                  onClick={e => { e.stopPropagation(); handleDeletePhoto(booking.booking_id, ph.photo_id); }}
                                                  className="p-0.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors">
                                                  <X size={9} strokeWidth={2.5} />
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {photos.length < 5 && (
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {["before", "after", "healed"].map(label => (
                                          <label key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-inter cursor-pointer transition-all hover:border-zinc-400 ${photoUploadLoading[booking.booking_id] ? "opacity-50 pointer-events-none" : "border-zinc-200 text-zinc-600"}`}>
                                            <Camera size={11} strokeWidth={1.5} />
                                            {labelMap[label]} hochladen
                                            <input type="file" accept="image/*" multiple className="hidden"
                                              onChange={e => handlePhotoUpload(booking.booking_id, e.target.files, label)}
                                            />
                                          </label>
                                        ))}
                                        {photoUploadLoading[booking.booking_id] && (
                                          <span className="text-xs font-inter text-zinc-400 animate-pulse">Wird hochgeladen…</span>
                                        )}
                                        <span className="text-[10px] text-zinc-400 font-inter">{photos.length}/5 Fotos</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              {/* Photo Lightbox */}
              <AnimatePresence>
                {photoLightbox && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setPhotoLightbox(null)}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                      className="relative max-w-2xl max-h-[80vh]" onClick={e => e.stopPropagation()}>
                      <img src={photoLightbox.photo_data} alt={photoLightbox.label}
                        className="max-h-[80vh] w-auto rounded-2xl object-contain" />
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-xs font-inter text-white">
                        {labelMap[photoLightbox.label] || photoLightbox.label}
                      </div>
                      <button onClick={() => setPhotoLightbox(null)}
                        className="absolute top-3 right-3 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                        <X size={14} strokeWidth={2} />
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })()}

        {/* ── Shop Tab ── */}
        {activeTab === "shop" && (() => {
          const studioId = stats?.studio?.studio_id;
          const TYPE_LABELS = { flash: "Flash-Design", voucher: "Gutschein", aftercare: "Pflegeprodukt" };
          const TYPE_COLORS = { flash: "bg-violet-50 text-violet-700 border-violet-200", voucher: "bg-emerald-50 text-emerald-700 border-emerald-200", aftercare: "bg-blue-50 text-blue-700 border-blue-200" };
          return (
            <motion.div key="shop" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-playfair font-bold text-xl text-zinc-900">Online-Shop</h2>
                  <p className="text-xs text-zinc-400 font-inter mt-0.5">Flash-Designs, Gutscheine & Pflegeprodukte</p>
                </div>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { setShopProductForm({ type: "flash", title: "", description: "", price_cents: "", stock: "", image_data: null, active: true }); setShopProductModal({}); }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-xs font-inter font-semibold rounded-xl hover:bg-zinc-700 transition-colors">
                  <Plus size={14} strokeWidth={2} /> Neues Produkt
                </motion.button>
              </div>

              {/* Stripe Connect prompt */}
              {connectStatus?.status !== "complete" && (
                <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CreditCard size={17} className="text-amber-600" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-inter font-semibold text-amber-900 text-sm mb-0.5">Stripe-Konto erforderlich</p>
                    <p className="text-xs text-amber-700 font-inter leading-relaxed">
                      Damit Kunden im Shop bezahlen können, musst du zuerst dein Stripe-Konto verbinden. Produkte können bereits angelegt werden, der Checkout ist aber erst nach der Verbindung aktiv.
                    </p>
                    <button
                      onClick={() => setActiveTab("settings")}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-inter font-semibold rounded-xl transition-colors">
                      <Link2 size={12} strokeWidth={2} /> Stripe jetzt verbinden
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-tabs */}
              <div className="flex gap-1 mb-5 bg-white rounded-2xl border border-black/[0.04] shadow-[0_2px_8px_rgb(0,0,0,0.04)] p-1.5 w-fit">
                {[{ id: "products", label: "Produkte" }, { id: "orders", label: "Bestellungen" }].map(t => (
                  <button key={t.id} onClick={() => setShopSubTab(t.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-inter font-medium transition-all whitespace-nowrap ${shopSubTab === t.id ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"}`}>
                    {t.label}
                    {t.id === "orders" && shopOrders.filter(o => o.status === "paid").length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 text-white text-[9px] font-bold rounded-full">{shopOrders.filter(o => o.status === "paid").length}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Products sub-tab */}
              {shopSubTab === "products" && (
                <div>
                  {shopLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1,2,3].map(i => <div key={i} className="h-48 bg-zinc-100 animate-pulse rounded-2xl" />)}
                    </div>
                  ) : shopProducts.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-black/[0.04] p-14 text-center">
                      <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <ShoppingBag size={20} className="text-zinc-400" strokeWidth={1.5} />
                      </div>
                      <p className="font-inter font-semibold text-zinc-700 mb-1">Noch keine Produkte</p>
                      <p className="text-xs text-zinc-400 font-inter mb-4">Erstelle dein erstes Produkt – Flash-Design, Gutschein oder Pflegeprodukt.</p>
                      <motion.button whileTap={{ scale: 0.97 }}
                        onClick={() => { setShopProductForm({ type: "flash", title: "", description: "", price_cents: "", stock: "", image_data: null, active: true }); setShopProductModal({}); }}
                        className="px-4 py-2.5 bg-zinc-900 text-white text-xs font-inter font-semibold rounded-xl hover:bg-zinc-700 transition-colors">
                        Erstes Produkt erstellen
                      </motion.button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {shopProducts.map(product => (
                        <div key={product.product_id} className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden">
                          {product.image_data && (
                            <div className="h-40 overflow-hidden bg-zinc-100">
                              <img src={product.image_data} alt={product.title} className="w-full h-full object-cover" />
                            </div>
                          )}
                          {!product.image_data && product.type === "flash" && (
                            <div className="h-24 bg-zinc-100 flex items-center justify-center">
                              <Package size={28} className="text-zinc-300" strokeWidth={1} />
                            </div>
                          )}
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <span className={`inline-block text-[9px] font-inter font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border mb-1.5 ${TYPE_COLORS[product.type]}`}>
                                  {TYPE_LABELS[product.type]}
                                </span>
                                <p className="font-inter font-semibold text-sm text-zinc-900 truncate">{product.title}</p>
                              </div>
                              <p className="font-playfair font-bold text-base text-zinc-900 flex-shrink-0">€{(product.price_cents / 100).toFixed(2)}</p>
                            </div>
                            {product.description && (
                              <p className="text-xs text-zinc-500 font-inter leading-relaxed mb-3 line-clamp-2">{product.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-inter mb-3">
                              <span>{product.sold_count || 0}× verkauft</span>
                              {product.stock !== null && product.stock !== undefined && (
                                <><span>·</span><span>{product.stock} auf Lager</span></>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleShopToggleActive(product)}
                                title={product.active ? "Aktiv – klicken zum Deaktivieren" : "Inaktiv – klicken zum Aktivieren"}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-inter font-medium border transition-all ${product.active ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200"}`}>
                                {product.active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                                {product.active ? "Aktiv" : "Inaktiv"}
                              </button>
                              <button onClick={() => { setShopProductModal(product); setShopProductForm({ type: product.type, title: product.title, description: product.description || "", price_cents: (product.price_cents / 100).toFixed(2), stock: product.stock ?? "", image_data: product.image_data || null, active: product.active }); }}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-inter font-medium border border-zinc-200 hover:border-zinc-400 text-zinc-600 transition-all">
                                <Eye size={12} strokeWidth={1.5} /> Bearbeiten
                              </button>
                              <button onClick={() => handleShopProductDelete(product.product_id)} disabled={shopProductDeleting[product.product_id]}
                                className="p-1.5 rounded-xl border border-zinc-200 text-zinc-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-40">
                                <Trash2 size={13} strokeWidth={1.5} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Orders sub-tab */}
              {shopSubTab === "orders" && (
                <div>
                  {/* Umsatzübersicht */}
                  {shopOrders.length > 0 && (() => {
                    const paidOrders = shopOrders.filter(o => o.status === "paid");
                    const totalRevenue = paidOrders.reduce((s, o) => s + (o.amount_cents || 0), 0) / 100;
                    const now = new Date();
                    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
                    const monthRevenue = paidOrders.filter(o => (o.paid_at || o.created_at || "").startsWith(monthPrefix)).reduce((s, o) => s + (o.amount_cents || 0), 0) / 100;
                    const byType = paidOrders.reduce((acc, o) => { acc[o.product_type] = (acc[o.product_type] || 0) + 1; return acc; }, {});
                    const TYPE_LABELS_REV = { flash: "Flash-Designs", voucher: "Gutscheine", aftercare: "Pflegeprodukte" };
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                        {[
                          { label: "Gesamtumsatz", value: `€${totalRevenue.toFixed(2)}`, sub: `${paidOrders.length} Bestellung${paidOrders.length !== 1 ? "en" : ""}` },
                          { label: "Diesen Monat", value: `€${monthRevenue.toFixed(2)}`, sub: now.toLocaleDateString("de-DE", { month: "long", year: "numeric" }) },
                          ...Object.entries(byType).map(([type, count]) => ({ label: TYPE_LABELS_REV[type] || type, value: `${count}×`, sub: "verkauft" })),
                        ].map((card, i) => (
                          <div key={i} className="bg-white rounded-2xl border border-black/[0.04] p-4">
                            <p className="text-[10px] font-inter font-semibold uppercase tracking-widest text-zinc-400 mb-1">{card.label}</p>
                            <p className="font-playfair font-bold text-xl text-zinc-900">{card.value}</p>
                            <p className="text-[10px] text-zinc-400 font-inter mt-0.5">{card.sub}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {shopOrders.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-black/[0.04] p-12 text-center">
                      <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Receipt size={20} className="text-zinc-400" strokeWidth={1.5} />
                      </div>
                      <p className="text-zinc-400 font-inter text-sm">Noch keine Bestellungen</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-zinc-100">
                              <th className="text-left px-5 py-3 text-[10px] font-inter font-semibold uppercase tracking-widest text-zinc-400">Datum</th>
                              <th className="text-left px-5 py-3 text-[10px] font-inter font-semibold uppercase tracking-widest text-zinc-400">Produkt</th>
                              <th className="text-left px-5 py-3 text-[10px] font-inter font-semibold uppercase tracking-widest text-zinc-400">Kunde</th>
                              <th className="text-left px-5 py-3 text-[10px] font-inter font-semibold uppercase tracking-widest text-zinc-400">Betrag</th>
                              <th className="text-left px-5 py-3 text-[10px] font-inter font-semibold uppercase tracking-widest text-zinc-400">Status</th>
                              <th className="text-left px-5 py-3 text-[10px] font-inter font-semibold uppercase tracking-widest text-zinc-400">Code / Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-50">
                            {shopOrders.map(order => (
                              <tr key={order.order_id} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-5 py-3 text-xs font-inter text-zinc-500">
                                  {new Date(order.created_at).toLocaleDateString("de-DE")}
                                </td>
                                <td className="px-5 py-3">
                                  <div>
                                    <p className="text-xs font-inter font-semibold text-zinc-800">{order.product_title}</p>
                                    <span className={`text-[9px] font-inter font-medium px-1.5 py-0.5 rounded-full border ${TYPE_COLORS[order.product_type] || "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
                                      {TYPE_LABELS[order.product_type] || order.product_type}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-5 py-3 text-xs font-inter text-zinc-600">{order.user_name || order.user_email || "–"}</td>
                                <td className="px-5 py-3 text-xs font-inter font-semibold text-zinc-800">€{(order.amount_cents / 100).toFixed(2)}</td>
                                <td className="px-5 py-3">
                                  <span className={`text-[10px] font-inter font-semibold px-2 py-0.5 rounded-full border ${order.status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                                    {order.status === "paid" ? "Bezahlt" : "Ausstehend"}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-xs font-mono text-zinc-500">
                                  {order.voucher_code ? (
                                    <div className="flex flex-col gap-1">
                                      <span className="font-bold text-emerald-700">{order.voucher_code}</span>
                                      {order.redeemed_at ? (
                                        <span className="text-[9px] font-inter font-semibold px-1.5 py-0.5 rounded-full border bg-zinc-100 text-zinc-500 border-zinc-200 w-fit">
                                          Eingelöst {new Date(order.redeemed_at).toLocaleDateString("de-DE")}
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-inter font-semibold px-1.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-200 w-fit">Verfügbar</span>
                                      )}
                                    </div>
                                  ) : order.download_token ? <span className="text-violet-600">Download-Link aktiv</span> : "–"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* Profile Edit Tab */}
        {activeTab === "profile" && editForm && (
          <><motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 22 }} onSubmit={handleSaveProfile} className="space-y-6">
            {/* ── Header: Titel + Speichern-Button ── */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-playfair font-bold text-xl text-zinc-900">Profil</h2>
                <p className="text-xs text-zinc-400 font-inter mt-0.5">Studio-Informationen und öffentliche Darstellung</p>
              </div>
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={editLoading}
                data-testid="save-profile-btn"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-inter font-semibold transition-all disabled:opacity-50 ${editSuccess ? "bg-emerald-600 text-white" : "bg-zinc-900 text-white hover:bg-zinc-700"}`}
              >
                {editLoading ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Speichern…</>
                ) : editSuccess ? (
                  <><CheckCircle size={14} strokeWidth={2} /> Gespeichert!</>
                ) : (
                  <><Save size={14} strokeWidth={1.5} /> Profil speichern</>
                )}
              </motion.button>
            </div>

            {/* ── Buchungslink ── */}
            {stats?.studio?.studio_id && (() => {
              const bookingUrl = `${window.location.origin}/studios/${stats.studio.studio_id}?book=true`;
              return (
                <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                        <Link2 size={14} className="text-zinc-600" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-inter font-semibold text-zinc-900 leading-tight">Dein Buchungslink</p>
                        <p className="text-[11px] text-zinc-400 font-inter font-mono truncate">{bookingUrl}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(bookingUrl); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2500); }}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-inter font-semibold transition-all ${linkCopied ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-zinc-900 text-white hover:bg-zinc-700"}`}
                      >
                        {linkCopied ? <><CheckCircle size={12} strokeWidth={2} /> Kopiert</> : <><Copy size={12} strokeWidth={1.5} /> Kopieren</>}
                      </button>
                      <a href={bookingUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-inter font-medium text-zinc-600 border border-zinc-200 hover:bg-zinc-50 transition-colors">
                        <ExternalLink size={12} strokeWidth={1.5} /> Vorschau
                      </a>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Studio-Profil ── */}
            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <h3 className="font-playfair font-semibold text-lg text-zinc-900 mb-5">Studio-Profil</h3>

              {/* Basis-Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Studio-Name</label>
                  <input type="text" value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} className="input-base w-full" data-testid="edit-studio-name" />
                </div>
                <div>
                  <label className="block text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Preisklasse</label>
                  <select value={editForm.price_range || "medium"} onChange={e => setEditForm({...editForm, price_range: e.target.value})} className="input-base w-full" data-testid="edit-price-range">
                    <option value="budget">Günstig</option><option value="medium">Mittel</option><option value="premium">Premium</option><option value="luxury">Luxus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Stadt</label>
                  <input type="text" value={editForm.city || ""} onChange={e => setEditForm({...editForm, city: e.target.value})} className="input-base w-full" data-testid="edit-studio-city" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Adresse</label>
                  <input type="text" value={editForm.address || ""} onChange={e => setEditForm({...editForm, address: e.target.value})} className="input-base w-full" data-testid="edit-studio-address" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Beschreibung</label>
                  <textarea value={editForm.description || ""} onChange={e => setEditForm({...editForm, description: e.target.value})} rows={3} className="input-base w-full resize-none" data-testid="edit-studio-description" />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-zinc-100 my-4" />

              {/* Kontakt */}
              <p className="text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-3">Kontakt</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Telefon</label>
                  <input type="text" value={editForm.phone || ""} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="input-base w-full" />
                </div>
                <div>
                  <label className="block text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">E-Mail</label>
                  <input type="email" value={editForm.email || ""} onChange={e => setEditForm({...editForm, email: e.target.value})} className="input-base w-full" data-testid="edit-studio-email" />
                </div>
                <div>
                  <label className="block text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Website</label>
                  <input type="text" value={editForm.website || ""} onChange={e => setEditForm({...editForm, website: e.target.value})} className="input-base w-full" />
                </div>
              </div>
            </div>

            {/* VIDEO CONSULTATION TOGGLE HIDDEN – auskommentiert bis Feature wieder aktiviert wird
            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <h3 className="font-playfair font-semibold text-lg text-zinc-900 mb-4">Videoberatung</h3>
              <div className="flex items-center gap-4 mb-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setEditForm(prev => ({ ...prev, video_consultation_enabled: !prev.video_consultation_enabled }))}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${editForm?.video_consultation_enabled ? "bg-zinc-900" : "bg-zinc-200"}`}
                    data-testid="video-consultation-toggle"
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${editForm?.video_consultation_enabled ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                  <span className="text-sm font-inter text-zinc-700">Videoberatungsgespräche anbieten</span>
                </label>
              </div>
              <p className="text-xs text-zinc-400 font-inter">
                Wenn aktiviert, können Kunden bei der Buchung "Videoberatungsgespräch" auswählen. Zum Termin erscheint ein "Beitreten"-Button.
              </p>
            </div>
            */}

            {/* ── Stripe Connect ── */}
            <div id="stripe-connect-section" className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-playfair font-semibold text-lg text-zinc-900">Stripe Konto verbinden</h3>
                {connectStatus?.status === "complete" ? (
                  <span className="text-[10px] font-inter font-semibold tracking-widest uppercase bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle size={10} strokeWidth={2} /> Verbunden
                  </span>
                ) : connectStatus?.status === "pending" ? (
                  <span className="text-[10px] font-inter font-semibold tracking-widest uppercase bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">Ausstehend</span>
                ) : (
                  <span className="text-[10px] font-inter font-semibold tracking-widest uppercase bg-zinc-100 text-zinc-500 px-2.5 py-1 rounded-full">Nicht verbunden</span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-inter mb-5">
                Verbinde dein Stripe-Konto damit Anzahlungen direkt auf dein Bankkonto ausgezahlt werden. Stripe führt dich durch das Onboarding (KYC, Bankdaten).
              </p>

              {connectStatus?.status === "complete" ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={16} className="text-emerald-600" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-inter font-semibold text-emerald-800">Stripe erfolgreich verbunden</p>
                    <p className="text-xs text-emerald-600 font-inter mt-0.5">Anzahlungen werden direkt auf dein Bankkonto überwiesen.</p>
                  </div>
                </div>
              ) : (
                <div>
                  {connectStatus?.status === "pending" && (
                    <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                      <p className="text-xs text-amber-700 font-inter font-medium">Onboarding noch nicht abgeschlossen. Klicke auf "Weiter bei Stripe" um fortzufahren.</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleConnectStripe}
                      disabled={connectLoading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white text-sm font-inter rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50"
                      data-testid="connect-stripe-btn"
                    >
                      <CreditCard size={14} strokeWidth={1.5} />
                      {connectLoading ? "Wird geöffnet…" : connectStatus?.status === "pending" ? "Weiter bei Stripe" : "Bei Stripe registrieren"}
                    </button>
                    {connectStatus?.status === "pending" && (
                      <button
                        type="button"
                        onClick={fetchConnectStatus}
                        className="text-xs text-zinc-500 font-inter hover:text-zinc-800 transition-colors"
                      >
                        Status aktualisieren
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 font-inter mt-3">
                    Nach dem Klick öffnet sich ein neues Fenster mit dem Stripe-Onboarding. Du hinterlegst dort deine Bankdaten sicher direkt bei Stripe.
                  </p>

                  {/* Stripe Connect error */}
                  {stripeConnectError && (
                    <div className="mt-4 rounded-xl border overflow-hidden">
                      {stripeConnectError === "not_enabled" ? (
                        <div className="bg-amber-50 border-amber-200 px-4 py-4">
                          <p className="text-sm font-inter font-semibold text-amber-900 mb-1">Anzahlungen werden eingerichtet</p>
                          <p className="text-xs text-amber-700 font-inter leading-relaxed mb-2">
                            Die Zahlungsfunktion wird gerade für StudioOS konfiguriert und steht in Kürze zur Verfügung. Du wirst benachrichtigt sobald du dein Konto verknüpfen kannst.
                          </p>
                          <p className="text-[10px] text-amber-600 font-inter">
                            Bei Fragen wende dich an den StudioOS Support.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-red-50 border-red-100 px-4 py-3">
                          <p className="text-xs text-red-600 font-inter">{stripeConnectError}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Steuer & Rechnungen ── */}
            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <h3 className="font-playfair font-semibold text-lg mb-1 text-zinc-900">Steuer &amp; Rechnungen</h3>
              <p className="text-xs text-zinc-400 font-inter mb-5">Wird auf allen generierten Rechnungs-PDFs ausgewiesen.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Steuermodell</label>
                  <select
                    value={editForm.tax_model || "standard"}
                    onChange={e => setEditForm({ ...editForm, tax_model: e.target.value })}
                    className="input-base w-full"
                  >
                    <option value="standard">Standard (19% MwSt ausweisen)</option>
                    <option value="kleinunternehmer">Kleinunternehmer §19 UStG (keine MwSt)</option>
                  </select>
                  {(editForm.tax_model === "kleinunternehmer" || (!editForm.tax_model)) && editForm.tax_model === "kleinunternehmer" && (
                    <p className="text-[11px] text-zinc-400 font-inter mt-1.5 leading-relaxed">
                      Auf Rechnungen erscheint: „Kein Ausweis von Umsatzsteuer gemäß §19 UStG"
                    </p>
                  )}
                  {(editForm.tax_model === "standard" || !editForm.tax_model) && editForm.tax_model !== "kleinunternehmer" && (
                    <p className="text-[11px] text-zinc-400 font-inter mt-1.5 leading-relaxed">
                      Rechnungsbetrag wird als Brutto ausgewiesen (inkl. 19% MwSt).
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Steuernummer / USt-IdNr.</label>
                  <input
                    type="text"
                    value={editForm.tax_number || ""}
                    onChange={e => setEditForm({ ...editForm, tax_number: e.target.value })}
                    placeholder="z.B. DE123456789 oder 123/456/78901"
                    className="input-base w-full"
                  />
                  <p className="text-[11px] text-zinc-400 font-inter mt-1.5">Optional — wird auf Rechnungen angezeigt.</p>
                </div>
              </div>
            </div>

            {/* ── Digitale Einverständniserklärung ── */}
            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-playfair font-semibold text-lg mb-1 text-zinc-900">Digitale Einverständniserklärung</h3>
                  <p className="text-xs text-zinc-400 font-inter leading-relaxed">
                    Kunden müssen vor bestätigten Terminen ein digitales Gesundheitsformular ausfüllen und elektronisch unterschreiben. Du siehst den Status direkt in der Buchungsübersicht.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditForm(prev => ({ ...prev, consent_required: !prev.consent_required }))}
                  className={`flex-shrink-0 relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${editForm?.consent_required ? "bg-zinc-900" : "bg-zinc-200"}`}
                  data-testid="consent-required-toggle"
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${editForm?.consent_required ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
              {editForm?.consent_required && (
                <div className="mt-4 space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs font-inter text-emerald-800 leading-relaxed">
                    ✅ Aktiviert — Kunden erhalten nach Terminbestätigung einen Link zum Formular. Der Status erscheint in jeder Buchungskarte.
                  </div>

                  {/* Custom questions */}
                  <div>
                    <label className="block text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">
                      Eigene Zusatzfragen (optional)
                    </label>
                    <p className="text-[11px] text-zinc-400 font-inter mb-3">
                      Kunden müssen diese Fragen ebenfalls per Häkchen bestätigen. Standardfragen (Gesundheit, Allergie, Unterschrift) sind immer enthalten.
                    </p>
                    <div className="space-y-2">
                      {((editForm.consent_config?.custom_questions) || []).map((q, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={q}
                            onChange={e => {
                              const updated = [...(editForm.consent_config?.custom_questions || [])];
                              updated[idx] = e.target.value;
                              setEditForm(prev => ({ ...prev, consent_config: { ...(prev.consent_config || {}), custom_questions: updated } }));
                            }}
                            placeholder={`Zusatzfrage ${idx + 1}`}
                            className="input-base flex-1 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = ((editForm.consent_config?.custom_questions) || []).filter((_, i) => i !== idx);
                              setEditForm(prev => ({ ...prev, consent_config: { ...(prev.consent_config || {}), custom_questions: updated } }));
                            }}
                            className="flex-shrink-0 w-7 h-7 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-200 transition-colors"
                          >
                            <X size={13} strokeWidth={1.8} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const current = editForm.consent_config?.custom_questions || [];
                          setEditForm(prev => ({ ...prev, consent_config: { ...(prev.consent_config || {}), custom_questions: [...current, ""] } }));
                        }}
                        className="flex items-center gap-1.5 text-xs font-inter font-medium text-zinc-500 hover:text-zinc-900 transition-colors mt-1"
                      >
                        <Plus size={13} strokeWidth={1.8} /> Frage hinzufügen
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Stornierungsrichtlinie ── */}
            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <h3 className="font-playfair font-semibold text-lg mb-1 text-zinc-900">Stornierungsrichtlinie</h3>
              <p className="text-xs text-zinc-400 font-inter mb-5">Lege fest, bis wann Kunden ihren Termin kostenfrei stornieren können. Nach Ablauf der Frist wird die Anzahlung als Aufwandsentschädigung einbehalten.</p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1.5">Kostenlose Stornierung bis</label>
                  <select
                    value={editForm.cancellation_hours ?? ""}
                    onChange={e => setEditForm({ ...editForm, cancellation_hours: e.target.value === "" ? null : parseInt(e.target.value) })}
                    className="input-base w-full"
                    data-testid="cancellation-hours-select"
                  >
                    <option value="">Keine Angabe / Keine kostenlose Stornierung</option>
                    <option value="12">12 Stunden vorher</option>
                    <option value="24">24 Stunden vorher (1 Tag)</option>
                    <option value="48">48 Stunden vorher (2 Tage)</option>
                    <option value="72">72 Stunden vorher (3 Tage)</option>
                    <option value="168">1 Woche vorher</option>
                  </select>
                </div>
              </div>
              {editForm.cancellation_hours && (
                <p className="text-xs text-zinc-500 font-inter mt-3 bg-zinc-50 rounded-xl px-3 py-2.5 leading-relaxed">
                  Kunden sehen beim Buchen und Stornieren: <strong>Kostenlose Stornierung bis {editForm.cancellation_hours >= 24 ? `${editForm.cancellation_hours / 24} Tag${editForm.cancellation_hours >= 48 ? "e" : ""}` : `${editForm.cancellation_hours} Stunden`} vor dem Termin.</strong>
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <h3 className="font-playfair font-semibold text-lg mb-4 text-zinc-900">Tattoo-Stile</h3>
              <div className="flex flex-wrap gap-2">
                {STYLES_LIST.map(s => (
                  <button key={s} type="button" onClick={() => toggleStyle(s)} className={`px-3 py-1.5 text-xs rounded-full border font-inter transition-all ${editForm.styles?.includes(s) ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 hover:border-zinc-400"}`} data-testid={`style-toggle-${s}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <h3 className="font-playfair font-semibold text-lg mb-1 text-zinc-900">Studio-Branding</h3>
              <p className="text-xs text-zinc-400 font-inter mb-5">Banner und Logo erscheinen auf deinem öffentlichen Studio-Profil.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Banner */}
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Banner-Bild</label>
                  {editForm.banner_image ? (
                    <div className="relative mb-3 group">
                      <img src={editForm.banner_image} alt="Banner" className="w-full h-28 object-cover rounded-xl border border-zinc-200" />
                      <button type="button" onClick={() => setEditForm(prev => ({ ...prev, banner_image: "" }))} className="absolute top-1.5 right-1.5 w-6 h-6 bg-zinc-900/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-28 rounded-xl bg-zinc-100 border border-dashed border-zinc-300 flex items-center justify-center mb-3">
                      <span className="text-xs text-zinc-400 font-inter">Kein Banner hochgeladen</span>
                    </div>
                  )}
                  <label className={`h-10 border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-xl flex items-center justify-center cursor-pointer transition-colors gap-2 ${uploadingBanner ? "opacity-50" : ""}`}>
                    <Upload size={14} className="text-zinc-400" strokeWidth={1.5} />
                    <span className="text-xs text-zinc-400 font-inter">{uploadingBanner ? "Wird hochgeladen..." : "Banner hochladen"}</span>
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" disabled={uploadingBanner} data-testid="banner-upload-input" />
                  </label>
                </div>
                {/* Logo */}
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Logo / Profilbild</label>
                  <div className="flex items-center gap-4 mb-3">
                    {editForm.logo_image ? (
                      <div className="relative group flex-shrink-0">
                        <img src={editForm.logo_image} alt="Logo" className="w-20 h-20 object-cover rounded-2xl border border-zinc-200" />
                        <button type="button" onClick={() => setEditForm(prev => ({ ...prev, logo_image: "" }))} className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-900/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={9} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-zinc-100 border border-dashed border-zinc-300 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl font-playfair text-zinc-300">{editForm?.name?.[0]}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500 font-inter mb-2">Erscheint als Profilbild auf deiner Studio-Seite.</p>
                      <label className={`h-9 border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-xl flex items-center justify-center cursor-pointer transition-colors gap-2 ${uploadingLogo ? "opacity-50" : ""}`}>
                        <Upload size={13} className="text-zinc-400" strokeWidth={1.5} />
                        <span className="text-xs text-zinc-400 font-inter">{uploadingLogo ? "..." : "Logo hochladen"}</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploadingLogo} data-testid="logo-upload-input" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Studio Räume */}
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-1">Studio Räume</label>
                  <p className="text-xs text-zinc-400 font-inter mb-3">Zeige Kunden dein Studio von innen – Räumlichkeiten, Ausstattung, Atmosphäre.</p>
                  {(editForm.images || []).length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {(editForm.images || []).map((img, i) => (
                        <div key={i} className="relative group aspect-video rounded-xl overflow-hidden">
                          <img src={img} alt={`Raum ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, images: prev.images.filter((_, j) => j !== i) }))}
                            className="absolute top-1 right-1 w-5 h-5 bg-zinc-900/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={9} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className={`h-10 border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-xl flex items-center justify-center cursor-pointer transition-colors gap-2 ${uploadingImg ? "opacity-50" : ""}`}>
                    <Upload size={14} className="text-zinc-400" strokeWidth={1.5} />
                    <span className="text-xs text-zinc-400 font-inter">{uploadingImg ? "Wird hochgeladen..." : "Raum-Foto hinzufügen"}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImg} data-testid="room-image-upload-input" />
                  </label>
                </div>
              </div>
            </div>

          </motion.form>

          {/* ── Konto-Einstellungen ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.05 }} className="space-y-4">

            {/* Feedback message */}
            {accountMsg && (
              <div className={`px-4 py-3 rounded-2xl text-sm font-inter flex items-center gap-2 ${accountMsg.type === "success" ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-red-50 border border-red-100 text-red-600"}`}>
                {accountMsg.type === "success" ? <CheckCircle size={15} strokeWidth={1.5} /> : <AlertCircle size={15} strokeWidth={1.5} />}
                {accountMsg.text}
              </div>
            )}

            {/* Name ändern */}
            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <h3 className="font-playfair font-semibold text-lg text-zinc-900 mb-1">Name ändern</h3>
              <p className="text-xs text-zinc-500 font-inter mb-4">Dein angezeigter Name im System.</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder={user?.name || "Neuer Name"}
                  value={accountForm.name}
                  onChange={e => setAccountForm(f => ({ ...f, name: e.target.value }))}
                  className="input-base flex-1"
                />
                <button
                  type="button"
                  onClick={handleChangeName}
                  disabled={accountLoading === "name" || !accountForm.name.trim()}
                  className="px-4 py-2.5 bg-zinc-900 text-white text-sm font-inter font-medium rounded-xl hover:bg-zinc-700 disabled:opacity-40 transition-colors whitespace-nowrap"
                >
                  {accountLoading === "name" ? "…" : "Speichern"}
                </button>
              </div>
            </div>

            {/* E-Mail */}
            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <h3 className="font-playfair font-semibold text-lg text-zinc-900 mb-1">E-Mail-Adresse</h3>
              <p className="text-xs text-zinc-500 font-inter mb-3">Aktuell hinterlegte Adresse für Login und Benachrichtigungen.</p>
              <div className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <span className="text-sm font-inter text-zinc-700">{user?.email || "—"}</span>
              </div>
            </div>

            {/* Passwort ändern */}
            <div className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <h3 className="font-playfair font-semibold text-lg text-zinc-900 mb-1">Passwort ändern</h3>
              <p className="text-xs text-zinc-500 font-inter mb-4">Mindestens 8 Zeichen.</p>
              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="Aktuelles Passwort"
                  value={accountForm.currentPassword}
                  onChange={e => setAccountForm(f => ({ ...f, currentPassword: e.target.value }))}
                  className="input-base w-full"
                />
                <input
                  type="password"
                  placeholder="Neues Passwort"
                  value={accountForm.newPassword}
                  onChange={e => setAccountForm(f => ({ ...f, newPassword: e.target.value }))}
                  className="input-base w-full"
                />
                <input
                  type="password"
                  placeholder="Neues Passwort bestätigen"
                  value={accountForm.confirmPassword}
                  onChange={e => setAccountForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  className="input-base w-full"
                />
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={accountLoading === "password" || !accountForm.currentPassword || !accountForm.newPassword}
                  className="px-4 py-2.5 bg-zinc-900 text-white text-sm font-inter font-medium rounded-xl hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                >
                  {accountLoading === "password" ? "Wird geändert…" : "Passwort ändern"}
                </button>
              </div>
            </div>

            {/* Account löschen */}
            <div className="bg-white rounded-2xl border border-red-100 shadow-[0_4px_16px_rgb(0,0,0,0.04)] p-6">
              <h3 className="font-playfair font-semibold text-lg text-red-700 mb-1">Account löschen</h3>
              <p className="text-xs text-zinc-500 font-inter mb-4">Dein Account und alle zugehörigen Daten werden dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.</p>
              {!deleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(true)}
                  className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 text-sm font-inter font-medium rounded-xl hover:bg-red-100 transition-colors"
                >
                  Account löschen
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-inter text-red-700 font-semibold">Bist du sicher? Diese Aktion ist unwiderruflich.</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(false)}
                      className="flex-1 px-4 py-2.5 text-sm font-inter font-medium text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="flex-1 px-4 py-2.5 text-sm font-inter font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                    >
                      Ja, Account löschen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          </>
        )}
          </div>
        </div>
      </div>
      {/* FAQ Help Strip */}
      <div className="bg-white border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-100 rounded-xl flex items-center justify-center">
              <HelpCircle size={15} className="text-zinc-500" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs font-inter font-semibold text-zinc-800">Hast du Fragen?</p>
              <p className="text-xs text-zinc-400 font-inter">FAQs & Hilfe speziell für Studios</p>
            </div>
          </div>
          <Link to="/faq" className="text-xs font-inter font-semibold text-zinc-900 underline underline-offset-2 hover:no-underline transition-all" data-testid="studio-faq-link">
            FAQ ansehen →
          </Link>
        </div>
      </div>
      <Footer />
      {/* VIDEO CONSULTATION HIDDEN
      {videoCallBooking && (
        <VideoCallModal
          booking={videoCallBooking}
          userRole="studio_owner"
          onClose={() => setVideoCallBooking(null)}
        />
      )}
      */}

      {/* Bemerkungen Modal */}
      <AnimatePresence>
        {notesModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setNotesModal(null)}
            data-testid="notes-modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
              data-testid="notes-modal"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-playfair font-semibold text-lg text-zinc-900">Kundenanmerkungen</h3>
                <button onClick={() => setNotesModal(null)} className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 transition-colors" data-testid="notes-modal-close">
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>
              <p className="text-xs text-zinc-400 font-inter mb-4">
                Buchung von <span className="font-semibold text-zinc-600">{notesModal.user_name}</span>
                {notesModal.date ? ` · ${new Date(notesModal.date + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}` : ""}
              </p>

              {!notesModal.notes && (!notesModal.reference_images || notesModal.reference_images.length === 0) ? (
                <div className="py-10 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mb-3">
                    <FileText size={20} className="text-zinc-300" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-zinc-400 font-inter">Keine Kundenanmerkung vorhanden</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notesModal.notes && (
                    <div>
                      <p className="text-[10px] font-inter font-semibold uppercase tracking-wider text-zinc-400 mb-2">Anmerkung</p>
                      <p className="text-sm font-inter text-zinc-700 bg-zinc-50 rounded-xl p-3.5 leading-relaxed border border-zinc-100">
                        "{notesModal.notes}"
                      </p>
                    </div>
                  )}
                  {notesModal.reference_images?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-inter font-semibold uppercase tracking-wider text-zinc-400 mb-2">Referenzbilder ({notesModal.reference_images.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {notesModal.reference_images.map((img, i) => (
                          <button key={i} type="button" onClick={() => setNotesLightbox(img)} className="focus:outline-none">
                            <img src={img} alt="" className="w-24 h-24 object-cover rounded-xl border border-zinc-100 hover:opacity-80 transition-opacity cursor-zoom-in" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Rejection Modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
            onClick={() => setRejectModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-playfair font-semibold text-lg text-zinc-900">Anfrage ablehnen</h3>
                  <p className="text-xs text-zinc-500 font-inter mt-0.5">
                    {rejectModal.user_name} · {rejectModal.user_email}
                  </p>
                </div>
                <button onClick={() => setRejectModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 transition-colors">
                  <X size={15} strokeWidth={2} />
                </button>
              </div>

              <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 mb-4">
                <p className="text-xs font-inter text-red-700 leading-relaxed">
                  Der Gast erhält eine E-Mail, dass seine Anfrage abgelehnt wurde. Die Anfrage wird dauerhaft gelöscht.
                </p>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">
                  Ablehnungsgrund <span className="normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="z.B. Leider sind wir für diesen Zeitraum ausgebucht..."
                  rows={3}
                  className="input-base w-full resize-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setRejectModal(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-inter font-medium text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
                >
                  Abbrechen
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDeleteInquiry}
                  disabled={rejectLoading}
                  className="flex-1 px-4 py-2.5 text-sm font-inter font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {rejectLoading ? "Wird gesendet…" : "Ablehnen & E-Mail senden"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bemerkungen Lightbox */}
      <AnimatePresence>
        {notesLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setNotesLightbox(null)}
            data-testid="notes-lightbox-overlay"
          >
            <motion.img
              src={notesLightbox}
              alt="Referenzbild"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              onClick={e => e.stopPropagation()}
              data-testid="notes-lightbox-img"
            />
            <button
              onClick={() => setNotesLightbox(null)}
              className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
              data-testid="notes-lightbox-close"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Anzahlungs-Onboarding Popup ── */}
      <AnimatePresence>
        {showDepositPopup && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header strip */}
              <div className="bg-zinc-900 px-6 pt-6 pb-5 relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                    <CreditCard size={20} className="text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[10px] font-inter font-semibold tracking-widest uppercase text-white/40 mb-0.5">Einrichtung erforderlich</p>
                    <h2 className="font-playfair font-semibold text-white text-lg leading-tight">Stripe Konto verbinden</h2>
                  </div>
                </div>
                <p className="text-sm text-white/70 font-inter leading-relaxed">
                  Um Anzahlungen zu empfangen, musst du einmalig dein Stripe-Konto verbinden. Das geht <strong className="text-white">in wenigen Minuten</strong>.
                </p>
              </div>

              <div className="px-6 py-5">
                {/* Benefits list */}
                <div className="space-y-3 mb-5">
                  {[
                    { icon: "🛡️", text: "Kein Umsatzverlust durch kurzfristige Absagen" },
                    { icon: "💸", text: "Anzahlung wird automatisch auf dein Konto überwiesen" },
                    { icon: "⚡", text: "In wenigen Minuten eingerichtet via Stripe" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-base leading-none mt-0.5">{item.icon}</span>
                      <p className="text-sm font-inter text-zinc-700 leading-snug">{item.text}</p>
                    </div>
                  ))}
                </div>

                {/* CTA buttons */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleConnectStripe}
                  disabled={connectLoading}
                  className="btn-primary w-full justify-center mb-2.5 disabled:opacity-60"
                >
                  {connectLoading ? "Wird geöffnet…" : stripeWindowOpened ? "Stripe erneut öffnen" : "Jetzt Stripe einrichten →"}
                </motion.button>

                <button
                  onClick={() => { localStorage.setItem("inkbook_deposit_popup_dismissed", "1"); localStorage.removeItem("inkbook_stripe_window_opened"); setShowDepositPopup(false); }}
                  className="w-full py-2.5 text-sm font-inter text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  {stripeWindowOpened ? "Fenster geöffnet — später fortfahren" : "Jetzt nicht — später einrichten"}
                </button>

                {stripeConnectError && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    {stripeConnectError.startsWith("STRIPE_CONNECT_NOT_ENABLED") ? (() => {
                      const isTest = stripeConnectError.includes(":test");
                      const connectUrl = isTest
                        ? "https://dashboard.stripe.com/test/connect"
                        : "https://dashboard.stripe.com/connect";
                      const urlLabel = isTest
                        ? "dashboard.stripe.com/test/connect"
                        : "dashboard.stripe.com/connect";
                      return (
                        <div className="text-xs font-inter text-amber-800 leading-relaxed space-y-1.5">
                          <p className="font-semibold">Stripe Connect noch nicht aktiviert</p>
                          {isTest && (
                            <p className="text-amber-600">Du verwendest den <strong>Test-Modus</strong> — Connect muss separat für den Test-Modus aktiviert werden.</p>
                          )}
                          <p>Aktiviere es einmalig hier:</p>
                          <a
                            href={connectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-amber-900 font-semibold underline hover:no-underline break-all"
                          >
                            {urlLabel} →
                          </a>
                          <p className="text-amber-600 mt-1">Danach hier erneut auf den Button klicken.</p>
                        </div>
                      );
                    })() : (
                      <p className="text-xs text-red-600 font-inter">{stripeConnectError}</p>
                    )}
                  </div>
                )}

                {/* Fee note */}
                <p className="text-center text-[10px] text-zinc-300 font-inter mt-3 leading-relaxed">
                  Bei aktivierten Anzahlungen werden 5 % Gebühren automatisch von jeder Anzahlung abgezogen — kein manueller Aufwand, kaum spürbar.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offer creation modal */}
      <AnimatePresence>
        {offerModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setOfferModal(null); }}
          >
            <motion.div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md"
              initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-playfair font-semibold text-xl text-zinc-900">Angebot erstellen</h3>
                <button onClick={() => setOfferModal(null)} className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"><X size={18} strokeWidth={2} /></button>
              </div>
              <p className="text-xs text-zinc-500 font-inter mb-4">
                Für <span className="font-semibold text-zinc-800">{offerModal.user_name}</span>
                {offerModal.notes && <> · <span className="italic">"{offerModal.notes}"</span></>}
              </p>
              {offerModal._inquiry_id && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 border border-violet-100 mb-4">
                  <Tag size={12} strokeWidth={1.5} className="text-violet-500 shrink-0" />
                  <p className="text-xs text-violet-700 font-inter">Das Angebot wird per E-Mail an den Gast gesendet – mit einem Aktivierungslink zum StudioOS-Konto.</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-inter font-semibold text-zinc-500 mb-1 block">Datum *</label>
                    <input type="date" value={offerForm.offer_date} onChange={e => setOfferForm(f => ({ ...f, offer_date: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl font-inter focus:outline-none focus:border-zinc-500 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-inter font-semibold text-zinc-500 mb-1 block">Uhrzeit *</label>
                    <input type="time" value={offerForm.offer_time} onChange={e => setOfferForm(f => ({ ...f, offer_time: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl font-inter focus:outline-none focus:border-zinc-500 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-inter font-semibold text-zinc-500 mb-1 block">Dauer (Stunden)</label>
                  <input type="number" min="0.5" max="16" step="0.5" placeholder="2"
                    value={offerForm.offer_duration_min / 60}
                    onChange={e => setOfferForm(f => ({ ...f, offer_duration_min: Math.round((parseFloat(e.target.value) || 1) * 60) }))}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl font-inter focus:outline-none focus:border-zinc-500 transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-inter font-semibold text-zinc-500 mb-1 block">Gesamtpreis (€) *</label>
                    <input type="number" min="0" step="5" placeholder="150" value={offerForm.offer_total_price} onChange={e => setOfferForm(f => ({ ...f, offer_total_price: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl font-inter focus:outline-none focus:border-zinc-500 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-inter font-semibold text-zinc-500 mb-1 block">Anzahlung (€) *</label>
                    <input type="number" min="0.50" step="5" placeholder="50" value={offerForm.offer_deposit_amount} onChange={e => setOfferForm(f => ({ ...f, offer_deposit_amount: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl font-inter focus:outline-none focus:border-zinc-500 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-inter font-semibold text-zinc-500 mb-1 block">Notiz (optional)</label>
                  <textarea rows={2} value={offerForm.offer_notes} onChange={e => setOfferForm(f => ({ ...f, offer_notes: e.target.value }))}
                    placeholder="Weitere Informationen für den Kunden..."
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl font-inter focus:outline-none focus:border-zinc-500 transition-colors resize-none" />
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button onClick={() => setOfferModal(null)}
                  className="flex-1 px-4 py-2.5 border border-zinc-200 text-sm font-inter text-zinc-600 rounded-xl hover:bg-zinc-50 transition-colors">
                  Abbrechen
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreateOffer} disabled={offerLoading}
                  className="flex-1 px-4 py-2.5 bg-zinc-900 text-white text-sm font-inter font-medium rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {offerLoading ? "Wird gesendet…" : "Angebot senden"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Shop Product Modal ── */}
      <AnimatePresence>
        {shopProductModal !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget && !shopProductSaving) setShopProductModal(null); }}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <p className="text-base font-playfair font-semibold text-zinc-900">
                  {shopProductModal?.product_id ? "Produkt bearbeiten" : "Neues Produkt"}
                </p>
                {!shopProductSaving && (
                  <button onClick={() => setShopProductModal(null)} className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 transition-colors"><X size={16} strokeWidth={2} /></button>
                )}
              </div>

              {/* Product type */}
              <div className="mb-4">
                <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Produkttyp</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ id: "flash", label: "Flash-Design", icon: <Package size={14} strokeWidth={1.5} /> }, { id: "voucher", label: "Gutschein", icon: <Gift size={14} strokeWidth={1.5} /> }, { id: "aftercare", label: "Pflegeprodukt", icon: <ShoppingBag size={14} strokeWidth={1.5} /> }].map(t => (
                    <button key={t.id} onClick={() => setShopProductForm(f => ({ ...f, type: t.id }))}
                      disabled={!!shopProductModal?.product_id}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 text-xs font-inter font-medium transition-all ${shopProductForm.type === t.id ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"} disabled:cursor-default`}>
                      {t.icon}{t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Titel *</label>
                <input type="text" value={shopProductForm.title} onChange={e => setShopProductForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="z.B. Rose Flash Design, Heilcreme 50ml..."
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-200 rounded-xl font-inter focus:outline-none focus:border-zinc-900 text-zinc-900 transition-colors" />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Beschreibung</label>
                <textarea rows={2} value={shopProductForm.description} onChange={e => setShopProductForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional – kurze Produktbeschreibung..."
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-200 rounded-xl font-inter focus:outline-none focus:border-zinc-900 text-zinc-900 resize-none transition-colors" />
              </div>

              {/* Price + Stock */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Preis (€) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-inter">€</span>
                    <input type="number" min="0.50" step="0.01" value={shopProductForm.price_cents} onChange={e => setShopProductForm(f => ({ ...f, price_cents: e.target.value }))}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2.5 text-sm border border-zinc-200 rounded-xl font-inter focus:outline-none focus:border-zinc-900 text-zinc-900 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Lagerbestand</label>
                  <input type="number" min="0" step="1" value={shopProductForm.stock} onChange={e => setShopProductForm(f => ({ ...f, stock: e.target.value }))}
                    placeholder="∞ (unlimitiert)"
                    className="w-full px-3.5 py-2.5 text-sm border border-zinc-200 rounded-xl font-inter focus:outline-none focus:border-zinc-900 text-zinc-900 transition-colors" />
                </div>
              </div>

              {/* Image upload for flash designs */}
              {shopProductForm.type === "flash" && (
                <div className="mb-4">
                  <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Design-Bild</label>
                  {shopProductForm.image_data ? (
                    <div className="relative rounded-2xl overflow-hidden bg-zinc-100 h-40">
                      <img src={shopProductForm.image_data} alt="Vorschau" className="w-full h-full object-contain" />
                      <button onClick={() => setShopProductForm(f => ({ ...f, image_data: null }))}
                        className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-500 transition-colors shadow-sm">
                        <X size={13} strokeWidth={2} />
                      </button>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center gap-2 p-6 border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-2xl cursor-pointer transition-colors ${shopImageUploading ? "opacity-50 cursor-not-allowed" : ""}`}>
                      <Package size={20} className="text-zinc-400" strokeWidth={1.5} />
                      <span className="text-xs font-inter text-zinc-500">{shopImageUploading ? "Wird hochgeladen…" : "Bild hochladen (JPG, PNG)"}</span>
                      <input type="file" accept="image/*" disabled={shopImageUploading} className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setShopImageUploading(true);
                          try {
                            const dataUrl = await shopResizeImage(file);
                            setShopProductForm(f => ({ ...f, image_data: dataUrl }));
                          } catch { notify.error("Bild konnte nicht geladen werden."); }
                          finally { setShopImageUploading(false); }
                        }} />
                    </label>
                  )}
                  <p className="text-[10px] text-zinc-400 font-inter mt-1">Das Bild wird erst nach Kauf zum Download freigegeben.</p>
                </div>
              )}

              {/* Active toggle */}
              <div className="flex items-center justify-between mb-5 p-3 bg-zinc-50 rounded-xl">
                <span className="text-xs font-inter text-zinc-700 font-medium">Im Shop sichtbar</span>
                <button onClick={() => setShopProductForm(f => ({ ...f, active: !f.active }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-inter font-medium border transition-all ${shopProductForm.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
                  {shopProductForm.active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                  {shopProductForm.active ? "Ja" : "Nein"}
                </button>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShopProductModal(null)} disabled={shopProductSaving}
                  className="flex-1 py-2.5 text-sm font-inter text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-2xl transition-all disabled:opacity-50">
                  Abbrechen
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleShopProductSave} disabled={shopProductSaving || !shopProductForm.title.trim() || !shopProductForm.price_cents}
                  className="flex-1 py-2.5 text-sm font-inter font-medium text-white bg-zinc-900 hover:bg-zinc-700 rounded-2xl transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                  {shopProductSaving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Speichern…</> : <><Save size={14} strokeWidth={2} /> Speichern</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Refund cancellation modal */}
      <AnimatePresence>
        {refundModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget && !refundLoading) setRefundModal(null); }}
          >
            <motion.div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm"
              initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-lg">💳</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-zinc-900 font-inter text-base">Stornieren & Anzahlung zurückzahlen</h3>
                  <p className="text-xs text-zinc-500 mt-0.5 font-inter">
                    {refundModal.user_name || "Kunde"} · {refundModal.offer_date || refundModal.date || ""}
                    {(refundModal.offer_time || refundModal.start_time) ? ` · ${refundModal.offer_time || refundModal.start_time} Uhr` : ""}
                  </p>
                </div>
                {!refundLoading && (
                  <button onClick={() => setRefundModal(null)} className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors ml-2">
                    <X size={16} strokeWidth={2} />
                  </button>
                )}
              </div>

              {/* Deposit info */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-amber-800 font-inter">Anzahlung bezahlt</span>
                  <span className="text-sm font-bold text-amber-900 font-inter">
                    €{parseFloat(refundModal.offer_deposit_amount || refundModal.deposit_amount || 0).toFixed(0)}
                  </span>
                </div>
                <p className="text-xs text-amber-700 font-inter leading-relaxed">
                  Stripe erstattet den Betrag automatisch auf die Karte zurück, mit der der Kunde bezahlt hat. Du brauchst keine Bankdaten — Stripe erledigt das.
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-3 mb-5">
                <p className="text-xs text-zinc-600 font-inter leading-relaxed">
                  Nach der Stornierung bekommt der Kunde eine Benachrichtigung und sieht die Rückerstattung in der App. Die Gutschrift erscheint in 5–10 Werktagen auf dem Kontoauszug.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setRefundModal(null)}
                  disabled={refundLoading}
                  className="flex-1 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-2xl transition-all font-inter disabled:opacity-50"
                >
                  Abbrechen
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={refundLoading}
                  onClick={async () => {
                    setRefundLoading(true);
                    try {
                      await axios.post(`${API}/bookings/${refundModal.booking_id}/cancel-with-refund`, {}, { withCredentials: true });
                      setRefundModal(null);
                      fetchStats();
                    } catch (err) {
                      notify.error(err?.response?.data?.detail || "Fehler bei der Rückerstattung. Bitte erneut versuchen.");
                    } finally {
                      setRefundLoading(false);
                    }
                  }}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-2xl transition-all font-inter disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {refundLoading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Läuft...</>
                  ) : (
                    "Stornieren & Zurückzahlen"
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      {/* ── Zahlung-erfassen-Modal ── */}
      <AnimatePresence>
        {finalPayModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget && !finalPayLoading) setFinalPayModal(null); }}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-base font-playfair font-semibold text-zinc-900">Zahlung erfassen</p>
                  <p className="text-xs text-zinc-400 font-inter mt-0.5">{finalPayModal.user_name} · {finalPayModal.offer_date || finalPayModal.date || ""}</p>
                </div>
                {!finalPayLoading && (
                  <button onClick={() => setFinalPayModal(null)} className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 transition-colors"><X size={16} strokeWidth={2} /></button>
                )}
              </div>

              {/* Amount input */}
              <div className="mb-5">
                <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Betrag (€)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-inter">€</span>
                  <input
                    type="number" min="0.50" step="0.01" placeholder="0,00"
                    value={finalPayAmount}
                    onChange={e => setFinalPayAmount(e.target.value)}
                    autoFocus
                    className="w-full pl-8 pr-4 py-3 text-sm border border-zinc-200 rounded-2xl font-inter focus:outline-none focus:border-zinc-900 text-zinc-900 bg-white transition-colors"
                  />
                </div>
                {finalPayModal.offer_total_price && (
                  <p className="text-[10px] text-zinc-400 font-inter mt-1.5">
                    Gesamtpreis lt. Angebot: €&thinsp;{parseFloat(finalPayModal.offer_total_price).toFixed(2)}
                    {finalPayModal.offer_deposit_amount && parseFloat(finalPayModal.offer_deposit_amount) > 0
                      ? ` · Anzahlung: €\u202F${parseFloat(finalPayModal.offer_deposit_amount).toFixed(2)} · Restbetrag: €\u202F${Math.max(0, parseFloat(finalPayModal.offer_total_price) - parseFloat(finalPayModal.offer_deposit_amount)).toFixed(2)}`
                      : ""}
                  </p>
                )}
              </div>

              {/* Payment method */}
              <div className="mb-6">
                <label className="block text-xs font-inter font-semibold tracking-widest uppercase text-zinc-400 mb-2">Zahlungsart</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFinalPayMethod("cash")}
                    className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all ${finalPayMethod === "cash" ? "border-zinc-900 bg-zinc-900" : "border-zinc-200 bg-white hover:border-zinc-400"}`}
                  >
                    <Banknote size={20} strokeWidth={1.5} className={finalPayMethod === "cash" ? "text-white" : "text-zinc-500"} />
                    <span className={`text-xs font-inter font-semibold ${finalPayMethod === "cash" ? "text-white" : "text-zinc-700"}`}>Barzahlung</span>
                    <span className={`text-[10px] font-inter leading-tight text-center ${finalPayMethod === "cash" ? "text-white/50" : "text-zinc-400"}`}>Sofort in Umsatz</span>
                  </button>
                  <button
                    onClick={() => setFinalPayMethod("stripe")}
                    className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all ${finalPayMethod === "stripe" ? "border-violet-600 bg-violet-600" : "border-zinc-200 bg-white hover:border-violet-300"}`}
                  >
                    <Send size={20} strokeWidth={1.5} className={finalPayMethod === "stripe" ? "text-white" : "text-violet-500"} />
                    <span className={`text-xs font-inter font-semibold ${finalPayMethod === "stripe" ? "text-white" : "text-zinc-700"}`}>Stripe-Link</span>
                    <span className={`text-[10px] font-inter leading-tight text-center ${finalPayMethod === "stripe" ? "text-white/60" : "text-zinc-400"}`}>Link per E-Mail</span>
                  </button>
                </div>
              </div>

              {/* Info box */}
              {finalPayMethod === "stripe" && (
                <div className="bg-violet-50 border border-violet-100 rounded-2xl p-3 mb-5 text-xs font-inter text-violet-700 leading-relaxed">
                  Der Kunde erhält einen Stripe-Zahlungslink per E-Mail (<span className="font-semibold">{finalPayModal.user_email || "gespeicherte E-Mail"}</span>). Nach erfolgreicher Zahlung wird der Termin automatisch als abgeschlossen markiert.
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  disabled={finalPayLoading}
                  onClick={() => setFinalPayModal(null)}
                  className="flex-1 py-3 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-2xl transition-all font-inter disabled:opacity-50"
                >
                  Abbrechen
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={finalPayLoading || !finalPayAmount || parseFloat(finalPayAmount) <= 0}
                  onClick={handleFinalPayment}
                  className={`flex-1 py-3 text-sm font-medium text-white rounded-2xl transition-all font-inter disabled:opacity-50 flex items-center justify-center gap-2 ${finalPayMethod === "stripe" ? "bg-violet-600 hover:bg-violet-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                >
                  {finalPayLoading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Läuft...</>
                  ) : finalPayMethod === "cash" ? (
                    <><Banknote size={15} strokeWidth={1.8} /> Einnahme speichern</>
                  ) : (
                    <><Send size={15} strokeWidth={1.8} /> Link senden</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </AnimatePresence>
    </div>
  );
}
