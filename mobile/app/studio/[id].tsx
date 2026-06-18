import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  Dimensions, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { apiPost, apiGet } from '@/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PRICE_LABELS: Record<string, string> = { budget: '€', medium: '€€', premium: '€€€', luxury: '€€€€' };
const BOOKING_TYPES = [
  { value: 'tattoo', label: 'Tattoo' },
  { value: 'consultation', label: 'Beratung' },
  { value: 'video_consultation', label: 'Video' },
];

interface Studio {
  studio_id: string; name: string; city: string; address?: string;
  description?: string; styles?: string[]; avg_rating?: number;
  review_count?: number; price_range?: string; images?: string[]; owner_id?: string;
}
interface Review {
  review_id: string; user_name?: string; rating: number; comment?: string; created_at?: string;
}
interface Slot {
  slot_id: string; date: string; start_time: string; end_time: string; slot_type?: string; is_booked: boolean;
}

function StarRating({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={size} color={i <= rating ? '#FF9500' : '#C7C7CC'} />
      ))}
    </View>
  );
}

function formatDateDE(iso: string): string {
  const [y, m, d] = iso.split('-');
  const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const date = new Date(iso + 'T12:00:00');
  return `${weekdays[date.getDay()]}, ${d}. ${months[parseInt(m) - 1]} ${y}`;
}

type BookStep = 'date' | 'slot' | 'confirm';

export default function StudioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { user } = useAuth();
  const navigation = useNavigation();

  const [imgIdx, setImgIdx] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const [bookStep, setBookStep] = useState<BookStep>('date');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [bookingType, setBookingType] = useState('tattoo');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);

  const { data: studio, isLoading } = useQuery<Studio>({ queryKey: [`/studios/${id}`] });
  const { data: reviews = [] } = useQuery<Review[]>({ queryKey: [`/studios/${id}/reviews`], enabled: !!id });
  const { data: availableDates, isLoading: datesLoading } = useQuery<{ available_dates: string[] }>({
    queryKey: [`/studios/${id}/available-dates?year=${viewYear}&month=${viewMonth}`],
    enabled: showBooking && bookStep === 'date',
  });

  useEffect(() => {
    if (studio?.name) navigation.setOptions({ headerTitle: studio.name });
  }, [studio?.name, navigation]);

  const goToSlotPicker = async (date: string) => {
    setSelectedDate(date); setLoadingSlots(true); setBookStep('slot');
    try {
      const data = await apiGet<Slot[]>(`/studios/${id}/slots?date=${date}`);
      setSlots(data.filter((s: Slot) => !s.is_booked));
    } catch { setSlots([]); } finally { setLoadingSlots(false); }
  };

  const resetBooking = () => {
    setShowBooking(false); setBookStep('date'); setSelectedDate(null);
    setSelectedSlot(null); setNotes(''); setBookingType('tattoo');
  };

  const handleBook = async () => {
    if (!selectedSlot || !user) return;
    setSubmitting(true);
    try {
      await apiPost('/bookings', { studio_id: id, slot_id: selectedSlot.slot_id, booking_type: bookingType, notes, reference_images: [] });
      Alert.alert(
        'Anfrage gesendet!',
        `Dein Termin am ${formatDateDE(selectedSlot.date)} um ${selectedSlot.start_time} Uhr wurde angefragt. Das Studio meldet sich bei dir.`,
        [{ text: 'Super!', onPress: () => { resetBooking(); router.push('/(tabs)/bookings'); } }]
      );
    } catch (e: any) {
      Alert.alert('Fehler', e.message || 'Buchung fehlgeschlagen');
    } finally { setSubmitting(false); }
  };

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); } else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); } else setViewMonth(m => m + 1);
  };
  const canGoPrev = () => viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth > now.getMonth() + 1);

  const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  if (isLoading) return <LoadingScreen />;
  if (!studio) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.groupedBackground }}>
      <Text style={{ color: colors.secondaryLabel, fontSize: 17 }}>Studio nicht gefunden</Text>
    </View>
  );

  const images = studio.images || [];

  const renderBookingOverlay = () => {
    if (!showBooking) return null;

    if (bookStep === 'date') {
      const dates = availableDates?.available_dates || [];
      return (
        <View style={[styles.overlay, { backgroundColor: colors.surface, borderColor: colors.opaqueSeparator }]}>
          <View style={styles.overlayHeader}>
            <Text style={[styles.overlayTitle, { color: colors.label }]}>Datum wählen</Text>
            <TouchableOpacity onPress={resetBooking} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={colors.secondaryLabel} />
            </TouchableOpacity>
          </View>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} disabled={!canGoPrev()} style={[styles.navBtn, { opacity: canGoPrev() ? 1 : 0.3 }]}>
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: colors.label }]}>{MONTH_NAMES[viewMonth - 1]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {datesLoading ? (
            <View style={styles.centeredLoad}><ActivityIndicator color={colors.primary} /></View>
          ) : dates.length === 0 ? (
            <View style={styles.centeredLoad}>
              <Ionicons name="calendar-outline" size={36} color={colors.tertiaryLabel} />
              <Text style={[styles.emptyText, { color: colors.secondaryLabel }]}>Keine Termine in diesem Monat</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {dates.map((date: string) => (
                <TouchableOpacity
                  key={date}
                  style={[styles.dateRow, { borderBottomColor: colors.separator }]}
                  onPress={() => goToSlotPicker(date)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dateText, { color: colors.label }]}>{formatDateDE(date)}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.tertiaryLabel} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      );
    }

    if (bookStep === 'slot') {
      return (
        <View style={[styles.overlay, { backgroundColor: colors.surface, borderColor: colors.opaqueSeparator }]}>
          <View style={styles.overlayHeader}>
            <TouchableOpacity onPress={() => setBookStep('date')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
              <Text style={[styles.overlayTitle, { color: colors.label }]}>Zeit wählen</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={resetBooking} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={colors.secondaryLabel} />
            </TouchableOpacity>
          </View>
          {selectedDate && <Text style={[styles.subLabel, { color: colors.secondaryLabel }]}>{formatDateDE(selectedDate)}</Text>}
          {loadingSlots ? (
            <View style={styles.centeredLoad}><ActivityIndicator color={colors.primary} /></View>
          ) : slots.length === 0 ? (
            <View style={styles.centeredLoad}>
              <Ionicons name="time-outline" size={36} color={colors.tertiaryLabel} />
              <Text style={[styles.emptyText, { color: colors.secondaryLabel }]}>Keine Slots an diesem Tag</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              <View style={styles.slotsGrid}>
                {slots.map((slot: Slot) => {
                  const sel = selectedSlot?.slot_id === slot.slot_id;
                  return (
                    <TouchableOpacity
                      key={slot.slot_id}
                      style={[styles.slotChip, { backgroundColor: sel ? colors.primary : colors.fill, borderColor: sel ? colors.primary : 'transparent' }]}
                      onPress={() => setSelectedSlot(slot)}
                    >
                      <Text style={[styles.slotTime, { color: sel ? '#fff' : colors.label }]}>{slot.start_time}</Text>
                      <Text style={[styles.slotEnd, { color: sel ? 'rgba(255,255,255,0.7)' : colors.secondaryLabel }]}>{slot.end_time}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}
          {selectedSlot && (
            <Button title={`Weiter: ${selectedSlot.start_time} – ${selectedSlot.end_time}`} onPress={() => setBookStep('confirm')} fullWidth style={{ marginTop: 14 }} />
          )}
        </View>
      );
    }

    if (bookStep === 'confirm') {
      return (
        <View style={[styles.overlay, { backgroundColor: colors.surface, borderColor: colors.opaqueSeparator }]}>
          <View style={styles.overlayHeader}>
            <TouchableOpacity onPress={() => setBookStep('slot')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
              <Text style={[styles.overlayTitle, { color: colors.label }]}>Bestätigen</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={resetBooking} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={colors.secondaryLabel} />
            </TouchableOpacity>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.groupedBackground }]}>
            <View style={styles.summaryRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.secondaryLabel} />
              <Text style={[styles.summaryText, { color: colors.label }]}>{selectedDate ? formatDateDE(selectedDate) : '—'}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.separator }]} />
            <View style={styles.summaryRow}>
              <Ionicons name="time-outline" size={16} color={colors.secondaryLabel} />
              <Text style={[styles.summaryText, { color: colors.label }]}>{selectedSlot?.start_time} – {selectedSlot?.end_time}</Text>
            </View>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.secondaryLabel }]}>Art der Buchung</Text>
          <View style={styles.typeRow}>
            {BOOKING_TYPES.map(bt => (
              <TouchableOpacity
                key={bt.value}
                style={[styles.typeBtn, { backgroundColor: bookingType === bt.value ? colors.primary : colors.fill }]}
                onPress={() => setBookingType(bt.value)}
              >
                <Text style={[styles.typeBtnText, { color: bookingType === bt.value ? '#fff' : colors.label }]}>{bt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Notizen (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Stil, Größe, Körperstelle..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ height: 80, paddingTop: 10 }}
            containerStyle={{ marginTop: 12 }}
          />

          <Button title="Termin anfragen" onPress={handleBook} loading={submitting} fullWidth size="lg" style={{ marginTop: 14 }} />
        </View>
      );
    }
    return null;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.groupedBackground }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Image carousel */}
        {images.length > 0 ? (
          <View>
            <ScrollView
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
            >
              {images.map((img: string, i: number) => (
                <Image key={i} source={{ uri: img }} style={[styles.carouselImg, { width: SCREEN_WIDTH }]} resizeMode="cover" />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.dots}>
                {images.map((_: string, i: number) => (
                  <View key={i} style={[styles.dot, { backgroundColor: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.5)' }]} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.fill }]}>
            <Ionicons name="image-outline" size={48} color={colors.tertiaryLabel} />
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Name + price */}
          <View style={styles.nameRow}>
            <Text style={[styles.studioName, { color: colors.label }]}>{studio.name}</Text>
            {studio.price_range && (
              <Text style={[styles.priceRange, { color: colors.secondaryLabel }]}>{PRICE_LABELS[studio.price_range] || studio.price_range}</Text>
            )}
          </View>

          {/* Location */}
          <TouchableOpacity style={styles.locationRow} activeOpacity={0.7}>
            <Ionicons name="location-outline" size={14} color={colors.secondaryLabel} />
            <Text style={[styles.locationText, { color: colors.secondaryLabel }]}>
              {studio.address ? `${studio.address}, ` : ''}{studio.city}
            </Text>
          </TouchableOpacity>

          {/* Rating */}
          {studio.avg_rating != null && studio.avg_rating > 0 && (
            <View style={styles.ratingRow}>
              <StarRating rating={Math.round(studio.avg_rating)} />
              <Text style={[styles.ratingText, { color: colors.label }]}>{studio.avg_rating.toFixed(1)}</Text>
              <Text style={[styles.ratingCount, { color: colors.secondaryLabel }]}>
                ({studio.review_count || reviews.length} Bewertungen)
              </Text>
            </View>
          )}

          {/* Styles */}
          {studio.styles && studio.styles.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.label }]}>Stile</Text>
              <View style={styles.tagsRow}>
                {studio.styles.map((s: string) => (
                  <View key={s} style={[styles.tag, { backgroundColor: colors.fill }]}>
                    <Text style={[styles.tagText, { color: colors.secondaryLabel }]}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          {studio.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.label }]}>Über das Studio</Text>
              <Text style={[styles.description, { color: colors.secondaryLabel }]}>{studio.description}</Text>
            </View>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.label }]}>Bewertungen</Text>
              {reviews.slice(0, 5).map((review: Review) => (
                <View key={review.review_id} style={[styles.reviewCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.reviewHeader}>
                    <Text style={[styles.reviewUser, { color: colors.label }]}>{review.user_name || 'Anonym'}</Text>
                    <StarRating rating={review.rating} size={12} />
                  </View>
                  {review.comment && <Text style={[styles.reviewComment, { color: colors.secondaryLabel }]}>{review.comment}</Text>}
                </View>
              ))}
            </View>
          )}

          {renderBookingOverlay()}
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      {!showBooking && (
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.opaqueSeparator }]}>
          {studio.owner_id && (
            <TouchableOpacity
              style={[styles.msgBtn, { backgroundColor: colors.fill }]}
              onPress={() => router.push(`/conversation/${studio.owner_id}`)}
            >
              <Ionicons name="chatbubble-outline" size={20} color={colors.label} />
            </TouchableOpacity>
          )}
          <Button title="Jetzt buchen" onPress={() => setShowBooking(true)} fullWidth size="lg" style={{ flex: 1 }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  carouselImg: { height: 300 },
  imagePlaceholder: { height: 240, alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  content: { padding: 20 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 },
  studioName: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, flex: 1 },
  priceRange: { fontSize: 17, fontFamily: 'Inter_500Medium', marginLeft: 10 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  locationText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  ratingText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  ratingCount: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: -0.3, marginBottom: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  description: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24 },
  reviewCard: { padding: 14, borderRadius: 12, marginBottom: 8 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  reviewUser: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  reviewComment: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  overlay: {
    marginTop: 16, borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 20, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  overlayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  overlayTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(120,120,128,0.16)', alignItems: 'center', justifyContent: 'center' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { padding: 6 },
  monthLabel: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  dateText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  subLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 12 },
  centeredLoad: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotChip: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', minWidth: 88 },
  slotTime: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  slotEnd: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  summaryCard: { borderRadius: 12, padding: 14, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  summaryDivider: { height: StyleSheet.hairlineWidth },
  summaryText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 8 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  typeBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  msgBtn: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
