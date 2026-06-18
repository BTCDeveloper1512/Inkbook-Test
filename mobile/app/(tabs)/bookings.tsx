import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
import { LoadingScreen } from '@/components/LoadingScreen';
import { StatusBadge } from '@/components/StatusBadge';
import { apiPut, apiGet } from '@/lib/api';

const ACTIVE_STATUSES = ['pending', 'pending_studio_review', 'under_review', 'offer_sent', 'waiting_for_deposit', 'deposit_pending', 'confirmed'];
const CLOSED_STATUSES = ['cancelled', 'customer_cancelled', 'studio_cancelled', 'completed', 'no_show'];

type Booking = {
  booking_id: string;
  studio_id?: string;
  studio_name?: string;
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

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel: (b: Booking) => void }) {
  const colors = useColors();
  const displayDate = booking.offer_date || booking.date;
  const displayTime = booking.offer_time || booking.start_time;
  const isActive = ACTIVE_STATUSES.includes(booking.status);
  const [chatLoading, setChatLoading] = useState(false);

  const handleChat = async () => {
    setChatLoading(true);
    await navigateToStudioChat(booking.studio_id);
    setChatLoading(false);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            {booking.studio_name || 'Studio'}
          </Text>
          <Text style={[styles.cardSub, { color: colors.muted }]}>
            {formatDate(displayDate)}{displayTime ? ` · ${displayTime}` : ''}
            {booking.booking_type ? ` · ${TYPE_LABELS[booking.booking_type] || booking.booking_type}` : ''}
          </Text>
        </View>
        <StatusBadge status={booking.status} />
      </View>

      {isActive && (
        <View style={styles.actionRow}>
          {['confirmed', 'pending', 'pending_studio_review', 'under_review'].includes(booking.status) && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.errorBg }]}
              onPress={() => onCancel(booking)}
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

export default function BookingsTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  const { data: bookingList = [], isLoading, refetch, isRefetching } = useQuery<Booking[]>({
    queryKey: ['/bookings'],
  });

  const updateStatus = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: string }) =>
      apiPut(`/bookings/${bookingId}/status?status=${status}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/bookings'] }),
  });

  const handleCancel = (booking: Booking) => {
    Alert.alert('Buchung stornieren', 'Möchtest du diese Buchung wirklich stornieren?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Stornieren', style: 'destructive', onPress: () => updateStatus.mutate({ bookingId: booking.booking_id, status: 'customer_cancelled' }) },
    ]);
  };

  if (isLoading) return <LoadingScreen />;

  const now = new Date();

  const active = bookingList.filter((b: Booking) => {
    if (!ACTIVE_STATUSES.includes(b.status)) return false;
    const d = b.offer_date || b.date;
    const t = b.offer_time || b.end_time;
    if (!d) return true;
    return now <= new Date(`${d}T${t || '23:59'}:00`);
  }).sort((a: Booking, b: Booking) =>
    (a.offer_date || a.date || '').localeCompare(b.offer_date || b.date || '')
  );

  const past = bookingList.filter((b: Booking) =>
    CLOSED_STATUSES.includes(b.status) ||
    (ACTIVE_STATUSES.includes(b.status) && (() => {
      const d = b.offer_date || b.date;
      const t = b.offer_time || b.end_time;
      if (!d) return false;
      return now > new Date(`${d}T${t || '23:59'}:00`);
    })())
  ).sort((a: Booking, b: Booking) =>
    (b.offer_date || b.date || '').localeCompare(a.offer_date || a.date || '')
  );

  const displayData = activeTab === 'active' ? active : past;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16) }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Buchungen</Text>
        <View style={[styles.segmented, { backgroundColor: colors.surface }]}>
          {([
            { key: 'active' as const, label: `Aktiv${active.length > 0 ? ` (${active.length})` : ''}` },
            { key: 'past' as const, label: 'Vergangen' },
          ]).map(tab => (
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

      <FlatList
        data={displayData}
        keyExtractor={item => item.booking_id}
        renderItem={({ item }) => (
          <BookingCard booking={item} onCancel={handleCancel} />
        )}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="calendar" size={40} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {activeTab === 'active' ? 'Keine aktiven Buchungen' : 'Keine vergangenen Buchungen'}
            </Text>
            {activeTab === 'active' && (
              <>
                <Text style={[styles.emptyText, { color: colors.muted }]}>Buche dein erstes Studio!</Text>
                <TouchableOpacity
                  style={[styles.discoverBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Studios entdecken</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
      />
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
});
