import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title, onPress, loading = false, disabled = false,
  variant = 'primary', size = 'md', style, textStyle, fullWidth = false,
}: ButtonProps) {
  const colors = useColors();

  const handlePress = () => {
    if (loading || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const bg =
    variant === 'primary' ? colors.primary :
    variant === 'danger'  ? colors.error :
    variant === 'secondary' ? colors.fill :
    'transparent';

  const fg =
    variant === 'primary' || variant === 'danger' ? '#ffffff' :
    variant === 'secondary' ? colors.label :
    colors.primary;

  const h = size === 'sm' ? 36 : size === 'lg' ? 54 : 50;
  const fs = size === 'sm' ? 15 : size === 'lg' ? 17 : 17;
  const r = size === 'sm' ? 10 : 14;

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.78}
      disabled={disabled || loading}
      style={[
        styles.base,
        { backgroundColor: bg, height: h, borderRadius: r },
        fullWidth && styles.fullWidth,
        variant === 'secondary' && { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.opaqueSeparator },
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : colors.primary} size="small" />
      ) : (
        <Text style={[styles.label, { color: fg, fontSize: fs }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.42 },
  label: { fontFamily: 'Inter_600SemiBold', letterSpacing: -0.2 },
});
