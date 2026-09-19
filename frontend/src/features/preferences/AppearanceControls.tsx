import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { Language } from '@/i18n';
import type { ThemeMode } from '@/types/api';

import { useAppearance } from './useAppearance';

export function ThemeModeToggle({
  fullWidth = false,
  size = 'small',
}: {
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}) {
  const { t } = useTranslation();
  const { mode, setMode } = useAppearance();
  const options: { value: ThemeMode; label: string; icon: ReactNode }[] = [
    { value: 'light', label: t('common.themeLight'), icon: <LightModeOutlinedIcon fontSize="small" /> },
    { value: 'dark', label: t('common.themeDark'), icon: <DarkModeOutlinedIcon fontSize="small" /> },
    { value: 'system', label: t('common.themeSystem'), icon: <SettingsBrightnessOutlinedIcon fontSize="small" /> },
  ];
  return (
    <ToggleButtonGroup
      value={mode}
      exclusive
      size={size}
      fullWidth={fullWidth}
      onChange={(_, value: ThemeMode | null) => value && setMode(value)}
      aria-label={t('settings.theme')}
    >
      {options.map((option) => (
        <ToggleButton
          key={option.value}
          value={option.value}
          sx={{ gap: 0.75, textTransform: 'none', fontWeight: 700 }}
        >
          {option.icon}
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

export function LanguageToggle({
  fullWidth = false,
  size = 'small',
}: {
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}) {
  const { t } = useTranslation();
  const { language, setLanguage } = useAppearance();
  return (
    <ToggleButtonGroup
      value={language}
      exclusive
      size={size}
      fullWidth={fullWidth}
      onChange={(_, value: Language | null) => value && setLanguage(value)}
      aria-label={t('common.language')}
    >
      <ToggleButton value="ar" lang="ar" sx={{ textTransform: 'none', fontWeight: 700 }}>
        العربية
      </ToggleButton>
      <ToggleButton value="en" lang="en" sx={{ textTransform: 'none', fontWeight: 700 }}>
        English
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
