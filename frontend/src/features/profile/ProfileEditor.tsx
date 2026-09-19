import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { applyFieldErrors, errorMessage } from '@/api/errors';
import { usersApi } from '@/api/users';
import { useNotify } from '@/components/Notifier';
import { useAuth, useCurrentUser } from '@/features/auth/AuthProvider';
import { USERNAME_PATTERN, useUsernameAvailability } from '@/features/auth/useUsernameAvailability';

import { AvatarUploader } from './AvatarUploader';
import { InterestSelector } from './InterestSelector';

interface ProfileValues {
  username: string;
  display_name: string;
  bio: string;
  location: string;
  website: string;
}

const FIELDS = ['username', 'display_name', 'bio', 'location', 'website'] as const;

function sameIds(a: number[], b: number[]) {
  return [...a].sort().join(',') === [...b].sort().join(',');
}

/** Picture, identity, bio and interests. Used by /profile/edit and Settings → Profile. */
export function ProfileEditor() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const { setUser } = useAuth();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [interests, setInterests] = useState(() => user.interests.map((interest) => interest.id));

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileValues>({
    defaultValues: {
      username: user.username,
      display_name: user.display_name,
      bio: user.bio ?? '',
      location: user.location ?? '',
      website: user.website ?? '',
    },
  });

  const availability = useUsernameAvailability(watch('username'), user.username);
  const taken = availability.result && !availability.result.available;
  const bio = watch('bio');
  const interestsChanged = !sameIds(
    interests,
    user.interests.map((i) => i.id),
  );

  const onSubmit = handleSubmit(async (values) => {
    if (taken) return;
    try {
      let me = user;
      const username = values.username.trim().toLowerCase();
      if (username !== user.username) me = await usersApi.updateUsername(username);
      me = await usersApi.updateProfile({
        display_name: values.display_name.trim(),
        bio: values.bio.trim() || null,
        location: values.location.trim() || null,
        website: values.website.trim() || null,
      });
      if (interestsChanged) me = await usersApi.updateInterests(interests);
      setUser(me);
      reset({
        username: me.username,
        display_name: me.display_name,
        bio: me.bio ?? '',
        location: me.location ?? '',
        website: me.website ?? '',
      });
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      void queryClient.invalidateQueries({ queryKey: ['recommended'] });
      notify(t('editProfile.saved'));
    } catch (error) {
      if (!applyFieldErrors(error, setError, t, FIELDS)) notify(errorMessage(error, t), 'error');
    }
  });

  return (
    <Stack spacing={4}>
      <section aria-labelledby="photo-heading">
        <Typography id="photo-heading" variant="h5" component="h2" sx={{ mb: 2 }}>
          {t('editProfile.photo')}
        </Typography>
        <AvatarUploader size={112} />
      </section>
      <Divider />
      <Stack component="form" noValidate onSubmit={onSubmit} spacing={2.5} aria-label={t('editProfile.title')}>
        <TextField
          label={t('editProfile.displayName')}
          fullWidth
          error={Boolean(errors.display_name)}
          helperText={errors.display_name?.message}
          slotProps={{ htmlInput: { maxLength: 50 } }}
          {...register('display_name', {
            required: t('errors.required'),
            validate: (value) => value.trim().length > 0 || t('errors.required'),
          })}
        />
        <TextField
          label={t('editProfile.username')}
          fullWidth
          error={Boolean(errors.username) || Boolean(taken)}
          helperText={
            errors.username?.message ??
            (taken
              ? t('errors.username_taken')
              : availability.result?.available
                ? t('register.usernameAvailable', { username: availability.value })
                : t('settings.usernameHelp'))
          }
          slotProps={{
            htmlInput: { dir: 'ltr', maxLength: 20, autoCapitalize: 'none', spellCheck: false },
            input: { startAdornment: <InputAdornment position="start">@</InputAdornment> },
          }}
          {...register('username', {
            required: t('errors.required'),
            pattern: { value: USERNAME_PATTERN, message: t('errors.username_invalid') },
          })}
        />
        <TextField
          label={t('editProfile.bio')}
          placeholder={t('editProfile.bioPlaceholder')}
          fullWidth
          multiline
          minRows={3}
          error={Boolean(errors.bio)}
          helperText={errors.bio?.message ?? t('common.characters', { count: bio.length, max: 280 })}
          slotProps={{ htmlInput: { maxLength: 280, dir: 'auto' } }}
          {...register('bio')}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label={t('editProfile.location')}
            fullWidth
            error={Boolean(errors.location)}
            helperText={errors.location?.message}
            slotProps={{ htmlInput: { maxLength: 60 } }}
            {...register('location')}
          />
          <TextField
            label={t('editProfile.website')}
            placeholder="https://"
            fullWidth
            error={Boolean(errors.website)}
            helperText={errors.website?.message}
            slotProps={{ htmlInput: { maxLength: 200, dir: 'ltr', inputMode: 'url' } }}
            {...register('website')}
          />
        </Stack>
        <section aria-labelledby="interests-heading">
          <Typography id="interests-heading" variant="h5" component="h2" sx={{ mb: 1.5, mt: 1 }}>
            {t('editProfile.interests')}
          </Typography>
          <InterestSelector value={interests} onChange={setInterests} />
        </section>
        <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            loading={isSubmitting}
            disabled={!isDirty && !interestsChanged}
          >
            {t('common.save')}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
