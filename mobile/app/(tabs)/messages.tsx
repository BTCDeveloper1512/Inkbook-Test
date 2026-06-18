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
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { LoadingScreen } from '@/components/LoadingScreen';

type Conversation = {
  conv_id: string;
  other_user_id: string;
  other_name?: string;
  other_role?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  is_broadcast_conv?: boolean;
};

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'Jetzt';
  if (diff < 3600) return `${Math.floor(diff / 60)} Min.`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} Std.`;
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

function initials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['#1d1d1f', '#374151', '#4b5563', '#6b7280'];

function getAvatarColor(name?: string): string {
  const idx = (name?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function MessagesTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data: conversations = [], isLoading, refetch, isRefetching } = useQuery<Conversation[]>({
    queryKey: ['/messages'],
    refetchInterval: 5000,
  });

  if (isLoading) return <LoadingScreen />;

  const sorted = [...conversations].sort((a, b) =>
    new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16) }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Nachrichten</Text>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={item => item.conv_id || item.other_user_id}
        renderItem={({ item }) => {
          const name = item.other_name || 'Nutzer';
          const unread = item.unread_count || 0;
          return (
            <TouchableOpacity
              style={[styles.convRow, { borderBottomColor: colors.separator }]}
              activeOpacity={0.7}
              onPress={() => router.push(`/conversation/${item.other_user_id}`)}
            >
              <View style={[styles.avatar, { backgroundColor: getAvatarColor(name) }]}>
                <Text style={styles.avatarText}>{initials(name)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.convTop}>
                  <Text style={[styles.convName, { color: colors.foreground, fontFamily: unread > 0 ? 'Inter_700Bold' : 'Inter_600SemiBold' }]} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={[styles.convTime, { color: colors.muted }]}>{timeAgo(item.last_message_at)}</Text>
                </View>
                <View style={styles.convBottom}>
                  <Text style={[styles.convPreview, { color: unread > 0 ? colors.foreground : colors.muted, fontFamily: unread > 0 ? 'Inter_500Medium' : 'Inter_400Regular' }]} numberOfLines={1}>
                    {item.last_message || '—'}
                  </Text>
                  {unread > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.unreadText}>{unread > 9 ? '9+' : unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="message-circle" size={40} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Keine Nachrichten</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>Schreibe einem Studio oder Kunden</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.6, marginBottom: 8 },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  convTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  convName: { fontSize: 15, letterSpacing: -0.2, flex: 1 },
  convTime: { fontSize: 12, fontFamily: 'Inter_400Regular', marginLeft: 8 },
  convBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  convPreview: { fontSize: 13, flex: 1 },
  unreadBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  unreadText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
