import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { apiPost, apiGet } from '@/lib/api';

interface Message {
  message_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_system?: boolean;
}

type ConversationResponse = Message[];

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Heute';
  if (diffDays === 1) return 'Gestern';
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long' });
}

function groupByDay(msgs: Message[]): { type: 'day'; label: string } | { type: 'msg'; msg: Message }[] {
  const result: any[] = [];
  let lastDay = '';
  for (const msg of msgs) {
    const day = msg.created_at?.split('T')[0] || '';
    if (day !== lastDay) {
      result.push({ type: 'day', label: formatDay(msg.created_at) });
      lastDay = day;
    }
    result.push({ type: 'msg', msg });
  }
  return result;
}

export default function ConversationScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const colors = useColors();
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ['/messages'],
  });

  const { data: messages = [], isLoading, refetch } = useQuery<ConversationResponse>({
    queryKey: [`/messages/${userId}`],
    refetchInterval: 3000,
  });

  const otherName = conversations.find((c: any) => c.other_user_id === userId)?.other_name;

  const allMessages = [...messages, ...localMessages].filter((m, i, arr) =>
    arr.findIndex(n => n.message_id === m.message_id) === i
  );

  useEffect(() => {
    if (otherName) {
      navigation.setOptions({ headerTitle: otherName });
    }
  }, [otherName, navigation]);

  useEffect(() => {
    if (messages.length > 0) {
      setLocalMessages([]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setText('');
    setSending(true);
    const tempMsg: Message = {
      message_id: `tmp-${Date.now()}`,
      sender_id: user?.id || '',
      content,
      created_at: new Date().toISOString(),
    };
    setLocalMessages(prev => [...prev, tempMsg]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      await apiPost('/messages', { recipient_id: userId, content });
      refetch();
    } catch {}
    setSending(false);
  };

  const items = groupByDay(
    allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  ) as any[];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(item, idx) => item.type === 'day' ? `day-${idx}` : item.msg.message_id}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          contentContainerStyle={{ padding: 16, gap: 2, paddingBottom: 8 }}
          renderItem={({ item }) => {
            if (item.type === 'day') {
              return (
                <View style={styles.dayRow}>
                  <Text style={[styles.dayLabel, { color: colors.muted }]}>{item.label}</Text>
                </View>
              );
            }
            const msg: Message = item.msg;
            const isMe = msg.sender_id === user?.id;
            const isTemp = msg.message_id.startsWith('tmp-');
            if (msg.is_system) {
              return (
                <View style={styles.systemMsg}>
                  <Text style={[styles.systemText, { color: colors.muted }]}>{msg.content}</Text>
                </View>
              );
            }
            return (
              <View style={[styles.bubbleWrap, isMe && styles.bubbleWrapMe]}>
                <View style={[
                  styles.bubble,
                  isMe
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                ]}>
                  <Text style={[
                    styles.bubbleText,
                    { color: isMe ? '#fff' : colors.foreground },
                  ]}>
                    {msg.content}
                  </Text>
                  <Text style={[
                    styles.bubbleTime,
                    { color: isMe ? 'rgba(255,255,255,0.6)' : colors.muted },
                  ]}>
                    {formatTime(msg.created_at)}{isTemp && ' ·'}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={[
        styles.inputBar,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + (Platform.OS === 'ios' ? 0 : 8),
        },
      ]}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border },
          ]}
          placeholder="Nachricht schreiben..."
          placeholderTextColor={colors.muted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.surface }]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.muted} />
          ) : (
            <Feather name="send" size={18} color={text.trim() ? '#fff' : colors.muted} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  dayRow: { alignItems: 'center', paddingVertical: 12 },
  dayLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  systemMsg: { alignItems: 'center', paddingVertical: 6 },
  systemText: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', fontStyle: 'italic' },
  bubbleWrap: { alignItems: 'flex-start', marginVertical: 1 },
  bubbleWrapMe: { alignItems: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: 18, padding: 12, paddingBottom: 8 },
  bubbleText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  bubbleTime: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4, textAlign: 'right' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingTop: 10,
    paddingHorizontal: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
