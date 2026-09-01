/**
 * ReadFlow color palette.
 * Calm, low-eye-strain palette suited to a reading/audio app.
 * Works in both light and dark mode via the `dark` variant.
 */
export const colors = {
  light: {
    primary: '#5B6CF5',
    onPrimary: '#FFFFFF',
    primaryContainer: '#E0E4FF',
    onPrimaryContainer: '#1F2670',
    accent: '#4EA57A',
    background: '#FAFAFC',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F2F8',
    onSurface: '#1B1C24',
    onSurfaceVariant: '#5A5C66',
    outline: '#DFE0E8',
    error: '#C0392B',
    onError: '#FFFFFF',
    elevation: '#FFFFFF',
    scrim: '#000000',
  },
  dark: {
    primary: '#A8B1FF',
    onPrimary: '#232A75',
    primaryContainer: '#3A418D',
    onPrimaryContainer: '#E0E4FF',
    accent: '#6CCB9B',
    background: '#12131A',
    surface: '#1B1C26',
    surfaceVariant: '#262836',
    onSurface: '#EAEAF0',
    onSurfaceVariant: '#B4B6C2',
    outline: '#383A4A',
    error: '#FF6B5E',
    onError: '#3D0A06',
    elevation: '#22232E',
    scrim: '#000000',
  },
} as const;

export type ColorPalette = {
  [K in keyof typeof colors.light]: string;
};
