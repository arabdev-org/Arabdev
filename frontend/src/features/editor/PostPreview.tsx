import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { UserAvatar } from '@/components/common';
import { useCurrentUser } from '@/features/auth/AuthProvider';
import { PostLink } from '@/features/posts/PostCard';
import { PostContent } from '@/features/posts/PostContent';
import { headingFont } from '@/theme/typography';
import type { Image } from '@/types/api';

import { isValidLink } from './Attachments';

interface PostPreviewProps {
  title: string;
  html: string;
  tags: string[];
  image: Image | null;
  linkUrl: string;
}

/** Renders the draft exactly as readers will see it, using the same content styles. */
export function PostPreview({ title, html, tags, image, linkUrl }: PostPreviewProps) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const empty = !title.trim() && !html;

  if (empty) {
    return (
      <Stack
        spacing={1.5}
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
          py: 10,
          px: 3,
          textAlign: 'center',
        }}
      >
        <VisibilityOutlinedIcon />
        <Typography variant="body2">{t('editor.previewEmpty')}</Typography>
      </Stack>
    );
  }

  return (
    <Box component="article" aria-label={t('editor.preview')} sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
        <UserAvatar name={user.display_name} src={user.avatar_url} size={40} />
        <Box>
          <Typography sx={{ fontWeight: 700 }}>{user.display_name}</Typography>
          <Typography variant="body2" color="text.secondary" dir="ltr" sx={{ textAlign: 'start' }}>
            @{user.username}
          </Typography>
        </Box>
      </Stack>
      {title.trim() && (
        <Typography
          component="h2"
          dir="auto"
          sx={{
            fontFamily: headingFont,
            fontWeight: 700,
            fontSize: { xs: '1.5rem', md: '1.75rem' },
            lineHeight: 1.35,
            mb: 2,
          }}
        >
          {title}
        </Typography>
      )}
      <PostContent html={html} />
      {image && (
        <Box
          component="img"
          src={image.url}
          alt={t('post.attachedImage')}
          sx={{ display: 'block', width: '100%', borderRadius: 2, border: 1, borderColor: 'divider', mt: 1.5 }}
        />
      )}
      {linkUrl.trim() && isValidLink(linkUrl) && <PostLink url={linkUrl.trim()} />}
      {tags.length > 0 && (
        <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
          {tags.map((tag) => (
            <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" />
          ))}
        </Stack>
      )}
    </Box>
  );
}
