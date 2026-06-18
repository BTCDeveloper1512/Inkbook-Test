import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { LoadingScreen } from '@/components/LoadingScreen';
import { apiGet } from '@/lib/api';

interface Studio {
  studio_id: string;
  name: string;
  city: string;
  description?: string;
  styles?: string[];
  avg_rating?: number;
  review_count?: number;
  price_range?: string;
  images?: string[];
}


const PRICE_LABELS: Record<string, string> = { budget: '€', medium: '€€', premium: '€€€', luxury: '€€€€' };

function StudioCard({ studio }: { studio: Studio }) {
  const colors = useColors();
  const img = studio.images?.[0];
  return (
    <TouchableOpacity
      style={[styles.studioCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.85}
      onPress={() => router.push(`/studio/${studio.studio_id}`)}
    >
      <View style={[styles.studioImg, { backgroundColor: colors.surface }]}>
        {img ? (
          <Image source={{ uri: img }} style={styles.studioImgFill} resizeMode="cover" />
        ) : (
          <Feather name="image" size={32} color={colors.muted} />
        )}
      </View>
      <View style={styles.studioInfo}>
        <View style={styles.studioTopRow}>
          <Text style={[styles.studioName, { color: colors.foreground }]} numberOfLines={1}>
            {studio.name}
          </Text>
          {studio.avg_rating != null && studio.avg_rating > 0 && (
            <View style={styles.ratingRow}>
              <Feather name="star" size={12} color="#f59e0b" />
              <Text style={[styles.ratingText, { color: colors.foreground }]}>
                {studio.avg_rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.studioMeta}>
          <Feather name="map-pin" size={12} color={colors.muted} />
          <Text style={[styles.studioCity, { color: colors.muted }]}>{studio.city}</Text>
          {studio.price_range && (
            <Text style={[styles.studioPrice, { color: colors.muted }]}>· {PRICE_LABELS[studio.price_range] || studio.price_range}</Text>
          )}
        </View>
        {studio.styles && studio.styles.length > 0 && (
          <View style={styles.stylesRow}>
            {studio.styles.slice(0, 3).map(s => (
              <View key={s} style={[styles.styleChip, { backgroundColor: colors.surface }]}>
                <Text style={[styles.styleChipText, { color: colors.muted }]}>{s}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function CustomerSearch() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const { data: studios = [], isLoading, refetch, isRefetching } = useQuery<Studio[]>({
    queryKey: ['/studios'],
  });

  const filtered = useMemo(() => {
    if (!query) return studios;
    const q = query.toLowerCase();
    return studios.filter((s: Studio) =>
      s.name?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q)
    );
  }, [studios, query]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16) }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Studios entdecken</Text>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Studioname, Stil oder Stadt..."
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => setQuery(search)}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setQuery(''); }}>
              <Feather name="x" size={16} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.studio_id}
          renderItem={({ item }) => <StudioCard studio={item} />}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="search" size={40} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Keine Studios gefunden</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>Versuche andere Suchbegriffe</Text>
            </View>
          }
          ListHeaderComponent={
            filtered.length > 0 ? (
              <Text style={[styles.resultCount, { color: colors.muted }]}>
                {filtered.length} {filtered.length === 1 ? 'Studio' : 'Studios'} gefunden
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

export default function HomeTab() {
  return <CustomerSearch />;
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.6, marginBottom: 16 },
  subTitle: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: -12, marginBottom: 20 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  resultCount: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 12 },
  studioCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  studioImg: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studioImgFill: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
  studioInfo: { padding: 14 },
  studioTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  studioName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', flex: 1, letterSpacing: -0.3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  studioMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  studioCity: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  studioPrice: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  stylesRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 10 },
  styleChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  styleChipText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3, marginBottom: 12 },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  bookingUser: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  bookingDate: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
});
