import React, { useState } from 'react';
import { TextInput, View, Text, TouchableOpacity, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export function Input({ label, error, containerStyle, isPassword, ...props }: InputProps) {
  const colors = useColors();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.secondaryLabel }]}>{label}</Text>
      )}
      <View style={[
        styles.inputWrap,
        { backgroundColor: colors.fill, borderColor: error ? colors.error : 'transparent' },
        error && { borderWidth: 1.5 },
      ]}>
        <TextInput
          {...props}
          secureTextEntry={isPassword && !showPassword}
          style={[styles.input, { color: colors.label }, props.style]}
          placeholderTextColor={colors.tertiaryLabel}
          autoCapitalize={props.autoCapitalize ?? 'none'}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.secondaryLabel} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 4 },
  label: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 17,
    fontFamily: 'Inter_400Regular',
  },
  eyeBtn: { padding: 14 },
  error: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 5 },
});
