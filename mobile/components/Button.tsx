import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
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
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const colors = useColors();

  const handlePress = () => {
    if (loading || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const containerStyle: ViewStyle[] = [
    styles.base,
    fullWidth && styles.fullWidth,
    size === 'sm' && styles.sm,
    size === 'lg' && styles.lg,
    variant === 'primary' && { backgroundColor: colors.primary },
    variant === 'secondary' && {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    variant === 'ghost' && { backgroundColor: 'transparent' },
    variant === 'danger' && { backgroundColor: colors.error },
    (disabled || loading) && styles.disabled,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  const labelStyle: TextStyle[] = [
    styles.label,
    size === 'sm' && styles.labelSm,
    size === 'lg' && styles.labelLg,
    variant === 'primary' && { color: colors.primaryForeground },
    variant === 'secondary' && { color: colors.foreground },
    variant === 'ghost' && { color: colors.foreground },
    variant === 'danger' && { color: '#ffffff' },
    textStyle as TextStyle,
  ].filter(Boolean) as TextStyle[];

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.75}
      style={containerStyle}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#fff' : colors.muted}
          size="small"
        />
      ) : (
        <Text style={labelStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fullWidth: {
    width: '100%',
  },
  sm: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  lg: {
    height: 56,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
  },
  labelSm: {
    fontSize: 13,
  },
  labelLg: {
    fontSize: 16,
  },
});
