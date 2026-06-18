import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
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
  studio_id: string;
  name: string;
  city: string;
  address?: string;
  description?: string;
  styles?: string[];
  avg_rating?: number;
  review_count?: number;
  price_range?: string;
  images?: string[];
  owner_id?: string;
}

interface Review {
  review_id: string;
  user_name?: string;
  rating: number;
  comment?: string;
  created_at?: string;
}

interface Slot {
  slot_id: string;
  date: string;
  start_time: string;
  end_time: string;
  slot_type?: string;
  is_booked: boolean;
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Feather key={i} name="star" size={size} color={i <= rating ? '#f59e0b' : '#e5e5e5'} />
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
  const [bookingType, setBookingType] = useState<string>('tattoo');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);

  const { data: studio, isLoading } = useQuery<Studio>({
    queryKey: [`/studios/${id}`],
  });

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: [`/studios/${id}/reviews`],
    enabled: !!id,
  });

  const { data: availableDates, isLoading: datesLoading } = useQuery<{ available_dates: string[] }>({
    queryKey: [`/studios/${id}/available-dates?year=${viewYear}&month=${viewMonth}`],
    enabled: showBooking && bookStep === 'date',
  });

  useEffect(() => {
    if (studio?.name) {
      navigation.setOptions({ headerTitle: studio.name });
    }
  }, [studio?.name, navigation]);

  const goToSlotPicker = async (date: string) => {
    setSelectedDate(date);
    setLoadingSlots(true);
    setBookStep('slot');
    try {
      const data = await apiGet<Slot[]>(`/studios/${id}/slots?date=${date}`);
      setSlots(data.filter((s: Slot) => !s.is_booked));
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const resetBooking = () => {
    setShowBooking(false);
    setBookStep('date');
    setSelectedDate(null);
    setSelectedSlot(null);
    setNotes('');
    setBookingType('tattoo');
  };

  const handleBook = async () => {
    if (!selectedSlot || !user) return;
    setSubmitting(true);
    try {
      await apiPost('/bookings', {
        studio_id: id,
        slot_id: selectedSlot.slot_id,
        booking_type: bookingType,
        notes,
        reference_images: [],
      });
      Alert.alert(
        'Buchung bestätigt! 🎉',
        `Dein Termin am ${formatDateDE(selectedSlot.date)} um ${selectedSlot.start_time} Uhr wurde angefragt. Das Studio meldet sich bei dir.`,
        [{ text: 'Super!', onPress: () => { resetBooking(); router.push('/(tabs)/bookings'); } }]
      );
    } catch (e: any) {
      Alert.alert('Fehler', e.message || 'Buchung fehlgeschlagen');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContact = () => {
    if (!studio?.owner_id) return;
    router.push(`/conversation/${studio.owner_id}`);
  };

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  };

  const canGoPrev = () => {
    return viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth > now.getMonth() + 1);
  };

  if (isLoading) return <LoadingScreen />;
  if (!studio) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.muted }}>Studio nicht gefunden</Text>
      </View>
    );
  }

  const images = studio.images || [];
  const isOwner = user?.role === 'studio_owner';

  const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  const renderBookingOverlay = () => {
    if (!showBooking || isOwner) return null;

    if (bookStep === 'date') {
      const dates = availableDates?.available_dates || [];
      return (
        <View style={[styles.overlay, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.overlayHeader}>
            <Text style={[styles.overlayTitle, { color: colors.foreground }]}>Datum wählen</Text>
            <TouchableOpacity onPress={resetBooking}>
              <Feather name="x" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={prevMonth}
              style={[styles.monthNavBtn, { opacity: canGoPrev() ? 1 : 0.3 }]}
              disabled={!canGoPrev()}
            >
              <Feather name="chevron-left" size={18} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: colors.foreground }]}>
              {MONTH_NAMES[viewMonth - 1]} {viewYear}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.monthNavBtn}>
              <Feather name="chevron-right" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {datesLoading ? (
            <View style={styles.centeredLoad}><ActivityIndicator color={colors.primary} /></View>
          ) : dates.length === 0 ? (
            <View style={styles.centeredLoad}>
              <Feather name="calendar" size={32} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>Keine freien Termine in diesem Monat</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {dates.map((date: string) => (
                <TouchableOpacity
                  key={date}
                  style={[styles.dateRow, { borderBottomColor: colors.separator }]}
                  onPress={() => goToSlotPicker(date)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dateText, { color: colors.foreground }]}>
                    {formatDateDE(date)}
                  </Text>
                  <Feather name="chevron-right" size={16} color={colors.muted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      );
    }

    if (bookStep === 'slot') {
      return (
        <View style={[styles.overlay, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.overlayHeader}>
            <TouchableOpacity onPress={() => setBookStep('date')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="arrow-left" size={18} color={colors.foreground} />
              <Text style={[styles.overlayTitle, { color: colors.foreground }]}>Zeit wählen</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={resetBooking}>
              <Feather name="x" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
          {selectedDate && (
            <Text style={[styles.selectedDateLabel, { color: colors.muted }]}>{formatDateDE(selectedDate)}</Text>
          )}

          {loadingSlots ? (
            <View style={styles.centeredLoad}><ActivityIndicator color={colors.primary} /></View>
          ) : slots.length === 0 ? (
            <View style={styles.centeredLoad}>
              <Feather name="clock" size={32} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>Keine freien Slots an diesem Tag</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              <View style={styles.slotsGrid}>
                {slots.map((slot: Slot) => (
                  <TouchableOpacity
                    key={slot.slot_id}
                    style={[
                      styles.slotChip,
                      {
                        backgroundColor: selectedSlot?.slot_id === slot.slot_id ? colors.primary : colors.surface,
                        borderColor: selectedSlot?.slot_id === slot.slot_id ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => { setSelectedSlot(slot); }}
                  >
                    <Text style={[
                      styles.slotTime,
                      { color: selectedSlot?.slot_id === slot.slot_id ? '#fff' : colors.foreground },
                    ]}>
                      {slot.start_time}
                    </Text>
                    <Text style={[
                      styles.slotDuration,
                      { color: selectedSlot?.slot_id === slot.slot_id ? 'rgba(255,255,255,0.7)' : colors.muted },
                    ]}>
                      {slot.end_time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {selectedSlot && (
            <Button
              title={`Weiter: ${selectedSlot.start_time} – ${selectedSlot.end_time}`}
              onPress={() => setBookStep('confirm')}
              fullWidth
              style={{ marginTop: 16 }}
            />
          )}
        </View>
      );
    }

    if (bookStep === 'confirm') {
      return (
        <View style={[styles.overlay, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.overlayHeader}>
            <TouchableOpacity onPress={() => setBookStep('slot')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="arrow-left" size={18} color={colors.foreground} />
              <Text style={[styles.overlayTitle, { color: colors.foreground }]}>Buchung bestätigen</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={resetBooking}>
              <Feather name="x" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <View style={[styles.summaryBox, { backgroundColor: colors.surface }]}>
            <View style={styles.summaryRow}>
              <Feather name="calendar" size={15} color={colors.muted} />
              <Text style={[styles.summaryText, { color: colors.foreground }]}>{selectedDate ? formatDateDE(selectedDate) : '—'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Feather name="clock" size={15} color={colors.muted} />
              <Text style={[styles.summaryText, { color: colors.foreground }]}>
                {selectedSlot?.start_time} – {selectedSlot?.end_time}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 12 }}>
            <Text style={[styles.typeLabel, { color: colors.muted }]}>Art der Buchung</Text>
            <View style={styles.typeRow}>
              {BOOKING_TYPES.map(bt => (
                <TouchableOpacity
                  key={bt.value}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: bookingType === bt.value ? colors.primary : colors.surface,
                      borderColor: bookingType === bt.value ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setBookingType(bt.value)}
                >
                  <Text style={[styles.typeBtnText, { color: bookingType === bt.value ? '#fff' : colors.foreground }]}>
                    {bt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input
            label="Notizen (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Was hast du in mind? Stil, Größe, Körperstelle..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ height: 80, paddingTop: 10 }}
            containerStyle={{ marginTop: 12 }}
          />

          <Button
            title="Termin buchen"
            onPress={handleBook}
            loading={submitting}
            fullWidth
            size="lg"
            style={{ marginTop: 16 }}
          />
        </View>
      );
    }

    return null;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: isOwner ? 24 : 100 }}>
        {images.length > 0 ? (
          <View style={styles.imageCarousel}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
            >
              {images.map((img: string, i: number) => (
                <Image key={i} source={{ uri: img }} style={[styles.carouselImg, { width: SCREEN_WIDTH }]} resizeMode="cover" />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.dots}>
                {images.map((_: string, i: number) => (
                  <View key={i} style={[styles.dot, { backgroundColor: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.4)' }]} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.surface }]}>
            <Feather name="image" size={48} color={colors.border} />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={[styles.studioName, { color: colors.foreground }]}>{studio.name}</Text>
            {studio.price_range && (
              <Text style={[styles.priceRange, { color: colors.muted }]}>{PRICE_LABELS[studio.price_range] || studio.price_range}</Text>
            )}
          </View>

          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color={colors.muted} />
            <Text style={[styles.locationText, { color: colors.muted }]}>
              {studio.address ? `${studio.address}, ` : ''}{studio.city}
            </Text>
          </View>

          {studio.avg_rating != null && studio.avg_rating > 0 && (
            <View style={styles.ratingRow}>
              <StarRating rating={Math.round(studio.avg_rating)} />
              <Text style={[styles.ratingText, { color: colors.foreground }]}>
                {studio.avg_rating.toFixed(1)}
              </Text>
              <Text style={[styles.ratingCount, { color: colors.muted }]}>
                ({studio.review_count || reviews.length} {studio.review_count === 1 ? 'Bewertung' : 'Bewertungen'})
              </Text>
            </View>
          )}

          {studio.styles && studio.styles.length > 0 && (
            <View style={styles.stylesSection}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Stile</Text>
              <View style={styles.stylesWrap}>
                {studio.styles.map((s: string) => (
                  <View key={s} style={[styles.styleTag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.styleTagText, { color: colors.muted }]}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {studio.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Über das Studio</Text>
              <Text style={[styles.description, { color: colors.muted }]}>{studio.description}</Text>
            </View>
          )}

          {reviews.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Bewertungen</Text>
              {reviews.slice(0, 5).map((review: Review) => (
                <View key={review.review_id} style={[styles.reviewCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.reviewHeader}>
                    <Text style={[styles.reviewUser, { color: colors.foreground }]}>{review.user_name || 'Anonym'}</Text>
                    <StarRating rating={review.rating} size={12} />
                  </View>
                  {review.comment && (
                    <Text style={[styles.reviewComment, { color: colors.muted }]}>{review.comment}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {renderBookingOverlay()}
        </View>
      </ScrollView>

      {!isOwner && !showBooking && (
        <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.msgBtn, { borderColor: colors.border }]}
            onPress={handleContact}
          >
            <Feather name="message-circle" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Button
            title="Jetzt buchen"
            onPress={() => setShowBooking(true)}
            fullWidth
            size="lg"
            style={{ flex: 1 }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  imageCarousel: { position: 'relative' },
  carouselImg: { height: 280 },
  imagePlaceholder: { height: 240, alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  content: { padding: 20 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 },
  studioName: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, flex: 1 },
  priceRange: { fontSize: 16, fontFamily: 'Inter_500Medium', marginLeft: 10 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  locationText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  ratingText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  ratingCount: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  stylesSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3, marginBottom: 12 },
  stylesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  styleTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  styleTagText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  section: { marginBottom: 24 },
  description: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24 },
  reviewCard: { padding: 14, borderRadius: 12, marginBottom: 8 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  reviewUser: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  reviewComment: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  overlay: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 8,
  },
  overlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  overlayTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  monthNavBtn: { padding: 8 },
  monthLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dateText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  centeredLoad: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 90,
  },
  slotTime: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  slotDuration: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  selectedDateLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 14 },
  summaryBox: { borderRadius: 14, padding: 14, gap: 10 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  typeLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  typeBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  msgBtn: { width: 50, height: 50, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
