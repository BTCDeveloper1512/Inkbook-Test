import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { LoadingScreen } from '@/components/LoadingScreen';
import { StatusBadge } from '@/components/StatusBadge';
import { apiPut, apiGet } from '@/lib/api';

const ACTIVE_STATUSES = ['pending', 'pending_studio_review', 'under_review', 'offer_sent', 'waiting_for_deposit', 'deposit_pending', 'confirmed'];
const CLOSED_STATUSES = ['cancelled', 'customer_cancelled', 'studio_cancelled', 'completed', 'no_show'];

type Booking = {
  booking_id: string;
  studio_id?: string;
  studio_name?: string;
  user_name?: string;
  user_id?: string;
  date?: string;
  offer_date?: string;
  start_time?: string;
  end_time?: string;
  offer_time?: string;
  booking_type?: string;
  status: string;
  notes?: string;
  deposit_amount?: number;
  offer_deposit_amount?: number;
  revenue?: number;
};

function formatDate(d?: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y}`;
}

const TYPE_LABELS: Record<string, string> = {
  tattoo: 'Tattoo', consultation: 'Beratung', video_consultation: 'Video', full_day: 'Ganztag',
};

async function navigateToStudioChat(studioId?: string) {
  if (!studioId) return;
  try {
    const studio = await apiGet<{ owner_id?: string }>(`/studios/${studioId}`);
    if (studio.owner_id) {
      router.push(`/conversation/${studio.owner_id}`);
    }
  } catch {}
}

function BookingCard({ booking, isStudio, onAction }: { booking: Booking; isStudio: boolean; onAction: (b: Booking, action: string) => void }) {
  const colors = useColors();
  const displayDate = booking.offer_date || booking.date;
  const displayTime = booking.offer_time || booking.start_time;
  const isActive = ACTIVE_STATUSES.includes(booking.status);
  const [chatLoading, setChatLoading] = useState(false);

  const handleChat = async () => {
    if (isStudio) {
      onAction(booking, 'contact');
    } else {
      setChatLoading(true);
      await navigateToStudioChat(booking.studio_id);
      setChatLoading(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            {isStudio ? (booking.user_name || 'Kunde') : (booking.studio_name || 'Studio')}
          </Text>
          <Text style={[styles.cardSub, { color: colors.muted }]}>
            {formatDate(displayDate)}{displayTime ? ` · ${displayTime}` : ''}{booking.booking_type ? ` · ${TYPE_LABELS[booking.booking_type] || booking.booking_type}` : ''}
          </Text>
        </View>
        <StatusBadge status={booking.status} />
      </View>

      {isActive && (
        <View style={styles.actionRow}>
          {isStudio && ['pending_studio_review', 'pending', 'under_review'].includes(booking.status) && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.successBg }]}
                onPress={() => onAction(booking, 'confirm')}
              >
                <Feather name="check" size={15} color={colors.success} />
                <Text style={[styles.actionBtnText, { color: colors.success }]}>Bestätigen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.errorBg }]}
                onPress={() => onAction(booking, 'reject')}
              >
                <Feather name="x" size={15} color={colors.error} />
                <Text style={[styles.actionBtnText, { color: colors.error }]}>Ablehnen</Text>
              </TouchableOpacity>
            </>
          )}
          {!isStudio && ['confirmed', 'pending', 'pending_studio_review', 'under_review'].includes(booking.status) && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.errorBg }]}
              onPress={() => onAction(booking, 'cancel')}
            >
              <Feather name="x" size={15} color={colors.error} />
              <Text style={[styles.actionBtnText, { color: colors.error }]}>Stornieren</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface }]}
            onPress={handleChat}
            disabled={chatLoading}
          >
            {chatLoading ? (
              <ActivityIndicator size="small" color={colors.muted} />
            ) : (
              <>
                <Feather name="message-circle" size={15} color={colors.foreground} />
                <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Nachricht</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function CalendarView({ bookings }: { bookings: Booking[] }) {
  const colors = useColors();

  const groupedByDate = bookings.reduce((acc: Record<string, Booking[]>, b) => {
    const d = b.offer_date || b.date;
    if (!d) {
      const k = '—';
      if (!acc[k]) acc[k] = [];
      acc[k].push(b);
    } else {
      if (!acc[d]) acc[d] = [];
      acc[d].push(b);
    }
    return acc;
  }, {});

  const sections = Object.entries(groupedByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      title: date === '—' ? 'Ohne Datum' : (() => {
        const [y, m, dd] = date.split('-');
        const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
        return `${dd}. ${months[parseInt(m) - 1]} ${y}`;
      })(),
      data,
    }));

  if (sections.length === 0) {
    return (
      <View style={styles.empty}>
        <Feather name="calendar" size={40} color={colors.border} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Keine Buchungen</Text>
        <Text style={[styles.emptyText, { color: colors.muted }]}>Buchungen erscheinen hier nach Datum</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={item => item.booking_id}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <View style={styles.calendarDayHeader}>
          <View style={[styles.calendarDayDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.calendarDayText, { color: colors.foreground }]}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => {
        const displayTime = item.offer_time || item.start_time;
        return (
          <View style={[styles.calendarBookingRow, { borderLeftColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.calendarBookingName, { color: colors.foreground }]}>
                {item.user_name || 'Kunde'}
              </Text>
              <Text style={[styles.calendarBookingMeta, { color: colors.muted }]}>
                {displayTime ? `${displayTime} Uhr` : ''}{item.booking_type ? ` · ${TYPE_LABELS[item.booking_type] || item.booking_type}` : ''}
              </Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
        );
      }}
      ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
      SectionSeparatorComponent={() => <View style={{ height: 12 }} />}
    />
  );
}

export default function BookingsTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isStudio = user?.role === 'studio_owner';
  type TabKey = 'active' | 'past' | 'calendar';
  const [activeTab, setActiveTab] = useState<TabKey>('active');

  const { data: bookingList = [], isLoading, refetch, isRefetching } = useQuery<Booking[]>({
    queryKey: ['/bookings'],
  });

  const updateStatus = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: string }) =>
      apiPut(`/bookings/${bookingId}/status?status=${status}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/bookings'] }),
  });

  const handleAction = (booking: Booking, action: string) => {
    if (action === 'confirm') {
      Alert.alert('Buchung bestätigen', `Buchung von ${booking.user_name || 'Kunde'} bestätigen?`, [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Bestätigen', onPress: () => updateStatus.mutate({ bookingId: booking.booking_id, status: 'confirmed' }) },
      ]);
    } else if (action === 'reject') {
      Alert.alert('Buchung ablehnen', `Buchung von ${booking.user_name || 'Kunde'} ablehnen?`, [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Ablehnen', style: 'destructive', onPress: () => updateStatus.mutate({ bookingId: booking.booking_id, status: 'studio_cancelled' }) },
      ]);
    } else if (action === 'cancel') {
      Alert.alert('Buchung stornieren', 'Möchtest du diese Buchung wirklich stornieren?', [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Stornieren', style: 'destructive', onPress: () => updateStatus.mutate({ bookingId: booking.booking_id, status: 'customer_cancelled' }) },
      ]);
    } else if (action === 'contact') {
      if (booking.user_id) {
        router.push(`/conversation/${booking.user_id}`);
      }
    }
  };

  if (isLoading) return <LoadingScreen />;

  const now = new Date();

  const active = bookingList.filter((b: Booking) => {
    if (!ACTIVE_STATUSES.includes(b.status)) return false;
    const d = b.offer_date || b.date;
    const t = b.offer_time || b.end_time;
    if (!d) return true;
    return now <= new Date(`${d}T${t || '23:59'}:00`);
  }).sort((a: Booking, b: Booking) => {
    const da = a.offer_date || a.date || '';
    const db = b.offer_date || b.date || '';
    return da.localeCompare(db);
  });

  const past = bookingList.filter((b: Booking) =>
    CLOSED_STATUSES.includes(b.status) ||
    (ACTIVE_STATUSES.includes(b.status) && (() => {
      const d = b.offer_date || b.date;
      const t = b.offer_time || b.end_time;
      if (!d) return false;
      return now > new Date(`${d}T${t || '23:59'}:00`);
    })())
  ).sort((a: Booking, b: Booking) => {
    const da = a.offer_date || a.date || '';
    const db = b.offer_date || b.date || '';
    return db.localeCompare(da);
  });

  const displayData = activeTab === 'active' ? active : activeTab === 'past' ? past : [];

  const tabs: { key: TabKey; label: string }[] = isStudio
    ? [
        { key: 'active', label: `Aktiv${active.length > 0 ? ` (${active.length})` : ''}` },
        { key: 'past', label: 'Vergangen' },
        { key: 'calendar', label: 'Kalender' },
      ]
    : [
        { key: 'active', label: `Aktiv${active.length > 0 ? ` (${active.length})` : ''}` },
        { key: 'past', label: 'Vergangen' },
      ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16) }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Buchungen</Text>
        <View style={[styles.segmented, { backgroundColor: colors.surface }]}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.segmentedBtn,
                activeTab === tab.key && { backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
              ]}
            >
              <Text style={[
                styles.segmentedBtnText,
                { color: activeTab === tab.key ? colors.foreground : colors.muted },
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeTab === 'calendar' ? (
        <CalendarView bookings={bookingList} />
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={item => item.booking_id}
          renderItem={({ item }) => (
            <BookingCard booking={item} isStudio={isStudio} onAction={handleAction} />
          )}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="calendar" size={40} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {activeTab === 'active' ? 'Keine aktiven Buchungen' : 'Keine vergangenen Buchungen'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {activeTab === 'active' && !isStudio ? 'Buche dein erstes Studio!' : ''}
              </Text>
              {activeTab === 'active' && !isStudio && (
                <TouchableOpacity
                  style={[styles.discoverBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Studios entdecken</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.6, marginBottom: 16 },
  segmented: { flexDirection: 'row', borderRadius: 10, padding: 3 },
  segmentedBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  segmentedBtnText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
  cardSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 3 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  discoverBtn: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  calendarDayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  calendarDayDot: { width: 8, height: 8, borderRadius: 4 },
  calendarDayText: { fontSize: 14, fontFamily: 'Inter_700Bold', letterSpacing: -0.2 },
  calendarBookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
    marginLeft: 4,
  },
  calendarBookingName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  calendarBookingMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
});
