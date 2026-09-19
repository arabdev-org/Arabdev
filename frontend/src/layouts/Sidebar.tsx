import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Fab from '@mui/material/Fab';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useMatch, useResolvedPath } from 'react-router';

import { useAuth } from '@/features/auth/AuthProvider';
import { layout } from '@/theme/tokens';

import { useNavItems, type NavItem } from './navItems';

function NavEntry({ item, compact }: { item: NavItem; compact: boolean }) {
  const { t } = useTranslation();
  const resolved = useResolvedPath(item.to);
  const active = Boolean(useMatch({ path: resolved.pathname, end: item.end ?? false }));
  const label = t(item.labelKey);
  const icon = (
    <Badge color="primary" badgeContent={item.badge} max={99} invisible={!item.badge}>
      {active ? item.activeIcon : item.icon}
    </Badge>
  );

  const button = (
    <ListItemButton
      component={RouterLink}
      to={item.to}
      aria-current={active ? 'page' : undefined}
      aria-label={compact ? label : undefined}
      sx={{
        position: 'relative',
        minHeight: 48,
        px: compact ? 0 : 1.5,
        justifyContent: compact ? 'center' : 'flex-start',
        color: active ? 'text.primary' : 'text.secondary',
        '&:hover': { color: 'text.primary' },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 10,
          bottom: 10,
          width: 3,
          borderRadius: 3,
          bgcolor: active ? 'primary.main' : 'transparent',
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: compact ? 0 : 40, color: active ? 'accent.text' : 'inherit' }}>{icon}</ListItemIcon>
      {!compact && (
        <ListItemText
          primary={label}
          slotProps={{ primary: { sx: { fontWeight: active ? 800 : 500, fontSize: '1.0625rem' } } }}
        />
      )}
    </ListItemButton>
  );

  return compact ? (
    <Tooltip title={label} placement="right">
      {button}
    </Tooltip>
  ) : (
    button
  );
}

/** Desktop navigation: full labels on large screens, an icon rail on tablets. */
export function Sidebar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const items = useNavItems();
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <Box
      component="nav"
      aria-label={t('nav.mainNavigation')}
      sx={{
        display: { xs: 'none', md: 'block' },
        width: { md: layout.navRailWidth, lg: layout.navWidth },
        flexShrink: 0,
        position: 'sticky',
        top: layout.appBarHeight,
        alignSelf: 'flex-start',
        height: `calc(100vh - ${layout.appBarHeight}px)`,
        overflowY: 'auto',
        py: 2,
        pr: { lg: 1 },
      }}
    >
      <List disablePadding sx={{ display: 'grid', gap: 0.5 }}>
        {items.map((item) => (
          <NavEntry key={item.key} item={item} compact={compact} />
        ))}
      </List>
      {user &&
        (compact ? (
          <Tooltip title={t('nav.createPost')} placement="right">
            <Fab
              color="primary"
              size="medium"
              component={RouterLink}
              to="/create"
              aria-label={t('nav.createPost')}
              sx={{ mt: 2, mx: 'auto', display: 'flex', boxShadow: 'none' }}
            >
              <EditOutlinedIcon />
            </Fab>
          </Tooltip>
        ) : (
          <Button
            component={RouterLink}
            to="/create"
            variant="contained"
            size="large"
            fullWidth
            startIcon={<EditOutlinedIcon />}
            sx={{ mt: 2.5 }}
          >
            {t('nav.createPost')}
          </Button>
        ))}
      {!compact && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 4, px: 1.5 }}>
          {t('nav.footerAbout')}
        </Typography>
      )}
    </Box>
  );
}
