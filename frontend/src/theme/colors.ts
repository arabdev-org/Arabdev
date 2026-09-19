/**
 * ArabDev color system: red + white, with warm neutrals.
 * Values were chosen for WCAG AA contrast (white on brand red ≥ 4.5:1 in both schemes).
 */

export const brand = {
  red: '#D0152B',
  redDark: '#A50E21',
  redDarkScheme: '#DB2436',
  redTextDarkScheme: '#FF6B76',
} as const;

export const neutralLight = {
  background: '#F7F7F5',
  paper: '#FFFFFF',
  sunken: '#F1F0ED',
  border: '#E6E4E0',
  borderStrong: '#D4D1CC',
  textPrimary: '#141414',
  textSecondary: '#5C5A57',
  textMuted: '#7A7874',
} as const;

export const neutralDark = {
  background: '#0F0F10',
  paper: '#161618',
  sunken: '#1C1C1F',
  border: '#2A2A2D',
  borderStrong: '#3A3A3E',
  textPrimary: '#F2F2F0',
  textSecondary: '#A3A3A0',
  textMuted: '#85857F',
} as const;

/**
 * Colors the post editor may apply to text. They are CSS variables so a post written
 * in light mode stays readable in dark mode. The backend accepts only these names.
 */
export const postTextColors = {
  light: {
    red: '#C8102E',
    crimson: '#8E0B1F',
    ink: '#141414',
    graphite: '#4A4A48',
    muted: '#7A7874',
  },
  dark: {
    red: '#FF6B76',
    crimson: '#FF9AA2',
    ink: '#F2F2F0',
    graphite: '#C9C9C6',
    muted: '#9A9A97',
  },
} as const;

export type PostTextColor = keyof typeof postTextColors.light;
