import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, TouchableOpacity,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

type Role = 'customer' | 'studio_owner';

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) { setError('Bitte alle Felder ausfüllen.'); return; }
    if (password.length < 8) { setError('Passwort muss mindestens 8 Zeichen haben.'); return; }
    setError('');
    setLoading(true);
    try {
      await register(email, password, name, role);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Registrierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={[styles.root, { backgroundColor: colors.groupedBackground }]}
        contentContainerStyle={{
          paddingTop: insets.top + 60,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={[styles.logoBg, { backgroundColor: colors.label }]}>
            <Text style={styles.logoLetter}>S</Text>
          </View>
          <Text style={[styles.logoText, { color: colors.label }]}>
            Studio<Text style={{ fontFamily: 'Inter_700Bold' }}>OS</Text>
          </Text>
        </View>

        <Text style={[styles.heading, { color: colors.label }]}>Konto erstellen</Text>
        <Text style={[styles.sub, { color: colors.secondaryLabel }]}>
          Bereits registriert?{' '}
          <Link href="/(auth)/login" style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>
            Anmelden
          </Link>
        </Text>

        {/* Role selector */}
        <View style={styles.roleRow}>
          {([
            { r: 'customer' as Role, label: 'Als Kunde', icon: 'person-outline' as const },
            { r: 'studio_owner' as Role, label: 'Als Studio', icon: 'cut-outline' as const },
          ]).map(opt => (
            <TouchableOpacity
              key={opt.r}
              onPress={() => setRole(opt.r)}
              style={[
                styles.roleBtn,
                {
                  backgroundColor: role === opt.r ? colors.primary : colors.surface,
                  borderColor: role === opt.r ? colors.primary : colors.opaqueSeparator,
                },
              ]}
            >
              <Ionicons name={opt.icon} size={18} color={role === opt.r ? '#fff' : colors.secondaryLabel} />
              <Text style={[styles.roleBtnText, { color: role === opt.r ? '#fff' : colors.label }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!!error && (
          <View style={[styles.errorBox, { backgroundColor: colors.errorBg }]}>
            <Ionicons name="warning-outline" size={15} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
          <Input label="Name" value={name} onChangeText={setName} placeholder="Dein Name" autoCapitalize="words" />
          <View style={{ height: 12 }} />
          <Input label="E-Mail" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="email@beispiel.de" />
          <View style={{ height: 12 }} />
          <Input label="Passwort" value={password} onChangeText={setPassword} isPassword placeholder="Mindestens 8 Zeichen" />
        </View>

        <Button title="Registrieren" onPress={handleRegister} loading={loading} fullWidth size="lg" style={{ marginTop: 16 }} />

        <Text style={[styles.legal, { color: colors.tertiaryLabel }]}>
          Mit der Registrierung stimmst du unserer Datenschutzerklärung und den AGB zu.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 48 },
  logoBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logoLetter: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  logoText: { fontSize: 22, fontFamily: 'Inter_400Regular', letterSpacing: -0.5 },
  heading: { fontSize: 30, fontFamily: 'Inter_700Bold', letterSpacing: -0.6, marginBottom: 6 },
  sub: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 21, marginBottom: 24 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  roleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
  },
  roleBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1 },
  formCard: { borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  legal: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 24, lineHeight: 17 },
});
