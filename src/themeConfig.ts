/**
 * Theme configuration for the race track
 */

export type ThemeType = 'normal' | 'christmas';

export interface ThemeConfig {
  name: string;
  groundColor: number;
  groundTexture?: 'grass' | 'snow';
  fenceType: 'post' | 'candy-cane';
  skyColor: number;
}

export const THEMES: Record<ThemeType, ThemeConfig> = {
  normal: {
    name: 'Normal',
    groundColor: 0x90EE90,
    groundTexture: 'grass',
    fenceType: 'post',
    skyColor: 0x6495ED,
  },
  christmas: {
    name: 'Christmas',
    groundColor: 0x90EE90,
    groundTexture: 'grass',
    fenceType: 'candy-cane',
    skyColor: 0x87CEEB,
  },
};

const THEME_STORAGE_KEY = 'reindeer-racing-theme';

/**
 * Get current theme from localStorage or default to christmas
 */
export function getCurrentTheme(): ThemeType {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'normal' || stored === 'christmas') {
    return stored;
  }
  return 'christmas'; // Default theme
}

/**
 * Save theme to localStorage
 */
export function saveTheme(theme: ThemeType): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Get theme configuration
 */
export function getThemeConfig(theme: ThemeType): ThemeConfig {
  return THEMES[theme];
}
