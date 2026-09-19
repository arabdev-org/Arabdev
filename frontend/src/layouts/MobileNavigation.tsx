import AddIcon from '@mui/icons-material/Add';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LoginIcon from '@mui/icons-material/Login';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import Badge from '@mui/material/Badge';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation } from 'react-router';

import { useAuth } from '@/features/auth/AuthProvider';
import { layout } from '@/theme/tokens';

import { useUnreadCount } from './navItems';
import { HOME_PATH } from '@/site';

/** Phones get five destinations at the bottom, within thumb reach. */
export function MobileNavigation() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const unread = useUnreadCount();
  const { pathname } = useLocation();

  const destinations = user
    ? [
        { value: HOME_PATH, label: t('nav.home'), icon: <HomeOutlinedIcon /> },
        { value: '/explore', label: t('nav.explore'), icon: <ExploreOutlinedIcon /> },
        {
          value: '/create',
          label: t('nav.create'),
          icon: (
            <Box
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                borderRadius: 2,
                px: 1.5,
                py: 0.25,
                display: 'flex',
              }}
            >
              <AddIcon />
            </Box>
          ),
        },
        {
          value: '/notifications',
          label: t('nav.notifications'),
          icon: (
            <Badge color="primary" badgeContent={unread} max={99} invisible={!unread}>
              <NotificationsNoneIcon />
            </Badge>
          ),
        },
        { value: `/u/${user.username}`, label: t('nav.profile'), icon: <PersonOutlineIcon /> },
      ]
    : [
        { value: '/explore', label: t('nav.explore'), icon: <ExploreOutlinedIcon /> },
        { value: '/login', label: t('common.signIn'), icon: <LoginIcon /> },
      ];

  const current =
    destinations
      .map((d) => d.value)
      .filter((value) => pathname.startsWith(value))
      .sort((a, b) => b.length - a.length)[0] ?? false;

  return (
    <Paper
      component="nav"
      aria-label={t('nav.mainNavigation')}
      square
      sx={{
        display: { xs: 'block', md: 'none' },
        position: 'fixed',
        insetInline: 0,
        bottom: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        borderTop: 1,
        borderColor: 'divider',
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation value={current} showLabels sx={{ height: layout.mobileNavHeight, bgcolor: 'background.paper' }}>
        {destinations.map((destination) => (
          <BottomNavigationAction
            key={destination.value}
            component={RouterLink}
            to={destination.value}
            value={destination.value}
            label={destination.label}
            icon={destination.icon}
            sx={{
              minWidth: 0,
              color: 'text.secondary',
              '&.Mui-selected': { color: 'accent.text' },
              '& .MuiBottomNavigationAction-label': { fontSize: '0.75rem', fontWeight: 700, mt: 0.25 },
              '& .MuiBottomNavigationAction-label.Mui-selected': { fontSize: '0.75rem' },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
