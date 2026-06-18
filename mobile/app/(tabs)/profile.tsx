import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { apiPut } from '@/lib/api';

type Section = 'main' | 'profile' | 'password';

function SettingsRow({
  icon,
  label,
  onPress,
  destructive = false,
  last = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  destructive?: boolean;
  last?: boolean;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.rowIcon, { backgroundColor: destructive ? colors.errorBg : colors.fill }]}>
        <Ionicons name={icon} size={18} color={destructive ? colors.error : colors.secondaryLabel} />
      </View>
      <Text style={[styles.rowLabel, { color: destructive ? colors.error : colors.label }]}>{label}</Text>
      {!destructive && <Ionicons name="chevron-forward" size={16} color={colors.tertiaryLabel} />}
    </TouchableOpacity>
  );
}

function IOSInput({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  const colors = useColors();
  return (
    <View>
      <Text style={[styles.inputLabel, { color: colors.secondaryLabel }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.inputField, { color: colors.label }]}
          placeholderTextColor={colors.tertiaryLabel}
          autoCapitalize="none"
          {...props}
        />
      </View>
    </View>
  );
}

export default function ProfileTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, refreshUser } = useAuth();
  const [section, setSection] = useState<Section>('main');
  const [name, setName] = useState(user?.name || '');
  const [nameLoading, setNameLoading] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setNameLoading(true);
    try {
      await apiPut('/users/me', { name: name.trim() });
      await refreshUser();
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
    if (newPw.length < 8) { setPwError('Mindestens 8 Zeichen.'); return; }
    setPwLoading(true);
    try {
      await apiPut('/users/me/password', { current_password: currentPw, new_password: newPw });
      setPwSuccess('Passwort erfolgreich geändert.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e: any) {
      setPwError(e.message || 'Passwort konnte nicht geändert werden.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Abmelden', 'Möchtest du dich wirklich abmelden?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Abmelden', style: 'destructive', onPress: logout },
    ]);
  };

  if (section === 'profile') {
    return (
      <ScrollView
        style={[styles.root, { backgroundColor: colors.groupedBackground }]}
        contentContainerStyle={{ paddingTop: topPadding + 12, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => setSection('main')} style={styles.backRow}>
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Profil</Text>
        </TouchableOpacity>
        <Text style={[styles.sectionTitle, { color: colors.label }]}>Profil bearbeiten</Text>

        <View style={[styles.formGroup, { backgroundColor: colors.surface }]}>
          <IOSInput label="NAME" value={name} onChangeText={setName} placeholder="Dein Name" autoCapitalize="words" />
          <View style={[styles.fieldDivider, { backgroundColor: colors.separator }]} />
          <View>
            <Text style={[styles.inputLabel, { color: colors.secondaryLabel }]}>E-MAIL</Text>
            <Text style={[styles.readonlyValue, { color: colors.secondaryLabel }]}>{user?.email}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: name.trim() === user?.name || nameLoading ? colors.fill : colors.primary }]}
          onPress={handleSaveName}
          disabled={name.trim() === user?.name || nameLoading}
        >
          {nameLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.saveBtnText, { color: name.trim() === user?.name ? colors.secondaryLabel : '#fff' }]}>
              Speichern
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (section === 'password') {
    return (
      <ScrollView
        style={[styles.root, { backgroundColor: colors.groupedBackground }]}
        contentContainerStyle={{ paddingTop: topPadding + 12, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => setSection('main')} style={styles.backRow}>
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Profil</Text>
        </TouchableOpacity>
        <Text style={[styles.sectionTitle, { color: colors.label }]}>Passwort ändern</Text>

        {!!pwError && (
          <View style={[styles.notice, { backgroundColor: colors.errorBg }]}>
            <Ionicons name="warning-outline" size={15} color={colors.error} />
            <Text style={[styles.noticeText, { color: colors.error }]}>{pwError}</Text>
          </View>
        )}
        {!!pwSuccess && (
          <View style={[styles.notice, { backgroundColor: colors.successBg }]}>
            <Ionicons name="checkmark-circle-outline" size={15} color={colors.success} />
            <Text style={[styles.noticeText, { color: colors.success }]}>{pwSuccess}</Text>
          </View>
        )}

        <View style={[styles.formGroup, { backgroundColor: colors.surface }]}>
          <IOSInput label="AKTUELLES PASSWORT" value={currentPw} onChangeText={setCurrentPw} secureTextEntry placeholder="••••••••" />
          <View style={[styles.fieldDivider, { backgroundColor: colors.separator }]} />
          <IOSInput label="NEUES PASSWORT" value={newPw} onChangeText={setNewPw} secureTextEntry placeholder="Mindestens 8 Zeichen" />
          <View style={[styles.fieldDivider, { backgroundColor: colors.separator }]} />
          <IOSInput label="BESTÄTIGEN" value={confirmPw} onChangeText={setConfirmPw} secureTextEntry placeholder="••••••••" />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: (!currentPw || !newPw || !confirmPw || pwLoading) ? colors.fill : colors.primary }]}
          onPress={handleChangePassword}
          disabled={!currentPw || !newPw || !confirmPw || pwLoading}
        >
          {pwLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.saveBtnText, { color: (!currentPw || !newPw || !confirmPw) ? colors.secondaryLabel : '#fff' }]}>
              Passwort ändern
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.groupedBackground }]}
      contentContainerStyle={{ paddingTop: topPadding + 12, paddingBottom: insets.bottom + 40 }}
    >
      {/* Avatar + Name */}
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={[styles.userName, { color: colors.label }]}>{user?.name}</Text>
        <Text style={[styles.userEmail, { color: colors.secondaryLabel }]}>{user?.email}</Text>
      </View>

      {/* Account Group */}
      <Text style={[styles.groupLabel, { color: colors.secondaryLabel }]}>KONTO</Text>
      <View style={[styles.group, { backgroundColor: colors.surface }]}>
        <SettingsRow
          icon="person-outline"
          label="Profil bearbeiten"
          onPress={() => setSection('profile')}
        />
        <SettingsRow
          icon="lock-closed-outline"
          label="Passwort ändern"
          onPress={() => setSection('password')}
          last
        />
      </View>

      {/* App Group */}
      <Text style={[styles.groupLabel, { color: colors.secondaryLabel }]}>APP</Text>
      <View style={[styles.group, { backgroundColor: colors.surface }]}>
        <SettingsRow
          icon="help-circle-outline"
          label="FAQ & Hilfe"
          onPress={() => {}}
          last
        />
      </View>

      {/* Danger Group */}
      <View style={[styles.group, { backgroundColor: colors.surface }]}>
        <SettingsRow
          icon="log-out-outline"
          label="Abmelden"
          onPress={handleLogout}
          destructive
          last
        />
      </View>

      <Text style={[styles.versionText, { color: colors.tertiaryLabel }]}>StudioOS 1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  profileHeader: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontFamily: 'Inter_700Bold' },
  userName: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.4 },
  userEmail: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 2 },
  groupLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', letterSpacing: 0.1, marginHorizontal: 32, marginBottom: 6, marginTop: 16 },
  group: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 14 },
  rowIcon: { width: 30, height: 30, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 17, fontFamily: 'Inter_400Regular' },
  versionText: { textAlign: 'center', fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 32 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginHorizontal: 16, marginBottom: 20 },
  backText: { fontSize: 17, fontFamily: 'Inter_400Regular' },
  sectionTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, marginHorizontal: 16, marginBottom: 20 },
  formGroup: { marginHorizontal: 16, borderRadius: 14, padding: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  fieldDivider: { height: StyleSheet.hairlineWidth },
  inputLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, marginBottom: 4 },
  inputWrap: {},
  inputField: { fontSize: 17, fontFamily: 'Inter_400Regular', paddingVertical: 8 },
  readonlyValue: { fontSize: 17, fontFamily: 'Inter_400Regular', paddingVertical: 8 },
  saveBtn: { marginHorizontal: 16, marginTop: 24, borderRadius: 14, height: 50, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 10 },
  noticeText: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1 },
});
