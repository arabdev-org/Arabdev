import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import { useTranslation } from 'react-i18next';

import { Surface } from '@/components/common';
import { EmptyState } from '@/components/EmptyState';
import { useDocumentTitle } from '@/hooks';
import { HOME_PATH } from '@/site';

export default function NotFoundPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('common.notFoundTitle'));
  return (
    <Surface>
      <EmptyState
        icon={<TravelExploreOutlinedIcon />}
        title={t('common.notFoundTitle')}
        description={t('common.notFoundBody')}
        action={{ label: t('common.goHome'), to: HOME_PATH }}
      />
    </Surface>
  );
}
