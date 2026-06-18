import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending:               { label: 'Ausstehend',           bg: '#FFF3E0', text: '#FF9500' },
  pending_studio_review: { label: 'Neue Anfrage',         bg: '#FFF3E0', text: '#FF9500' },
  under_review:          { label: 'In Prüfung',           bg: '#EFF6FF', text: '#007AFF' },
  offer_sent:            { label: 'Angebot',              bg: '#F5EEFA', text: '#AF52DE' },
  waiting_for_deposit:   { label: 'Anzahlung fällig',     bg: '#FFF3E0', text: '#FF9500' },
  deposit_pending:       { label: 'Zahlung läuft',        bg: '#FFF3E0', text: '#FF9500' },
  confirmed:             { label: 'Bestätigt',            bg: '#E8F8ED', text: '#34C759' },
  cancelled:             { label: 'Storniert',            bg: '#FFECEB', text: '#FF3B30' },
  customer_cancelled:    { label: 'Storniert',            bg: '#FFECEB', text: '#FF3B30' },
  studio_cancelled:      { label: 'Abgelehnt',            bg: '#FFECEB', text: '#FF3B30' },
  completed:             { label: 'Abgeschlossen',        bg: '#F2F2F7', text: '#8E8E93' },
  no_show:               { label: 'Nicht erschienen',     bg: '#F2F2F7', text: '#8E8E93' },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#F2F2F7', text: '#8E8E93' };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.label, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  label: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.1 },
});
