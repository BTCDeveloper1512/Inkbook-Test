const light = {
  background: '#ffffff',
  surface: '#f5f5f7',
  card: '#ffffff',
  foreground: '#1d1d1f',
  muted: '#6e6e73',
  border: '#e5e5e5',
  separator: '#d2d2d7',
  primary: '#1d1d1f',
  primaryForeground: '#ffffff',
  accent: '#0071e3',
  success: '#16a34a',
  successBg: '#f0fdf4',
  error: '#dc2626',
  errorBg: '#fef2f2',
  warning: '#d97706',
  warningBg: '#fffbeb',
  violet: '#7c3aed',
  violetBg: '#f5f3ff',
  tabBar: '#f8f8f8',
  tabBarBorder: '#d2d2d7',
  radius: 12,
  shadow: {
    color: '#000',
    offset: { width: 0, height: 2 },
    opacity: 0.06,
    radius: 8,
    elevation: 3,
  },
} as const;

export const colors = { light };
export type ColorScheme = typeof light;
