// A restrained, water-inspired palette. Two accent colors max, generous
// neutral space, distinct light/dark sets (not just inverted).

export const light = {
  background: '#F6F9FB',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF4F8',
  textPrimary: '#0B1E2E',
  textSecondary: '#5C7080',
  textTertiary: '#93A4B0',
  accent: '#2F9BE0',
  accentSoft: '#DCEEFB',
  ring: '#2F9BE0',
  ringTrack: '#E1EDF4',
  success: '#34B27B',
  border: '#E6EDF2',
  danger: '#E5654A',
};

export const dark = {
  background: '#081420',
  surface: '#0F1F2E',
  surfaceMuted: '#132638',
  textPrimary: '#EAF2F8',
  textSecondary: '#9BB1C0',
  textTertiary: '#5F7684',
  accent: '#4FB4F2',
  accentSoft: '#153650',
  ring: '#4FB4F2',
  ringTrack: '#1A344A',
  success: '#3FCB94',
  border: '#1B3145',
  danger: '#F07A5F',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

export type Palette = typeof light;
