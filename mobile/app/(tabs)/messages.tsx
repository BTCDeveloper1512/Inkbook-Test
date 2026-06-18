import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { LoadingScreen } from '@/components/LoadingScreen';

type Conversation = {
  conv_id: string;
  other_user_id: string;
  other_name?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
};

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'Jetzt';
  if (diff < 3600) return `${Math.floor(diff / 60)} Min.`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} Std.`;
  if (diff < 604800) return d.toLocaleDateString('de-DE', { weekday: 'short' });
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

function getInitials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30'];
function getAvatarColor(name?: string): string {
  return AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

export default function MessagesTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const { data: conversations = [], isLoading, refetch, isRefetching } = useQuery<Conversation[]>({
    queryKey: ['/messages'],
    refetchInterval: 5000,
  });

  if (isLoading) return <LoadingScreen />;

  const sorted = [...conversations].sort((a, b) =>
    new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Large Title Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <Text style={[styles.largeTitle, { color: colors.label }]}>Nachrichten</Text>
      </View>

      {sorted.length > 0 && (
        <View style={[styles.listContainer, { backgroundColor: colors.surface }]}>
          <FlatList
            data={sorted}
            keyExtractor={item => item.conv_id || item.other_user_id}
            scrollEnabled={false}
            renderItem={({ item, index }) => {
              const name = item.other_name || 'Studio';
              const unread = item.unread_count || 0;
              const isLast = index === sorted.length - 1;
              return (
                <TouchableOpacity
                  style={[styles.row, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator }]}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/conversation/${item.other_user_id}`)}
                >
                  {/* Avatar */}
                  <View style={[styles.avatar, { backgroundColor: getAvatarColor(name) }]}>
                    <Text style={styles.avatarText}>{getInitials(name)}</Text>
                  </View>

                  {/* Content */}
                  <View style={styles.rowContent}>
                    <View style={styles.rowTop}>
                      <Text
                        style={[styles.rowName, { color: colors.label, fontFamily: unread > 0 ? 'Inter_700Bold' : 'Inter_600SemiBold' }]}
                        numberOfLines={1}
                      >
                        {name}
                      </Text>
                      <Text style={[styles.rowTime, { color: colors.tertiaryLabel }]}>
                        {timeAgo(item.last_message_at)}
                      </Text>
                    </View>
                    <View style={styles.rowBottom}>
                      <Text
                        style={[styles.rowPreview, { color: unread > 0 ? colors.label : colors.secondaryLabel, fontFamily: unread > 0 ? 'Inter_500Medium' : 'Inter_400Regular' }]}
                        numberOfLines={1}
                      >
                        {item.last_message || '—'}
                      </Text>
                      {unread > 0 && (
                        <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.unreadText}>{unread > 9 ? '9+' : unread}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Chevron */}
                  <Ionicons name="chevron-forward" size={16} color={colors.tertiaryLabel} />
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {sorted.length === 0 && (
        <FlatList
          data={[]}
          renderItem={() => null}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.fill }]}>
                <Ionicons name="chatbubbles-outline" size={40} color={colors.tertiaryLabel} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.label }]}>Keine Nachrichten</Text>
              <Text style={[styles.emptyText, { color: colors.secondaryLabel }]}>
                Schreibe einem Studio direkt über die Buchung
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  largeTitle: { fontSize: 34, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  listContainer: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { color: '#fff', fontSize: 17, fontFamily: 'Inter_700Bold' },
  rowContent: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  rowName: { fontSize: 17, letterSpacing: -0.2, flex: 1 },
  rowTime: { fontSize: 13, fontFamily: 'Inter_400Regular', marginLeft: 8 },
  rowBottom: { flexDirection: 'row', alignItems: 'center' },
  rowPreview: { fontSize: 15, flex: 1 },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, marginLeft: 8 },
  unreadText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40, gap: 10 },
  emptyIcon: { width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 21 },
});
