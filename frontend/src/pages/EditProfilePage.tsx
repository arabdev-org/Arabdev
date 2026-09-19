import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';

import { PageHeader, Surface } from '@/components/common';
import { useCurrentUser } from '@/features/auth/AuthProvider';
import { ProfileEditor } from '@/features/profile/ProfileEditor';
import { useDocumentTitle } from '@/hooks';

export default function EditProfilePage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  useDocumentTitle(t('editProfile.title'));
  return (
    <Surface sx={{ maxWidth: 760 }}>
      <PageHeader
        title={t('editProfile.title')}
        action={
          <Button component={RouterLink} to={`/u/${user.username}`} color="inherit" variant="outlined">
            {t('editProfile.viewProfile')}
          </Button>
        }
      />
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <ProfileEditor />
      </Box>
    </Surface>
  );
}
