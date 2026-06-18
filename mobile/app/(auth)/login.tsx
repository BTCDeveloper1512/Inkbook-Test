import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { apiPost } from '@/lib/api';

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
    if (!email || !password) {
      setError('Bitte E-Mail und Passwort eingeben.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'studio_owner') {
        router.replace('/(tabs)/bookings');
      } else {
        router.replace('/(tabs)');
      }
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
      setForgotSent(true);
    } catch {
      setForgotSent(true);
    } finally {
      setForgotLoading(false);
    }
  };

  if (forgotSent) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 60 }]}>
        <View style={styles.centeredBox}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Text style={{ color: '#fff', fontSize: 28 }}>✉</Text>
          </View>
          <Text style={[styles.heading, { color: colors.foreground }]}>E-Mail gesendet</Text>
          <Text style={[styles.subheading, { color: colors.muted }]}>
            Falls ein Konto mit {forgotEmail} existiert, hast du jetzt einen Reset-Link erhalten.
          </Text>
          <Button title="Zurück zur Anmeldung" onPress={() => { setForgotView(false); setForgotSent(false); }} fullWidth style={{ marginTop: 24 }} />
        </View>
      </View>
    );
  }

  if (forgotView) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 40, paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => setForgotView(false)} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.muted }]}>← Zurück</Text>
          </TouchableOpacity>
          <Text style={[styles.heading, { color: colors.foreground }]}>Passwort vergessen?</Text>
          <Text style={[styles.subheading, { color: colors.muted }]}>
            Gib deine E-Mail-Adresse ein und wir senden dir einen Reset-Link.
          </Text>
          <View style={{ marginTop: 32 }}>
            <Input
              label="E-Mail"
              value={forgotEmail}
              onChangeText={setForgotEmail}
              keyboardType="email-address"
              placeholder="email@beispiel.de"
            />
            <Button
              title={forgotLoading ? 'Sende...' : 'Reset-Link senden'}
              onPress={handleForgot}
              loading={forgotLoading}
              fullWidth
              style={{ marginTop: 20 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          paddingTop: insets.top + 48,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoRow}>
          <View style={[styles.logoDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.logoText, { color: colors.foreground }]}>Studio<Text style={{ fontFamily: 'Inter_700Bold' }}>OS</Text></Text>
        </View>

        <Text style={[styles.heading, { color: colors.foreground }]}>Anmelden</Text>
        <Text style={[styles.subheading, { color: colors.muted }]}>
          Noch kein Konto?{' '}
          <Link href="/(auth)/register" style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>
            Registrieren
          </Link>
        </Text>

        {!!error && (
          <View style={[styles.errorBox, { backgroundColor: colors.errorBg }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <View style={{ marginTop: 32, gap: 16 }}>
          <Input
            label="E-Mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="email@beispiel.de"
          />
          <Input
            label="Passwort"
            value={password}
            onChangeText={setPassword}
            isPassword
            placeholder="••••••••"
          />
          <TouchableOpacity onPress={() => { setForgotView(true); setForgotEmail(email); }}>
            <Text style={[styles.forgotLink, { color: colors.muted }]}>Passwort vergessen?</Text>
          </TouchableOpacity>
          <Button
            title="Anmelden"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 40 },
  logoDot: { width: 28, height: 28, borderRadius: 8 },
  logoText: { fontSize: 20, fontFamily: 'Inter_500Medium', letterSpacing: -0.5 },
  heading: { fontSize: 32, fontFamily: 'Inter_700Bold', letterSpacing: -0.8, marginBottom: 6 },
  subheading: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  errorBox: { marginTop: 16, padding: 12, borderRadius: 10 },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  forgotLink: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'right', marginTop: -4 },
  backBtn: { marginBottom: 28 },
  backText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  centeredBox: { flex: 1, alignItems: 'center', paddingHorizontal: 24 },
  iconCircle: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
});
