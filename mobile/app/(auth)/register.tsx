import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
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
    if (!name || !email || !password) {
      setError('Bitte alle Felder ausfüllen.');
      return;
    }
    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await register(email, password, name, role);
      if (user.role === 'studio_owner') {
        router.replace('/(tabs)/bookings');
      } else {
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      setError(e.message || 'Registrierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

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

        <Text style={[styles.heading, { color: colors.foreground }]}>Konto erstellen</Text>
        <Text style={[styles.subheading, { color: colors.muted }]}>
          Bereits registriert?{' '}
          <Link href="/(auth)/login" style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>
            Anmelden
          </Link>
        </Text>

        <View style={[styles.roleRow, { marginTop: 28 }]}>
          {[
            { r: 'customer' as Role, label: 'Als Kunde', icon: 'user' },
            { r: 'studio_owner' as Role, label: 'Als Studio', icon: 'scissors' },
          ].map(opt => (
            <TouchableOpacity
              key={opt.r}
              onPress={() => setRole(opt.r)}
              style={[
                styles.roleBtn,
                {
                  borderColor: role === opt.r ? colors.primary : colors.border,
                  backgroundColor: role === opt.r ? colors.primary : colors.surface,
                },
              ]}
            >
              <Feather
                name={opt.icon as any}
                size={18}
                color={role === opt.r ? '#fff' : colors.muted}
              />
              <Text style={[
                styles.roleBtnText,
                { color: role === opt.r ? '#fff' : colors.foreground },
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!!error && (
          <View style={[styles.errorBox, { backgroundColor: colors.errorBg }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <View style={{ marginTop: 24, gap: 16 }}>
          <Input label="Name" value={name} onChangeText={setName} placeholder="Dein Name" autoCapitalize="words" />
          <Input label="E-Mail" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="email@beispiel.de" />
          <Input label="Passwort" value={password} onChangeText={setPassword} isPassword placeholder="Mindestens 8 Zeichen" />
          <Button title="Registrieren" onPress={handleRegister} loading={loading} fullWidth size="lg" style={{ marginTop: 4 }} />
        </View>

        <Text style={[styles.legal, { color: colors.muted }]}>
          Mit der Registrierung stimmst du unserer Datenschutzerklärung und den AGB zu.
        </Text>
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
  roleRow: { flexDirection: 'row', gap: 10 },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  roleBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  errorBox: { marginTop: 16, padding: 12, borderRadius: 10 },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  legal: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 24, lineHeight: 16 },
});
