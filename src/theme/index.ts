import { useColorScheme } from 'react-native';
import { colors, ColorPalette } from './colors';
import { spacing, radius } from './spacing';
import { typography } from './typography';

export { colors, spacing, radius, typography };
export type { ColorPalette };

export interface Theme {
  colors: ColorPalette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  isDark: boolean;
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    colors: isDark ? colors.dark : colors.light,
    spacing,
    radius,
    typography,
    isDark,
  };
}
