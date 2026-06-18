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
import { Ionicons } from '@expo/vector-icons';
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
};

function formatDate(d?: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return `${day}. ${months[parseInt(m) - 1]} ${y}`;
}

const TYPE_LABELS: Record<string, string> = {
  tattoo: 'Tattoo', consultation: 'Beratung', video_consultation: 'Video-Beratung', full_day: 'Ganztag',
};

async function navigateToStudioChat(studioId?: string) {
  if (!studioId) return;
  try {
    const studio = await apiGet<{ owner_id?: string }>(`/studios/${studioId}`);
    if (studio.owner_id) router.push(`/conversation/${studio.owner_id}`);
  } catch {}
}

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel: () => void }) {
  const colors = useColors();
  const displayDate = booking.offer_date || booking.date;
  const displayTime = booking.offer_time || booking.start_time;
  const isActive = ACTIVE_STATUSES.includes(booking.status);
  const [chatLoading, setChatLoading] = useState(false);
  const canCancel = isActive && ['confirmed', 'pending', 'pending_studio_review', 'under_review'].includes(booking.status);

  const handleChat = async () => {
    setChatLoading(true);
    await navigateToStudioChat(booking.studio_id);
    setChatLoading(false);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {/* Studio name + status */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.studioName, { color: colors.label }]} numberOfLines={1}>
            {booking.studio_name || 'Studio'}
          </Text>
          <Text style={[styles.dateText, { color: colors.secondaryLabel }]}>
            {formatDate(displayDate)}
            {displayTime ? ` · ${displayTime}` : ''}
            {booking.booking_type ? ` · ${TYPE_LABELS[booking.booking_type] || booking.booking_type}` : ''}
          </Text>
        </View>
        <StatusBadge status={booking.status} />
      </View>

      {/* Divider + Actions */}
      {isActive && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.opaqueSeparator }]} />
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleChat}
              disabled={chatLoading}
            >
              {chatLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>Nachricht</Text>
                </>
              )}
            </TouchableOpacity>
            {canCancel && (
              <>
                <View style={[styles.actionDivider, { backgroundColor: colors.opaqueSeparator }]} />
                <TouchableOpacity style={styles.actionBtn} onPress={onCancel}>
                  <Ionicons name="close-circle-outline" size={16} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>Stornieren</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </>
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

  const active = bookingList.filter(b => {
    if (!ACTIVE_STATUSES.includes(b.status)) return false;
    const d = b.offer_date || b.date;
    const t = b.offer_time || b.end_time;
    if (!d) return true;
    return now <= new Date(`${d}T${t || '23:59'}:00`);
  }).sort((a, b) => (a.offer_date || a.date || '').localeCompare(b.offer_date || b.date || ''));

  const past = bookingList.filter(b =>
    CLOSED_STATUSES.includes(b.status) ||
    (ACTIVE_STATUSES.includes(b.status) && (() => {
      const d = b.offer_date || b.date;
      const t = b.offer_time || b.end_time;
      if (!d) return false;
      return now > new Date(`${d}T${t || '23:59'}:00`);
    })())
  ).sort((a, b) => (b.offer_date || b.date || '').localeCompare(a.offer_date || a.date || ''));

  const displayData = activeTab === 'active' ? active : past;
  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.groupedBackground }]}>
      {/* Large Title Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <Text style={[styles.largeTitle, { color: colors.label }]}>Buchungen</Text>

        {/* iOS Segmented Control */}
        <View style={[styles.segmented, { backgroundColor: colors.fill }]}>
          {([
            { key: 'active' as const, label: active.length > 0 ? `Aktiv  ${active.length}` : 'Aktiv' },
            { key: 'past' as const, label: 'Vergangen' },
          ]).map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.segment,
                activeTab === tab.key && [styles.segmentActive, { backgroundColor: colors.surface, shadowColor: '#000' }],
              ]}
            >
              <Text style={[
                styles.segmentText,
                { color: activeTab === tab.key ? colors.label : colors.secondaryLabel },
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
          <BookingCard
            booking={item}
            onCancel={() => handleCancel(item)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={colors.tertiaryLabel} />
            <Text style={[styles.emptyTitle, { color: colors.label }]}>
              {activeTab === 'active' ? 'Keine aktiven Buchungen' : 'Keine vergangenen Buchungen'}
            </Text>
            {activeTab === 'active' && (
              <>
                <Text style={[styles.emptyText, { color: colors.secondaryLabel }]}>
                  Finde und buche dein erstes Studio
                </Text>
                <TouchableOpacity
                  style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Text style={styles.ctaBtnText}>Studios entdecken</Text>
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
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  largeTitle: { fontSize: 34, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, marginBottom: 12 },
  segmented: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 2,
    height: 32,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  segmentActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40, gap: 10 },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 10 },
  studioName: { fontSize: 17, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
  dateText: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 3 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  actions: { flexDirection: 'row', height: 44 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionDivider: { width: StyleSheet.hairlineWidth, marginVertical: 10 },
  actionText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 8 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  ctaBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  ctaBtnText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
