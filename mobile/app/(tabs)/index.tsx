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
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { LoadingScreen } from '@/components/LoadingScreen';

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
      style={[styles.card, { backgroundColor: colors.surface }]}
      activeOpacity={0.92}
      onPress={() => router.push(`/studio/${studio.studio_id}`)}
    >
      <View style={[styles.cardImg, { backgroundColor: colors.fill }]}>
        {img ? (
          <Image source={{ uri: img }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <Ionicons name="image-outline" size={32} color={colors.tertiaryLabel} />
        )}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={[styles.cardName, { color: colors.label }]} numberOfLines={1}>
            {studio.name}
          </Text>
          {studio.avg_rating != null && studio.avg_rating > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={11} color="#FF9500" />
              <Text style={[styles.ratingText, { color: colors.label }]}>
                {studio.avg_rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.cardMeta}>
          <Ionicons name="location-outline" size={12} color={colors.secondaryLabel} />
          <Text style={[styles.metaText, { color: colors.secondaryLabel }]}>{studio.city}</Text>
          {studio.price_range && (
            <Text style={[styles.metaText, { color: colors.secondaryLabel }]}>
              · {PRICE_LABELS[studio.price_range] || studio.price_range}
            </Text>
          )}
        </View>
        {studio.styles && studio.styles.length > 0 && (
          <View style={styles.tagsRow}>
            {studio.styles.slice(0, 3).map(s => (
              <View key={s} style={[styles.tag, { backgroundColor: colors.fill }]}>
                <Text style={[styles.tagText, { color: colors.secondaryLabel }]}>{s}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function HomeTab() {
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
    return studios.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q)
    );
  }, [studios, query]);

  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={[styles.root, { backgroundColor: colors.groupedBackground }]}>
      {/* Large Title Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <Text style={[styles.largeTitle, { color: colors.label }]}>Studios</Text>

        {/* iOS-style Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.fill }]}>
          <Ionicons name="search" size={16} color={colors.tertiaryLabel} />
          <TextInput
            style={[styles.searchInput, { color: colors.label }]}
            placeholder="Suchen"
            placeholderTextColor={colors.tertiaryLabel}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => setQuery(search)}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setQuery(''); }}>
              <Ionicons name="close-circle" size={16} color={colors.tertiaryLabel} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.studio_id}
        renderItem={({ item }) => <StudioCard studio={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        ListHeaderComponent={
          filtered.length > 0 && query ? (
            <Text style={[styles.resultCount, { color: colors.secondaryLabel }]}>
              {filtered.length} {filtered.length === 1 ? 'Studio' : 'Studios'}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color={colors.tertiaryLabel} />
            <Text style={[styles.emptyTitle, { color: colors.label }]}>Keine Studios gefunden</Text>
            <Text style={[styles.emptyText, { color: colors.secondaryLabel }]}>
              Versuche andere Suchbegriffe
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  largeTitle: {
    fontSize: 34,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Inter_400Regular',
    height: '100%',
  },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40, gap: 12 },
  resultCount: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImg: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { padding: 14 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardName: { fontSize: 17, fontFamily: 'Inter_600SemiBold', flex: 1, letterSpacing: -0.3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 6 },
  ratingText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 10 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 8 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
});
