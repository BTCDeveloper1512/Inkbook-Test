import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending:               { label: 'Ausstehend',           bg: '#fffbeb', text: '#d97706' },
  pending_studio_review: { label: 'Neue Anfrage',         bg: '#fffbeb', text: '#d97706' },
  under_review:          { label: 'In Prüfung',           bg: '#eff6ff', text: '#2563eb' },
  offer_sent:            { label: 'Angebot wartet',       bg: '#f5f3ff', text: '#7c3aed' },
  waiting_for_deposit:   { label: 'Anzahlung fällig',     bg: '#fff7ed', text: '#c2410c' },
  deposit_pending:       { label: 'Zahlung läuft',        bg: '#fff7ed', text: '#c2410c' },
  confirmed:             { label: 'Bestätigt',            bg: '#f0fdf4', text: '#16a34a' },
  cancelled:             { label: 'Storniert',            bg: '#fef2f2', text: '#dc2626' },
  customer_cancelled:    { label: 'Von dir storniert',    bg: '#fef2f2', text: '#dc2626' },
  studio_cancelled:      { label: 'Vom Studio storniert', bg: '#fef2f2', text: '#dc2626' },
  completed:             { label: 'Abgeschlossen',        bg: '#f4f4f5', text: '#71717a' },
  no_show:               { label: 'Nicht erschienen',     bg: '#f4f4f5', text: '#71717a' },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#f4f4f5', text: '#71717a' };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.label, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.2,
  },
});
