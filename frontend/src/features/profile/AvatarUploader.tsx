import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { errorMessage } from '@/api/errors';
import { usersApi } from '@/api/users';
import { UserAvatar } from '@/components/common';
import { useNotify } from '@/components/Notifier';
import { useAuth, useCurrentUser } from '@/features/auth/AuthProvider';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Upload, preview, replace and remove the profile picture. The preview shows instantly
 * from the local file; the server validates and re-encodes it.
 */
export function AvatarUploader({ size = 128, layout = 'row' }: { size?: number; layout?: 'row' | 'column' }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const { setUser } = useAuth();
  const notify = useNotify();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError(t('errors.file_type_not_allowed'));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t('errors.file_too_large'));
      return;
    }
    setPreview(URL.createObjectURL(file));
    setProgress(0);
    try {
      const me = await usersApi.uploadAvatar(file, setProgress);
      setUser(me);
      notify(t('editProfile.photoUpdated'));
    } catch (uploadError) {
      setError(errorMessage(uploadError, t));
    } finally {
      setPreview(null);
      setProgress(null);
    }
  };

  const remove = async () => {
    setRemoving(true);
    setError(null);
    try {
      setUser(await usersApi.removeAvatar());
      notify(t('editProfile.photoRemoved'));
    } catch (removeError) {
      setError(errorMessage(removeError, t));
    } finally {
      setRemoving(false);
    }
  };

  const uploading = progress !== null;
  const src = preview ?? user.avatar_url;

  return (
    <Stack
      direction={layout === 'row' ? { xs: 'column', sm: 'row' } : 'column'}
      spacing={3}
      sx={{ alignItems: 'center' }}
    >
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        <UserAvatar
          name={user.display_name}
          src={src}
          size={size}
          sx={{ border: 1, borderColor: 'divider', opacity: uploading ? 0.6 : 1 }}
        />
        {uploading && (
          <CircularProgress
            variant={progress && progress > 0 ? 'determinate' : 'indeterminate'}
            value={progress ?? 0}
            size={size + 8}
            thickness={2}
            sx={{ position: 'absolute', top: -4, left: -4 }}
            aria-label={t('editor.uploading')}
          />
        )}
      </Box>
      <Box sx={{ textAlign: layout === 'column' ? 'center' : { xs: 'center', sm: 'start' } }}>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED.join(',')}
          hidden
          onChange={(event) => void onFile(event)}
        />
        <Stack
          direction="row"
          spacing={1}
          sx={{ justifyContent: layout === 'column' ? 'center' : { xs: 'center', sm: 'flex-start' } }}
        >
          <Button
            variant="contained"
            startIcon={<PhotoCameraOutlinedIcon />}
            onClick={() => inputRef.current?.click()}
            disabled={uploading || removing}
          >
            {user.avatar_url ? t('editProfile.changePhoto') : t('editProfile.uploadPhoto')}
          </Button>
          {user.avatar_url && (
            <Button
              color="inherit"
              startIcon={<DeleteOutlineIcon />}
              onClick={() => void remove()}
              loading={removing}
              disabled={uploading}
            >
              {t('editProfile.removePhoto')}
            </Button>
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
          {t('editProfile.photoHelp')}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Stack>
  );
}
