import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { applyFieldErrors, errorMessage } from '@/api/errors';
import { usersApi } from '@/api/users';
import { Logo } from '@/components/Logo';
import { useNotify } from '@/components/Notifier';
import { useAuth, useCurrentUser } from '@/features/auth/AuthProvider';
import { USERNAME_PATTERN, useUsernameAvailability } from '@/features/auth/useUsernameAvailability';
import { AvatarUploader } from '@/features/profile/AvatarUploader';
import { InterestSelector } from '@/features/profile/InterestSelector';
import { RecommendedDevelopers } from '@/features/users/RecommendedDevelopers';
import { useIsMobile } from '@/hooks';
import { HOME_PATH } from '@/site';

const STEPS = 4;
const PROFILE_FORM_ID = 'onboarding-profile';

interface ProfileValues {
  username: string;
  display_name: string;
  bio: string;
}

function StepHeading({ title, body }: { title: string; body: string }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h3" component="h2" id="onboarding-step-title" sx={{ mb: 0.75 }}>
        {title}
      </Typography>
      <Typography color="text.secondary">{body}</Typography>
    </Box>
  );
}

function ProfileStep({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const { setUser } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<ProfileValues>({
    defaultValues: { username: user.username, display_name: user.display_name, bio: user.bio ?? '' },
  });
  const availability = useUsernameAvailability(watch('username'), user.username);
  const taken = availability.result && !availability.result.available;
  const bio = watch('bio');

  const onSubmit = handleSubmit(async (values) => {
    if (taken) return;
    try {
      let me = user;
      const username = values.username.trim().toLowerCase();
      if (username !== user.username) me = await usersApi.updateUsername(username);
      me = await usersApi.updateProfile({
        display_name: values.display_name.trim(),
        bio: values.bio.trim() || null,
        location: me.location,
        website: me.website,
      });
      setUser(me);
      onDone();
    } catch (error) {
      if (!applyFieldErrors(error, setError, t, ['username', 'display_name', 'bio'])) {
        setError('display_name', { type: 'server', message: errorMessage(error, t) });
      }
    }
  });

  return (
    <Box component="form" id={PROFILE_FORM_ID} noValidate onSubmit={onSubmit}>
      <Stack spacing={2.5}>
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
                : t('register.usernameHelp'))
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
          label={`${t('editProfile.bio')} (${t('common.optional')})`}
          placeholder={t('editProfile.bioPlaceholder')}
          fullWidth
          multiline
          minRows={3}
          error={Boolean(errors.bio)}
          helperText={errors.bio?.message ?? t('common.characters', { count: bio.length, max: 280 })}
          slotProps={{ htmlInput: { maxLength: 280 } }}
          {...register('bio')}
        />
      </Stack>
    </Box>
  );
}

/** First-login setup: photo → name → interests → people to follow. Every step can be skipped. */
export function OnboardingDialog() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  const notify = useNotify();
  const navigate = useNavigate();
  const fullScreen = useIsMobile();
  const [step, setStep] = useState(1);
  const [interests, setInterests] = useState<number[]>(() => user.interests.map((i) => i.id));
  const [savingInterests, setSavingInterests] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [followed, setFollowed] = useState(0);

  const finish = async () => {
    setFinishing(true);
    try {
      const me = await usersApi.completeOnboarding();
      void queryClient.invalidateQueries({ queryKey: ['feed'] });
      setUser(me);
      navigate(HOME_PATH);
    } catch (error) {
      notify(errorMessage(error, t), 'error');
      setFinishing(false);
    }
  };

  const saveInterests = async () => {
    const current = user.interests
      .map((i) => i.id)
      .sort()
      .join(',');
    if (current !== [...interests].sort().join(',')) {
      setSavingInterests(true);
      try {
        setUser(await usersApi.updateInterests(interests));
        await queryClient.invalidateQueries({ queryKey: ['recommended'] });
      } catch (error) {
        notify(errorMessage(error, t), 'error');
        setSavingInterests(false);
        return;
      }
      setSavingInterests(false);
    }
    setStep(4);
  };

  const next = () => {
    if (step === 3) void saveInterests();
    else if (step === 4) void finish();
    else setStep(step + 1);
  };

  return (
    <Dialog
      open
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      aria-labelledby="onboarding-step-title"
      slotProps={{ paper: { sx: { height: { md: 'min(720px, 90vh)' } } } }}
    >
      <Box sx={{ px: { xs: 2.5, sm: 4 }, pt: 2.5, pb: 2 }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Logo size={24} to={null} />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
              {t('onboarding.stepOf', { step, total: STEPS })}
            </Typography>
          </Stack>
          <IconButton onClick={() => void finish()} aria-label={t('onboarding.finishLater')} disabled={finishing}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={(step / STEPS) * 100}
          sx={{ mt: 2, height: 4, borderRadius: 2 }}
          aria-label={t('onboarding.stepOf', { step, total: STEPS })}
        />
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2.5, sm: 4 }, py: 2 }}>
        {step === 1 && (
          <>
            <StepHeading title={t('onboarding.photoTitle')} body={t('onboarding.photoBody')} />
            <Box sx={{ py: { xs: 2, sm: 4 } }}>
              <AvatarUploader size={144} layout="column" />
            </Box>
          </>
        )}
        {step === 2 && (
          <>
            <StepHeading title={t('onboarding.profileTitle')} body={t('onboarding.profileBody')} />
            <Box sx={{ maxWidth: 520 }}>
              <ProfileStep onDone={() => setStep(3)} />
            </Box>
          </>
        )}
        {step === 3 && (
          <>
            <StepHeading title={t('onboarding.interestsTitle')} body={t('onboarding.interestsBody')} />
            <InterestSelector value={interests} onChange={setInterests} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2.5 }} aria-live="polite">
              {t('onboarding.interestsSelected', { count: interests.length })}
              {interests.length < 3 && ` · ${t('onboarding.interestsHint')}`}
            </Typography>
          </>
        )}
        {step === 4 && (
          <>
            <StepHeading title={t('onboarding.peopleTitle')} body={t('onboarding.peopleBody')} />
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden', mx: { xs: -1, sm: 0 } }}>
              <RecommendedDevelopers
                limit={8}
                onFollowChange={(following) => setFollowed((n) => n + (following ? 1 : -1))}
              />
            </Box>
          </>
        )}
      </Box>

      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2.5, sm: 4 },
          py: 2,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Box>
          {step > 1 && (
            <Button color="inherit" onClick={() => setStep(step - 1)}>
              {t('common.back')}
            </Button>
          )}
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {step === 4 && followed > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {t('onboarding.followingCount', { count: followed })}
            </Typography>
          )}
          {step < 4 && (
            <Button color="inherit" onClick={() => setStep(step + 1)}>
              {t('common.skip')}
            </Button>
          )}
          {step === 2 ? (
            <Button type="submit" form={PROFILE_FORM_ID} variant="contained">
              {t('common.next')}
            </Button>
          ) : (
            <Button variant="contained" onClick={next} loading={savingInterests || finishing}>
              {step === 4 ? t('onboarding.finish') : t('common.next')}
            </Button>
          )}
        </Stack>
      </Stack>
    </Dialog>
  );
}
