import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { apiPut } from '@/lib/api';

export default function ProfileTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, refreshUser } = useAuth();

  const [section, setSection] = useState<'main' | 'profile' | 'password'>('main');

  const [name, setName] = useState(user?.name || '');
  const [nameLoading, setNameLoading] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setNameLoading(true);
    try {
      await apiPut('/users/me', { name: name.trim() });
      await refreshUser();
      Alert.alert('Gespeichert', 'Name erfolgreich geändert.');
      setSection('main');
    } catch (e: any) {
      Alert.alert('Fehler', e.message || 'Speichern fehlgeschlagen');
    } finally {
      setNameLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError(''); setPwSuccess('');
    if (newPw !== confirmPw) { setPwError('Passwörter stimmen nicht überein.'); return; }
    if (newPw.length < 8) { setPwError('Neues Passwort muss mindestens 8 Zeichen haben.'); return; }
    setPwLoading(true);
    try {
      await apiPut('/users/me/password', { current_password: currentPw, new_password: newPw });
      setPwSuccess('Passwort erfolgreich geändert.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e: any) {
      setPwError(e.message || 'Passwort konnte nicht geändert werden.');
    } finally {
      setPwLoading(false); }
  };

  const handleLogout = () => {
    Alert.alert('Abmelden', 'Möchtest du dich wirklich abmelden?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Abmelden', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (section === 'profile') {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16), paddingBottom: 40, paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => setSection('main')} style={styles.backRow}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
          <Text style={[styles.backText, { color: colors.foreground }]}>Profil</Text>
        </TouchableOpacity>
        <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Name ändern</Text>
        <View style={{ marginTop: 24, gap: 16 }}>
          <Input label="Name" value={name} onChangeText={setName} placeholder="Dein Name" autoCapitalize="words" />
          <View style={[styles.readOnly, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.readOnlyLabel, { color: colors.muted }]}>E-Mail</Text>
            <Text style={[styles.readOnlyValue, { color: colors.muted }]}>{user?.email}</Text>
          </View>
          <Button title="Speichern" onPress={handleSaveName} loading={nameLoading} fullWidth disabled={name.trim() === user?.name} />
        </View>
      </ScrollView>
    );
  }

  if (section === 'password') {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16), paddingBottom: 40, paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => setSection('main')} style={styles.backRow}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
          <Text style={[styles.backText, { color: colors.foreground }]}>Passwort</Text>
        </TouchableOpacity>
        <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Passwort ändern</Text>
        {!!pwError && <View style={[styles.msgBox, { backgroundColor: colors.errorBg }]}><Text style={{ color: colors.error, fontFamily: 'Inter_400Regular', fontSize: 13 }}>{pwError}</Text></View>}
        {!!pwSuccess && <View style={[styles.msgBox, { backgroundColor: colors.successBg }]}><Text style={{ color: colors.success, fontFamily: 'Inter_400Regular', fontSize: 13 }}>{pwSuccess}</Text></View>}
        <View style={{ marginTop: 24, gap: 16 }}>
          <Input label="Aktuelles Passwort" value={currentPw} onChangeText={setCurrentPw} isPassword placeholder="••••••••" />
          <Input label="Neues Passwort" value={newPw} onChangeText={setNewPw} isPassword placeholder="Mindestens 8 Zeichen" />
          <Input label="Passwort bestätigen" value={confirmPw} onChangeText={setConfirmPw} isPassword placeholder="••••••••" />
          <Button title="Passwort ändern" onPress={handleChangePassword} loading={pwLoading} fullWidth disabled={!currentPw || !newPw || !confirmPw} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16),
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 24,
      }}
    >
      <View style={[styles.avatarWrap, { backgroundColor: colors.primary }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name}</Text>
      <Text style={[styles.userEmail, { color: colors.muted }]}>{user?.email}</Text>
      <View style={[styles.rolePill, { backgroundColor: colors.surface }]}>
        <Text style={[styles.roleText, { color: colors.muted }]}>
          {user?.role === 'studio_owner' ? 'Studio-Inhaber' : 'Kunde'}
        </Text>
      </View>

      <View style={[styles.menu, { borderColor: colors.border }]}>
        {[
          { label: 'Profil bearbeiten', icon: 'user', onPress: () => setSection('profile') },
          { label: 'Passwort ändern', icon: 'lock', onPress: () => setSection('password') },
        ].map((item, idx) => (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.menuItem,
              idx < 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
            ]}
            activeOpacity={0.7}
            onPress={item.onPress}
          >
            <Feather name={item.icon as any} size={18} color={colors.muted} />
            <Text style={[styles.menuItemText, { color: colors.foreground }]}>{item.label}</Text>
            <Feather name="chevron-right" size={16} color={colors.muted} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: colors.error }]}
        activeOpacity={0.75}
        onPress={handleLogout}
      >
        <Feather name="log-out" size={16} color={colors.error} />
        <Text style={[styles.logoutText, { color: colors.error }]}>Abmelden</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatarWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarText: { color: '#fff', fontSize: 26, fontFamily: 'Inter_700Bold' },
  userName: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.4 },
  userEmail: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 4 },
  rolePill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 10 },
  roleText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  menu: { marginTop: 32, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  menuItemText: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, padding: 16, borderRadius: 14, borderWidth: 1 },
  logoutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  backText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  sectionHeading: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  readOnly: { borderWidth: 1, borderRadius: 12, padding: 16 },
  readOnlyLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  readOnlyValue: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  msgBox: { padding: 12, borderRadius: 10, marginTop: 12 },
});
