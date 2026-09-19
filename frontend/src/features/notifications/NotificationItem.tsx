import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import RepeatIcon from '@mui/icons-material/Repeat';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';

import { RelativeTime, UserAvatar } from '@/components/common';
import { MentionText } from '@/features/comments/Comments';
import type { Notification, NotificationType } from '@/types/api';

const ICONS: Record<NotificationType, { icon: typeof FavoriteIcon; color: string }> = {
  like: { icon: FavoriteIcon, color: 'accent.text' },
  comment: { icon: ChatBubbleIcon, color: 'info.main' },
  follow: { icon: PersonAddAlt1Icon, color: 'text.primary' },
  repost: { icon: RepeatIcon, color: 'success.main' },
  mention: { icon: AlternateEmailIcon, color: 'warning.main' },
};

export function notificationLink(notification: Notification) {
  if (notification.type === 'follow' || !notification.post) return `/u/${notification.actor.username}`;
  return `/posts/${notification.post.id}${notification.comment_excerpt ? '#comments' : ''}`;
}

/**
 * One notification. Unread items get a tinted background, a bold actor name and a
 * "New" dot with a text label — never color alone.
 */
export function NotificationItem({ notification, onOpen }: { notification: Notification; onOpen: () => void }) {
  const { t } = useTranslation();
  const { icon: Icon, color } = ICONS[notification.type];
  const unread = !notification.is_read;

  return (
    <ButtonBase
      component={RouterLink}
      to={notificationLink(notification)}
      onClick={onOpen}
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        gap: 1.5,
        px: 2,
        py: 1.75,
        textAlign: 'start',
        position: 'relative',
        bgcolor: unread ? 'accent.subtle' : 'transparent',
        '&:hover': { bgcolor: unread ? 'accent.hover' : 'action.hover' },
      }}
    >
      <Box sx={{ width: 28, display: 'flex', justifyContent: 'center', pt: 0.5, color, flexShrink: 0 }}>
        <Icon fontSize="small" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <UserAvatar name={notification.actor.display_name} src={notification.actor.avatar_url} size={32} />
        <Typography sx={{ mt: 0.75, fontWeight: unread ? 500 : 400 }}>
          <Box component="span" sx={{ fontWeight: unread ? 800 : 700 }}>
            {notification.actor.display_name}
          </Box>{' '}
          {t(`notifications.${notification.type}`)}
        </Typography>
        {notification.post && (
          <Typography variant="body2" color="text.secondary" dir="auto" sx={{ mt: 0.25 }} noWrap>
            {notification.post.title || notification.post.excerpt}
          </Typography>
        )}
        {notification.comment_excerpt && (
          <Typography
            variant="body2"
            dir="auto"
            sx={{
              mt: 0.75,
              px: 1.25,
              py: 0.75,
              borderRadius: 1.5,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <MentionText text={notification.comment_excerpt} linkify={false} />
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>
          <RelativeTime iso={notification.created_at} />
        </Typography>
      </Box>
      {unread && (
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexShrink: 0 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} aria-hidden />
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'accent.text' }}>
            {t('notifications.newBadge')}
          </Typography>
        </Stack>
      )}
    </ButtonBase>
  );
}
