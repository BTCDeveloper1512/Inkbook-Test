import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, TouchableOpacity,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { apiPost } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotView, setForgotView] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError('Bitte E-Mail und Passwort eingeben.'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      await apiPost('/auth/forgot-password', { email: forgotEmail });
    } catch {}
    setForgotSent(true);
    setForgotLoading(false);
  };

  if (forgotSent) {
    return (
      <View style={[styles.root, { backgroundColor: colors.groupedBackground, paddingTop: insets.top + 60 }]}>
        <View style={styles.center}>
          <View style={[styles.iconBox, { backgroundColor: colors.primary }]}>
            <Ionicons name="mail" size={32} color="#fff" />
          </View>
          <Text style={[styles.heading, { color: colors.label }]}>Link gesendet</Text>
          <Text style={[styles.sub, { color: colors.secondaryLabel }]}>
            Falls ein Konto mit dieser E-Mail existiert, erhältst du einen Reset-Link.
          </Text>
          <Button
            title="Zurück zur Anmeldung"
            onPress={() => { setForgotView(false); setForgotSent(false); }}
            fullWidth
            style={{ marginTop: 28 }}
          />
        </View>
      </View>
    );
  }

  if (forgotView) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={[styles.root, { backgroundColor: colors.groupedBackground }]}
          contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40, paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => setForgotView(false)} style={styles.backRow}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>Anmelden</Text>
          </TouchableOpacity>
          <Text style={[styles.heading, { color: colors.label }]}>Passwort vergessen?</Text>
          <Text style={[styles.sub, { color: colors.secondaryLabel }]}>
            Gib deine E-Mail ein. Wir schicken dir einen Reset-Link.
          </Text>
          <View style={{ marginTop: 28, gap: 12 }}>
            <Input label="E-Mail" value={forgotEmail} onChangeText={setForgotEmail} keyboardType="email-address" placeholder="email@beispiel.de" />
            <Button title="Reset-Link senden" onPress={handleForgot} loading={forgotLoading} fullWidth size="lg" style={{ marginTop: 4 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={[styles.root, { backgroundColor: colors.groupedBackground }]}
        contentContainerStyle={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40, paddingHorizontal: 24 }}
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

        <Text style={[styles.heading, { color: colors.label }]}>Willkommen zurück</Text>
        <Text style={[styles.sub, { color: colors.secondaryLabel }]}>
          Noch kein Konto?{' '}
          <Link href="/(auth)/register" style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>
            Registrieren
          </Link>
        </Text>

        {!!error && (
          <View style={[styles.errorBox, { backgroundColor: colors.errorBg }]}>
            <Ionicons name="warning-outline" size={15} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
          <Input
            label="E-Mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="email@beispiel.de"
          />
          <View style={{ height: 12 }} />
          <Input
            label="Passwort"
            value={password}
            onChangeText={setPassword}
            isPassword
            placeholder="Passwort eingeben"
          />
          <TouchableOpacity onPress={() => { setForgotView(true); setForgotEmail(email); }} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
            <Text style={[styles.forgotLink, { color: colors.primary }]}>Passwort vergessen?</Text>
          </TouchableOpacity>
        </View>

        <Button title="Anmelden" onPress={handleLogin} loading={loading} fullWidth size="lg" style={{ marginTop: 16 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: 32 },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 48 },
  logoBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logoLetter: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  logoText: { fontSize: 22, fontFamily: 'Inter_400Regular', letterSpacing: -0.5 },
  heading: { fontSize: 30, fontFamily: 'Inter_700Bold', letterSpacing: -0.6, marginBottom: 6 },
  sub: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 21, marginBottom: 24 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1 },
  formCard: { borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  forgotLink: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  iconBox: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 28 },
  backText: { fontSize: 17, fontFamily: 'Inter_400Regular' },
});
